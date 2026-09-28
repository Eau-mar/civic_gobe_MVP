from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.urls import reverse
import uuid
from django.utils import timezone
from datetime import timedelta


class Ministere(models.Model):
    nom = models.CharField(max_length=255)
    email_contact = models.EmailField()

    class Meta:
        verbose_name = "Ministère"
        verbose_name_plural = "Ministères"

    def __str__(self):
        return self.nom


class ProfilUtilisateur(AbstractUser):
    nom = models.CharField(max_length=50)
    prenom = models.CharField(max_length=50)
    telephone = models.CharField(max_length=20, unique=True)
    photo = models.ImageField(upload_to="Photo_de_profil", null=True, blank=True)
    quartier = models.CharField(max_length=100)
    is_ministere = models.BooleanField(default=False)
    is_approved = models.BooleanField(
        default=True,
        help_text="Les comptes citoyens sont approuvés automatiquement. "
                  "Les comptes autorité/ministère nécessitent une validation admin."
    )
    ministere = models.ForeignKey(
        Ministere,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="agents",
        help_text="Ministère de rattachement (uniquement pour les agents ministériels)"
    )

    # Indique à Django que ces champs doivent être demandés lors d'un createsuperuser
    REQUIRED_FIELDS = ['telephone', 'email']

    @property
    def role(self):
        if self.is_superuser:
            return "ADMIN"
        if self.is_ministere:
            return "MINISTERE"
        return "CITOYEN"

    def __str__(self):
        label = self.role
        if self.is_ministere and self.ministere:
            label = f"Ministère — {self.ministere.nom}"
        return f"{self.prenom} {self.nom} ({label})"


class PasswordResetCode(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        return self.created_at < timezone.now() - timedelta(minutes=10)