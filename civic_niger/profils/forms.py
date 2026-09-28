from django import forms
from .models import Publication


class PublicationForm(forms.ModelForm):
    class Meta:
        model = Publication
        fields = ['titre', 'contenu', 'image']  # adapte selon tes champs
        widgets = {
            'titre': forms.TextInput(attrs={
                'class': 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007f5f]'
            }),
            'contenu': forms.Textarea(attrs={
                'class': 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007f5f]',
                'rows': 5
            }),
            'image': forms.ClearableFileInput(attrs={
                'class': 'w-full px-4 py-2 border border-gray-300 rounded-md'
            }),
        }

