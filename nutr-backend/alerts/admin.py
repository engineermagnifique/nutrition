from django.contrib import admin
from .models import Alert


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ['user', 'alert_type', 'severity', 'title', 'is_read', 'created_at']
    list_filter = ['alert_type', 'severity', 'is_read']
    search_fields = ['user__full_name', 'title']
    readonly_fields = ['created_at', 'read_at']
    raw_id_fields = ['user', 'institution']

    def mark_read(self, request, queryset):
        from django.utils import timezone
        queryset.update(is_read=True, read_at=timezone.now())
    mark_read.short_description = 'Mark selected alerts as read'
    actions = ['mark_read']
