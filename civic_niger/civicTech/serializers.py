from rest_framework import serializers
from django.contrib.auth.models import User
from signalement.models import Signalement
from savoir.models import SavoirCitoyen, CategorieSavoir
from voix.models import VoixDuPeuple, Commentaire, Like
from profils.models import Notification, Publication

class RegisterSerializer(serializers.ModelSerializer):
    telephone = serializers.CharField(write_only=True)
    quartier = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name', 'password', 'telephone', 'quartier']

    def create(self, validated_data):
        telephone = validated_data.pop('telephone')
        quartier = validated_data.pop('quartier')
        password = validated_data.pop('password')
        user = User.objects.create(
            username=validated_data['username'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name']
        )
        user.set_password(password)
        user.save()
        ProfilUtilisateur.objects.filter(user=user).update(telephone=telephone, quartier=quartier)
        return user

class SignalementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Signalement
        fields = '__all__'

class SavoirCitoyenSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavoirCitoyen
        fields = '__all__'

class VoixDuPeupleSerializer(serializers.ModelSerializer):
    class Meta:
        model = VoixDuPeuple
        fields = '__all__'

class CommentaireSerializer(serializers.ModelSerializer):
    class Meta:
        model = Commentaire
        fields = '__all__'

class LikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Like
        fields = '__all__'

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

class PublicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Publication
        fields = '__all__'
        read_only_fields = ['ministere']

class CategorieSavoirSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategorieSavoir
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'is_staff']

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name', 'email', 'password']

    def create(self, validated_data):
        user = User.objects.create(
            username=validated_data['username'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            email=validated_data['email']
        )
        user.set_password(validated_data['password'])
        user.save()
        return user
