"""
Permission service - Maps roles to permissions for RBAC.

WHY:
- Centralized permission logic
- Map roles to granular permissions
- Used to populate JWT permissions field

HOW:
- Define permission sets for each role
- Calculate permissions based on org/workspace roles
- Return permission dict for JWT

PSEUDOCODE:
-----------
from app.models.organization_member import OrganizationMember
from app.models.workspace_member import WorkspaceMember

# Permission definitions
ORGANIZATION_PERMISSIONS = {
    "owner": {
        "org:read": True,
        "org:write": True,
        "org:delete": True,
        "org:manage_members": True,
        "workspace:create": True,
        "workspace:delete": True,
        "workspace:manage_members": True,
        "chatbot:create": True,
        "chatbot:edit": True,
        "chatbot:delete": True,
        "chatflow:create": True,
        "chatflow:edit": True,
        "chatflow:delete": True,
    },
    "admin": {
        "org:read": True,
        "org:write": True,
        "org:delete": False,  # Only owner can delete org
        "org:manage_members": True,
        "workspace:create": True,
        "workspace:delete": True,
        "workspace:manage_members": True,
        "chatbot:create": True,
        "chatbot:edit": True,
        "chatbot:delete": True,
        "chatflow:create": True,
        "chatflow:edit": True,
        "chatflow:delete": True,
    },
    "member": {
        "org:read": True,
        "org:write": False,
        "org:delete": False,
        "org:manage_members": False,
        "workspace:create": False,
        "workspace:delete": False,
        "workspace:manage_members": False,
        # Workspace-level permissions determined by workspace role
        "chatbot:create": False,  # Unless workspace admin/editor
        "chatbot:edit": False,
        "chatbot:delete": False,
        "chatflow:create": False,
        "chatflow:edit": False,
        "chatflow:delete": False,
    }
}
    WHY separate chatbot/chatflow: They are different entities
    NOTE: chatbot = simple form-based bots
    NOTE: chatflow = drag-and-drop workflow bots

WORKSPACE_PERMISSIONS = {
    "admin": {
        "workspace:read": True,
        "workspace:write": True,
        "workspace:manage_members": True,
        "chatbot:create": True,
        "chatbot:edit": True,
        "chatbot:delete": True,
        "chatflow:create": True,
        "chatflow:edit": True,
        "chatflow:delete": True,
    },
    "editor": {
        "workspace:read": True,
        "workspace:write": False,
        "workspace:manage_members": False,
        "chatbot:create": True,
        "chatbot:edit": True,
        "chatbot:delete": False,  # Can't delete
        "chatflow:create": True,
        "chatflow:edit": True,
        "chatflow:delete": False,
    },
    "viewer": {
        "workspace:read": True,
        "workspace:write": False,
        "workspace:manage_members": False,
        "chatbot:create": False,
        "chatbot:edit": False,
        "chatbot:delete": False,
        "chatflow:create": False,
        "chatflow:edit": False,
        "chatflow:delete": False,
    }
}


async def get_user_permissions(
    user_id: UUID,
    organization_id: UUID | None,
    workspace_id: UUID | None,
    db: Session
) -> dict[str, bool]:
    \"\"\"
    WHY: Calculate user's permissions for current context
    HOW: Combine org and workspace roles

    Args:
        user_id: User to get permissions for
        organization_id: Current org from JWT
        workspace_id: Current workspace from JWT (optional)

    Returns: Dict of permission -> bool
        EXAMPLE: {"org:read": True, "chatbot:create": True, ...}
    \"\"\"

    permissions = {}

    # Step 1: Get organization role and permissions
    if organization_id:
        org_member = db.query(OrganizationMember).filter(
            OrganizationMember.user_id == user_id,
            OrganizationMember.organization_id == organization_id
        ).first()

        if org_member:
            org_perms = ORGANIZATION_PERMISSIONS.get(org_member.role, {})
            permissions.update(org_perms)
                WHY: Start with org-level permissions

    # Step 2: Get workspace role and merge permissions
    if workspace_id:
        ws_member = db.query(WorkspaceMember).filter(
            WorkspaceMember.user_id == user_id,
            WorkspaceMember.workspace_id == workspace_id
        ).first()

        # If user is workspace member, merge workspace permissions
        if ws_member:
            ws_perms = WORKSPACE_PERMISSIONS.get(ws_member.role, {})

            # Merge workspace permissions (workspace perms take precedence for workspace-scoped actions)
            for perm, value in ws_perms.items():
                if perm.startswith("workspace:") or perm.startswith("chatbot:") or perm.startswith("chatflow:"):
                    permissions[perm] = value
                        WHY: Workspace-specific perms override org defaults

        # If org owner/admin but not workspace member, grant admin access
        elif org_member and org_member.role in ["owner", "admin"]:
            ws_perms = WORKSPACE_PERMISSIONS["admin"]
            for perm, value in ws_perms.items():
                permissions[perm] = value
                    WHY: Org admins have full access to all workspaces

    return permissions


def check_permission(permissions: dict, required_permission: str) -> bool:
    \"\"\"
    WHY: Helper to check if user has specific permission
    HOW: Look up in permissions dict

    Args:
        permissions: Permission dict from JWT
        required_permission: Permission to check (e.g., "chatbot:create")

    Returns: True if has permission
    \"\"\"
    return permissions.get(required_permission, False)


def require_permission(required_permission: str):
    \"\"\"
    WHY: Decorator for route handlers to enforce permissions
    HOW: Check JWT permissions field

    Usage:
        @router.post("/chatbots")
        @require_permission("chatbot:create")
        def create_chatbot(current_user: User = Depends(get_current_user)):
            ...
    \"\"\"
    def decorator(func):
        def wrapper(*args, **kwargs):
            current_user = kwargs.get("current_user")

            if not current_user:
                raise HTTPException(401, "Not authenticated")

            if not check_permission(current_user.permissions, required_permission):
                raise HTTPException(403, f"Missing permission: {required_permission}")

            return func(*args, **kwargs)

        return wrapper
    return decorator


PERMISSION GRANULARITY:
-----------------------
WHY separate chatbot and chatflow permissions:
    - chatbot: Simple form-based bots
    - chatflow: Complex drag-and-drop workflow bots
    - May want different access controls in future
    - Currently same permissions, but separated for flexibility

EXAMPLE: chatbot:create vs chatflow:create
    - Both create bot-like entities
    - chatbot is simpler (form)
    - chatflow is more complex (ReactFlow nodes)
    - Could restrict chatflow to higher roles in future

PERMISSION HIERARCHY:
---------------------
Org Level:
    owner > admin > member

Workspace Level:
    admin > editor > viewer

Inheritance:
    - Org owner/admin gets admin access to all workspaces
    - Workspace role overrides for workspace-scoped permissions
    - Org member with workspace admin role has admin perms in that workspace only

USAGE IN JWT:
-------------
JWT payload includes:
{
    "sub": "user_id",
    "org_id": "uuid",
    "ws_id": "uuid",
    "perms": {
        "org:read": true,
        "chatbot:create": true,
        "chatflow:edit": true,
        ...
    }
}

WHY in JWT:
    - Fast permission checks without DB query
    - Client can hide/show UI elements based on perms
    - Verify server-side too (don't trust client)

SECURITY NOTE:
--------------
WHY check permissions server-side:
    - JWT can be tampered with client-side
    - Always verify on server for security
    - JWT perms are for convenience/UI, not security
    - Re-check critical operations against database
"""
