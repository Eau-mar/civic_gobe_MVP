from rest_framework.permissions import BasePermission


class IsMinistere(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.is_ministere
            and request.user.is_approved
        )


class IsApproved(BasePermission):
    """Vérifie que le compte utilisateur est approuvé."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_approved
