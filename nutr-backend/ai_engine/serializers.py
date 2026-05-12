from rest_framework import serializers
from .models import Recommendation, Prediction, WeeklyReport


class RecommendationSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)

    class Meta:
        model = Recommendation
        fields = [
            'id', 'user_id', 'user_name', 'health_record', 'calorie_target', 'diet_plan',
            'food_portions', 'notes', 'is_active', 'created_at', 'raw_response',
        ]
        read_only_fields = fields


class PredictionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prediction
        fields = [
            'id', 'prediction_type', 'time_horizon', 'predicted_value',
            'risk_level', 'confidence_score', 'description', 'created_at', 'raw_response',
        ]
        read_only_fields = fields


class WeeklyReportSerializer(serializers.ModelSerializer):
    calorie_adherence_pct = serializers.SerializerMethodField()

    class Meta:
        model = WeeklyReport
        fields = [
            'id', 'week_start', 'week_end', 'days_logged',
            'avg_daily_calories', 'calorie_target', 'avg_daily_protein',
            'weight_start', 'weight_end', 'bmi_end',
            'overall_score', 'summary', 'wins', 'improvements',
            'next_week_goals', 'medication_notes', 'created_at',
            'calorie_adherence_pct',
        ]
        read_only_fields = fields

    def get_calorie_adherence_pct(self, obj):
        if obj.avg_daily_calories and obj.calorie_target and float(obj.calorie_target) > 0:
            return round(float(obj.avg_daily_calories) / float(obj.calorie_target) * 100, 1)
        return None
