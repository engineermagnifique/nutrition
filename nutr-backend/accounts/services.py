import logging
from django.conf import settings

logger = logging.getLogger('nutritionxai')


def verify_firebase_token(token: str) -> dict:
    """Verify a Firebase ID token and return the decoded payload.

    In DEBUG mode, tokens prefixed with 'devuid:' are accepted as mock tokens
    and return a synthetic decoded payload without calling Firebase.
    """
    if settings.DEBUG and token.startswith('devuid:'):
        uid = token[7:]
        logger.debug(f'DEV: using mock Firebase token for uid={uid}')
        return {'uid': uid, 'email': f'{uid}@dev.local'}
    try:
        import firebase_admin
        from firebase_admin import auth as firebase_auth, credentials
        if not firebase_admin._apps:
            cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
            firebase_admin.initialize_app(cred)
        return firebase_auth.verify_id_token(token)
    except Exception as e:
        logger.error(f'Firebase token verification failed: {e}')
        raise ValueError(f'Invalid Firebase token: {e}')


def register_institution(validated_data: dict) -> tuple:
    """Create Institution and its admin UserProfile from verified token data."""
    from .models import Institution, UserProfile
    decoded = verify_firebase_token(validated_data['firebase_token'])
    firebase_uid = decoded['uid']

    if UserProfile.objects.filter(firebase_uid=firebase_uid).exists():
        raise ValueError('A user with this Firebase account already exists.')

    institution = Institution.objects.create(
        name=validated_data['name'],
        email=validated_data['email'],
        phone=validated_data['phone'],
        location=validated_data['location'],
    )
    user = UserProfile.objects.create(
        firebase_uid=firebase_uid,
        email=validated_data['email'],
        full_name=validated_data['name'],
        role=UserProfile.ROLE_INSTITUTION,
        institution=institution,
    )
    logger.info(f'Institution registered: {institution.institution_id}')
    return institution, user


def register_elderly_user(validated_data: dict) -> 'UserProfile':
    """Create an elderly UserProfile linked to an institution."""
    from .models import Institution, UserProfile
    decoded = verify_firebase_token(validated_data['firebase_token'])
    firebase_uid = decoded['uid']

    if UserProfile.objects.filter(firebase_uid=firebase_uid).exists():
        raise ValueError('A user with this Firebase account already exists.')

    institution = Institution.objects.get(
        institution_id=validated_data['institution_id'],
        is_active=True,
    )
    user = UserProfile.objects.create(
        firebase_uid=firebase_uid,
        email=validated_data['email'],
        full_name=validated_data['full_name'],
        role=UserProfile.ROLE_ELDERLY,
        institution=institution,
        date_of_birth=validated_data['date_of_birth'],
        gender=validated_data['gender'],
        phone=validated_data.get('phone', ''),
    )
    logger.info(f'Elderly user registered: {user.id} at {institution.institution_id}')
    return user
