from rest_framework import serializers
from .models import VoixDuPeuple, Commentaire, Like
from users.api.serializers import ProfilUtilisateurSerializer

class CommentaireSerializer(serializers.ModelSerializer):
    auteur = ProfilUtilisateurSerializer(read_only=True)
    is_official_reply = serializers.SerializerMethodField()

    class Meta:
        model = Commentaire
        fields = ['id', 'publication', 'auteur', 'contenu', 'parent', 'date', 'is_official_reply']
        read_only_fields = ['auteur', 'date', 'is_official_reply']

    def get_is_official_reply(self, obj):
        # Un commentaire est "officiel" si l'auteur est un compte Ministère ou Superadmin
        return getattr(obj.auteur, 'is_ministere', False) or getattr(obj.auteur, 'is_superuser', False)

class VoixDuPeupleSerializer(serializers.ModelSerializer):
    auteur = ProfilUtilisateurSerializer(read_only=True)
    votes_pour = serializers.SerializerMethodField()
    votes_contre = serializers.SerializerMethodField()
    user_vote = serializers.SerializerMethodField()
    commentaires_count = serializers.SerializerMethodField()

    class Meta:
        model = VoixDuPeuple
        fields = ['id', 'auteur', 'titre', 'contenu', 'audio', 'objectif_votes', 'date', 'approuve', 'votes_pour', 'votes_contre', 'user_vote', 'commentaires_count']
        read_only_fields = ['auteur', 'date', 'approuve', 'votes_pour', 'votes_contre', 'user_vote', 'commentaires_count']

    def get_votes_pour(self, obj):
        return obj.votes.filter(choix='pour').count()

    def get_votes_contre(self, obj):
        return obj.votes.filter(choix='contre').count()

    def get_user_vote(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            vote = obj.votes.filter(utilisateur=request.user).first()
            if vote:
                return vote.choix
        return None

    def get_commentaires_count(self, obj):
        return obj.commentaires.count()

class LikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Like
        fields = ['publication', 'utilisateur', 'choix']
        read_only_fields = ['utilisateur']
