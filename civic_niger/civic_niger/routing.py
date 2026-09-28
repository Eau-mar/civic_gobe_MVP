from django.urls import path
from signalement.consumers import MinistereMapConsumer

websocket_urlpatterns = [
    path('ws/ministere/<int:ministere_id>/map/', MinistereMapConsumer.as_asgi()),
]
