from rest_framework import serializers
from .models import Alert


class AlertSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)

    class Meta:
        model = Alert
        fields = [
            'id', 'user', 'user_name', 'alert_type', 'severity',
            'title', 'message', 'is_read', 'triggered_by',
            'created_at', 'read_at',
        ]
        read_only_fields = ['id', 'user', 'user_name', 'is_read', 'created_at', 'read_at']


class AlertCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alert
        fields = ['user', 'alert_type', 'severity', 'title', 'message', 'triggered_by']
