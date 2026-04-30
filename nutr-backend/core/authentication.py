import logging
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

logger = logging.getLogger('nutritionxai')

_firebase_initialized = False


def _init_firebase():
    global _firebase_initialized
    if _firebase_initialized:
        return True
    try:
        import firebase_admin
        from firebase_admin import credentials
        if not firebase_admin._apps:
            cred_path = settings.FIREBASE_CREDENTIALS_PATH
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
        _firebase_initialized = True
        return True
    except Exception as e:
        logger.warning(f"Firebase init failed: {e}. Token verification will fail for real tokens.")
        return False


class FirebaseAuthentication(BaseAuthentication):
    """Authenticates requests using Firebase ID tokens (Bearer scheme)."""

    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Bearer '):
            return None
        token = auth_header[7:].strip()
        if not token:
            return None
        return self._verify_token(token)

    def _verify_token(self, token):
        # Development bypass: "devtoken:<user_id>" works only when DEBUG=True
        if settings.DEBUG and token.startswith('devtoken:'):
            return self._dev_bypass(token[9:])

        try:
            import firebase_admin
            from firebase_admin import auth as firebase_auth
            _init_firebase()
            decoded = firebase_auth.verify_id_token(token)
        except Exception as e:
            raise AuthenticationFailed(f'Invalid or expired Firebase token: {e}')

        firebase_uid = decoded.get('uid')
        if not firebase_uid:
            raise AuthenticationFailed('Token missing uid claim.')

        from accounts.models import UserProfile
        try:
            user = UserProfile.objects.select_related('institution').get(firebase_uid=firebase_uid)
        except UserProfile.DoesNotExist:
            raise AuthenticationFailed('No account found. Register first.')

        if not user.is_active:
            raise AuthenticationFailed('Account is deactivated.')

        return (user, token)

    def _dev_bypass(self, user_id: str):
        from accounts.models import UserProfile
        try:
            user = UserProfile.objects.select_related('institution').get(pk=int(user_id))
        except (UserProfile.DoesNotExist, ValueError):
            raise AuthenticationFailed(f'Dev bypass: no user with id={user_id}')
        if not user.is_active:
            raise AuthenticationFailed('Account is deactivated.')
        logger.debug(f'DEV AUTH BYPASS for user {user.id} ({user.role})')
        return (user, f'devtoken:{user_id}')

    def authenticate_header(self, request):
        return 'Bearer realm="NutritionX AI"'
