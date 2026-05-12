import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
        ('health', '0002_medication'),
    ]

    operations = [
        migrations.CreateModel(
            name='UserPreferences',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('dietary_type', models.CharField(
                    choices=[
                        ('none', 'No restrictions'),
                        ('vegetarian', 'Vegetarian'),
                        ('vegan', 'Vegan'),
                        ('halal', 'Halal'),
                        ('kosher', 'Kosher'),
                        ('hindu_vegetarian', 'Hindu Vegetarian'),
                    ],
                    default='none', max_length=20,
                )),
                ('disliked_foods', models.JSONField(blank=True, default=list)),
                ('favorite_foods', models.JSONField(blank=True, default=list)),
                ('daily_lifestyle', models.CharField(
                    choices=[
                        ('office_worker', 'Office / desk worker'),
                        ('physical_labor', 'Physical labor / manual work'),
                        ('retired', 'Retired'),
                        ('active_outdoors', 'Active outdoors (farming, sport)'),
                        ('student', 'Student'),
                    ],
                    default='office_worker', max_length=20,
                )),
                ('additional_notes', models.TextField(blank=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='preferences',
                    to='accounts.userprofile',
                )),
            ],
            options={'db_table': 'user_preferences'},
        ),
    ]
