from django.db import models
from django.conf import settings


class CategorieSavoir(models.Model):
    nom = models.CharField(max_length=100)

    def __str__(self):
        return self.nom


# Create your models here.
class SavoirCitoyen(models.Model):
    STATUT_CHOICES = [
        ('brouillon', 'Brouillon'),
        ('publie', 'Publié'),
    ]

    titre = models.CharField(max_length=255)
    contenu = models.TextField()
    audio = models.FileField(upload_to='savoir/audio/', null=True, blank=True)
    image = models.ImageField(upload_to='savoirs/', blank=True, null=True)
    categorie = models.ForeignKey(CategorieSavoir, on_delete=models.SET_NULL, null=True, blank=True)
    auteur = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    statut = models.CharField(max_length=10, choices=STATUT_CHOICES, default='brouillon')
    date = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.titre
