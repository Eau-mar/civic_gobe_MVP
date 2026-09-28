from django.db import models
from django.conf import settings
from django.urls import reverse

# Create your models here.

class VoixDuPeuple(models.Model):
    auteur = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='publications_voix')
    titre = models.CharField(max_length=255)
    contenu = models.TextField()
    audio = models.FileField(upload_to='voix/audio/', null=True, blank=True)
    objectif_votes = models.PositiveIntegerField(default=100)
    date = models.DateTimeField(auto_now_add=True)
    approuve = models.BooleanField(default=False)  # Validation par admin

    def __str__(self):
        return f"{self.titre} par {self.auteur}"

    def get_absolute_url(self):
        return reverse('detail_voix', args=[self.id])


# Commentaires avec réponses en thread
class Commentaire(models.Model):
    publication = models.ForeignKey(VoixDuPeuple, on_delete=models.CASCADE, related_name='commentaires')
    auteur = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    contenu = models.TextField()
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='reponses')
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Commentaire par {self.auteur} sur {self.publication}"


# Likes
class Like(models.Model):
    CHOIX_VOTE = (
            ('pour', 'Pour'),
            ('contre', 'Contre'),
        )

    publication = models.ForeignKey(VoixDuPeuple, on_delete=models.CASCADE, related_name='votes')
    utilisateur = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    choix = models.CharField(max_length=10, choices=CHOIX_VOTE)

    class Meta:
        unique_together = ('publication', 'utilisateur')  # Un seul vote par utilisateur

    def __str__(self):
        return f"{self.utilisateur} a voté {self.get_choix_display()} pour {self.publication}"
