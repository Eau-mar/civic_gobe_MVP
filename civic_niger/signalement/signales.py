from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from signalement.models import Signalement

@receiver(post_save, sender=Signalement)
def notifier_admins_nouveau_signalement(sender, instance, created, **kwargs):
    if created and not instance.approuver:
        destinataires = ['civicniger@gmail.com']

        # URL vers la page admin
        admin_url = f"{settings.SITE_URL}/admin/login/"

        # Contexte pour le template
        context = {
            'titre': instance.titre,
            'description': instance.description,
            'localisation': instance.localisation,
            'categorie': instance.get_categorie_display(),
            'admin_url': admin_url
        }

        # Contenu HTML
        html_content = render_to_string('civicTech/mails/admin_mail.html', context)
        text_content = strip_tags(html_content)

        msg = EmailMultiAlternatives(
            subject="[CivicNiger] Nouveau signalement à approuver",
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=destinataires
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send()


@receiver(post_save, sender=Signalement)
def notifier_ministere_approuve(sender, instance, created, **kwargs):
    if not created and instance.approuver and instance.ministere and instance.ministere.email:
        # Envoi email uniquement si approuver vient de passer à True
        send_mail(
            subject="Nouveau signalement approuvé",
            message=(
                f"Bonjour {instance.ministere.first_name},\n\n"
                f"Un nouveau signalement vous a été assigné et a été approuvé :\n\n"
                f"Titre : {instance.titre}\n"
                f"Description : {instance.description}\n"
                f"Localisation : {instance.localisation}\n"
                f"Catégorie : {instance.get_categorie_display()}\n\n"
                f"Merci de vous connecter pour en prendre connaissance."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[instance.ministere.email],
            fail_silently=False,
        )
