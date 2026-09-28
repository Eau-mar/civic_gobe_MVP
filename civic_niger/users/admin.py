from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.core.mail import send_mail
from django.conf import settings
from django.contrib import messages

from .models import ProfilUtilisateur, Ministere, PasswordResetCode


# ============================
# ACTION: Approuver les comptes
# ============================
@admin.action(description="✅ Approuver les comptes sélectionnés")
def approuver_comptes(modeladmin, request, queryset):
    comptes_a_approuver = queryset.filter(is_approved=False, is_ministere=True)
    count = comptes_a_approuver.count()

    for user in comptes_a_approuver:
        user.is_approved = True
        user.save(update_fields=["is_approved"])

        # Envoi email de confirmation
        if user.email:
            try:
                send_mail(
                    subject="CivicTech Niger — Votre compte autorité a été validé",
                    message=(
                        f"Bonjour {user.prenom} {user.nom},\n\n"
                        f"Votre compte autorité sur CivicTech Niger a été validé par l'administration.\n"
                        f"Vous pouvez désormais vous connecter et accéder à votre tableau de bord.\n\n"
                        f"Cordialement,\n"
                        f"L'équipe CivicTech Niger"
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=True,
                )
            except Exception:
                pass

    messages.success(request, f"{count} compte(s) autorité validé(s) avec succès.")


# ============================
# ACTION: Refuser les comptes
# ============================
@admin.action(description="❌ Refuser les comptes sélectionnés")
def refuser_comptes(modeladmin, request, queryset):
    comptes_a_refuser = queryset.filter(is_approved=False, is_ministere=True)
    count = comptes_a_refuser.count()

    for user in comptes_a_refuser:
        # Envoi email de refus
        if user.email:
            try:
                send_mail(
                    subject="CivicTech Niger — Demande de compte autorité refusée",
                    message=(
                        f"Bonjour {user.prenom} {user.nom},\n\n"
                        f"Votre demande de compte autorité sur CivicTech Niger n'a pas été approuvée.\n"
                        f"Si vous pensez qu'il s'agit d'une erreur, veuillez contacter l'administration.\n\n"
                        f"Cordialement,\n"
                        f"L'équipe CivicTech Niger"
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=True,
                )
            except Exception:
                pass

        user.delete()

    messages.warning(request, f"{count} compte(s) autorité refusé(s) et supprimé(s).")


# ============================
# ADMIN: ProfilUtilisateur
# ============================
@admin.register(ProfilUtilisateur)
class ProfilUtilisateurAdmin(UserAdmin):
    list_display = (
        "telephone", "prenom", "nom", "role_display",
        "is_approved", "ministere", "date_joined",
    )
    list_filter = ("is_ministere", "is_approved", "is_superuser", "ministere")
    search_fields = ("telephone", "nom", "prenom", "email", "username")
    ordering = ("-date_joined",)
    actions = [approuver_comptes, refuser_comptes]

    @admin.display(description="Rôle", ordering="is_ministere")
    def role_display(self, obj):
        return obj.role

    fieldsets = (
        ("Identité", {
            "fields": ("telephone", "username", "prenom", "nom", "email", "photo", "quartier"),
        }),
        ("Rôle & Validation", {
            "fields": ("is_ministere", "ministere", "is_approved"),
        }),
        ("Permissions Django", {
            "fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions"),
            "classes": ("collapse",),
        }),
        ("Sécurité", {
            "fields": ("password", "last_login"),
            "classes": ("collapse",),
        }),
    )

    add_fieldsets = (
        ("Nouveau compte", {
            "classes": ("wide",),
            "fields": (
                "telephone", "username", "prenom", "nom", "email",
                "quartier", "password1", "password2",
                "is_ministere", "ministere", "is_approved",
            ),
        }),
    )


# ============================
# ADMIN: Ministere
# ============================
@admin.register(Ministere)
class MinistereAdmin(admin.ModelAdmin):
    list_display = ("nom", "email_contact", "nombre_agents")
    search_fields = ("nom", "email_contact")

    @admin.display(description="Agents")
    def nombre_agents(self, obj):
        return obj.agents.count()


# ============================
# ADMIN: PasswordResetCode
# ============================
@admin.register(PasswordResetCode)
class PasswordResetCodeAdmin(admin.ModelAdmin):
    list_display = ("user", "code", "created_at", "is_expired_display")
    list_filter = ("created_at",)
    readonly_fields = ("user", "code", "created_at")

    @admin.display(description="Expiré ?", boolean=True)
    def is_expired_display(self, obj):
        return obj.is_expired()
