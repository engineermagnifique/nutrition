import logging
from celery import shared_task
from django.utils import timezone

logger = logging.getLogger('nutritionxai')


@shared_task(name='tasks.scheduled.generate_daily_recommendations', bind=True, max_retries=3)
def generate_daily_recommendations(self):
    """Generate AI recommendations for all active elderly users daily."""
    from accounts.models import UserProfile
    from ai_engine.services import generate_recommendation

    users = UserProfile.objects.filter(role='elderly', is_active=True).select_related('institution')
    count = 0
    for user in users:
        try:
            generate_recommendation(user)
            count += 1
        except Exception as exc:
            logger.error(f'Failed to generate recommendation for user {user.id}: {exc}')
    logger.info(f'Daily recommendations generated for {count} users.')
    return {'generated': count, 'timestamp': str(timezone.now())}


@shared_task(name='tasks.scheduled.update_predictions', bind=True, max_retries=3)
def update_predictions(self):
    """Weekly prediction update for all active elderly users."""
    from accounts.models import UserProfile
    from ai_engine.services import update_predictions_for_user

    users = UserProfile.objects.filter(role='elderly', is_active=True)
    count = 0
    for user in users:
        try:
            preds = update_predictions_for_user(user)
            count += len(preds)
        except Exception as exc:
            logger.error(f'Prediction update failed for user {user.id}: {exc}')
    logger.info(f'Prediction update complete: {count} predictions created.')
    return {'predictions_created': count}


@shared_task(name='tasks.scheduled.evaluate_alerts', bind=True, max_retries=3)
def evaluate_alerts(self):
    """Evaluate health records and generate alerts for abnormal values."""
    from health.models import HealthRecord
    from alerts.models import Alert
    from accounts.models import Institution

    threshold_bmi_low = 18.5
    threshold_bmi_obese = 30.0

    recent_records = HealthRecord.objects.select_related('user', 'user__institution').filter(
        recorded_at__gte=timezone.now() - timezone.timedelta(hours=24),
        user__is_active=True,
    )

    created = 0
    for record in recent_records:
        user = record.user
        institution = user.institution
        if not institution:
            continue

        bmi = float(record.bmi)
        if bmi < threshold_bmi_low:
            _create_alert(user, institution, 'abnormal_data', 'high',
                          'Underweight BMI Detected',
                          f'BMI of {bmi:.1f} is below the healthy threshold of 18.5.',
                          f'health_record:{record.pk}')
            created += 1
        elif bmi >= threshold_bmi_obese:
            severity = 'critical' if bmi >= 35 else 'high'
            _create_alert(user, institution, 'health_risk', severity,
                          'Elevated BMI Alert',
                          f'BMI of {bmi:.1f} indicates obesity risk.',
                          f'health_record:{record.pk}')
            created += 1

    logger.info(f'Alert evaluation complete: {created} alerts created.')
    return {'alerts_created': created}


def _create_alert(user, institution, alert_type, severity, title, message, triggered_by):
    from alerts.models import Alert
    Alert.objects.create(
        user=user,
        institution=institution,
        alert_type=alert_type,
        severity=severity,
        title=title,
        message=message,
        triggered_by=triggered_by,
    )
