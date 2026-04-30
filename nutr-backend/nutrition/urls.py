from django.urls import path
from . import views

urlpatterns = [
    path('food-items/', views.FoodItemListCreateView.as_view(), name='food-items'),
    path('food-items/<int:pk>/', views.FoodItemDetailView.as_view(), name='food-item-detail'),

    path('meals/', views.MealLogListCreateView.as_view(), name='meal-logs'),
    path('meals/<int:pk>/', views.MealLogDetailView.as_view(), name='meal-log-detail'),
    path('meals/<int:meal_pk>/items/', views.MealItemCreateView.as_view(), name='meal-item-create'),
    path('meals/<int:meal_pk>/items/<int:item_pk>/', views.MealItemDeleteView.as_view(), name='meal-item-delete'),

    path('daily-summary/', views.DailySummaryView.as_view(), name='daily-summary'),
]
