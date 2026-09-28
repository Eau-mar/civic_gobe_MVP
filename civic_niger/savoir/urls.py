from django.urls import path
from .views import *

urlpatterns = [
    path('savoir/<int:pk>/', detail_savoir, name='detail_savoir'),
    path('savoir/creer/', creer_savoir, name='creer_savoir'),
    path('savoir/modifier/<int:pk>/', modifier_savoir, name='modifier_savoir'),
    path('savoir/supprimer/<int:pk>/', supprimer_savoir, name='supprimer_savoir'),
]
