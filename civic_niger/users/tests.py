from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core import mail

from users.models import Ministere, PasswordResetCode
from users.services import inscrire_utilisateur, login_utilisateur

User = get_user_model()


class TestModels(TestCase):
    """Test des modèles : rôles, is_approved, FK ministere"""

    def setUp(self):
        self.ministere = Ministere.objects.create(
            nom="Ministère de l'Hydraulique",
            email_contact="hydraulique@gov.ne"
        )

    def test_citoyen_role(self):
        user = User.objects.create_user(
            username="90000001", telephone="90000001",
            password="test1234", nom="Amadou", prenom="Ibrahim",
            quartier="Koira Kano",
        )
        self.assertEqual(user.role, "CITOYEN")
        self.assertTrue(user.is_approved)

    def test_ministere_role(self):
        user = User.objects.create_user(
            username="90000002", telephone="90000002",
            password="test1234", nom="Ali", prenom="Moussa",
            quartier="Plateau", is_ministere=True,
            is_approved=False, ministere=self.ministere,
        )
        self.assertEqual(user.role, "MINISTERE")
        self.assertFalse(user.is_approved)
        self.assertEqual(user.ministere, self.ministere)

    def test_admin_role(self):
        user = User.objects.create_superuser(
            username="admin", telephone="99999999",
            password="admin1234", nom="Admin", prenom="Super",
            quartier="Centre",
        )
        self.assertEqual(user.role, "ADMIN")

    def test_ministere_str(self):
        self.assertEqual(str(self.ministere), "Ministère de l'Hydraulique")


class TestInscription(TestCase):
    """Test du service d'inscription"""

    def setUp(self):
        self.ministere = Ministere.objects.create(
            nom="Ministère de la Santé",
            email_contact="sante@gov.ne"
        )

    def test_inscription_citoyen(self):
        user = inscrire_utilisateur(
            telephone="90000010",
            password="pass1234",
            password_confirm="pass1234",
            prenom="Fatima",
            nom="Moussa",
            quartier="Gamkalé",
        )
        self.assertEqual(user.role, "CITOYEN")
        self.assertTrue(user.is_approved)
        self.assertIsNone(user.ministere)

    def test_inscription_autorite_non_approuvee(self):
        user = inscrire_utilisateur(
            telephone="90000011",
            password="pass1234",
            password_confirm="pass1234",
            prenom="Abdoulaye",
            nom="Sow",
            quartier="Plateau",
            email="abdoulaye@gov.ne",
            is_ministere=True,
            ministere_id=self.ministere.pk,
        )
        self.assertEqual(user.role, "MINISTERE")
        self.assertFalse(user.is_approved)
        self.assertEqual(user.ministere, self.ministere)

    def test_inscription_telephone_duplique(self):
        inscrire_utilisateur(
            telephone="90000012",
            password="pass1234",
            password_confirm="pass1234",
            prenom="Test",
            nom="User",
            quartier="Centre",
        )
        with self.assertRaises(ValidationError):
            inscrire_utilisateur(
                telephone="90000012",
                password="pass1234",
                password_confirm="pass1234",
                prenom="Test2",
                nom="User2",
                quartier="Centre",
            )

    def test_inscription_passwords_mismatch(self):
        with self.assertRaises(ValidationError):
            inscrire_utilisateur(
                telephone="90000013",
                password="pass1234",
                password_confirm="different",
                prenom="Test",
                nom="User",
                quartier="Centre",
            )

    def test_inscription_ministere_invalide(self):
        with self.assertRaises(ValidationError):
            inscrire_utilisateur(
                telephone="90000014",
                password="pass1234",
                password_confirm="pass1234",
                prenom="Test",
                nom="User",
                quartier="Centre",
                is_ministere=True,
                ministere_id=99999,
            )


