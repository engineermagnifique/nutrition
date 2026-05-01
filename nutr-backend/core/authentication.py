import logging
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

logger = logging.getLogger('nutritionxai')


class FirebaseAuthentication(BaseAuthentication):
    """
    Authenticates requests using Firebase ID tokens sent as:
        Authorization: Bearer <firebase_id_token>

    Development shortcut (works whenever DEBUG=True):
        Authorization: Bearer devtoken:<user_id>
    """

    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Bearer '):
            return None
        token = auth_header[7:].strip()
        if not token:
            return None

        # ── Development bypass ─────────────────────────────────────────────
        if token.startswith('devtoken:') and getattr(settings, 'DEBUG', False):
            user_id_str = token[len('devtoken:'):]
            return self._dev_bypass(user_id_str)

        # ── Firebase verification ──────────────────────────────────────────
        return self._verify_firebase_token(token)

    # ------------------------------------------------------------------
    def _dev_bypass(self, user_id_str: str):
        from accounts.models import UserProfile
        try:
            user = UserProfile.objects.select_related('institution').get(pk=int(user_id_str))
        except (UserProfile.DoesNotExist, ValueError, TypeError):
            raise AuthenticationFailed(f'Dev bypass: no user with id={user_id_str!r}')
        if not user.is_active:
            raise AuthenticationFailed('Account is deactivated.')
        logger.debug('DEV AUTH: user=%s role=%s', user.id, user.role)
        return (user, f'devtoken:{user_id_str}')

    def _verify_firebase_token(self, token: str):
        try:
            import firebase_admin
            from firebase_admin import auth as fb_auth, credentials
            if not firebase_admin._apps:
                cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
                firebase_admin.initialize_app(cred)
            decoded = fb_auth.verify_id_token(token)
        except Exception as exc:
            raise AuthenticationFailed(f'Invalid Firebase token: {exc}')

        firebase_uid = decoded.get('uid')
        if not firebase_uid:
            raise AuthenticationFailed('Token missing uid.')

        from accounts.models import UserProfile
        try:
            user = UserProfile.objects.select_related('institution').get(firebase_uid=firebase_uid)
        except UserProfile.DoesNotExist:
            raise AuthenticationFailed('No account found for this Firebase user. Register first.')

        if not user.is_active:
            raise AuthenticationFailed('Account is deactivated.')
        return (user, token)

    def authenticate_header(self, request):
        return 'Bearer realm="NutritionX AI"'
