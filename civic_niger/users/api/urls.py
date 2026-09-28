from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    UserRegisterViewSet,
    LoginAPI,
    RequestResetCodeAPI,
    VerifyResetCodeAPI,
    SetNewPasswordAPI,
    UserMeAPI,
    MinistereListAPI,
)

router = DefaultRouter()
router.register("register", UserRegisterViewSet, basename="register")

urlpatterns = [
    path("auth/login/", LoginAPI.as_view()),
    path("auth/token/refresh/", TokenRefreshView.as_view()),

    path("me/", UserMeAPI.as_view(), name="user-me"),

    path("ministeres/", MinistereListAPI.as_view(), name="ministere-list"),

    path("password/request/", RequestResetCodeAPI.as_view()),
    path("password/verify/", VerifyResetCodeAPI.as_view()),
    path("password/reset/", SetNewPasswordAPI.as_view()),

    path("", include(router.urls)),
]
