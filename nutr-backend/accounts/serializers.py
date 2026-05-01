from rest_framework import serializers
from .models import Institution, UserProfile, EmailVerification


class InstitutionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Institution
        fields = ['id', 'institution_id', 'name', 'email', 'phone', 'location', 'is_active', 'created_at']
        read_only_fields = ['id', 'institution_id', 'is_active', 'created_at']


class InstitutionRegistrationSerializer(serializers.Serializer):
    firebase_token = serializers.CharField(write_only=True)
    name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=30)
    location = serializers.CharField()

    def validate_email(self, value):
        if Institution.objects.filter(email=value).exists():
            raise serializers.ValidationError('An institution with this email already exists.')
        if UserProfile.objects.filter(email=value).exists():
            raise serializers.ValidationError('This email is already registered.')
        return value


class UserProfileSerializer(serializers.ModelSerializer):
    institution_id = serializers.CharField(source='institution.institution_id', read_only=True)
    institution_name = serializers.CharField(source='institution.name', read_only=True)
    age = serializers.IntegerField(read_only=True, allow_null=True)

    class Meta:
        model = UserProfile
        fields = [
            'id', 'firebase_uid', 'email', 'full_name', 'role',
            'institution_id', 'institution_name',
            'date_of_birth', 'age', 'gender', 'phone',
            'email_verified', 'is_active', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'firebase_uid', 'email', 'role', 'institution_id', 'institution_name', 'age', 'email_verified', 'is_active', 'created_at', 'updated_at']


class ElderlyRegistrationSerializer(serializers.Serializer):
    firebase_token = serializers.CharField(write_only=True)
    institution_id = serializers.CharField()
    full_name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    date_of_birth = serializers.DateField()
    gender = serializers.ChoiceField(choices=UserProfile.GENDER_CHOICES)
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True)

    def validate_institution_id(self, value):
        if not Institution.objects.filter(institution_id=value, is_active=True).exists():
            raise serializers.ValidationError('Institution not found or inactive.')
        return value

    def validate_email(self, value):
        if UserProfile.objects.filter(email=value).exists():
            raise serializers.ValidationError('This email is already registered.')
        return value


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['full_name', 'date_of_birth', 'gender', 'phone']


class AdminUserListSerializer(serializers.ModelSerializer):
    institution_name = serializers.CharField(source='institution.name', read_only=True)
    institution_id = serializers.CharField(source='institution.institution_id', read_only=True)
    age = serializers.IntegerField(read_only=True, allow_null=True)

    class Meta:
        model = UserProfile
        fields = [
            'id', 'firebase_uid', 'email', 'full_name', 'role',
            'institution_id', 'institution_name', 'date_of_birth', 'age',
            'email_verified', 'is_active', 'created_at',
        ]


class VerifyEmailSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(min_length=6, max_length=6)


class ResendVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()
