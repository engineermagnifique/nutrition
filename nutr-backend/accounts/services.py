import logging
from datetime import timedelta
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

logger = logging.getLogger('nutritionxai')


def verify_firebase_token(token: str) -> dict:
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


def send_verification_email(user) -> str:
    from .models import EmailVerification
    EmailVerification.objects.filter(user=user, is_used=False).delete()
    code = EmailVerification.generate_code()
    EmailVerification.objects.create(
        user=user,
        code=code,
        expires_at=timezone.now() + timedelta(minutes=10),
    )
    send_mail(
        subject='NutritionX AI — Verify your email',
        message=(
            f'Hello {user.full_name},\n\n'
            f'Your email verification code is:\n\n'
            f'    {code}\n\n'
            f'This code expires in 10 minutes.\n\n'
            f'If you did not register, please ignore this email.\n\n'
            f'— NutritionX AI Team'
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )
    logger.info(f'Verification email sent to {user.email}')
    return code


def verify_email_code(email: str, code: str):
    from .models import UserProfile, EmailVerification
    try:
        user = UserProfile.objects.get(email=email)
    except UserProfile.DoesNotExist:
        raise ValueError('No account found with this email.')

    if user.email_verified:
        raise ValueError('Email is already verified.')

    verification = (
        EmailVerification.objects
        .filter(user=user, code=code, is_used=False, expires_at__gt=timezone.now())
        .order_by('-created_at')
        .first()
    )
    if not verification:
        raise ValueError('Invalid or expired verification code.')

    verification.is_used = True
    verification.save(update_fields=['is_used'])
    user.email_verified = True
    user.save(update_fields=['email_verified'])
    logger.info(f'Email verified for user {user.id}')
    return user


def register_institution(validated_data: dict) -> tuple:
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
    try:
        send_verification_email(user)
    except Exception as e:
        logger.error(f'Failed to send verification email to {user.email}: {e}')
    logger.info(f'Institution registered: {institution.institution_id}')
    return institution, user


def register_elderly_user(validated_data: dict) -> 'UserProfile':
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
    try:
        send_verification_email(user)
    except Exception as e:
        logger.error(f'Failed to send verification email to {user.email}: {e}')
    logger.info(f'Elderly user registered: {user.id} at {institution.institution_id}')
    return user
