import logging
from datetime import timedelta
from django.conf import settings
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
    from django.core.mail import EmailMultiAlternatives

    EmailVerification.objects.filter(user=user, is_used=False).delete()
    code = EmailVerification.generate_code()
    EmailVerification.objects.create(
        user=user,
        code=code,
        expires_at=timezone.now() + timedelta(minutes=10),
    )

    name = user.full_name or 'there'
    digits = '  '.join(list(str(code)))

    plain = (
        f'Hello {name},\n\n'
        f'Your NutritionX AI verification code is:\n\n'
        f'    {code}\n\n'
        f'This code expires in 10 minutes.\n'
        f'If you did not create this account, you can safely ignore this email.\n\n'
        f'— NutritionX AI Team'
    )

    html = f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f7f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="520" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:12px;overflow:hidden;
                    border:1px solid #e0e8e0;">
        <!-- Header -->
        <tr>
          <td style="background:#2E7D32;padding:28px 32px;">
            <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;
                      letter-spacing:-0.3px;">
              NutritionX<span style="color:#86efac;">AI</span>
            </p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 32px;">
            <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f1f0f;">
              Verify your email
            </p>
            <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.6;">
              Hello {name}, use the code below to verify your email address.
              It expires in <strong>10 minutes</strong>.
            </p>
            <!-- Code box -->
            <div style="background:#f0fdf4;border:2px solid #bbf7d0;border-radius:12px;
                        padding:24px;text-align:center;margin-bottom:28px;">
              <p style="margin:0 0 6px;font-size:11px;color:#6b7280;
                        text-transform:uppercase;letter-spacing:0.08em;">
                Verification Code
              </p>
              <p style="margin:0;font-size:36px;font-weight:800;color:#2E7D32;
                        letter-spacing:0.25em;font-family:monospace;">
                {digits}
              </p>
            </div>
            <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">
              If you did not create a NutritionX AI account, you can safely
              ignore this email.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8faf8;padding:16px 32px;
                     border-top:1px solid #e8f0e8;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              &copy; 2026 NutritionX AI &nbsp;|&nbsp; Elderly Nutrition Platform
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""

    msg = EmailMultiAlternatives(
        subject='Your NutritionX AI verification code',
        body=plain,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[user.email],
    )
    msg.attach_alternative(html, 'text/html')
    msg.send(fail_silently=False)

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

    try:
        institution = Institution.objects.get(
            institution_id=validated_data['institution_id'],
            is_active=True,
        )
    except Institution.DoesNotExist:
        raise ValueError(
            f"No active institution found with ID '{validated_data['institution_id']}'. "
            "Please check the ID with your care home administrator."
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
