from django.apps import AppConfig


class CivictechConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'civicTech'

    def ready(self):
        import signalement.signales
