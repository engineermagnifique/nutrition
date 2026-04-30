from django.contrib import admin
from .models import Recommendation, Prediction


@admin.register(Recommendation)
class RecommendationAdmin(admin.ModelAdmin):
    list_display = ['user', 'calorie_target', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['user__full_name']
    readonly_fields = ['raw_response', 'created_at']
    raw_id_fields = ['user', 'health_record']


@admin.register(Prediction)
class PredictionAdmin(admin.ModelAdmin):
    list_display = ['user', 'prediction_type', 'risk_level', 'confidence_score', 'time_horizon', 'created_at']
    list_filter = ['prediction_type', 'risk_level']
    search_fields = ['user__full_name']
    readonly_fields = ['raw_response', 'created_at']
    raw_id_fields = ['user']
