from django import forms
from .models import *

class SavoirCitoyenForm(forms.ModelForm):
    class Meta:
        model = SavoirCitoyen
        fields = ['titre', 'contenu', 'audio', 'image', 'categorie', 'statut']
        widgets = {
            'titre': forms.TextInput(attrs={
                'class': 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007f5f]'
            }),
            'contenu': forms.Textarea(attrs={
                'class': 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007f5f]',
                'rows': 6
            }),
            'audio': forms.ClearableFileInput(attrs={
                'class': 'w-full px-4 py-2 border border-gray-300 rounded-md'
            }),
            'image': forms.ClearableFileInput(attrs={
                'class': 'w-full px-4 py-2 border border-gray-300 rounded-md'
            }),
            'categorie': forms.Select(attrs={
                'class': 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007f5f]'
            }),
            'statut': forms.Select(attrs={
                'class': 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007f5f]'
            }),
        }
       