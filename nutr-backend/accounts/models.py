import uuid
import logging
from django.db import models

logger = logging.getLogger('nutritionxai')


def _generate_institution_id():
    return 'INST-' + uuid.uuid4().hex[:8].upper()


class Institution(models.Model):
    institution_id = models.CharField(max_length=20, unique=True, editable=False)
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=30)
    location = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'institutions'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.institution_id:
            self.institution_id = _generate_institution_id()
            while Institution.objects.filter(institution_id=self.institution_id).exists():
                self.institution_id = _generate_institution_id()
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.name} ({self.institution_id})'


class UserProfile(models.Model):
    ROLE_SYSTEM_ADMIN = 'system_admin'
    ROLE_INSTITUTION = 'institution'
    ROLE_ELDERLY = 'elderly'
    ROLE_CHOICES = [
        (ROLE_SYSTEM_ADMIN, 'System Admin'),
        (ROLE_INSTITUTION, 'Care Institution Admin'),
        (ROLE_ELDERLY, 'Elderly User'),
    ]

    GENDER_MALE = 'male'
    GENDER_FEMALE = 'female'
    GENDER_OTHER = 'other'
    GENDER_CHOICES = [
        (GENDER_MALE, 'Male'),
        (GENDER_FEMALE, 'Female'),
        (GENDER_OTHER, 'Other'),
    ]

    firebase_uid = models.CharField(max_length=128, unique=True, db_index=True)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    institution = models.ForeignKey(
        Institution,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='members',
    )
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, null=True, blank=True)
    phone = models.CharField(max_length=30, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_profiles'
        ordering = ['-created_at']

    # DRF / auth compatibility
    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

    def __str__(self):
        return f'{self.full_name} ({self.role})'
