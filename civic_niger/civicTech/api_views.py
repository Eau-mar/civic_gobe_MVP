from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q

from signalement.models import Signalement
from signalement.serializers import SignalementReadSerializer

from savoir.models import SavoirCitoyen
from savoir.serializers import SavoirCitoyenSerializer

from voix.models import VoixDuPeuple
from voix.serializers import VoixDuPeupleSerializer

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50

class FeedAPIView(APIView):
    """
    API endpoint that unifies Signalements and Publications (Savoir) into a single feed.
    """
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get(self, request, format=None):
        search_query = request.query_params.get('search', '').lower()
        filter_type = request.query_params.get('type', 'tout').lower()
        user = request.user

        feed_items = []

        # 1. Fetch Signalements
        if filter_type in ['tout', 'signalement', 'live']:
            sig_qs = Signalement.objects.filter(Q(utilisateur=user) | Q(est_public=True))
            
            # Exclude live streams if the current user is the author
            sig_qs = sig_qs.exclude(Q(is_live=True) & Q(utilisateur=user))

            # Exclude ended live streams (they have a live_room_id but is_live is False)
            sig_qs = sig_qs.exclude(Q(is_live=False) & Q(live_room_id__isnull=False) & ~Q(live_room_id=''))

            if filter_type == 'live':
                sig_qs = sig_qs.filter(is_live=True)
            elif filter_type == 'signalement':
                sig_qs = sig_qs.filter(is_live=False)

            if search_query:
                sig_qs = sig_qs.filter(
                    Q(titre__icontains=search_query) | 
                    Q(description__icontains=search_query) |
                    Q(localisation__icontains=search_query)
                )

            # Serialize Signalements
            sig_data = SignalementReadSerializer(sig_qs, many=True, context={'request': request}).data
            for item in sig_data:
                item['feedType'] = 'live' if item.get('is_live') else 'signalement'
                item['sort_date'] = item.get('date') or item.get('created_at')
                item['is_pinned'] = True if item.get('is_live') else False
                feed_items.append(item)

        # 2. Fetch Savoirs (Publications)
        if filter_type in ['tout', 'publication']:
            sav_qs = SavoirCitoyen.objects.filter(statut='publie')

            if search_query:
                sav_qs = sav_qs.filter(
                    Q(titre__icontains=search_query) | 
                    Q(contenu__icontains=search_query)
                )

            sav_data = SavoirCitoyenSerializer(sav_qs, many=True, context={'request': request}).data
            for item in sav_data:
                item['feedType'] = 'publication'
                item['sort_date'] = item.get('date') or item.get('created_at')
                item['is_pinned'] = False
                feed_items.append(item)

        # 3. Fetch Voix (Tendances/Propositions)
        if filter_type in ['tout', 'voix']:
            voix_qs = VoixDuPeuple.objects.all()
            
            if search_query:
                voix_qs = voix_qs.filter(
                    Q(titre__icontains=search_query) | 
                    Q(contenu__icontains=search_query)
                )
                
            voix_data = VoixDuPeupleSerializer(voix_qs, many=True, context={'request': request}).data
            for item in voix_data:
                item['feedType'] = 'voix'
                item['sort_date'] = item.get('date') or item.get('created_at')
                item['is_pinned'] = False
                feed_items.append(item)

        # 4. Sort logic
        # Pinned (live) items first, then descending by date
        feed_items.sort(
            key=lambda x: (
                0 if x['is_pinned'] else 1,
                x['sort_date'] or ''
            ), 
            reverse=True
        )

        # Reverse again manually for sort_date since reverse=True inverted the pinned priority
        # Let's do it safer:
        # Sort by date first (descending)
        feed_items.sort(key=lambda x: x['sort_date'] or '', reverse=True)
        # Then sort by pinned (pinned first)
        feed_items.sort(key=lambda x: 0 if x['is_pinned'] else 1)

        # 5. Paginate manually for a list
        paginator = self.pagination_class()
        
        # Django Rest Framework paginators usually expect a QuerySet, but PageNumberPagination can paginate lists.
        page = paginator.paginate_queryset(feed_items, request, view=self)
        if page is not None:
            return paginator.get_paginated_response(page)

        return Response(feed_items)
