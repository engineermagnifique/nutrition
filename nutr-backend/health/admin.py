from django.contrib import admin
from .models import HealthRecord, MedicalCondition, HealthGoal


@admin.register(HealthRecord)
class HealthRecordAdmin(admin.ModelAdmin):
    list_display = ['user', 'weight', 'height', 'bmi', 'activity_level', 'recorded_at']
    list_filter = ['activity_level']
    search_fields = ['user__full_name', 'user__email']
    readonly_fields = ['bmi', 'recorded_at']
    raw_id_fields = ['user']


@admin.register(MedicalCondition)
class MedicalConditionAdmin(admin.ModelAdmin):
    list_display = ['user', 'condition_name', 'severity', 'diagnosis_date']
    list_filter = ['severity']
    search_fields = ['user__full_name', 'condition_name']
    raw_id_fields = ['user']


@admin.register(HealthGoal)
class HealthGoalAdmin(admin.ModelAdmin):
    list_display = ['user', 'goal_type', 'target_weight', 'is_active', 'created_at']
    list_filter = ['goal_type', 'is_active']
    search_fields = ['user__full_name']
    raw_id_fields = ['user']
