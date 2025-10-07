from django.urls import path
from .views import ping, register, me, reset_admin, sync_usuario
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("ping/", ping, name="ping"),
    # Auth
    path("auth/register/", register, name="register"),
    path("auth/login/", TokenObtainPairView.as_view(), name="login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/me/", me, name="me"),
    # Debug helpers
    path("auth/debug/reset-admin/", reset_admin, name="reset_admin"),
    path("auth/debug/sync-usuario/", sync_usuario, name="sync_usuario"),
]
