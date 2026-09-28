from django.urls import path
from .views import bienvenue, accueil, blog, apropos

urlpatterns = [
    path('', bienvenue, name='bienvenue'),
    path('accueil/', accueil, name='accueil'),
    path('blog', blog, name="blog"),
    path('apropos', apropos, name="apropos"),
]
