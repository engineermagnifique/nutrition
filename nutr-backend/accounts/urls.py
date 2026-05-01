from django.urls import path
from . import views

urlpatterns = [
    # Public registration
    path('institution/register/', views.InstitutionRegisterView.as_view(), name='institution-register'),
    path('user/register/', views.ElderlyRegisterView.as_view(), name='elderly-register'),

    # Email verification
    path('verify-email/', views.VerifyEmailView.as_view(), name='verify-email'),
    path('resend-verification/', views.ResendVerificationView.as_view(), name='resend-verification'),
    
    path('profile/', views.UserProfileView.as_view(), name='user-profile'),
    path('institution/profile/', views.InstitutionProfileView.as_view(), name='institution-profile'),
    path('institution/users/', views.InstitutionUsersView.as_view(), name='institution-users'),

    # System admin
    path('admin/institutions/', views.AdminInstitutionListView.as_view(), name='admin-institutions'),
    path('admin/institutions/<int:pk>/toggle/', views.AdminToggleInstitutionView.as_view(), name='admin-institution-toggle'),
    path('admin/users/', views.AdminUserListView.as_view(), name='admin-users'),
    path('admin/users/<int:pk>/toggle/', views.AdminToggleUserView.as_view(), name='admin-user-toggle'),

    # Dashboard
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),
]
