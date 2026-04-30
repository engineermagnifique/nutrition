import logging
from drf_spectacular.utils import extend_schema, OpenApiResponse
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsElderyOrInstitution
from core.exceptions import success_response
from accounts.models import UserProfile
from .models import Recommendation, Prediction
from .serializers import RecommendationSerializer, PredictionSerializer
from . import services

logger = logging.getLogger('nutritionxai')


def _resolve_user(request):
    user_id = request.query_params.get('user_id')
    if user_id and request.user.role in ('institution', 'system_admin'):
        try:
            target = UserProfile.objects.get(pk=user_id)
            if request.user.role == 'institution' and target.institution != request.user.institution:
                return None, Response({'status': 'error', 'message': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        except UserProfile.DoesNotExist:
            return None, Response({'status': 'error', 'message': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        return target, None
    return request.user, None


@extend_schema(
    tags=['ai'],
    request=None,
    responses={201: RecommendationSerializer},
    description=(
        'Build an AI payload from the user\'s health data, send it to the external AI engine, '
        'store and return the resulting recommendation. Falls back to a mock response if the AI engine is unreachable.'
    ),
)
class GenerateRecommendationView(APIView):
    permission_classes = [IsAuthenticated, IsElderyOrInstitution]

    def post(self, request):
        target, err = _resolve_user(request)
        if err:
            return err
        try:
            recommendation = services.generate_recommendation(target)
        except RuntimeError as e:
            return Response({'status': 'error', 'message': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return success_response(data=RecommendationSerializer(recommendation).data,
                                message='Recommendation generated successfully.',
                                status_code=status.HTTP_201_CREATED)


@extend_schema(tags=['ai'])
class RecommendationListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsElderyOrInstitution]
    serializer_class = RecommendationSerializer

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Recommendation.objects.none()
        user = self.request.user
        if user.role == 'elderly':
            return Recommendation.objects.filter(user=user)
        user_id = self.request.query_params.get('user_id')
        if user_id:
            return Recommendation.objects.filter(user_id=user_id, user__institution=user.institution)
        return Recommendation.objects.filter(user__institution=user.institution)


@extend_schema(tags=['ai'])
class RecommendationDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated, IsElderyOrInstitution]
    serializer_class = RecommendationSerializer

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Recommendation.objects.none()
        user = self.request.user
        if user.role == 'elderly':
            return Recommendation.objects.filter(user=user)
        return Recommendation.objects.filter(user__institution=user.institution)


@extend_schema(tags=['ai'])
class PredictionListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsElderyOrInstitution]
    serializer_class = PredictionSerializer
    filterset_fields = ['prediction_type', 'risk_level']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Prediction.objects.none()
        user = self.request.user
        if user.role == 'elderly':
            return Prediction.objects.filter(user=user)
        user_id = self.request.query_params.get('user_id')
        if user_id:
            return Prediction.objects.filter(user_id=user_id, user__institution=user.institution)
        return Prediction.objects.filter(user__institution=user.institution)


@extend_schema(tags=['ai'])
class PredictionDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated, IsElderyOrInstitution]
    serializer_class = PredictionSerializer

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Prediction.objects.none()
        user = self.request.user
        if user.role == 'elderly':
            return Prediction.objects.filter(user=user)
        return Prediction.objects.filter(user__institution=user.institution)
