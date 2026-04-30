from django.urls import path
from . import views

urlpatterns = [
    path('records/', views.HealthRecordListCreateView.as_view(), name='health-records'),
    path('records/<int:pk>/', views.HealthRecordDetailView.as_view(), name='health-record-detail'),

    path('conditions/', views.MedicalConditionListCreateView.as_view(), name='medical-conditions'),
    path('conditions/<int:pk>/', views.MedicalConditionDetailView.as_view(), name='medical-condition-detail'),

    path('goals/', views.HealthGoalListCreateView.as_view(), name='health-goals'),
    path('goals/<int:pk>/', views.HealthGoalDetailView.as_view(), name='health-goal-detail'),

    path('summary/', views.UserHealthSummaryView.as_view(), name='health-summary'),
    path('summary/<int:user_id>/', views.UserHealthSummaryView.as_view(), name='health-summary-user'),
]
