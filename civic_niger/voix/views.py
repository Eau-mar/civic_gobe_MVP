from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from voix.models import VoixDuPeuple, Commentaire, Like
from profils.models import Notification
from voix.forms import VoixDuPeupleForm, CommentaireForm
from django.conf import settings
from django.core.mail import send_mail


@login_required
def detail_voix(request, publication_id):
    publication = get_object_or_404(VoixDuPeuple, id=publication_id, approuve=True)
    top_level_commentaires = publication.commentaires.filter(parent__isnull=True).order_by('date')

    # Vérifie si l'utilisateur a déjà voté
    user_vote = None
    if request.user.is_authenticated:
        try:
            vote = publication.votes.get(utilisateur=request.user)
            user_vote = vote.choix  # 'pour' ou 'contre'
        except Like.DoesNotExist:
            pass

    votes_pour = publication.votes.filter(choix='pour').count()
    votes_contre = publication.votes.filter(choix='contre').count()

    return render(request, 'voix/detail_voix.html', {
        'publication': publication,
        'commentaires': top_level_commentaires,
        'votes_pour': votes_pour,
        'votes_contre': votes_contre,
        'user_vote': user_vote,
    })

# Publier une voix
@login_required
def publier_voix(request):
    if request.method == 'POST':
        form = VoixDuPeupleForm(request.POST, request.FILES)
        if form.is_valid():
            voix = form.save(commit=False)
            voix.auteur = request.user
            voix.save()

            # Notification admin
            send_mail(
                'Nouvelle voix à approuver',
                f'Une nouvelle voix a été soumise : {voix.titre}. Vérifiez le site.',
                settings.DEFAULT_FROM_EMAIL,
                [settings.DEFAULT_FROM_EMAIL],
                fail_silently=False
            )
            return redirect('accueil')
    else:
        form = VoixDuPeupleForm()
    return render(request, 'voix/publier_voix.html', {'form': form})

@login_required
def modifier_voix(request, pk):
    voix = get_object_or_404(VoixDuPeuple, pk=pk, auteur=request.user)

    if voix.approuve:
        return render(request, 'profils/modification_interdite.html')

    if request.method == 'POST':
        form = VoixDuPeupleForm(request.POST, request.FILES, instance=voix)
        if form.is_valid():
            form.save()
            return redirect('profil_citoyen')
    else:
        form = VoixDuPeupleForm(instance=voix)

    return render(request, 'voix/modifier_voix.html', {'form': form})


@login_required
def supprimer_voix(request, pk):
    voix = get_object_or_404(VoixDuPeuple, pk=pk, utilisateur=request.user)

    if request.method == 'POST':
        voix.delete()
        return redirect('profil_citoyen')

    return render(request, 'voix/confirmer_suppression_voix.html', {'voix': voix})



# Ajouter un commentaire
@login_required
def ajouter_commentaire(request, publication_id):
    publication = get_object_or_404(VoixDuPeuple, id=publication_id, approuve=True)
    if request.method == 'POST':
        form = CommentaireForm(request.POST)
        if form.is_valid():
            commentaire = form.save(commit=False)
            commentaire.auteur = request.user
            commentaire.publication = publication
            commentaire.save()

            # Notification
            Notification.objects.create(
                destinataire=publication.auteur,
                message=f"Votre publication '{publication.titre}' a reçu un nouveau commentaire.",
                lien=publication.get_absolute_url()
            )
            return redirect('detail_voix', publication_id=publication.id)
    else:
        form = CommentaireForm()
    return render(request, 'civicTech/ajouter_commentaire.html', {'form': form, 'publication': publication})

# Ajouter une réponse
@login_required
def ajouter_reponse(request, commentaire_id):
    parent_commentaire = get_object_or_404(Commentaire, id=commentaire_id)
    if request.method == 'POST':
        form = CommentaireForm(request.POST)
        if form.is_valid():
            reponse = form.save(commit=False)
            reponse.auteur = request.user
            reponse.publication = parent_commentaire.publication
            reponse.parent = parent_commentaire
            reponse.save()

            # Notification
            Notification.objects.create(
                destinataire=parent_commentaire.auteur,
                message=f"Votre commentaire a reçu une réponse.",
                lien=parent_commentaire.publication.get_absolute_url()
            )
            return redirect('detail_voix', publication_id=parent_commentaire.publication.id)
    else:
        form = CommentaireForm()
    return render(request, 'voix/commentaire_detail.html', {
        'form': form,
        'parent': parent_commentaire
    })

# Like / Unlike
@login_required
def toggle_like(request, pk, choix):
    publication = get_object_or_404(VoixDuPeuple, pk=pk)
    
    if choix not in ['pour', 'contre']:
        return redirect('detail_voix', pk=pk)  # mauvaise option

    # Supprimer l'ancien vote si existant
    vote, created = Like.objects.update_or_create(
        publication=publication,
        utilisateur=request.user,
        defaults={'choix': choix}
    )
    return redirect('detail_voix', pk)


@login_required
def voir_commentaire(request, commentaire_id):
    parent_commentaire = get_object_or_404(Commentaire, id=commentaire_id)
    reponses = parent_commentaire.reponses.all().order_by('date')

    if request.method == 'POST':
        form = CommentaireForm(request.POST)
        if form.is_valid():
            nouvelle_reponse = form.save(commit=False)
            nouvelle_reponse.auteur = request.user
            nouvelle_reponse.parent = parent_commentaire
            nouvelle_reponse.publication = parent_commentaire.publication
            nouvelle_reponse.save()

            # (Optionnel) Notification
            parent_commentaire.auteur.notifications.create(
                message=f"Votre commentaire sur '{parent_commentaire.publication.titre}' a reçu une réponse.",
                lien=parent_commentaire.publication.get_absolute_url()
            )

            return redirect('voir_commentaire', commentaire_id=commentaire_id)
    else:
        form = CommentaireForm()

    return render(request, 'voix/commentaire_detail.html', {
        'commentaire': parent_commentaire,
        'reponses': reponses,
        'form': form
    })
