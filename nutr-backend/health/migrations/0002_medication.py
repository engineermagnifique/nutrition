import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
        ('health', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Medication',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('medication_name', models.CharField(max_length=200)),
                ('dosage', models.CharField(blank=True, max_length=100)),
                ('frequency', models.CharField(
                    choices=[
                        ('once_daily', 'Once daily'), ('twice_daily', 'Twice daily'),
                        ('three_times_daily', 'Three times daily'), ('as_needed', 'As needed'),
                        ('weekly', 'Weekly'),
                    ],
                    default='once_daily', max_length=20,
                )),
                ('purpose', models.CharField(blank=True, max_length=200)),
                ('with_food', models.BooleanField(default=True)),
                ('is_current', models.BooleanField(default=True)),
                ('start_date', models.DateField(blank=True, null=True)),
                ('notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='medications',
                    to='accounts.userprofile',
                )),
            ],
            options={'db_table': 'medications', 'ordering': ['-created_at']},
        ),
    ]
