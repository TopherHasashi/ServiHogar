from django.urls import path
from .views import ping, register, me
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("ping/", ping, name="ping"),
    # Auth
    path("auth/register/", register, name="register"),
    path("auth/login/", TokenObtainPairView.as_view(), name="login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/me/", me, name="me"),
]
