from django.contrib import admin

from signalement.models import Signalement
from profils.models import Publication, Notification
from voix.models import Commentaire, Like, VoixDuPeuple
from savoir.models import SavoirCitoyen, CategorieSavoir

from django.core.mail import send_mail
from django.conf import settings

# Register your models here.

tables = [
    Commentaire,
    Like,
    Notification,
    SavoirCitoyen,
    CategorieSavoir,
]

@admin.register(Signalement)
class SignalementAdmin(admin.ModelAdmin):
    list_display = ('titre', 'categorie', 'statut', 'date')
    list_filter = ('categorie', 'statut')
    search_fields = ('titre', 'localisation')


@admin.register(Publication)
class PublicationAdmin(admin.ModelAdmin):
    list_display = ('titre', 'ministere', 'date')
    list_filter = ('titre', 'ministere')
    search_fields = ('titre', 'contenu')


@admin.register(VoixDuPeuple)
class VoixDuPeupleAdmin(admin.ModelAdmin):
    list_display = ('titre', 'auteur', 'approuve', 'date')
    list_filter = ('approuve',)
    search_fields = ('titre', 'contenu')
    actions = ['approuver_voix']

    def approuver_voix(self, request, queryset):
        queryset.update(approuve=True)
        for voix in queryset:
            send_mail(
                'Votre voix a été approuvée !',
                f'Bravo ! Votre publication "{voix.titre}" est maintenant visible.',
                settings.DEFAULT_FROM_EMAIL,
                [voix.auteur.email],
                fail_silently=False
            )
        self.message_user(request, "Publications approuvées et notifications envoyées.")

admin.site.register(tables)