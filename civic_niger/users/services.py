from users.models import PasswordResetCode, ProfilUtilisateur, Ministere
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
import random


User = get_user_model()


def inscrire_utilisateur(*, telephone, password, password_confirm,
                         prenom, nom, quartier, email="",
                         is_ministere=False, ministere_id=None):
    """
    Inscrit un nouvel utilisateur (Citoyen ou Autorité).
    - Les citoyens sont approuvés automatiquement (is_approved=True).
    - Les autorités/ministères sont en attente de validation (is_approved=False).
    """

    if password != password_confirm:
        raise ValidationError("Les mots de passe ne correspondent pas")

    if User.objects.filter(telephone=telephone).exists():
        raise ValidationError("Ce numéro de téléphone est déjà utilisé")

    # Déterminer le statut d'approbation
    is_approved = not is_ministere

    # Rattacher au ministère si applicable
    ministere = None
    if is_ministere and ministere_id:
        try:
            ministere = Ministere.objects.get(pk=ministere_id)
        except Ministere.DoesNotExist:
            raise ValidationError("Ministère introuvable")

    user = User.objects.create_user(
        username=telephone,
        telephone=telephone,
        password=password,
        prenom=prenom,
        nom=nom,
        email=email,
        quartier=quartier,
        is_ministere=is_ministere,
        is_approved=is_approved,
        ministere=ministere,
    )

    # Notifier les admins qu'un compte autorité est en attente
    if is_ministere:
        _notifier_admins_nouveau_compte_autorite(user)

    return user


def _notifier_admins_nouveau_compte_autorite(user):
    """
    Envoie une notification push interne aux admins lorsqu'un nouveau
    compte autorité est créé et en attente de validation.
    """
    from profils.models import Notification

    admins = User.objects.filter(is_superuser=True)
    ministere_nom = user.ministere.nom if user.ministere else "Non spécifié"

    for admin_user in admins:
        Notification.objects.create(
            destinataire=admin_user,
            message=(
                f"Nouveau compte autorité en attente de validation : "
                f"{user.prenom} {user.nom} ({user.telephone}) — "
                f"Ministère : {ministere_nom}"
            ),
            lien=f"/admin/users/profilutilisateur/{user.pk}/change/",
        )


def login_utilisateur(*, telephone, password, request=None):
    """
    Authentifie un utilisateur par téléphone et mot de passe.
    Bloque les comptes autorité non approuvés.
    """
    try:
        user = User.objects.get(telephone=telephone)
    except User.DoesNotExist:
        raise ValidationError("Numéro de téléphone incorrect.")

    if not user.is_approved:
        raise ValidationError(
            "Votre compte autorité est en attente de validation "
            "par l'administrateur CivicTech Niger."
        )

    user = authenticate(request, username=user.username, password=password)
    if user is None:
        raise ValidationError("Mot de passe incorrect.")

    return user


class PasswordResetService:

    @staticmethod
    def request_code(telephone):
        try:
            user = User.objects.get(telephone=telephone)
        except User.DoesNotExist:
            raise ValidationError("Utilisateur introuvable")

        code = str(random.randint(100000, 999999))
        PasswordResetCode.objects.create(user=user, code=code)

        # TODO: SMS provider (Infobip / Orange SMS API / Twilio)
        print(f"[SMS] Code pour {telephone} : {code}")

        return True

    @staticmethod
    def verify_code(telephone, code):
        try:
            user = User.objects.get(telephone=telephone)
            reset = PasswordResetCode.objects.get(user=user, code=code)

            if reset.is_expired():
                return False, "Code expiré"

            return True, "Code valide"

        except (User.DoesNotExist, PasswordResetCode.DoesNotExist):
            return False, "Code invalide"
        

    @staticmethod
    def reset_password(telephone, new_password):
        try:
            user = User.objects.get(telephone=telephone)
        except User.DoesNotExist:
            raise ValidationError("Utilisateur introuvable")

        user.set_password(new_password)
        user.save()

        PasswordResetCode.objects.filter(user=user).delete()
        return True


def changer_mot_de_passe(*, user, password1, password2):
    if password1 != password2:
        raise ValidationError("Les mots de passe ne correspondent pas.")

    user.set_password(password1)
    user.save()

    PasswordResetCode.objects.filter(user=user).delete()
