from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    path('admin/', admin.site.urls),

    # OpenAPI schema + Swagger UI + ReDoc
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    path('api/v1/', include([
        path('auth/', include('accounts.urls')),
        path('health/', include('health.urls')),
        path('nutrition/', include('nutrition.urls')),
        path('ai/', include('ai_engine.urls')),
        path('alerts/', include('alerts.urls')),
        path('progress/', include('progress.urls')),
    ])),
]
