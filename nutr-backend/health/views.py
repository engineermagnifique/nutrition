import logging
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema, OpenApiResponse
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsElderyOrInstitution, IsInstitutionOrAdmin
from core.exceptions import success_response
from accounts.models import UserProfile
from .models import HealthRecord, MedicalCondition, HealthGoal
from .serializers import HealthRecordSerializer, MedicalConditionSerializer, HealthGoalSerializer

logger = logging.getLogger('nutritionxai')


def _resolve_target_user(request):
    uid = request.query_params.get('user_id') or request.data.get('user_id')
    if uid and request.user.role in ('institution', 'system_admin'):
        qs = UserProfile.objects.filter(pk=uid)
        if request.user.role == 'institution':
            qs = qs.filter(institution=request.user.institution)
        return get_object_or_404(qs)
    return request.user


@extend_schema(tags=['health'])
class HealthRecordListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsElderyOrInstitution]
    serializer_class = HealthRecordSerializer

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return HealthRecord.objects.none()
        user = self.request.user
        if user.role == 'elderly':
            return HealthRecord.objects.filter(user=user)
        uid = self.request.query_params.get('user_id')
        if uid:
            return HealthRecord.objects.filter(user_id=uid, user__institution=user.institution)
        return HealthRecord.objects.filter(user__institution=user.institution)

    def perform_create(self, serializer):
        target = _resolve_target_user(self.request)
        serializer.save(user=target)
        logger.info(f'HealthRecord created for user {target.id}')


@extend_schema(tags=['health'])
class HealthRecordDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated, IsElderyOrInstitution]
    serializer_class = HealthRecordSerializer

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return HealthRecord.objects.none()
        user = self.request.user
        if user.role == 'elderly':
            return HealthRecord.objects.filter(user=user)
        return HealthRecord.objects.filter(user__institution=user.institution)


@extend_schema(tags=['health'])
class MedicalConditionListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsElderyOrInstitution]
    serializer_class = MedicalConditionSerializer

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return MedicalCondition.objects.none()
        user = self.request.user
        if user.role == 'elderly':
            return MedicalCondition.objects.filter(user=user)
        uid = self.request.query_params.get('user_id')
        if uid:
            return MedicalCondition.objects.filter(user_id=uid, user__institution=user.institution)
        return MedicalCondition.objects.filter(user__institution=user.institution)

    def perform_create(self, serializer):
        serializer.save(user=_resolve_target_user(self.request))


@extend_schema(tags=['health'])
class MedicalConditionDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsElderyOrInstitution]
    serializer_class = MedicalConditionSerializer

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return MedicalCondition.objects.none()
        user = self.request.user
        if user.role == 'elderly':
            return MedicalCondition.objects.filter(user=user)
        return MedicalCondition.objects.filter(user__institution=user.institution)

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)


@extend_schema(tags=['health'])
class HealthGoalListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsElderyOrInstitution]
    serializer_class = HealthGoalSerializer

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return HealthGoal.objects.none()
        user = self.request.user
        if user.role == 'elderly':
            return HealthGoal.objects.filter(user=user)
        uid = self.request.query_params.get('user_id')
        if uid:
            return HealthGoal.objects.filter(user_id=uid, user__institution=user.institution)
        return HealthGoal.objects.filter(user__institution=user.institution)

    def perform_create(self, serializer):
        serializer.save(user=_resolve_target_user(self.request))


@extend_schema(tags=['health'])
class HealthGoalDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsElderyOrInstitution]
    serializer_class = HealthGoalSerializer

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return HealthGoal.objects.none()
        user = self.request.user
        if user.role == 'elderly':
            return HealthGoal.objects.filter(user=user)
        return HealthGoal.objects.filter(user__institution=user.institution)

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)


@extend_schema(tags=['health'], responses={200: OpenApiResponse(description='Full health summary for a user')})
class UserHealthSummaryView(APIView):
    """Latest health record + all medical conditions + active goals in one call."""
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id=None):
        if user_id:
            if request.user.role == 'elderly':
                return Response({'status': 'error', 'message': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)
            qs = UserProfile.objects.filter(pk=user_id)
            if request.user.role == 'institution':
                qs = qs.filter(institution=request.user.institution)
            try:
                target = qs.get()
            except UserProfile.DoesNotExist:
                return Response({'status': 'error', 'message': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        else:
            target = request.user

        latest_record = HealthRecord.objects.filter(user=target).order_by('-recorded_at').first()
        conditions = MedicalCondition.objects.filter(user=target)
        goals = HealthGoal.objects.filter(user=target, is_active=True)

        return success_response(data={
            'user_id': target.id,
            'full_name': target.full_name,
            'latest_health_record': HealthRecordSerializer(latest_record).data if latest_record else None,
            'medical_conditions': MedicalConditionSerializer(conditions, many=True).data,
            'active_goals': HealthGoalSerializer(goals, many=True).data,
        })
