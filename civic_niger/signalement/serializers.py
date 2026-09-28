from rest_framework import serializers
from .models import Signalement, LiveFrame
from users.models import ProfilUtilisateur, Ministere

class CitoyenSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfilUtilisateur
        fields = ['id', 'prenom', 'nom', 'telephone', 'quartier']

class MinistereSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ministere
        fields = ['id', 'nom', 'email_contact']

class SignalementReadSerializer(serializers.ModelSerializer):
    utilisateur = CitoyenSerializer(read_only=True)
    ministere = MinistereSerializer(read_only=True)
    
    class Meta:
        model = Signalement
        fields = '__all__'
        
    def to_representation(self, instance):
        """
        Gère la règle de confidentialité dynamique (est_public).
        Si le signalement n'est pas public, on masque l'image et l'audio
        sauf si le demandeur est l'auteur ou un agent du ministère assigné.
        """
        ret = super().to_representation(instance)
        request = self.context.get('request')
        
        if not instance.est_public and request and request.user:
            user = request.user
            is_author = (user == instance.utilisateur)
            is_assigned_authority = (user.is_ministere and user.ministere == instance.ministere)
            
            if not is_author and not is_assigned_authority and not user.is_superuser:
                ret['image'] = None
                ret['audio'] = None
                
        return ret

class SignalementCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Signalement
        fields = ['id', 'titre', 'description', 'categorie', 'image', 'audio', 'est_public', 'localisation', 'latitude', 'longitude', 'is_live', 'ministere', 'live_room_id', 'live_started_at']
        # 'utilisateur', 'statut', 'approuver' ne sont pas exposés à la création
        
class SignalementAuthorityUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Signalement
        fields = ['statut', 'approuver']
        
    def validate_statut(self, value):
        # Règles métier supplémentaires pour le statut si nécessaire
        return value


class LiveFrameSerializer(serializers.ModelSerializer):
    class Meta:
        model = LiveFrame
        fields = ['id', 'signalement', 'image', 'latitude', 'longitude', 'timestamp']
        read_only_fields = ['id', 'signalement', 'timestamp']

