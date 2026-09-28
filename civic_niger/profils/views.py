from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required, user_passes_test
from users.decorators import role_required

from .models import Publication
from signalement.models import Signalement
from savoir.models import SavoirCitoyen
from users.models import ProfilUtilisateur
from voix.models import VoixDuPeuple

from .forms import PublicationForm
from users.forms import ProfilMinistereForm, ProfilUtilisateurForm
from signalement.forms import SignalementStatutForm

def est_ministere(user):
    return user.is_authenticated and user.is_ministere

def ministere_required(view_func):
    decorated_view_func = user_passes_test(
        lambda u: u.is_authenticated and u.is_ministere,
        login_url='login'
    )(view_func)
    return decorated_view_func


@login_required
def profil_citoyen(request):
    signalements = Signalement.objects.filter(utilisateur=request.user).order_by('-date')
    voix = VoixDuPeuple.objects.filter(auteur= request.user).order_by('-date')
    return render(request, 'profils/profil_citoyen.html', {
        'signalements': signalements,
        'voix': voix,
    })



@login_required
@role_required("ministere")
def dashboard_ministere(request):
    if not request.user.is_ministere:
        return render(request, '403.html')

    signalements = Signalement.objects.filter(ministere=request.user).order_by('-date')
    PublicationMinis = Publication.objects.filter(ministere=request.user).order_by('-date')
    savoirs = SavoirCitoyen.objects.filter(auteur=request.user)

    return render(request, 'profils/table_bord.html', {
        'signalements': signalements,
        'savoirs' : savoirs,
        'PublicationMinis': PublicationMinis,
    })

@login_required
def modifier_profil_ministere(request):
    user = request.user
    if not user.is_ministere:
        return redirect('home')  # sécurité : redirige si pas ministère

    if request.method == 'POST':
        form = ProfilMinistereForm(request.POST, request.FILES, instance=user)
        if form.is_valid():
            form.save()
            return redirect('dashboard_ministere')  # redirection après modif
    else:
        form = ProfilMinistereForm(instance=user)

    return render(request, 'profils/edit_ministere.html', {'form': form})


@login_required
def modifier_statut_signalement(request, pk):
    if not request.user.is_ministere:
        return render(request, '403.html')

    signalement = get_object_or_404(Signalement, pk=pk, ministere=request.user)

    if request.method == 'POST':
        form = SignalementStatutForm(request.POST, instance=signalement)
        if form.is_valid():
            form.save()
            return redirect('dashboard_ministere')
    else:
        form = SignalementStatutForm(instance=signalement)

    return render(request, 'profils/modif_statut.html', {'form': form, 'signalement': signalement})


@login_required
@user_passes_test(est_ministere)
def creer_publication(request):
    if request.method == 'POST':
        form = PublicationForm(request.POST, request.FILES)
        if form.is_valid():
            publication = form.save(commit=False)
            publication.ministere = request.user
            publication.save()
            return redirect('dashboard_ministere')
    else:
        form = PublicationForm()
    return render(request, 'profils/publication.html', {'form': form})


def detail_publication(request, pk):
    publication = get_object_or_404(Publication, pk=pk)
    context = {
        'publication': publication,
    }
    return render(request, 'profils/detail_pub.html', context)


@login_required
def liste_notifications(request):
    notifications = request.user.notifications.all().order_by('-date')
    request.user.notifications.filter(lu=False).update(lu=True)
    return render(request, 'profils/liste_notification.html', {
        'notifications': notifications,
    })

@login_required
def edit_profile(request):
    user = request.user
    if request.method == 'POST':
        form = ProfilUtilisateurForm(request.POST, request.FILES, instance=user)
        if form.is_valid():
            form.save()
            return redirect('profil_citoyen')  # ou autre URL de redirection après MAJ
    else:
        form = ProfilUtilisateurForm(instance=user)

    return render(request, 'profils/edit_profile.html', {'form': form})
