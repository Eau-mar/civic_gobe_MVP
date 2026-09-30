import os
import django

# Configuration de l'environnement Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "civic_niger.settings")
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Variables d'environnement configurables via Render (avec valeurs par défaut)
username = os.environ.get("ADMIN_USERNAME", "admin")
password = os.environ.get("ADMIN_PASSWORD", "admin12345")
email = os.environ.get("ADMIN_EMAIL", "admin@civicniger.com")
telephone = os.environ.get("ADMIN_PHONE", "00000000")

print(f"Vérification de l'existence de l'utilisateur '{username}'...")

if not User.objects.filter(username=username).exists():
    print(f"Création du compte administrateur '{username}'...")
    User.objects.create_superuser(
        username=username,
        email=email,
        password=password,
        telephone=telephone,
        nom="Super",
        prenom="Admin"
    )
    print("✅ Administrateur créé avec succès !")
else:
    print(f"✅ L'administrateur '{username}' existe déjà.")
