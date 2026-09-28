from rest_framework import serializers
from users.models import ProfilUtilisateur, Ministere


# ============================
# REGISTER
# ============================
class RegisterSerializer(serializers.Serializer):
    telephone = serializers.CharField(max_length=20)
    password = serializers.CharField(write_only=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True)
    nom = serializers.CharField(max_length=50)
    prenom = serializers.CharField(max_length=50)
    quartier = serializers.CharField(max_length=100)
    email = serializers.EmailField(required=False, default="")
    is_ministere = serializers.BooleanField(default=False)
    ministere_id = serializers.IntegerField(required=False, allow_null=True, default=None)

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError("Les mots de passe ne correspondent pas")
        return attrs


# ============================
# LOGIN (JWT)
# ============================
class LoginSerializer(serializers.Serializer):
    telephone = serializers.CharField()
    password = serializers.CharField(write_only=True)


# ============================
# PASSWORD RESET
# ============================
class PhoneSerializer(serializers.Serializer):
    telephone = serializers.CharField()


class CodeVerificationSerializer(serializers.Serializer):
    telephone = serializers.CharField()
    code = serializers.CharField(max_length=6)


class NewPasswordSerializer(serializers.Serializer):
    telephone = serializers.CharField()
    new_password = serializers.CharField(min_length=6)


# ============================
# PROFIL UTILISATEUR
# ============================
class MinistereSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ministere
        fields = ["id", "nom", "email_contact"]


class ProfilUtilisateurSerializer(serializers.ModelSerializer):
    role = serializers.CharField(read_only=True)
    ministere_detail = MinistereSerializer(source="ministere", read_only=True)

    class Meta:
        model = ProfilUtilisateur
        fields = [
            "id", "telephone", "nom", "prenom", "email",
            "quartier", "photo", "role", "is_approved",
            "is_ministere", "ministere", "ministere_detail",
            "date_joined",
        ]
        read_only_fields = [
            "id", "telephone", "role", "is_approved",
            "is_ministere", "date_joined",
        ]


class ProfilUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfilUtilisateur
        fields = ["nom", "prenom", "email", "quartier", "photo"]
