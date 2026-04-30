from rest_framework.permissions import BasePermission


class IsSystemAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_active and request.user.role == 'system_admin')


class IsInstitution(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_active and request.user.role == 'institution')


class IsElderly(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_active and request.user.role == 'elderly')


class IsInstitutionOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_active
            and request.user.role in ('institution', 'system_admin')
        )


class IsElderyOrInstitution(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_active
            and request.user.role in ('elderly', 'institution', 'system_admin')
        )


class BelongsToSameInstitution(BasePermission):
    """Object-level: the target user must belong to the requesting institution."""

    def has_object_permission(self, request, view, obj):
        if request.user.role == 'system_admin':
            return True
        user = getattr(obj, 'user', obj)
        return user.institution_id == request.user.institution_id
