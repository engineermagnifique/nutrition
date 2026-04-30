from django.urls import path
from . import views

urlpatterns = [
    path('recommendations/generate/', views.GenerateRecommendationView.as_view(), name='generate-recommendation'),
    path('recommendations/', views.RecommendationListView.as_view(), name='recommendations'),
    path('recommendations/<int:pk>/', views.RecommendationDetailView.as_view(), name='recommendation-detail'),

    path('predictions/', views.PredictionListView.as_view(), name='predictions'),
    path('predictions/<int:pk>/', views.PredictionDetailView.as_view(), name='prediction-detail'),
]
