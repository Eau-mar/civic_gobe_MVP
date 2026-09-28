from rest_framework import status, permissions, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.core.exceptions import ValidationError

from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from users.models import ProfilUtilisateur, Ministere
from users.services import (
    inscrire_utilisateur,
    login_utilisateur,
    PasswordResetService
)

from .serializers import (
    RegisterSerializer,
    PhoneSerializer,
    CodeVerificationSerializer,
    NewPasswordSerializer,
    ProfilUtilisateurSerializer,
    ProfilUpdateSerializer,
    MinistereSerializer,
)


# ============================
# INSCRIPTION
# ============================
class UserRegisterViewSet(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]

    def create(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user = inscrire_utilisateur(
                telephone=serializer.validated_data["telephone"],
                password=serializer.validated_data["password"],
                password_confirm=serializer.validated_data["password_confirm"],
                nom=serializer.validated_data["nom"],
                prenom=serializer.validated_data["prenom"],
                quartier=serializer.validated_data["quartier"],
                email=serializer.validated_data.get("email", ""),
                is_ministere=serializer.validated_data.get("is_ministere", False),
                ministere_id=serializer.validated_data.get("ministere_id"),
            )

            response_data = {"message": "Compte créé avec succès"}

            if user.is_ministere:
                response_data["message"] = (
                    "Votre demande de compte autorité a été enregistrée. "
                    "Elle sera validée par l'administration CivicTech Niger."
                )
                response_data["is_approved"] = False

            return Response(response_data, status=status.HTTP_201_CREATED)

        except ValidationError as e:
            return Response(
                {"error": e.message},
                status=status.HTTP_400_BAD_REQUEST
            )


# ============================
# CONNEXION JWT
# ============================
class CustomTokenSerializer(TokenObtainPairSerializer):

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        token["user_id"] = user.id
        token["role"] = user.role
        token["telephone"] = user.telephone
        token["prenom"] = user.prenom
        token["nom"] = user.nom
        token["is_approved"] = user.is_approved

        return token

    def validate(self, attrs):
        # Permettre la connexion par téléphone
        telephone = attrs.get("telephone") or attrs.get("username")

        try:
            user = ProfilUtilisateur.objects.get(telephone=telephone)
        except ProfilUtilisateur.DoesNotExist:
            raise ValidationError("Numéro de téléphone incorrect.")

        # Bloquer les comptes non approuvés
        if not user.is_approved:
            raise ValidationError(
                "Votre compte autorité est en attente de validation "
                "par l'administrateur CivicTech Niger."
            )

        attrs["username"] = user.username
        return super().validate(attrs)


class LoginAPI(TokenObtainPairView):
    serializer_class = CustomTokenSerializer
    permission_classes = [permissions.AllowAny]


# ============================
# MOT DE PASSE OUBLIÉ
# ============================
class RequestResetCodeAPI(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PhoneSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            PasswordResetService.request_code(
                serializer.validated_data["telephone"]
            )
            return Response({"message": "Code envoyé"})
        except ValidationError as e:
            return Response({"error": e.message}, status=400)


class VerifyResetCodeAPI(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = CodeVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        valid, message = PasswordResetService.verify_code(
            serializer.validated_data["telephone"],
            serializer.validated_data["code"]
        )

        if not valid:
            return Response({"error": message}, status=400)

        return Response({"message": "Code valide"})



class SetNewPasswordAPI(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = NewPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            PasswordResetService.reset_password(
                serializer.validated_data["telephone"],
                serializer.validated_data["new_password"]
            )
            return Response({"message": "Mot de passe modifié"})
        except ValidationError as e:
            return Response({"error": e.message}, status=400)


# ============================
# PROFIL UTILISATEUR (/me/)
# ============================
class UserMeAPI(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        serializer = ProfilUtilisateurSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = ProfilUpdateSerializer(
            request.user,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Retourner le profil complet mis à jour
        return Response(
            ProfilUtilisateurSerializer(request.user).data
        )


# ============================
# LISTE DES MINISTÈRES (Public)
# ============================
class MinistereListAPI(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        ministeres = Ministere.objects.all().order_by("nom")
        serializer = MinistereSerializer(ministeres, many=True)
        return Response(serializer.data)
