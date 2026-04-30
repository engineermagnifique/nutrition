from django.db import models


class ImprovementLog(models.Model):
    METRIC_WEIGHT = 'weight'
    METRIC_BMI = 'bmi'
    METRIC_CALORIE_ADHERENCE = 'calorie_adherence'
    METRIC_GOAL_PROGRESS = 'goal_progress'
    METRIC_CHOICES = [
        (METRIC_WEIGHT, 'Weight (kg)'),
        (METRIC_BMI, 'BMI'),
        (METRIC_CALORIE_ADHERENCE, 'Calorie Adherence (%)'),
        (METRIC_GOAL_PROGRESS, 'Goal Progress (%)'),
    ]

    user = models.ForeignKey('accounts.UserProfile', on_delete=models.CASCADE, related_name='improvement_logs')
    metric_type = models.CharField(max_length=25, choices=METRIC_CHOICES)
    value = models.DecimalField(max_digits=10, decimal_places=4)
    change_from_previous = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    date = models.DateField()
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'improvement_logs'
        ordering = ['-date']

    def save(self, *args, **kwargs):
        if not self.pk:
            prev = ImprovementLog.objects.filter(
                user=self.user,
                metric_type=self.metric_type,
            ).order_by('-date').first()
            if prev:
                self.change_from_previous = float(self.value) - float(prev.value)
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.metric_type}={self.value} for {self.user} on {self.date}'


class CaregiverNote(models.Model):
    CATEGORY_OBSERVATION = 'observation'
    CATEGORY_CONCERN = 'concern'
    CATEGORY_IMPROVEMENT = 'improvement'
    CATEGORY_GENERAL = 'general'
    CATEGORY_CHOICES = [
        (CATEGORY_OBSERVATION, 'Observation'),
        (CATEGORY_CONCERN, 'Concern'),
        (CATEGORY_IMPROVEMENT, 'Improvement'),
        (CATEGORY_GENERAL, 'General'),
    ]

    user = models.ForeignKey('accounts.UserProfile', on_delete=models.CASCADE, related_name='caregiver_notes')
    institution = models.ForeignKey('accounts.Institution', on_delete=models.CASCADE, related_name='caregiver_notes')
    created_by = models.ForeignKey(
        'accounts.UserProfile', on_delete=models.SET_NULL,
        null=True, related_name='authored_notes',
    )
    note = models.TextField()
    category = models.CharField(max_length=15, choices=CATEGORY_CHOICES, default=CATEGORY_GENERAL)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'caregiver_notes'
        ordering = ['-created_at']

    def __str__(self):
        return f'Note [{self.category}] for {self.user} by {self.created_by}'
