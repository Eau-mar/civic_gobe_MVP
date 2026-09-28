"""
ASGI config for civic_niger project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
# We will create routing.py shortly
import civic_niger.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'civic_niger.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            civic_niger.routing.websocket_urlpatterns
        )
    ),
})
