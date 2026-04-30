import logging
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema, OpenApiResponse
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsElderyOrInstitution, IsInstitutionOrAdmin
from core.exceptions import success_response
from .models import Alert
from .serializers import AlertSerializer, AlertCreateSerializer

logger = logging.getLogger('nutritionxai')


@extend_schema(tags=['alerts'])
class AlertListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsElderyOrInstitution]
    serializer_class = AlertSerializer
    filterset_fields = ['alert_type', 'severity', 'is_read']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Alert.objects.none()
        user = self.request.user
        if user.role == 'elderly':
            return Alert.objects.filter(user=user)
        user_id = self.request.query_params.get('user_id')
        if user_id:
            return Alert.objects.filter(user_id=user_id, user__institution=user.institution)
        return Alert.objects.filter(institution=user.institution)


@extend_schema(tags=['alerts'])
class AlertDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated, IsElderyOrInstitution]
    serializer_class = AlertSerializer

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Alert.objects.none()
        user = self.request.user
        if user.role == 'elderly':
            return Alert.objects.filter(user=user)
        return Alert.objects.filter(institution=user.institution)


@extend_schema(tags=['alerts'], request=None, responses={200: AlertSerializer})
class AlertMarkReadView(APIView):
    """Mark a single alert as read."""
    permission_classes = [IsAuthenticated, IsElderyOrInstitution]

    def patch(self, request, pk):
        user = request.user
        alert = (get_object_or_404(Alert, pk=pk, user=user)
                 if user.role == 'elderly'
                 else get_object_or_404(Alert, pk=pk, institution=user.institution))
        alert.mark_read()
        return success_response(data=AlertSerializer(alert).data, message='Alert marked as read.')


@extend_schema(tags=['alerts'], request=None,
               responses={200: OpenApiResponse(description='Count of alerts marked read')})
class AlertMarkAllReadView(APIView):
    """Mark all unread alerts as read for the authenticated user/institution."""
    permission_classes = [IsAuthenticated, IsElderyOrInstitution]

    def post(self, request):
        from django.utils import timezone
        user = request.user
        qs = (Alert.objects.filter(user=user, is_read=False)
              if user.role == 'elderly'
              else Alert.objects.filter(institution=user.institution, is_read=False))
        count = qs.count()
        qs.update(is_read=True, read_at=timezone.now())
        return success_response(message=f'{count} alert(s) marked as read.')


@extend_schema(tags=['alerts'])
class AlertCreateView(generics.CreateAPIView):
    """Institution admins and system admins can create manual alerts for users."""
    permission_classes = [IsAuthenticated, IsInstitutionOrAdmin]
    serializer_class = AlertCreateSerializer

    def perform_create(self, serializer):
        target_user = serializer.validated_data['user']
        serializer.save(institution=target_user.institution)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return success_response(data=AlertSerializer(serializer.instance).data,
                                message='Alert created.',
                                status_code=status.HTTP_201_CREATED)
