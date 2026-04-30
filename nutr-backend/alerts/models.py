from django.db import models
from django.utils import timezone


class Alert(models.Model):
    TYPE_HEALTH_RISK = 'health_risk'
    TYPE_ABNORMAL_DATA = 'abnormal_data'
    TYPE_MEDICATION = 'medication'
    TYPE_GOAL_MISSED = 'goal_missed'
    TYPE_RECOMMENDATION = 'recommendation'
    TYPE_CHOICES = [
        (TYPE_HEALTH_RISK, 'Health Risk'),
        (TYPE_ABNORMAL_DATA, 'Abnormal Data'),
        (TYPE_MEDICATION, 'Medication'),
        (TYPE_GOAL_MISSED, 'Goal Missed'),
        (TYPE_RECOMMENDATION, 'Recommendation'),
    ]

    SEV_LOW = 'low'
    SEV_MEDIUM = 'medium'
    SEV_HIGH = 'high'
    SEV_CRITICAL = 'critical'
    SEVERITY_CHOICES = [
        (SEV_LOW, 'Low'),
        (SEV_MEDIUM, 'Medium'),
        (SEV_HIGH, 'High'),
        (SEV_CRITICAL, 'Critical'),
    ]

    user = models.ForeignKey('accounts.UserProfile', on_delete=models.CASCADE, related_name='alerts')
    institution = models.ForeignKey(
        'accounts.Institution', on_delete=models.CASCADE,
        null=True, blank=True, related_name='alerts',
    )
    alert_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    triggered_by = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'alerts'
        ordering = ['-created_at']

    def mark_read(self):
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])

    def __str__(self):
        return f'[{self.severity}] {self.title} ({self.user})'
