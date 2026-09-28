from django.db import models
from django.conf import settings
from users.models import Ministere

class Signalement(models.Model):
    CATEGORIES = [
        ('eau', 'Eau potable'),
        ('route', 'Voirie / Routes'),
        ('eclairage', 'Éclairage public'),
        ('sante', 'Santé'),
        ('securite', 'Sécurité publique'),
        ('autre', 'Autre'),
    ]

    STATUTS = [
        ('non_traite', 'Non traité'),
        ('en_cours', 'En cours'),
        ('traite', 'Traité'),
    ]

    # Données principales
    titre = models.CharField(max_length=255, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    categorie = models.CharField(max_length=50, choices=CATEGORIES, default="autre")
    
    # Médias & Confidentialité
    image = models.ImageField(upload_to='signalements/images/', null=True, blank=True)
    audio = models.FileField(upload_to='signalements/audios/', null=True, blank=True)
    est_public = models.BooleanField(
        default=True, 
        help_text="Si False, seul le citoyen et les agents du ministère pourront voir les médias."
    )
    
    # Géolocalisation
    localisation = models.CharField(max_length=255, null=True, blank=True, help_text="Adresse textuelle")
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    # Live Streaming
    is_live = models.BooleanField(default=False, help_text="Indique si un flux vidéo en direct est en cours.")
    live_room_id = models.CharField(max_length=100, null=True, blank=True)
    live_started_at = models.DateTimeField(null=True, blank=True, help_text="Horodatage du début du live.")

    # État
    statut = models.CharField(max_length=20, choices=STATUTS, default='non_traite')
    date = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    approuver = models.BooleanField(default=False)
    
    # Relations
    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='signalements_crees'
    )
    ministere = models.ForeignKey(
        Ministere, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='signalements_assignes',
        help_text="Le ministère en charge de la résolution."
    )

    def __str__(self):
        return f"[{self.categorie}] {self.titre or 'Signalement'} - {self.get_statut_display()}"


class LiveFrame(models.Model):
    """
    Une frame (capture JPEG) envoyée par le citoyen pendant un Live.
    Stockée séquentiellement pour reconstruire le flux visuel.
    """
    signalement = models.ForeignKey(
        Signalement, on_delete=models.CASCADE,
        related_name='live_frames'
    )
    image = models.ImageField(upload_to='signalements/live_frames/')
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"Frame {self.id} - Signalement {self.signalement_id} @ {self.timestamp}"

