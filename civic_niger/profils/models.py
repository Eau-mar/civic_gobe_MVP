from django.db import models
from django.conf import settings


class Publication(models.Model):
    ministere = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    titre = models.CharField(max_length=255)
    contenu = models.TextField()
    image = models.ImageField(upload_to='publications/', null=True, blank=True)
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.titre} par {self.ministere.nom}"
    


# Notifications (simple historique interne)
class Notification(models.Model):
    destinataire = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    lien = models.URLField(null=True, blank=True)
    lu = models.BooleanField(default=False)
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification pour {self.destinataire} - {self.message}"
    



