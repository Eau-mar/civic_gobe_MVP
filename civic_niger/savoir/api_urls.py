from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import SavoirCitoyenViewSet, CategorieSavoirViewSet

router = DefaultRouter()
router.register(r'categories', CategorieSavoirViewSet, basename='categories')
router.register(r'', SavoirCitoyenViewSet, basename='savoir')

urlpatterns = [
    path('', include(router.urls)),
]
