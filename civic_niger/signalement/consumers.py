import json
from channels.generic.websocket import AsyncWebsocketConsumer

class MinistereMapConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Récupère l'ID du ministère depuis l'URL (routing.py)
        self.ministere_id = self.scope['url_route']['kwargs']['ministere_id']
        self.group_name = f"ministere_{self.ministere_id}_map"

        # Sécurité : On s'assure que l'utilisateur est authentifié et appartient au bon ministère
        user = self.scope.get('user')
        if user and user.is_authenticated and (user.is_superuser or (user.is_ministere and str(user.ministere_id) == str(self.ministere_id))):
            # Rejoindre le groupe WebSocket du Ministère
            await self.channel_layer.group_add(
                self.group_name,
                self.channel_name
            )
            await self.accept()
        else:
            # Rejeter la connexion si l'utilisateur n'est pas autorisé
            await self.close()

    async def disconnect(self, close_code):
        # Quitter le groupe
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    # Recevoir un message depuis le groupe (déclenché par views.py)
    async def live_signalement_alert(self, event):
        data = event['data']

        # Envoyer le message au WebSocket (Frontend)
        await self.send(text_data=json.dumps({
            'type': 'live_signalement',
            'data': data
        }))
