import os
from django.conf import settings
from django.http import HttpResponse

def frontend_view(request, path=None):
    index_path = os.path.join(settings.BASE_DIR, 'frontend_dist', 'index.html')
    try:
        with open(index_path, 'r', encoding='utf-8') as f:
            return HttpResponse(f.read())
    except FileNotFoundError:
        return HttpResponse("Frontend build not found. Please run build script.", status=404)
