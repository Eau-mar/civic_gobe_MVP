from django.shortcuts import redirect
from django.urls import reverse
from django.contrib.auth import logout
from django.contrib import messages


class RoleRedirectMiddleware:
    """
    Redirige automatiquement l'utilisateur
    vers son dashboard autorisé.
    Bloque les comptes autorités non approuvés.
    """

    # Routes accessibles même avec un compte non approuvé
    WHITELIST_PATHS = [
        "/auth/login/",
        "/auth/register/",
        "/auth/logout/",
        "/auth/mot-de-passe/",
        "/admin/",
        "/api/",
        "/static/",
        "/media/",
    ]

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        user = request.user

        if user.is_authenticated:
            path = request.path

            # Vérifier si le compte est approuvé
            if not user.is_approved:
                # Autoriser les routes en whitelist
                if not any(path.startswith(p) for p in self.WHITELIST_PATHS):
                    logout(request)
                    messages.warning(
                        request,
                        "Votre compte autorité est en attente de validation "
                        "par l'administrateur CivicTech Niger."
                    )
                    return redirect(reverse("login"))

            # Redirection de sécurité par rôle
            if path.startswith("/admin") and not user.is_superuser:
                return redirect(reverse("profil_citoyen"))

            if path.startswith("/ministere") and not user.is_ministere:
                return redirect(reverse("profil_citoyen"))

        return self.get_response(request)
