import logging
from datetime import date, timedelta
from decimal import Decimal
from typing import Optional

import requests
from django.conf import settings
from django.db.models import Sum

logger = logging.getLogger('nutritionxai')


def _build_user_payload(user) -> dict:
    """Assemble all user data into a structured payload for the AI engine."""
    from health.models import HealthRecord, MedicalCondition, HealthGoal
    from nutrition.models import MealLog

    latest_record = HealthRecord.objects.filter(user=user).order_by('-recorded_at').first()
    conditions = list(MedicalCondition.objects.filter(user=user).values(
        'condition_name', 'severity', 'diagnosis_date',
    ))
    goals = list(HealthGoal.objects.filter(user=user, is_active=True).values(
        'goal_type', 'target_weight', 'description',
    ))

    seven_days_ago = date.today() - timedelta(days=7)
    recent_meals = MealLog.objects.filter(user=user, date__gte=seven_days_ago)
    meal_aggregate = recent_meals.aggregate(
        avg_calories=Sum('total_calories'),
        avg_protein=Sum('total_protein'),
        avg_carbs=Sum('total_carbohydrates'),
        avg_fat=Sum('total_fat'),
    )
    days = recent_meals.values('date').distinct().count() or 1

    payload = {
        'user': {
            'id': user.id,
            'full_name': user.full_name,
            'date_of_birth': str(user.date_of_birth) if user.date_of_birth else None,
            'gender': user.gender,
        },
        'health_record': None,
        'medical_conditions': [
            {**c, 'diagnosis_date': str(c['diagnosis_date'])} for c in conditions
        ],
        'health_goals': [
            {**g, 'target_weight': str(g['target_weight']) if g['target_weight'] else None}
            for g in goals
        ],
        'recent_nutrition': {
            'period_days': days,
            'avg_daily_calories': round((meal_aggregate['avg_calories'] or Decimal('0')) / days, 2),
            'avg_daily_protein': round((meal_aggregate['avg_protein'] or Decimal('0')) / days, 2),
            'avg_daily_carbs': round((meal_aggregate['avg_carbs'] or Decimal('0')) / days, 2),
            'avg_daily_fat': round((meal_aggregate['avg_fat'] or Decimal('0')) / days, 2),
        },
    }

    if latest_record:
        payload['health_record'] = {
            'weight': str(latest_record.weight),
            'height': str(latest_record.height),
            'bmi': str(latest_record.bmi),
            'activity_level': latest_record.activity_level,
            'recorded_at': str(latest_record.recorded_at),
        }

    return payload, latest_record


def _call_ai_engine(payload: dict) -> dict:
    """Send payload to external AI engine and return response JSON."""
    url = settings.AI_ENGINE_URL
    api_key = settings.AI_ENGINE_API_KEY
    timeout = settings.AI_ENGINE_TIMEOUT

    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {api_key}',
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=timeout)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.ConnectionError:
        logger.warning('AI engine unreachable, returning mock response for development.')
        return _mock_ai_response(payload)
    except requests.exceptions.Timeout:
        logger.error('AI engine request timed out.')
        raise RuntimeError('AI engine request timed out.')
    except requests.exceptions.HTTPError as e:
        logger.error(f'AI engine HTTP error: {e}')
        raise RuntimeError(f'AI engine returned error: {e}')


def _mock_ai_response(payload: dict) -> dict:
    """Fallback mock response when the AI engine is not reachable."""
    bmi_str = payload.get('health_record', {}).get('bmi', '22')
    bmi = float(bmi_str) if bmi_str else 22.0
    base_calories = 2000

    return {
        'recommendation': {
            'calorie_target': base_calories,
            'diet_plan': {
                'breakfast': ['Oatmeal with fruits', 'Low-fat yogurt'],
                'lunch': ['Grilled chicken salad', 'Whole grain bread'],
                'dinner': ['Steamed fish', 'Vegetables', 'Brown rice'],
                'snacks': ['Nuts', 'Fresh fruits'],
            },
            'food_portions': {
                'grains': '6 servings/day',
                'vegetables': '3 cups/day',
                'protein': '5.5 oz/day',
                'dairy': '3 cups/day',
            },
            'notes': 'Balanced diet recommended based on provided health profile.',
        },
        'predictions': [
            {
                'type': 'health_risk',
                'time_horizon': '30 days',
                'risk_level': 'low' if bmi < 30 else 'medium',
                'confidence_score': 72.5,
                'predicted_value': None,
                'description': 'Risk assessment based on current BMI and activity level.',
            },
            {
                'type': 'weight',
                'time_horizon': '30 days',
                'risk_level': 'low',
                'confidence_score': 68.0,
                'predicted_value': float(bmi_str) * 0.98 if bmi_str else None,
                'description': 'Projected weight trend based on nutritional adherence.',
            },
        ],
        'alerts': [],
    }


def generate_recommendation(user) -> 'Recommendation':
    """Build payload, call AI, store and return a Recommendation."""
    from .models import Recommendation, Prediction
    from alerts.models import Alert

    payload, latest_record = _build_user_payload(user)
    ai_response = _call_ai_engine(payload)

    rec_data = ai_response.get('recommendation', {})
    recommendation = Recommendation.objects.create(
        user=user,
        health_record=latest_record,
        calorie_target=rec_data.get('calorie_target'),
        diet_plan=rec_data.get('diet_plan', {}),
        food_portions=rec_data.get('food_portions', {}),
        notes=rec_data.get('notes', ''),
        raw_response=ai_response,
    )

    # Deactivate old recommendations
    Recommendation.objects.filter(user=user, is_active=True).exclude(pk=recommendation.pk).update(is_active=False)

    # Store predictions
    for pred_data in ai_response.get('predictions', []):
        Prediction.objects.create(
            user=user,
            prediction_type=pred_data.get('type', 'health_risk'),
            time_horizon=pred_data.get('time_horizon', '30 days'),
            predicted_value=pred_data.get('predicted_value'),
            risk_level=pred_data.get('risk_level', 'low'),
            confidence_score=pred_data.get('confidence_score', 0),
            description=pred_data.get('description', ''),
            raw_response=pred_data,
        )

    # Store AI-generated alerts
    for alert_data in ai_response.get('alerts', []):
        Alert.objects.create(
            user=user,
            institution=user.institution,
            alert_type=alert_data.get('type', 'health_risk'),
            severity=alert_data.get('severity', 'medium'),
            title=alert_data.get('title', 'AI Alert'),
            message=alert_data.get('message', ''),
            triggered_by=f'recommendation:{recommendation.pk}',
        )

    logger.info(f'Recommendation generated for user {user.id}: pk={recommendation.pk}')
    return recommendation


def update_predictions_for_user(user) -> list:
    """Re-run predictions for a user and return new Prediction objects."""
    from .models import Prediction

    payload, _ = _build_user_payload(user)
    payload['request_type'] = 'predictions_only'
    ai_response = _call_ai_engine(payload)

    created = []
    for pred_data in ai_response.get('predictions', []):
        p = Prediction.objects.create(
            user=user,
            prediction_type=pred_data.get('type', 'health_risk'),
            time_horizon=pred_data.get('time_horizon', '30 days'),
            predicted_value=pred_data.get('predicted_value'),
            risk_level=pred_data.get('risk_level', 'low'),
            confidence_score=pred_data.get('confidence_score', 0),
            description=pred_data.get('description', ''),
            raw_response=pred_data,
        )
        created.append(p)
    return created
