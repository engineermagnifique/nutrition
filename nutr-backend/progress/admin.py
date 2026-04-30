from django.contrib import admin
from .models import ImprovementLog, CaregiverNote


@admin.register(ImprovementLog)
class ImprovementLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'metric_type', 'value', 'change_from_previous', 'date']
    list_filter = ['metric_type', 'date']
    search_fields = ['user__full_name']
    readonly_fields = ['change_from_previous', 'created_at']
    raw_id_fields = ['user']


@admin.register(CaregiverNote)
class CaregiverNoteAdmin(admin.ModelAdmin):
    list_display = ['user', 'category', 'created_by', 'institution', 'created_at']
    list_filter = ['category']
    search_fields = ['user__full_name', 'note']
    readonly_fields = ['created_at', 'updated_at']
    raw_id_fields = ['user', 'institution', 'created_by']
