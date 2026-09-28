from django.contrib.auth import authenticate, login, logout
from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError

from users.services import (
    inscrire_utilisateur,
    login_utilisateur,
    PasswordResetService
)

from .forms import (
    PhoneRequestForm,
    CodeVerificationForm,
    SetNewPasswordForm
)

User = get_user_model()


def register(request):
    if request.method == "POST":
        try:
            user = inscrire_utilisateur(
                telephone=request.POST.get("username"),
                password=request.POST.get("password1"),
                password_confirm=request.POST.get("password2"),
                prenom=request.POST.get("first_name"),
                nom=request.POST.get("last_name"),
                quartier=request.POST.get("quartier"),
                email=request.POST.get("email", ""),
                is_ministere=bool(request.POST.get("est_ministre")),
                ministere_id=request.POST.get("ministere_id") or None,
            )

            if user.is_ministere:
                messages.info(
                    request,
                    "Votre demande de compte autorité a été enregistrée. "
                    "Vous recevrez un email de confirmation après validation "
                    "par l'administration."
                )
            else:
                messages.success(request, "Compte créé avec succès.")

            return redirect("login")

        except ValidationError as e:
            messages.error(request, e.message)

    return render(request, "users/inscription.html")


def user_login(request):
    if request.method == "POST":
        telephone = request.POST.get("telephone")
        password = request.POST.get("password")

        try:
            user = login_utilisateur(
                telephone=telephone,
                password=password,
                request=request,
            )

            login(request, user)

            if user.is_ministere:
                return redirect("dashboard_ministere")

            return redirect("accueil")

        except ValidationError as e:
            messages.error(request, e.message)

    return render(request, "users/connexion.html")



def demande_tel(request):
    form = PhoneRequestForm(request.POST or None)

    if request.method == "POST" and form.is_valid():
        try:
            PasswordResetService.request_code(
                form.cleaned_data["telephone"]
            )
            request.session["reset_telephone"] = form.cleaned_data["telephone"]
            return redirect("verifier_code")

        except ValidationError as e:
            messages.error(request, e.message)

    return render(request, "users/demande_tel.html", {"form": form})


def verifier_code(request):
    telephone = request.session.get("reset_telephone")
    if not telephone:
        return redirect("demande_tel")

    form = CodeVerificationForm(request.POST or None)

    if request.method == "POST":
        code = "".join([
            request.POST.get(f"code{i}", "")
            for i in range(1, 7)
        ])

        if len(code) != 6 or not code.isdigit():
            messages.error(request, "Code invalide")
        else:
            valid, message = PasswordResetService.verify_code(
                telephone,
                code
            )

            if not valid:
                messages.error(request, message)
            else:
                request.session["verified_telephone"] = telephone
                request.session.modified = True
                return redirect("set_new_password")

    return render(request, "users/verifier_code.html", {"form": form})



def set_new_password(request):
    telephone = request.session.get("verified_telephone")
    if not telephone:
        return redirect("demande_tel")

    form = SetNewPasswordForm(request.POST or None)

    if request.method == "POST":
        if form.is_valid():
            PasswordResetService.reset_password(
                telephone,
                form.cleaned_data["new_password"]
            )
            messages.success(request, "Mot de passe modifié avec succès")
            return redirect("login")
        else:
            # Convertir erreurs du form en messages
            for error in form.non_field_errors():
                messages.error(request, error)

            for field, errors in form.errors.items():
                for error in errors:
                    messages.error(request, error)

    return render(request, "users/changer_mot.html", {"form": form})


def logout_view(request):
    logout(request)
    messages.success(request, "Déconnexion réussie")
    return redirect("login")
