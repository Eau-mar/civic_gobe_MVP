"""
URL configuration for civic_niger project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf.urls.static import static
from django.conf import settings
from rest_framework import permissions
from civicTech.api_views import FeedAPIView
from .views import frontend_view

urlpatterns = [
    path('admin/', admin.site.urls),
    path('auth/', include('users.urls')),
    path('', include('civicTech.urls')),
    path("api/v1/users/", include("users.api.urls")), 
    path('api/v1/signalement/', include('signalement.urls')),
    path('api/v1/savoir/', include('savoir.api_urls')),
    path('api/v1/voix/', include('voix.api_urls')),
    path('api/v1/publications/', include('profils.api_urls')),
    path('api/v1/feed/', FeedAPIView.as_view(), name='api-feed'),
    path('users/', include('profils.urls')),
    path('savoir/', include('savoir.urls')),
    path('voix/', include('voix.urls')),
    
    # Catch-all for React Native Web routes (must be last)
    re_path(r'^(?!api|admin|media|static).*$', frontend_view),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
