import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE','servihogar.settings')
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
from api.models import ServiceSchedule, ServiceUnavailability, ServiceCustomPeriod
print('schedules:', ServiceSchedule.objects.count())
print('unavailabilities:', ServiceUnavailability.objects.count())
print('periods:', ServiceCustomPeriod.objects.count())
