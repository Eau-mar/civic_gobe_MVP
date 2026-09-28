from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.forms import UserChangeForm
from .models import ProfilUtilisateur

class UtlisateurCreationForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = ProfilUtilisateur
        fields = ('nom', 'prenom', 'telephone', 'quartier','email', 'username')


class ProfilUtilisateurForm(UserChangeForm):
    password = None  # On ne veut pas afficher/modifier le mot de passe ici

    class Meta:
        model = ProfilUtilisateur
        fields = ['nom', 'prenom', 'telephone', 'email', 'quartier', 'photo']
        widgets = {
            'nom': forms.TextInput(attrs={'class': 'form-control'}),
            'prenom': forms.TextInput(attrs={'class': 'form-control'}),
            'telephone': forms.TextInput(attrs={'class': 'form-control'}),
            'email': forms.EmailInput(attrs={'class': 'form-control'}),
            'quartier': forms.TextInput(attrs={'class': 'form-control'}),
            'photo': forms.ClearableFileInput(attrs={'class': 'form-control-file'}),
        }



class ProfilMinistereForm(forms.ModelForm):
    class Meta:
        model = ProfilUtilisateur
        fields = ['nom', 'prenom', 'telephone', 'quartier', 'photo']
        widgets = {
            'nom': forms.TextInput(attrs={'class': 'form-input'}),
            'prenom': forms.TextInput(attrs={'class': 'form-input'}),
            'telephone': forms.TextInput(attrs={'class': 'form-input'}),
            'quartier': forms.TextInput(attrs={'class': 'form-input'}),
            'photo': forms.FileInput(attrs={'class': 'form-file'}),
        }


class PhoneRequestForm(forms.Form):
    telephone = forms.CharField(label="Numéro de téléphone", max_length=20)


class CodeVerificationForm(forms.Form):
    code = forms.CharField(label="Code de vérification", max_length=6)


class SetNewPasswordForm(forms.Form):
    new_password = forms.CharField(
        widget=forms.PasswordInput,
        min_length=8
    )
    new_password1 = forms.CharField(
        widget=forms.PasswordInput,
        min_length=8
    )

    def clean(self):
        cleaned_data = super().clean()
        p1 = cleaned_data.get("new_password")
        p2 = cleaned_data.get("new_password1")

        if p1 and p2 and p1 != p2:
            raise forms.ValidationError("Les mots de passe ne correspondent pas")

        return cleaned_data
