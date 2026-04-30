import logging
from decimal import Decimal
from django.db.models import Sum
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema, OpenApiResponse
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsElderyOrInstitution, IsInstitutionOrAdmin
from core.exceptions import success_response
from accounts.models import UserProfile
from .models import FoodItem, MealLog, MealItem
from .serializers import (
    FoodItemSerializer, MealLogSerializer, MealLogCreateSerializer,
    MealItemSerializer, MealItemCreateSerializer,
)

logger = logging.getLogger('nutritionxai')


@extend_schema(tags=['nutrition'])
class FoodItemListCreateView(generics.ListCreateAPIView):
    serializer_class = FoodItemSerializer
    search_fields = ['name']
    filterset_fields = ['is_active']

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsInstitutionOrAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        return FoodItem.objects.filter(is_active=True)


@extend_schema(tags=['nutrition'])
class FoodItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FoodItemSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsInstitutionOrAdmin()]

    def get_queryset(self):
        return FoodItem.objects.all()

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)


@extend_schema(tags=['nutrition'])
class MealLogListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsElderyOrInstitution]
    filterset_fields = ['meal_type', 'date']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return MealLogCreateSerializer
        return MealLogSerializer

    def _get_target_user(self):
        user = self.request.user
        user_id = self.request.query_params.get('user_id') or self.request.data.get('user_id')
        if user_id and user.role in ('institution', 'system_admin'):
            return get_object_or_404(UserProfile, pk=user_id, institution=user.institution)
        return user

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return MealLog.objects.none()
        return MealLog.objects.filter(user=self._get_target_user()).prefetch_related('items__food_item')

    def perform_create(self, serializer):
        target = self._get_target_user()
        meal_log, created = MealLog.objects.get_or_create(
            user=target,
            meal_type=serializer.validated_data['meal_type'],
            date=serializer.validated_data['date'],
            defaults={'notes': serializer.validated_data.get('notes', '')},
        )
        if not created and serializer.validated_data.get('notes'):
            meal_log.notes = serializer.validated_data['notes']
            meal_log.save(update_fields=['notes'])
        self._created_object = meal_log

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({'status': 'success', 'data': MealLogSerializer(self._created_object).data},
                        status=status.HTTP_201_CREATED)


@extend_schema(tags=['nutrition'])
class MealLogDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsElderyOrInstitution]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return MealLogCreateSerializer
        return MealLogSerializer

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return MealLog.objects.none()
        user = self.request.user
        if user.role == 'elderly':
            return MealLog.objects.filter(user=user)
        return MealLog.objects.filter(user__institution=user.institution)

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)


@extend_schema(tags=['nutrition'], request=MealItemCreateSerializer, responses={201: MealItemSerializer})
class MealItemCreateView(APIView):
    """Add a food item (with quantity in grams) to an existing meal log."""
    permission_classes = [IsAuthenticated, IsElderyOrInstitution]

    def post(self, request, meal_pk):
        user = request.user
        meal = (get_object_or_404(MealLog, pk=meal_pk, user=user)
                if user.role == 'elderly'
                else get_object_or_404(MealLog, pk=meal_pk, user__institution=user.institution))
        serializer = MealItemCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = MealItem.objects.create(meal_log=meal, **serializer.validated_data)
        return success_response(data=MealItemSerializer(item).data,
                                message='Food item added to meal.',
                                status_code=status.HTTP_201_CREATED)


@extend_schema(tags=['nutrition'], responses={200: OpenApiResponse(description='Item removed')})
class MealItemDeleteView(APIView):
    """Remove a specific food item from a meal log."""
    permission_classes = [IsAuthenticated, IsElderyOrInstitution]

    def delete(self, request, meal_pk, item_pk):
        user = request.user
        meal = (get_object_or_404(MealLog, pk=meal_pk, user=user)
                if user.role == 'elderly'
                else get_object_or_404(MealLog, pk=meal_pk, user__institution=user.institution))
        get_object_or_404(MealItem, pk=item_pk, meal_log=meal).delete()
        return success_response(message='Food item removed from meal.')


@extend_schema(tags=['nutrition'], responses={200: OpenApiResponse(description='Aggregated daily nutrition totals with all meals')})
class DailySummaryView(APIView):
    """Total calories, protein, carbs, fat for all meals on a given date."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        date = request.query_params.get('date')
        if not date:
            from django.utils import timezone
            date = timezone.now().date()
        user = request.user
        user_id = request.query_params.get('user_id')
        target = (get_object_or_404(UserProfile, pk=user_id, institution=user.institution)
                  if user_id and user.role in ('institution', 'system_admin')
                  else user)
        meals = MealLog.objects.filter(user=target, date=date).prefetch_related('items__food_item')
        agg = meals.aggregate(tc=Sum('total_calories'), tp=Sum('total_protein'),
                              tch=Sum('total_carbohydrates'), tf=Sum('total_fat'))
        return success_response(data={
            'date': str(date),
            'total_calories': agg['tc'] or Decimal('0'),
            'total_protein': agg['tp'] or Decimal('0'),
            'total_carbohydrates': agg['tch'] or Decimal('0'),
            'total_fat': agg['tf'] or Decimal('0'),
            'meals': MealLogSerializer(meals, many=True).data,
        })
