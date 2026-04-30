from rest_framework import serializers
from .models import Recommendation, Prediction


class RecommendationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recommendation
        fields = [
            'id', 'health_record', 'calorie_target', 'diet_plan',
            'food_portions', 'notes', 'is_active', 'created_at',
        ]
        read_only_fields = fields


class PredictionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prediction
        fields = [
            'id', 'prediction_type', 'time_horizon', 'predicted_value',
            'risk_level', 'confidence_score', 'description', 'created_at',
        ]
        read_only_fields = fields
