from django.urls import path
from . import views

urlpatterns = [
    path('logs/', views.ImprovementLogListCreateView.as_view(), name='improvement-logs'),
    path('logs/<int:pk>/', views.ImprovementLogDetailView.as_view(), name='improvement-log-detail'),

    path('caregiver-notes/', views.CaregiverNoteListCreateView.as_view(), name='caregiver-notes'),
    path('caregiver-notes/<int:pk>/', views.CaregiverNoteDetailView.as_view(), name='caregiver-note-detail'),
]
