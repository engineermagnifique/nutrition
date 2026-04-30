from django.urls import path
from . import views

urlpatterns = [
    path('', views.AlertListView.as_view(), name='alerts'),
    path('create/', views.AlertCreateView.as_view(), name='alert-create'),
    path('<int:pk>/', views.AlertDetailView.as_view(), name='alert-detail'),
    path('<int:pk>/mark-read/', views.AlertMarkReadView.as_view(), name='alert-mark-read'),
    path('mark-all-read/', views.AlertMarkAllReadView.as_view(), name='alert-mark-all-read'),
]
