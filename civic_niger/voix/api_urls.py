from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import VoixDuPeupleViewSet, CommentaireViewSet

router = DefaultRouter()
router.register(r'commentaires', CommentaireViewSet, basename='commentaires')
router.register(r'', VoixDuPeupleViewSet, basename='voix')

urlpatterns = [
    path('', include(router.urls)),
]
