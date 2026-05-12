import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
        ('ai_engine', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='WeeklyReport',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('week_start', models.DateField()),
                ('week_end', models.DateField()),
                ('days_logged', models.IntegerField(default=0)),
                ('avg_daily_calories', models.DecimalField(blank=True, decimal_places=2, max_digits=8, null=True)),
                ('calorie_target', models.DecimalField(blank=True, decimal_places=2, max_digits=8, null=True)),
                ('avg_daily_protein', models.DecimalField(blank=True, decimal_places=2, max_digits=7, null=True)),
                ('weight_start', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('weight_end', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('bmi_end', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('overall_score', models.IntegerField(default=0)),
                ('summary', models.TextField(blank=True)),
                ('wins', models.JSONField(default=list)),
                ('improvements', models.JSONField(default=list)),
                ('next_week_goals', models.JSONField(default=list)),
                ('medication_notes', models.JSONField(default=list)),
                ('raw_data', models.JSONField(default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='weekly_reports',
                    to='accounts.userprofile',
                )),
            ],
            options={
                'db_table': 'weekly_reports',
                'ordering': ['-week_start'],
                'unique_together': {('user', 'week_start')},
            },
        ),
    ]