class TestLogin(TestCase):
    """Test du service de connexion avec blocage is_approved"""

    def setUp(self):
        self.citoyen = User.objects.create_user(
            username="90000020", telephone="90000020",
            password="pass1234", nom="Citoyen", prenom="Test",
            quartier="Gamkalé", is_approved=True,
        )
        self.autorite_non_approuvee = User.objects.create_user(
            username="90000021", telephone="90000021",
            password="pass1234", nom="Autorite", prenom="Test",
            quartier="Plateau", is_ministere=True, is_approved=False,
        )
        self.autorite_approuvee = User.objects.create_user(
            username="90000022", telephone="90000022",
            password="pass1234", nom="Autorite2", prenom="Test",
            quartier="Plateau", is_ministere=True, is_approved=True,
        )

    def test_login_citoyen_ok(self):
        user = login_utilisateur(telephone="90000020", password="pass1234")
        self.assertEqual(user, self.citoyen)

    def test_login_autorite_non_approuvee_bloquee(self):
        with self.assertRaises(ValidationError) as ctx:
            login_utilisateur(telephone="90000021", password="pass1234")
        self.assertIn("attente de validation", str(ctx.exception))

    def test_login_autorite_approuvee_ok(self):
        user = login_utilisateur(telephone="90000022", password="pass1234")
        self.assertEqual(user, self.autorite_approuvee)

    def test_login_telephone_inexistant(self):
        with self.assertRaises(ValidationError):
            login_utilisateur(telephone="00000000", password="pass1234")

    def test_login_mot_de_passe_incorrect(self):
        with self.assertRaises(ValidationError):
            login_utilisateur(telephone="90000020", password="mauvais")


class TestAdminActions(TestCase):
    """Test des actions admin d'approbation"""

    def setUp(self):
        self.admin = User.objects.create_superuser(
            username="admin", telephone="99999990",
            password="admin1234", nom="Admin", prenom="Super",
            quartier="Centre", email="admin@civicniger.ne",
        )
        self.autorite = User.objects.create_user(
            username="90000030", telephone="90000030",
            password="pass1234", nom="Agent", prenom="Test",
            quartier="Plateau", is_ministere=True,
            is_approved=False, email="agent@gov.ne",
        )
        self.client = Client()
        self.client.force_login(self.admin)

    def test_approbation_via_admin(self):
        """Simule l'approbation directe en base (comme le fait l'action admin)"""
        self.assertFalse(self.autorite.is_approved)

        self.autorite.is_approved = True
        self.autorite.save(update_fields=["is_approved"])

        self.autorite.refresh_from_db()
        self.assertTrue(self.autorite.is_approved)

        # L'utilisateur peut maintenant se connecter
        user = login_utilisateur(telephone="90000030", password="pass1234")
        self.assertEqual(user, self.autorite)


class TestWebViews(TestCase):
    """Test des vues web (inscription, connexion)"""

    def setUp(self):
        self.client = Client()

    def test_page_connexion_accessible(self):
        response = self.client.get("/auth/login/")
        self.assertEqual(response.status_code, 200)

    def test_page_inscription_accessible(self):
        response = self.client.get("/auth/register/")
        self.assertEqual(response.status_code, 200)

    def test_connexion_citoyen_redirect_accueil(self):
        User.objects.create_user(
            username="90000040", telephone="90000040",
            password="pass1234", nom="Test", prenom="Citoyen",
            quartier="Centre", is_approved=True,
        )
        response = self.client.post("/auth/login/", {
            "telephone": "90000040",
            "password": "pass1234",
        })
        self.assertEqual(response.status_code, 302)
        self.assertIn("accueil", response.url)

    def test_connexion_autorite_non_approuvee_bloquee(self):
        User.objects.create_user(
            username="90000041", telephone="90000041",
            password="pass1234", nom="Test", prenom="Agent",
            quartier="Plateau", is_ministere=True, is_approved=False,
        )
        response = self.client.post("/auth/login/", {
            "telephone": "90000041",
            "password": "pass1234",
        })
        # Redirected back to login with error message
        self.assertEqual(response.status_code, 200)
