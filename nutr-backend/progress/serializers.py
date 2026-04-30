from rest_framework import serializers
from .models import ImprovementLog, CaregiverNote


class ImprovementLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImprovementLog
        fields = ['id', 'metric_type', 'value', 'change_from_previous', 'date', 'notes', 'created_at']
        read_only_fields = ['id', 'change_from_previous', 'created_at']


class CaregiverNoteSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)

    class Meta:
        model = CaregiverNote
        fields = ['id', 'user', 'user_name', 'category', 'note', 'created_by', 'created_by_name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_by', 'created_by_name', 'user_name', 'created_at', 'updated_at']
