import logging
from drf_spectacular.utils import extend_schema, OpenApiResponse
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsSystemAdmin, IsInstitutionOrAdmin, IsInstitution
from core.exceptions import success_response
from .models import Institution, UserProfile
from .serializers import (
    InstitutionSerializer, InstitutionRegistrationSerializer,
    ElderlyRegistrationSerializer, UserProfileSerializer,
    UserProfileUpdateSerializer, AdminUserListSerializer,
    VerifyEmailSerializer, ResendVerificationSerializer,
)
from . import services

logger = logging.getLogger('nutritionxai')


@extend_schema(tags=['auth'], request=InstitutionRegistrationSerializer,
               responses={201: InstitutionSerializer})
class InstitutionRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = InstitutionRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            institution, user = services.register_institution(serializer.validated_data)
        except ValueError as e:
            return Response({'status': 'error', 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return success_response(
            data={'institution': InstitutionSerializer(institution).data,
                  'user': UserProfileSerializer(user).data},
            message='Institution registered successfully.',
            status_code=status.HTTP_201_CREATED,
        )


@extend_schema(tags=['auth'], request=ElderlyRegistrationSerializer,
               responses={201: UserProfileSerializer})
class ElderlyRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ElderlyRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            user = services.register_elderly_user(serializer.validated_data)
        except ValueError as e:
            return Response({'status': 'error', 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return success_response(data={'user': UserProfileSerializer(user).data},
                                message='User registered successfully.',
                                status_code=status.HTTP_201_CREATED)


@extend_schema(tags=['auth'], request=VerifyEmailSerializer,
               responses={200: None})
class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            services.verify_email_code(
                serializer.validated_data['email'],
                serializer.validated_data['code'],
            )
        except ValueError as e:
            return Response({'status': 'error', 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return success_response(message='Email verified successfully. You can now log in.')


@extend_schema(tags=['auth'], request=ResendVerificationSerializer,
               responses={200: None})
class ResendVerificationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResendVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        from .models import UserProfile
        try:
            user = UserProfile.objects.get(email=email)
        except UserProfile.DoesNotExist:
            return Response({'status': 'error', 'message': 'No account found with this email.'}, status=status.HTTP_404_NOT_FOUND)
        if user.email_verified:
            return Response({'status': 'error', 'message': 'Email is already verified.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            services.send_verification_email(user)
        except Exception as e:
            logger.error(f'Failed to resend verification email: {e}')
            return Response({'status': 'error', 'message': 'Failed to send email. Try again later.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return success_response(message='Verification code sent. Check your inbox.')


@extend_schema(tags=['auth'])
class UserProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return UserProfileUpdateSerializer
        return UserProfileSerializer

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)


@extend_schema(tags=['auth'])
class InstitutionProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated, IsInstitution]
    serializer_class = InstitutionSerializer

    def get_object(self):
        return self.request.user.institution

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)


@extend_schema(tags=['auth'])
class InstitutionUsersView(generics.ListAPIView):
    """List elderly users belonging to the authenticated institution (or all if admin)."""
    permission_classes = [IsAuthenticated, IsInstitutionOrAdmin]
    serializer_class = AdminUserListSerializer

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return UserProfile.objects.none()
        user = self.request.user
        if user.role == 'system_admin':
            institution_id = self.request.query_params.get('institution_id')
            qs = UserProfile.objects.filter(role='elderly')
            if institution_id:
                qs = qs.filter(institution__institution_id=institution_id)
            return qs
        return UserProfile.objects.filter(institution=user.institution, role='elderly')


@extend_schema(tags=['auth'])
class AdminInstitutionListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsSystemAdmin]
    serializer_class = InstitutionSerializer

    def get_queryset(self):
        return Institution.objects.all()


@extend_schema(tags=['auth'])
class AdminUserListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsSystemAdmin]
    serializer_class = AdminUserListSerializer
    search_fields = ['full_name', 'email']
    filterset_fields = ['role', 'is_active']

    def get_queryset(self):
        return UserProfile.objects.select_related('institution').all()


@extend_schema(tags=['auth'], responses={200: UserProfileSerializer})
class AdminToggleUserView(APIView):
    permission_classes = [IsAuthenticated, IsSystemAdmin]

    def post(self, request, pk):
        try:
            user = UserProfile.objects.get(pk=pk)
        except UserProfile.DoesNotExist:
            return Response({'status': 'error', 'message': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        user.is_active = not user.is_active
        user.save(update_fields=['is_active'])
        return success_response(data={'is_active': user.is_active},
                                message=f"User {'activated' if user.is_active else 'deactivated'}.")


@extend_schema(tags=['auth'], responses={200: InstitutionSerializer})
class AdminToggleInstitutionView(APIView):
    permission_classes = [IsAuthenticated, IsSystemAdmin]

    def post(self, request, pk):
        try:
            institution = Institution.objects.get(pk=pk)
        except Institution.DoesNotExist:
            return Response({'status': 'error', 'message': 'Institution not found.'}, status=status.HTTP_404_NOT_FOUND)
        institution.is_active = not institution.is_active
        institution.save(update_fields=['is_active'])
        return success_response(data={'is_active': institution.is_active},
                                message=f"Institution {'activated' if institution.is_active else 'deactivated'}.")


@extend_schema(tags=['auth'], responses={200: OpenApiResponse(description='Role-aware dashboard stats')})
class DashboardView(APIView):
    """Unified dashboard — returns stats appropriate for the authenticated user's role."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        from health.models import HealthRecord
        from alerts.models import Alert

        if user.role == 'system_admin':
            data = {
                'total_institutions': Institution.objects.count(),
                'active_institutions': Institution.objects.filter(is_active=True).count(),
                'total_users': UserProfile.objects.filter(role='elderly').count(),
                'active_users': UserProfile.objects.filter(role='elderly', is_active=True).count(),
            }
        elif user.role == 'institution':
            members = UserProfile.objects.filter(institution=user.institution, role='elderly')
            data = {
                'institution': InstitutionSerializer(user.institution).data,
                'total_members': members.count(),
                'active_members': members.filter(is_active=True).count(),
                'unread_alerts': Alert.objects.filter(institution=user.institution, is_read=False).count(),
            }
        else:
            latest_record = HealthRecord.objects.filter(user=user).order_by('-recorded_at').first()
            data = {
                'profile': UserProfileSerializer(user).data,
                'latest_health_record': None,
                'unread_alerts': Alert.objects.filter(user=user, is_read=False).count(),
            }
            if latest_record:
                from health.serializers import HealthRecordSerializer
                data['latest_health_record'] = HealthRecordSerializer(latest_record).data

        return success_response(data=data)
