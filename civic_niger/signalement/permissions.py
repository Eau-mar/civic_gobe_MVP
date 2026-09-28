from rest_framework import permissions

class IsOwnerOrAuthority(permissions.BasePermission):
    """
    Permission personnalisée pour les signalements :
    - Autorise la lecture si le signalement est public (est_public=True)
    - Autorise l'accès complet au propriétaire (l'utilisateur qui l'a créé)
    - Autorise l'accès (y compris modification du statut) aux agents du ministère assigné
    - Autorise tout pour les superusers
    """
    
    def has_object_permission(self, request, view, obj):
        # Les super utilisateurs ont toujours accès
        if request.user and request.user.is_superuser:
            return True
            
        # Vérifie si l'utilisateur est le propriétaire
        is_owner = (obj.utilisateur_id == request.user.id)
        
        # Vérifie si l'utilisateur est un agent du ministère assigné
        is_assigned_authority = (
            request.user.is_ministere and 
            obj.ministere_id and
            request.user.ministere_id == obj.ministere_id
        )
        
        # Logique pour les requêtes de lecture (GET, HEAD, OPTIONS)
        if request.method in permissions.SAFE_METHODS:
            # Accessible si public OU si propriétaire OU si agent du bon ministère
            return obj.est_public or is_owner or is_assigned_authority
            
        # Logique pour les requêtes d'écriture (PUT, PATCH, DELETE)
        # Seul le propriétaire peut modifier l'ensemble (ou supprimer)
        # Mais on gérera le cas spécifique du changement de statut par l'autorité dans la vue (via un serializer/action dédié)
        return is_owner or is_assigned_authority
