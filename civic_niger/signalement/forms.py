from django import forms
from .models import Signalement

class SignalementForm(forms.ModelForm):
    class Meta:
        model = Signalement
        fields = ['titre', 'description', 'localisation', 'categorie', 'image', 'audio', 'ministere']


class SignalementStatutForm(forms.ModelForm):
    class Meta:
        model = Signalement
        fields = ['statut']
