from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import SavoirCitoyen, CategorieSavoir
from .serializers import SavoirCitoyenSerializer, CategorieSavoirSerializer

class IsMinistereOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow ministries to create/edit Savoir.
    Citizens can only read.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated and getattr(request.user, 'is_ministere', False)

class CategorieSavoirViewSet(viewsets.ModelViewSet):
    queryset = CategorieSavoir.objects.all()
    serializer_class = CategorieSavoirSerializer
    permission_classes = [IsMinistereOrReadOnly]

class SavoirCitoyenViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        user = self.request.user
        # Les agents de ministère ne voient et ne gèrent que les savoirs de leur ministère
        if user.is_authenticated and getattr(user, 'is_ministere', False):
            if getattr(user, 'ministere', None):
                return SavoirCitoyen.objects.filter(auteur__ministere=user.ministere).order_by('-date')
            return SavoirCitoyen.objects.filter(auteur=user).order_by('-date')
        
        # Les citoyens (et autres) voient tous les savoirs publiés
        return SavoirCitoyen.objects.filter(statut='publie').order_by('-date')
    serializer_class = SavoirCitoyenSerializer
    permission_classes = [IsMinistereOrReadOnly]

    def perform_create(self, serializer):
        # Always default to publie for mobile API for now, or allow draft if needed
        serializer.save(auteur=self.request.user, statut='publie')
