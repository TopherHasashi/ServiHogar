from django.urls import path
from .views import (
    ping,
    register,
    me,
    update_me,
    upload_avatar,
    reset_admin,
    reset_verifier,
    sync_usuario,
    regiones,
    comunas,
    categories,
    my_services,
    apply_professional,
    verifications_pending,
    verify_service,
    schedule_detail,
    services_search,
    toggle_service_visibility,
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("ping/", ping, name="ping"),
    # Auth
    path("auth/register/", register, name="register"),
    path("auth/login/", TokenObtainPairView.as_view(), name="login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/me/", me, name="me"),
    path("auth/me/update/", update_me, name="update_me"),
    path("auth/me/avatar/", upload_avatar, name="upload_avatar"),
    # Professional application & verification
    path("professional/apply/", apply_professional, name="apply_professional"),
    path("verifications/pending/", verifications_pending, name="verifications_pending"),
    path("verifications/service/<uuid:servicio_id>/", verify_service, name="verify_service"),
    # Debug helpers
    path("auth/debug/reset-admin/", reset_admin, name="reset_admin"),
    path("auth/debug/reset-verifier/", reset_verifier, name="reset_verifier"),
    path("auth/debug/sync-usuario/", sync_usuario, name="sync_usuario"),
    # Geo
    path("geo/regiones/", regiones, name="regiones"),
    path("geo/comunas/", comunas, name="comunas"),
    path("categories/", categories, name="categories"),
    path("my/services/", my_services, name="my_services"),
    # Scheduling
    path("schedule/<uuid:service_id>/", schedule_detail, name="schedule_detail"),
    path("services/search/", services_search, name="services_search"),
    path("services/<uuid:service_id>/visibility/", toggle_service_visibility, name="toggle_service_visibility"),
]
