from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Q
from django.utils import timezone

from .models import Signalement, LiveFrame
from .serializers import (
    SignalementReadSerializer,
    SignalementCreateSerializer,
    SignalementAuthorityUpdateSerializer,
    LiveFrameSerializer
)
from .permissions import IsOwnerOrAuthority


class SignalementViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing Signalements.
    """
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAuthority]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return SignalementCreateSerializer
        elif self.action in ['update', 'partial_update']:
            # If the user is a ministry authority, they use the AuthorityUpdateSerializer
            if self.request.user.is_ministere:
                return SignalementAuthorityUpdateSerializer
            return SignalementCreateSerializer
        return SignalementReadSerializer

    def get_queryset(self):
        user = self.request.user
        
        # Superadmin sees everything
        if user.is_superuser:
            return Signalement.objects.all().order_by('-date')
            
        # Ministry Agent sees reports assigned to their Ministry + public ones
        if user.is_ministere and user.ministere:
            return Signalement.objects.filter(
                Q(ministere=user.ministere) | Q(est_public=True)
            ).order_by('-date')
            
        # Citizen sees their own reports + public ones
        qs = Signalement.objects.filter(
            Q(utilisateur=user) | Q(est_public=True)
        )
        
        # Profile tab: fetch only current user's signalements
        if self.request.query_params.get('mine') == 'true':
            qs = Signalement.objects.filter(utilisateur=user)
            
        return qs.order_by('-date')

    def perform_create(self, serializer):
        # Force the user to the current authenticated user
        # If it's a live, set the start time
        is_live = serializer.validated_data.get('is_live', False)
        extra = {'utilisateur': self.request.user}
        if is_live:
            extra['live_started_at'] = timezone.now()
        serializer.save(**extra)

    # ─── DASHBOARD STATS ─────────────────────────────────────────────
    @action(detail=False, methods=['get'], url_path='stats')
    def get_stats(self, request):
        qs = self.get_queryset()
        total = qs.count()
        non_traite = qs.filter(statut='non_traite').count()
        en_cours = qs.filter(statut='en_cours').count()
        traite = qs.filter(statut='traite').count()
        live = qs.filter(is_live=True).count()
        
        return Response({
            'total': total,
            'nonTraite': non_traite,
            'enCours': en_cours,
            'traite': traite,
            'live': live
        })

    # ─── LIVE FRAME UPLOAD ───────────────────────────────────────────
    @action(detail=True, methods=['post'], url_path='upload-frame')
    def upload_frame(self, request, pk=None):
        """
        Reçoit une frame JPEG du citoyen pendant un live.
        Aussi met à jour la position GPS du signalement.
        """
        signalement = self.get_object()
        
        if not signalement.is_live:
            return Response(
                {'error': 'Ce signalement n\'est pas en mode live.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        image_b64 = request.data.get('image_base64')
        if not image_b64:
            return Response(
                {'error': 'Aucune image fournie.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        import base64
        import uuid
        from django.core.files.base import ContentFile
        
        format, imgstr = image_b64.split(';base64,') if ';base64,' in image_b64 else ('', image_b64)
        ext = format.split('/')[-1] if format else 'jpg'
        image = ContentFile(base64.b64decode(imgstr), name=f"frame_{uuid.uuid4().hex[:8]}.{ext}")
        
        lat = request.data.get('latitude')
        lon = request.data.get('longitude')
        
        # Créer la frame
        frame = LiveFrame.objects.create(
            signalement=signalement,
            image=image,
            latitude=lat,
            longitude=lon
        )
        
        # Mettre à jour la position GPS du signalement
        update_fields = []
        if lat is not None:
            signalement.latitude = lat
            update_fields.append('latitude')
        if lon is not None:
            signalement.longitude = lon
            update_fields.append('longitude')
        if update_fields:
            signalement.save(update_fields=update_fields)
        
        serializer = LiveFrameSerializer(frame, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    # ─── LATEST FRAME ────────────────────────────────────────────────
    @action(detail=True, methods=['get'], url_path='latest-frame')
    def latest_frame(self, request, pk=None):
        """
        Retourne la dernière frame d'un live signalement.
        Utilisé par le Dashboard des autorités pour le viewer.
        """
        signalement = self.get_object()
        frame = signalement.live_frames.first()  # Ordered by -timestamp
        
        if not frame:
            return Response(
                {'error': 'Aucune frame disponible.', 'is_live': signalement.is_live},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = LiveFrameSerializer(frame, context={'request': request})
        data = serializer.data
        data['is_live'] = signalement.is_live
        return Response(data)

    # ─── END LIVE ─────────────────────────────────────────────────────
    @action(detail=True, methods=['post'], url_path='end-live')
    def end_live(self, request, pk=None):
        """
        Termine un live en cours.
        Met is_live=False.
        """
        signalement = self.get_object()
        
        # Only the owner can end the live
        if signalement.utilisateur_id != request.user.id and not request.user.is_superuser:
            return Response(
                {'error': 'Seul le créateur peut arrêter le live.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        signalement.is_live = False
        signalement.save(update_fields=['is_live'])
        
        return Response({'status': 'Live terminé.', 'is_live': False})
