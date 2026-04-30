import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('nutritionxai')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

app.conf.beat_schedule = {
    'daily-recommendations': {
        'task': 'tasks.scheduled.generate_daily_recommendations',
        'schedule': crontab(hour=6, minute=0),
    },
    'weekly-predictions': {
        'task': 'tasks.scheduled.update_predictions',
        'schedule': crontab(hour=0, minute=0, day_of_week='monday'),
    },
    'alert-evaluation': {
        'task': 'tasks.scheduled.evaluate_alerts',
        'schedule': crontab(minute='*/30'),
    },
}
