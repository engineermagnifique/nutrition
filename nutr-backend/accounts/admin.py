from django.contrib import admin
from .models import Institution, UserProfile


@admin.register(Institution)
class InstitutionAdmin(admin.ModelAdmin):
    list_display = ['institution_id', 'name', 'email', 'phone', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['institution_id', 'name', 'email']
    readonly_fields = ['institution_id', 'created_at', 'updated_at']


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'email', 'role', 'institution', 'is_active', 'created_at']
    list_filter = ['role', 'is_active', 'gender']
    search_fields = ['full_name', 'email', 'firebase_uid']
    readonly_fields = ['firebase_uid', 'created_at', 'updated_at']
    raw_id_fields = ['institution']
