from django.urls import path
from .views import *

urlpatterns = [
    path('profil/', profil_citoyen, name='profil_citoyen'),
    path('profil/modifier/', edit_profile, name='edit_profile'),
    path('dashboard/ministere/', dashboard_ministere, name='dashboard_ministere'),
    path('ministere/modifier-profil/', modifier_profil_ministere, name='modifier_profil_ministere'),
    path('ministere/signalements/<int:pk>/modifier/', modifier_statut_signalement, name='modifier_statut_signalement'),
    path('ministere/publication/', creer_publication, name="creer_publication"),
    path('publication/<int:pk>/', detail_publication, name='detail_publication'),
    path('notifications/', liste_notifications, name='liste_notifications'),
]
