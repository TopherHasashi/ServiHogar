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
    verifier_stats,
    schedule_detail,
    schedule_block_conflicts,
    services_search,
    toggle_service_visibility,
    service_availability,
    service_book,
    booking_confirm,
    booking_cancel,
    booking_complete,
    create_review,
    service_weekly_template,
    my_requests,
    professional_stats,
    update_service_price,
    update_service_details,
)
from .payments import (
    create_booking_and_payment,
    create_payment_preference,
    payment_webhook,
    payment_status,
    process_checkout_api_payment,
    test_mp_credentials,
)
from .admin_views import (
    admin_dashboard_summary,
)
from .bank_account_views import (
    get_servihogar_bank_accounts,
    create_servihogar_bank_account,
    update_servihogar_bank_account,
    delete_servihogar_bank_account,
    get_bank_account_stats,
)
from .config_views import (
    get_system_config, 
    update_system_config, 
    get_config_value,
)
from .operations_views import (
    get_problematic_requests,
    get_operations_stats,
    resolve_request_issue,
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
    path("verifications/stats/", verifier_stats, name="verifier_stats"),
    # Debug helpers
    path("auth/debug/reset-admin/", reset_admin, name="reset_admin"),
    path("auth/debug/reset-verifier/", reset_verifier, name="reset_verifier"),
    path("auth/debug/sync-usuario/", sync_usuario, name="sync_usuario"),
    # Geo
    path("geo/regiones/", regiones, name="regiones"),
    path("geo/comunas/", comunas, name="comunas"),
    path("categories/", categories, name="categories"),
    path("my/services/", my_services, name="my_services"),
    path("professional/stats/", professional_stats, name="professional_stats"),
    # Scheduling
    path("schedule/<uuid:service_id>/", schedule_detail, name="schedule_detail"),
    path("schedule/<uuid:service_id>/block-conflicts/", schedule_block_conflicts, name="schedule_block_conflicts"),
    path("services/search/", services_search, name="services_search"),
    path("services/<uuid:service_id>/availability/", service_availability, name="service_availability"),
    path("services/<uuid:service_id>/weekly-template/", service_weekly_template, name="service_weekly_template"),
    path("services/<uuid:service_id>/book/", service_book, name="service_book"),
    path("requests/<uuid:request_id>/confirm/", booking_confirm, name="booking_confirm"),
    path("requests/<uuid:request_id>/cancel/", booking_cancel, name="booking_cancel"),
    path("requests/<uuid:request_id>/complete/", booking_complete, name="booking_complete"),
    path("requests/<uuid:request_id>/review/", create_review, name="create_review"),
    path("my/requests/", my_requests, name="my_requests"),
    path("services/<uuid:service_id>/visibility/", toggle_service_visibility, name="toggle_service_visibility"),
    path("services/<uuid:service_id>/price/", update_service_price, name="update_service_price"),
    path("services/<uuid:service_id>/details/", update_service_details, name="update_service_details"),
    # Payments
    path("payments/test-credentials/", test_mp_credentials, name="test_mp_credentials"),
    path("payments/book/<uuid:service_id>/", create_booking_and_payment, name="create_booking_and_payment"),
    path("payments/process/", process_checkout_api_payment, name="process_checkout_api_payment"),
    path("payments/create/<uuid:request_id>/", create_payment_preference, name="create_payment_preference"),
    path("payments/webhook/", payment_webhook, name="payment_webhook"),
    path("payments/status/<uuid:request_id>/", payment_status, name="payment_status"),
    # Admin
    path("admin/dashboard/summary/", admin_dashboard_summary, name="admin_dashboard_summary"),
    # Bank Accounts ServiHogar
    path("admin/bank-accounts/", get_servihogar_bank_accounts, name="get_servihogar_bank_accounts"),
    path("admin/bank-accounts/create/", create_servihogar_bank_account, name="create_servihogar_bank_account"),
    path("admin/bank-accounts/<uuid:account_id>/", update_servihogar_bank_account, name="update_servihogar_bank_account"),
    path("admin/bank-accounts/<uuid:account_id>/delete/", delete_servihogar_bank_account, name="delete_servihogar_bank_account"),
    path("admin/bank-accounts/stats/", get_bank_account_stats, name="get_bank_account_stats"),
    # System Configuration
    path("admin/config/", get_system_config, name="get_system_config"),
    path("admin/config/update/", update_system_config, name="update_system_config"),
    path("admin/config/<str:clave>/", get_config_value, name="get_config_value"),
    # Operations Center
    path("admin/operations/problematic-requests/", get_problematic_requests, name="get_problematic_requests"),
    path("admin/operations/stats/", get_operations_stats, name="get_operations_stats"),
    path("admin/operations/resolve/<uuid:request_id>/", resolve_request_issue, name="resolve_request_issue"),
]
