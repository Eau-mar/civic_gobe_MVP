from profils.models import Notification

def notification_count(request):
    if request.user.is_authenticated:
        count = request.user.notifications.filter(lu=False).count()
    else:
        count = 0
    return {'notification_count': count}
