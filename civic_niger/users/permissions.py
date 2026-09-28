from django.core.exceptions import PermissionDenied


def is_admin(user):
    return user.is_authenticated and user.is_superuser


def is_ministere(user):
    return user.is_authenticated and user.is_ministere and user.is_approved


def is_citoyen(user):
    return user.is_authenticated and not user.is_ministere


def check_role(user, role):
    if role == "admin" and not is_admin(user):
        raise PermissionDenied("Accès réservé à l'administration")

    if role == "ministere" and not is_ministere(user):
        raise PermissionDenied("Accès réservé aux ministères")

    if role == "citoyen" and not is_citoyen(user):
        raise PermissionDenied("Accès réservé aux citoyens")
