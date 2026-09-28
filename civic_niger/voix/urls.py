from django.urls import path
from .views import *


urlpatterns = [
    path('voix/<int:publication_id>/', detail_voix, name='detail_voix'),
    path('voix/publier/', publier_voix, name='publier_voix'),
    path('voix/<int:pk>/modifier/', modifier_voix, name='modifier_voix'),
    path('voix/<int:pk>/supprimer/', supprimer_voix, name='supprimer_voix'),
    path('voix/<int:publication_id>/commentaire/', ajouter_commentaire, name='ajouter_commentaire'),
    path('commentaire/<int:commentaire_id>/', voir_commentaire, name='voir_commentaire'),
    path('commentaire/<int:commentaire_id>/reponse/', ajouter_reponse, name='ajouter_reponse'),
    path('voix/<int:pk>/toggle_like/<str:choix>/', toggle_like, name='toggle_like'),
]
