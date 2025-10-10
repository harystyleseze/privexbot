"""
Tenant service - Manages multi-tenancy context and organization/workspace operations.

WHY:
- Handle organization and workspace operations
- Enforce tenant isolation
- Manage user memberships and access

HOW:
- Validate tenant boundaries
- Helper functions for tenant-safe queries
- Membership management

PSEUDOCODE:
-----------
from app.models.organization import Organization
from app.models.workspace import Workspace
from app.models.organization_member import OrganizationMember
from app.models.workspace_member import WorkspaceMember

async def get_user_default_context(user_id: UUID, db: Session) -> dict:
    \"\"\"
    WHY: Get user's default org/workspace for initial JWT
    HOW: Return first org they belong to

    Returns: {"org_id": UUID, "ws_id": UUID | None}
    \"\"\"

    # Get first organization user belongs to
    org_member = db.query(OrganizationMember).filter(
        OrganizationMember.user_id == user_id
    ).first()

    if not org_member:
        return {"org_id": None, "ws_id": None}
            WHY: User not in any org yet (shouldn't happen after signup)

    # Get first workspace in that org (optional)
    ws_member = db.query(WorkspaceMember).join(Workspace).filter(
        WorkspaceMember.user_id == user_id,
        Workspace.organization_id == org_member.organization_id
    ).first()

    return {
        "org_id": org_member.organization_id,
        "ws_id": ws_member.workspace_id if ws_member else None
    }


async def get_user_organizations(user_id: UUID, db: Session) -> list:
    \"\"\"
    WHY: List all organizations user belongs to
    HOW: Query through organization_members

    Returns: List of orgs with user's role
    \"\"\"

    orgs = db.query(Organization, OrganizationMember.role).join(
        OrganizationMember
    ).filter(
        OrganizationMember.user_id == user_id
    ).all()

    return [
        {
            "id": org.id,
            "name": org.name,
            "role": role,
            "created_at": org.created_at
        }
        for org, role in orgs
    ]
        WHY: Include role for UI display


async def get_organization_workspaces(
    organization_id: UUID,
    user_id: UUID,
    db: Session
) -> list:
    \"\"\"
    WHY: List workspaces in org that user can access
    HOW: Filter by user membership or org admin role

    Returns: List of workspaces with user's role
    \"\"\"

    # Step 1: Check user's org role
    org_member = db.query(OrganizationMember).filter(
        OrganizationMember.user_id == user_id,
        OrganizationMember.organization_id == organization_id
    ).first()

    if not org_member:
        raise HTTPException(403, "Not a member of this organization")

    # Step 2: If owner/admin, show all workspaces
    if org_member.role in ["owner", "admin"]:
        workspaces = db.query(Workspace).filter(
            Workspace.organization_id == organization_id
        ).all()

        return [
            {
                "id": ws.id,
                "name": ws.name,
                "role": "admin",  # Org admins have admin access to all workspaces
                "chatbot_count": len(ws.chatbots),  # Relationship count
                "chatflow_count": len(ws.chatflows)  # NOTE: Separate from chatbots!
            }
            for ws in workspaces
        ]

    # Step 3: If member, show only workspaces they're part of
    ws_memberships = db.query(Workspace, WorkspaceMember.role).join(
        WorkspaceMember
    ).filter(
        WorkspaceMember.user_id == user_id,
        Workspace.organization_id == organization_id
    ).all()

    return [
        {
            "id": ws.id,
            "name": ws.name,
            "role": role,
            "chatbot_count": len(ws.chatbots),
            "chatflow_count": len(ws.chatflows)
        }
        for ws, role in ws_memberships
    ]


async def create_organization(
    name: str,
    user_id: UUID,
    db: Session
) -> Organization:
    \"\"\"
    WHY: Create new organization
    HOW: Create org and set creator as owner

    Returns: Organization object
    \"\"\"

    # Create organization
    org = Organization(
        name=name,
        created_by=user_id
    )
    db.add(org)
    db.flush()

    # Add creator as owner
    org_member = OrganizationMember(
        user_id=user_id,
        organization_id=org.id,
        role="owner"
    )
    db.add(org_member)
    db.commit()
    db.refresh(org)

    return org


async def create_workspace(
    name: str,
    organization_id: UUID,
    user_id: UUID,
    db: Session
) -> Workspace:
    \"\"\"
    WHY: Create workspace within organization
    HOW: Verify user access, create workspace

    Returns: Workspace object
    \"\"\"

    # Step 1: Verify user is org member
    org_member = db.query(OrganizationMember).filter(
        OrganizationMember.user_id == user_id,
        OrganizationMember.organization_id == organization_id
    ).first()

    if not org_member:
        raise HTTPException(403, "Not a member of this organization")

    # Step 2: Check if user has permission to create workspaces
    if org_member.role not in ["owner", "admin"]:
        raise HTTPException(403, "Only owners and admins can create workspaces")

    # Step 3: Create workspace
    workspace = Workspace(
        name=name,
        organization_id=organization_id,
        created_by=user_id
    )
    db.add(workspace)
    db.flush()

    # Step 4: Add creator as workspace admin
    ws_member = WorkspaceMember(
        user_id=user_id,
        workspace_id=workspace.id,
        role="admin"
    )
    db.add(ws_member)
    db.commit()
    db.refresh(workspace)

    return workspace


async def add_organization_member(
    organization_id: UUID,
    inviter_user_id: UUID,
    invitee_user_id: UUID,
    role: str,  # 'admin' or 'member'
    db: Session
) -> OrganizationMember:
    \"\"\"
    WHY: Invite user to organization
    HOW: Verify inviter has permission, create membership

    PERMISSION: Only owner/admin can invite
    \"\"\"

    # Step 1: Verify inviter is owner/admin
    inviter_member = db.query(OrganizationMember).filter(
        OrganizationMember.user_id == inviter_user_id,
        OrganizationMember.organization_id == organization_id
    ).first()

    if not inviter_member or inviter_member.role not in ["owner", "admin"]:
        raise HTTPException(403, "Only owners and admins can invite members")

    # Step 2: Prevent creating duplicate membership
    existing = db.query(OrganizationMember).filter(
        OrganizationMember.user_id == invitee_user_id,
        OrganizationMember.organization_id == organization_id
    ).first()

    if existing:
        raise HTTPException(400, "User is already a member")

    # Step 3: Prevent non-owners from creating owners
    if role == "owner" and inviter_member.role != "owner":
        raise HTTPException(403, "Only owners can create other owners")

    # Step 4: Create membership
    org_member = OrganizationMember(
        user_id=invitee_user_id,
        organization_id=organization_id,
        role=role
    )
    db.add(org_member)
    db.commit()

    return org_member


async def verify_tenant_access(
    user_id: UUID,
    organization_id: UUID,
    workspace_id: UUID | None,
    required_role: str | None,
    db: Session
) -> bool:
    \"\"\"
    WHY: Central function to verify tenant access
    HOW: Check org membership, optionally workspace membership

    Args:
        user_id: User to check
        organization_id: Org from JWT or request
        workspace_id: Workspace from request (optional)
        required_role: Minimum role needed (e.g., 'admin')

    Returns: True if has access
    Raises: HTTPException if no access
    \"\"\"

    # Check org membership
    org_member = db.query(OrganizationMember).filter(
        OrganizationMember.user_id == user_id,
        OrganizationMember.organization_id == organization_id
    ).first()

    if not org_member:
        raise HTTPException(403, "No access to this organization")

    # If workspace specified, check workspace access
    if workspace_id:
        # Org owners/admins have access to all workspaces
        if org_member.role in ["owner", "admin"]:
            return True

        # Otherwise check workspace membership
        ws_member = db.query(WorkspaceMember).filter(
            WorkspaceMember.user_id == user_id,
            WorkspaceMember.workspace_id == workspace_id
        ).first()

        if not ws_member:
            raise HTTPException(403, "No access to this workspace")

        # Check role if required
        if required_role:
            role_hierarchy = {"viewer": 1, "editor": 2, "admin": 3}
            if role_hierarchy.get(ws_member.role, 0) < role_hierarchy.get(required_role, 0):
                raise HTTPException(403, f"Requires {required_role} role")

    return True


TENANT ISOLATION BEST PRACTICES:
---------------------------------
WHY verify at service layer:
    - Central validation logic
    - Prevents accidental access violations
    - Easier to audit and test

HOW to use in routes:
    @router.get("/chatbots/{chatbot_id}")
    def get_chatbot(chatbot_id: UUID, current_user: User = Depends(get_current_user)):
        # Verify access first
        verify_tenant_access(current_user.id, current_user.org_id, ...)

        # Then query with tenant filter
        chatbot = db.query(Chatbot).join(Workspace).filter(
            Chatbot.id == chatbot_id,
            Workspace.organization_id == current_user.org_id
        ).first()

        if not chatbot:
            raise HTTPException(404, "Chatbot not found")

        return chatbot

WHY separate chatbot and chatflow:
    - Different models/tables
    - Different creation flows
    - chatbot: Simple form-based
    - chatflow: ReactFlow drag-and-drop nodes
"""
