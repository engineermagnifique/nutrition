from decimal import Decimal
from django.db import models


class HealthRecord(models.Model):
    ACTIVITY_SEDENTARY = 'sedentary'
    ACTIVITY_LIGHTLY = 'lightly_active'
    ACTIVITY_MODERATELY = 'moderately_active'
    ACTIVITY_VERY = 'very_active'
    ACTIVITY_EXTRA = 'extra_active'
    ACTIVITY_CHOICES = [
        (ACTIVITY_SEDENTARY, 'Sedentary (little or no exercise)'),
        (ACTIVITY_LIGHTLY, 'Lightly Active (light exercise 1-3 days/week)'),
        (ACTIVITY_MODERATELY, 'Moderately Active (moderate exercise 3-5 days/week)'),
        (ACTIVITY_VERY, 'Very Active (hard exercise 6-7 days/week)'),
        (ACTIVITY_EXTRA, 'Extra Active (very hard exercise & physical job)'),
    ]

    user = models.ForeignKey('accounts.UserProfile', on_delete=models.CASCADE, related_name='health_records')
    weight = models.DecimalField(max_digits=5, decimal_places=2, help_text='Weight in kg')
    height = models.DecimalField(max_digits=5, decimal_places=2, help_text='Height in cm')
    bmi = models.DecimalField(max_digits=5, decimal_places=2, editable=False)
    activity_level = models.CharField(max_length=20, choices=ACTIVITY_CHOICES)
    notes = models.TextField(blank=True)
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'health_records'
        ordering = ['-recorded_at']

    def save(self, *args, **kwargs):
        height_m = float(self.height) / 100
        self.bmi = round(float(self.weight) / (height_m ** 2), 2)
        super().save(*args, **kwargs)

    def __str__(self):
        return f'HealthRecord({self.user_id}, BMI={self.bmi}, {self.recorded_at})'


class MedicalCondition(models.Model):
    SEVERITY_MILD = 'mild'
    SEVERITY_MODERATE = 'moderate'
    SEVERITY_SEVERE = 'severe'
    SEVERITY_CHOICES = [
        (SEVERITY_MILD, 'Mild'),
        (SEVERITY_MODERATE, 'Moderate'),
        (SEVERITY_SEVERE, 'Severe'),
    ]

    user = models.ForeignKey('accounts.UserProfile', on_delete=models.CASCADE, related_name='medical_conditions')
    condition_name = models.CharField(max_length=255)
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES)
    diagnosis_date = models.DateField()
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'medical_conditions'
        ordering = ['-diagnosis_date']

    def __str__(self):
        return f'{self.condition_name} ({self.severity}) - {self.user}'


class HealthGoal(models.Model):
    GOAL_WEIGHT_LOSS = 'weight_loss'
    GOAL_WEIGHT_GAIN = 'weight_gain'
    GOAL_MAINTENANCE = 'maintenance'
    GOAL_DISEASE_MANAGEMENT = 'disease_management'
    GOAL_MUSCLE_GAIN = 'muscle_gain'
    GOAL_CHOICES = [
        (GOAL_WEIGHT_LOSS, 'Weight Loss'),
        (GOAL_WEIGHT_GAIN, 'Weight Gain'),
        (GOAL_MAINTENANCE, 'Weight Maintenance'),
        (GOAL_DISEASE_MANAGEMENT, 'Disease Management'),
        (GOAL_MUSCLE_GAIN, 'Muscle Gain'),
    ]

    user = models.ForeignKey('accounts.UserProfile', on_delete=models.CASCADE, related_name='health_goals')
    goal_type = models.CharField(max_length=25, choices=GOAL_CHOICES)
    target_weight = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text='Target weight in kg')
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'health_goals'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.goal_type} goal for {self.user}'
