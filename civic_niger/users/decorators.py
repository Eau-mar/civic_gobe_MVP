from django.contrib.auth.decorators import login_required
from django.core.exceptions import PermissionDenied
from functools import wraps

from users.permissions import check_role


def role_required(role):
    def decorator(view_func):
        @wraps(view_func)
        @login_required
        def _wrapped_view(request, *args, **kwargs):
            check_role(request.user, role)
            return view_func(request, *args, **kwargs)

        return _wrapped_view
    return decorator
