from django.core.management.base import BaseCommand
from accounts.models import UserProfile


class Command(BaseCommand):
    help = 'Create a system admin UserProfile linked to a Firebase UID'

    def add_arguments(self, parser):
        parser.add_argument('firebase_uid', type=str)
        parser.add_argument('email', type=str)
        parser.add_argument('full_name', type=str)

    def handle(self, *args, **options):
        uid = options['firebase_uid']
        email = options['email']
        name = options['full_name']

        if UserProfile.objects.filter(firebase_uid=uid).exists():
            self.stderr.write(f'UserProfile with Firebase UID {uid} already exists.')
            return

        user = UserProfile.objects.create(
            firebase_uid=uid,
            email=email,
            full_name=name,
            role=UserProfile.ROLE_SYSTEM_ADMIN,
        )
        self.stdout.write(self.style.SUCCESS(f'System admin created: {user.email} (ID: {user.id})'))
