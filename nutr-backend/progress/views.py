import logging
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated

from core.permissions import IsElderyOrInstitution, IsInstitutionOrAdmin
from core.exceptions import success_response
from accounts.models import UserProfile
from .models import ImprovementLog, CaregiverNote
from .serializers import ImprovementLogSerializer, CaregiverNoteSerializer

logger = logging.getLogger('nutritionxai')


@extend_schema(tags=['progress'])
class ImprovementLogListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsElderyOrInstitution]
    serializer_class = ImprovementLogSerializer
    filterset_fields = ['metric_type', 'date']

    def _get_target(self):
        user = self.request.user
        uid = self.request.query_params.get('user_id') or self.request.data.get('user_id')
        if uid and user.role in ('institution', 'system_admin'):
            return get_object_or_404(UserProfile, pk=uid, institution=user.institution)
        return user

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return ImprovementLog.objects.none()
        return ImprovementLog.objects.filter(user=self._get_target())

    def perform_create(self, serializer):
        serializer.save(user=self._get_target())


@extend_schema(tags=['progress'])
class ImprovementLogDetailView(generics.RetrieveDestroyAPIView):
    permission_classes = [IsAuthenticated, IsElderyOrInstitution]
    serializer_class = ImprovementLogSerializer

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return ImprovementLog.objects.none()
        user = self.request.user
        if user.role == 'elderly':
            return ImprovementLog.objects.filter(user=user)
        return ImprovementLog.objects.filter(user__institution=user.institution)


@extend_schema(tags=['progress'])
class CaregiverNoteListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsInstitutionOrAdmin]
    serializer_class = CaregiverNoteSerializer
    filterset_fields = ['category']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return CaregiverNote.objects.none()
        user = self.request.user
        if user.role == 'system_admin':
            uid = self.request.query_params.get('user_id')
            return CaregiverNote.objects.filter(user_id=uid) if uid else CaregiverNote.objects.all()
        uid = self.request.query_params.get('user_id')
        if uid:
            return CaregiverNote.objects.filter(user_id=uid, institution=user.institution)
        return CaregiverNote.objects.filter(institution=user.institution)

    def perform_create(self, serializer):
        target_user = serializer.validated_data['user']
        serializer.save(created_by=self.request.user, institution=target_user.institution)


@extend_schema(tags=['progress'])
class CaregiverNoteDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsInstitutionOrAdmin]
    serializer_class = CaregiverNoteSerializer

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return CaregiverNote.objects.none()
        user = self.request.user
        if user.role == 'system_admin':
            return CaregiverNote.objects.all()
        return CaregiverNote.objects.filter(institution=user.institution)

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)
