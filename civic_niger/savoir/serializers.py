from rest_framework import serializers
from .models import SavoirCitoyen, CategorieSavoir
from users.api.serializers import ProfilUtilisateurSerializer

class CategorieSavoirSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategorieSavoir
        fields = '__all__'

class SavoirCitoyenSerializer(serializers.ModelSerializer):
    auteur = ProfilUtilisateurSerializer(read_only=True)
    categorie_nom = serializers.CharField(source='categorie.nom', read_only=True)

    class Meta:
        model = SavoirCitoyen
        fields = ['id', 'titre', 'contenu', 'audio', 'image', 'categorie', 'categorie_nom', 'auteur', 'statut', 'date', 'date_modification']
        read_only_fields = ['auteur', 'statut', 'date', 'date_modification']
