from django import forms
from .models import *

class VoixDuPeupleForm(forms.ModelForm):
    class Meta:
        model = VoixDuPeuple
        fields = ['titre', 'contenu', 'audio']

class CommentaireForm(forms.ModelForm):
    class Meta:
        model = Commentaire
        fields = ['contenu']
