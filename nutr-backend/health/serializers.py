from rest_framework import serializers
from .models import HealthRecord, MedicalCondition, HealthGoal, Medication, UserPreferences


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


class MedicationSerializer(serializers.ModelSerializer):
    frequency_display = serializers.CharField(source='get_frequency_display', read_only=True)

    class Meta:
        model = Medication
        fields = [
            'id', 'medication_name', 'dosage', 'frequency', 'frequency_display',
            'purpose', 'with_food', 'is_current', 'start_date', 'notes',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'frequency_display']


class UserPreferencesSerializer(serializers.ModelSerializer):
    dietary_type_display  = serializers.CharField(source='get_dietary_type_display', read_only=True)
    daily_lifestyle_display = serializers.CharField(source='get_daily_lifestyle_display', read_only=True)

    class Meta:
        model = UserPreferences
        fields = [
            'id', 'dietary_type', 'dietary_type_display', 'disliked_foods',
            'favorite_foods', 'daily_lifestyle', 'daily_lifestyle_display',
            'additional_notes', 'updated_at',
        ]
        read_only_fields = ['id', 'updated_at', 'dietary_type_display', 'daily_lifestyle_display']
