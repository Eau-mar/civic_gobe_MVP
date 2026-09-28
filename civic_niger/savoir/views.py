from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import user_passes_test, login_required
from savoir.models import SavoirCitoyen
from savoir.forms import SavoirCitoyenForm

def ministere_required(view_func):
    decorated_view_func = user_passes_test(
        lambda u: u.is_authenticated and u.is_ministere,
        login_url='login'
    )(view_func)
    return decorated_view_func


@ministere_required
def creer_savoir(request):
    if request.method == 'POST':
        form = SavoirCitoyenForm(request.POST, request.FILES)
        if form.is_valid():
            savoir = form.save(commit=False)
            savoir.auteur = request.user
            savoir.save()
            return redirect('dashboard_ministere')
    else:
        form = SavoirCitoyenForm()
    return render(request, 'savoir/creer_savoir.html', {'form': form})


@ministere_required
def modifier_savoir(request, pk):
    savoir = get_object_or_404(SavoirCitoyen, pk=pk, auteur=request.user)
    if request.method == 'POST':
        form = SavoirCitoyenForm(request.POST, request.FILES, instance=savoir)
        if form.is_valid():
            form.save()
            return redirect('dashboard_ministere')
    else:
        form = SavoirCitoyenForm(instance=savoir)
    return render(request, 'savoir/modifier_savoir.html', {'form': form})


@ministere_required
def supprimer_savoir(request, pk):
    savoir = get_object_or_404(SavoirCitoyen, pk=pk, auteur=request.user)
    if request.method == 'POST':
        savoir.delete()
        return redirect('tableauBord')
    return render(request, 'savoir/supprimer_savoir.html', {'savoir': savoir})

@login_required
def detail_savoir(request, pk):
    savoir = get_object_or_404(SavoirCitoyen, pk=pk, statut='publie')
    share_url = request.build_absolute_uri()

    return render(request, 'savoir/savoir_details.html', {
        'savoir': savoir,
        'share_url': share_url,
    })
