from rest_framework import serializers
from .models import HealthRecord, MedicalCondition, HealthGoal


class HealthRecordSerializer(serializers.ModelSerializer):
    bmi_category = serializers.SerializerMethodField()

    class Meta:
        model = HealthRecord
        fields = [
            'id', 'weight', 'height', 'bmi', 'bmi_category',
            'activity_level', 'notes', 'recorded_at',
        ]
        read_only_fields = ['id', 'bmi', 'recorded_at']

    def get_bmi_category(self, obj):
        bmi = float(obj.bmi)
        if bmi < 18.5:
            return 'Underweight'
        if bmi < 25.0:
            return 'Normal weight'
        if bmi < 30.0:
            return 'Overweight'
        return 'Obese'


class MedicalConditionSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalCondition
        fields = ['id', 'condition_name', 'severity', 'diagnosis_date', 'notes', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class HealthGoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = HealthGoal
        fields = ['id', 'goal_type', 'target_weight', 'description', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
