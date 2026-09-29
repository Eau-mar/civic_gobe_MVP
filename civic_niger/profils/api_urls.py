from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import PublicationViewSet

router = DefaultRouter()
router.register(r'', PublicationViewSet, basename='publications')

urlpatterns = [
    path('', include(router.urls)),
]
