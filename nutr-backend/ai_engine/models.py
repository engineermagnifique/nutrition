from django.db import models


class Recommendation(models.Model):
    user = models.ForeignKey('accounts.UserProfile', on_delete=models.CASCADE, related_name='recommendations')
    health_record = models.ForeignKey(
        'health.HealthRecord', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='recommendations',
    )
    calorie_target = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    diet_plan = models.JSONField(default=dict, help_text='Structured daily diet plan from AI')
    food_portions = models.JSONField(default=dict, help_text='Specific food portion mappings')
    notes = models.TextField(blank=True)
    raw_response = models.JSONField(default=dict)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'recommendations'
        ordering = ['-created_at']

    def __str__(self):
        return f'Recommendation for {self.user} on {self.created_at:%Y-%m-%d}'


class Prediction(models.Model):
    TYPE_WEIGHT = 'weight'
    TYPE_HEALTH_RISK = 'health_risk'
    TYPE_NUTRITION_DEFICIT = 'nutrition_deficit'
    TYPE_DISEASE_PROGRESSION = 'disease_progression'
    TYPE_CHOICES = [
        (TYPE_WEIGHT, 'Weight Prediction'),
        (TYPE_HEALTH_RISK, 'Health Risk'),
        (TYPE_NUTRITION_DEFICIT, 'Nutrition Deficit'),
        (TYPE_DISEASE_PROGRESSION, 'Disease Progression'),
    ]

    RISK_LOW = 'low'
    RISK_MEDIUM = 'medium'
    RISK_HIGH = 'high'
    RISK_CRITICAL = 'critical'
    RISK_CHOICES = [
        (RISK_LOW, 'Low'),
        (RISK_MEDIUM, 'Medium'),
        (RISK_HIGH, 'High'),
        (RISK_CRITICAL, 'Critical'),
    ]

    user = models.ForeignKey('accounts.UserProfile', on_delete=models.CASCADE, related_name='predictions')
    prediction_type = models.CharField(max_length=25, choices=TYPE_CHOICES)
    time_horizon = models.CharField(max_length=50, help_text='e.g. "7 days", "30 days"')
    predicted_value = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    risk_level = models.CharField(max_length=10, choices=RISK_CHOICES)
    confidence_score = models.DecimalField(max_digits=5, decimal_places=2, help_text='Percentage 0-100')
    description = models.TextField()
    raw_response = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'predictions'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.prediction_type} prediction for {self.user}'


class WeeklyReport(models.Model):
    user             = models.ForeignKey('accounts.UserProfile', on_delete=models.CASCADE, related_name='weekly_reports')
    week_start       = models.DateField()
    week_end         = models.DateField()
    days_logged      = models.IntegerField(default=0, help_text='Number of days with at least one meal logged')
    avg_daily_calories  = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    calorie_target      = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    avg_daily_protein   = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    weight_start        = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    weight_end          = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    bmi_end             = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    overall_score       = models.IntegerField(default=0, help_text='0-100 weekly adherence score')
    summary             = models.TextField(blank=True)
    wins                = models.JSONField(default=list)
    improvements        = models.JSONField(default=list)
    next_week_goals     = models.JSONField(default=list)
    medication_notes    = models.JSONField(default=list)
    raw_data            = models.JSONField(default=dict)
    created_at          = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'weekly_reports'
        ordering = ['-week_start']
        unique_together = [('user', 'week_start')]

    def __str__(self):
        return f'WeeklyReport for {self.user} w/s {self.week_start}'
