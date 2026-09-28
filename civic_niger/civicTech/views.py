from django.template import loader
from django.http import HttpResponse
from django.db.models import Q
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required, user_passes_test
from django.conf import settings
from django.core.mail import send_mail
from django.contrib.auth import get_user_model
from signalement.models import *
from voix.models import *
from savoir.models import *
from profils.models import *

# Create your views here.

User = get_user_model()


@login_required
def accueil(request):

    query = request.GET.get('q')
    filter_type = request.GET.get('type')

    # On commence par tout charger
    signalements = Signalement.objects.filter(approuver=True)
    voix = VoixDuPeuple.objects.filter(approuve=True)
    savoirs = SavoirCitoyen.objects.filter(statut="publie")
    publications = Publication.objects.all()

    # Recherche par mots-clés
    if query:
        signalements = signalements.filter(
            Q(titre__icontains=query) | Q(description__icontains=query)
        )
        voix = voix.filter(titre__icontains=query)
        savoirs = savoirs.filter(Q(titre__icontains=query) | Q(contenu__icontains=query))
        publications = publications.filter(Q(titre__icontains=query) | Q(contenu__icontains=query))

    # Filtrage par type
    actualites = []
    if filter_type == "signalement":
        actualites = list(signalements)
    elif filter_type == "voix":
        actualites = list(voix)
    elif filter_type == "savoir":
        actualites = list(savoirs)
    elif filter_type == "publication":
        actualites = list(publications)
    else:
        # Mélange tout par défaut
        actualites = list(signalements) + list(voix) + list(savoirs) + list(publications)

    # Tri par date (assumons qu'ils ont tous un champ "date")
    actualites.sort(key=lambda x: x.date, reverse=True)

    context = {
        'actualites': actualites,
        'query': query,
        'filter_type': filter_type,
    }

    template = loader.get_template('civicTech/accueil.html')
    return HttpResponse(template.render(context, request))


def bienvenue(request):
    
    template = loader.get_template('users/bienvenue.html')
    return HttpResponse(template.render())


# Détail d'une publication
@login_required
def notifier_utilisateur_signalement_approve(signalement):
    utilisateur = signalement.utilisateur
    lien_admin = f"{settings.SITE_URL}/admin/civicTech/signalement/{signalement.id}/change/"

    # Créer une notification en base
    Notification.objects.create(
        destinataire=utilisateur,
        message=f"Votre signalement '{signalement.titre}' a été approuvé.",
        lien=lien_admin
    )

    # (Facultatif) Envoyer un email
    send_mail(
        "Signalement approuvé",
        f"Votre signalement '{signalement.titre}' a été approuvé.\nVous pouvez voir vos signalements sur la plateforme.",
        settings.DEFAULT_FROM_EMAIL,
        [utilisateur.email]
    )


def blog(request):

    type_filtre = request.GET.get('type')  # ?type=savoir / publication

    publications = Publication.objects.all()
    savoirs = SavoirCitoyen.objects.filter(statut='publie')

    # On combine et trie par date descendante
    items = []
    if type_filtre in [None, '', 'tous']:
        items = list(publications) + list(savoirs)
    elif type_filtre == 'publication':
        items = list(publications)
    elif type_filtre == 'savoir':
        items = list(savoirs)

    items.sort(key=lambda x: x.date, reverse=True)  # tri sur la date

    return render(request, 'civicTech/blog.html', {
        'items': items,
        'type_filtre': type_filtre,
    })

@login_required
def apropos(request):
    template = loader.get_template('civicTech/apropos.html')
    return HttpResponse(template.render())