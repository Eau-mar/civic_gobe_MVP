from django.urls import path
from .views import *

urlpatterns = [
    path('register/', register, name='register'),
    path('login/', user_login, name='login'),
    path('mot-de-passe/oublié/', demande_tel, name='demande_tel'),
    path('mot-de-passe/code/', verifier_code, name='verifier_code'),
    path('mot-de-passe/nouveau/', set_new_password, name='set_new_password'),
    path('logout/', logout_view, name='logout'),
]
