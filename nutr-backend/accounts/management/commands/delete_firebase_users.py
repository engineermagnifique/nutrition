from django.core.management.base import BaseCommand
from django.conf import settings


class Command(BaseCommand):
    help = 'Delete Firebase accounts by email address'

    def add_arguments(self, parser):
        parser.add_argument('emails', nargs='+', type=str, help='Email addresses to delete from Firebase')

    def handle(self, *args, **options):
        import firebase_admin
        from firebase_admin import auth as firebase_auth, credentials

        if not firebase_admin._apps:
            cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
            firebase_admin.initialize_app(cred)

        for email in options['emails']:
            try:
                user = firebase_auth.get_user_by_email(email)
                firebase_auth.delete_user(user.uid)
                self.stdout.write(self.style.SUCCESS(f'  Deleted: {email}'))
            except firebase_auth.UserNotFoundError:
                self.stdout.write(self.style.WARNING(f'  Not in Firebase: {email}'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  Failed ({email}): {e}'))
