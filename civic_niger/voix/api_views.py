from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import VoixDuPeuple, Commentaire, Like
from .serializers import VoixDuPeupleSerializer, CommentaireSerializer, LikeSerializer

class VoixDuPeupleViewSet(viewsets.ModelViewSet):
    # Only show approved voices or voices authored by the current user
    serializer_class = VoixDuPeupleSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        # Pour le profil, récupérer uniquement les voix créées par l'utilisateur
        if self.request.query_params.get('mine') == 'true':
            return VoixDuPeuple.objects.filter(auteur=self.request.user).order_by('-date')
            
        # Pour l'instant, on affiche tout pour faciliter les tests, mais en prod: approuve=True
        # return VoixDuPeuple.objects.filter(approuve=True).order_by('-date')
        return VoixDuPeuple.objects.all().order_by('-date')

    def perform_create(self, serializer):
        serializer.save(auteur=self.request.user, approuve=True) # Auto-approuvé pour l'instant pour MVP

    @action(detail=True, methods=['post'], url_path='vote')
    def vote(self, request, pk=None):
        voix = self.get_object()
        choix = request.data.get('choix')
        
        if choix not in ['pour', 'contre']:
            return Response({'error': 'Le choix doit être "pour" ou "contre".'}, status=status.HTTP_400_BAD_REQUEST)
            
        vote, created = Like.objects.update_or_create(
            publication=voix,
            utilisateur=request.user,
            defaults={'choix': choix}
        )
        
        return Response({'status': 'Vote enregistré', 'choix': vote.choix})

    @action(detail=True, methods=['get'], url_path='commentaires')
    def get_commentaires(self, request, pk=None):
        voix = self.get_object()
        # Ne récupérer que les commentaires parents pour le thread principal
        commentaires = voix.commentaires.filter(parent__isnull=True).order_by('-date')
        serializer = CommentaireSerializer(commentaires, many=True)
        return Response(serializer.data)

class CommentaireViewSet(viewsets.ModelViewSet):
    queryset = Commentaire.objects.all().order_by('-date')
    serializer_class = CommentaireSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(auteur=self.request.user)

    @action(detail=True, methods=['get'], url_path='reponses')
    def get_reponses(self, request, pk=None):
        commentaire = self.get_object()
        reponses = commentaire.reponses.all().order_by('date')
        serializer = CommentaireSerializer(reponses, many=True)
        return Response(serializer.data)
