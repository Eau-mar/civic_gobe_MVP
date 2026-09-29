from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from civicTech.serializers import PublicationSerializer
from profils.models import Publication

class PublicationViewSet(viewsets.ModelViewSet):
    serializer_class = PublicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.is_ministere:
            return Publication.objects.filter(ministere=user).order_by('-date')
        return Publication.objects.all().order_by('-date')

    def perform_create(self, serializer):
        serializer.save(ministere=self.request.user)
