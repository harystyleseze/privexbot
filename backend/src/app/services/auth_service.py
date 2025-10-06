"""
Authentication service - Orchestrates auth flows and JWT generation.

WHY:
- Central place for auth logic
- Coordinates between auth strategies and token creation
- Handles user creation and context management

HOW:
- Uses auth strategies for verification
- Creates JWT tokens with permissions
- Manages user sessions and context

PSEUDOCODE:
-----------
from app.core.security import create_access_token
from app.auth.strategies import email, evm, solana, cosmos
from app.services.permission_service import get_user_permissions
from app.services.tenant_service import get_user_default_context

async def authenticate_email(
    email: str,
    password: str,
    db: Session
) -> dict:
    \"\"\"
    WHY: Handle email/password login
    HOW: Verify credentials, generate JWT

    Returns: Token response
    \"\"\"

    # Step 1: Verify credentials using email strategy
    user = await email.login_with_email(email, password, db)
        WHY: Delegates to strategy for verification

    # Step 2: Get user's default organization/workspace
    context = await get_user_default_context(user.id, db)
        WHY: Need org_id and ws_id for JWT
        HOW: Gets first org user belongs to, or None

    # Step 3: Get permissions for current context
    permissions = await get_user_permissions(
        user.id,
        context.get("org_id"),
        context.get("ws_id"),
        db
    )
        WHY: JWT needs permissions for RBAC

    # Step 4: Create JWT token
    token_data = {
        "sub": str(user.id),
        "email": email,
        "org_id": str(context.get("org_id")) if context.get("org_id") else None,
        "ws_id": str(context.get("ws_id")) if context.get("ws_id") else None,
        "perms": permissions
    }

    access_token = create_access_token(token_data)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }


async def register_email(
    username: str,
    email: str,
    password: str,
    db: Session
) -> dict:
    \"\"\"
    WHY: Handle email signup
    HOW: Create user, create default org, generate JWT
    \"\"\"

    # Step 1: Create user with email auth
    user = await email.signup_with_email(email, password, username, db)

    # Step 2: Create default personal organization
    from app.models.organization import Organization
    from app.models.organization_member import OrganizationMember

    org = Organization(
        name=f"{username}'s Organization",
        created_by=user.id
    )
    db.add(org)
    db.flush()

    # Step 3: Add user as owner
    org_member = OrganizationMember(
        user_id=user.id,
        organization_id=org.id,
        role="owner"
    )
    db.add(org_member)
    db.commit()

    WHY create default org: Every user needs at least one organization
    WHY owner role: User created it, they own it

    # Step 4: Get permissions and create token
    permissions = await get_user_permissions(user.id, org.id, None, db)

    token_data = {
        "sub": str(user.id),
        "email": email,
        "org_id": str(org.id),
        "ws_id": None,  # No workspace yet
        "perms": permissions
    }

    access_token = create_access_token(token_data)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }


async def authenticate_wallet(
    provider: str,  # 'evm', 'solana', 'cosmos'
    address: str,
    signed_message: str,
    signature: str,
    public_key: str | None,  # Required for Cosmos
    db: Session
) -> dict:
    \"\"\"
    WHY: Handle wallet authentication (EVM/Solana/Cosmos)
    HOW: Verify signature, create/get user, generate JWT

    Args:
        provider: Which blockchain ('evm', 'solana', 'cosmos')
        ... wallet-specific params
    \"\"\"

    # Step 1: Verify signature using appropriate strategy
    if provider == "evm":
        user = await evm.verify_signature(address, signed_message, signature, db)
    elif provider == "solana":
        user = await solana.verify_signature(address, signed_message, signature, db)
    elif provider == "cosmos":
        if not public_key:
            raise HTTPException(400, "Public key required for Cosmos")
        user = await cosmos.verify_signature(address, signed_message, signature, public_key, db)
    else:
        raise HTTPException(400, f"Unsupported provider: {provider}")

    # Step 2: Check if user has organization
    from app.models.organization_member import OrganizationMember

    org_membership = db.query(OrganizationMember).filter(
        OrganizationMember.user_id == user.id
    ).first()

    # Step 3: Create default org if new user
    if not org_membership:
        org = Organization(
            name=f"{user.username}'s Organization",
            created_by=user.id
        )
        db.add(org)
        db.flush()

        org_member = OrganizationMember(
            user_id=user.id,
            organization_id=org.id,
            role="owner"
        )
        db.add(org_member)
        db.commit()

        org_id = org.id
    else:
        org_id = org_membership.organization_id

    # Step 4: Get permissions and create token
    permissions = await get_user_permissions(user.id, org_id, None, db)

    token_data = {
        "sub": str(user.id),
        "email": None,  # Wallet users may not have email
        "org_id": str(org_id),
        "ws_id": None,
        "perms": permissions
    }

    access_token = create_access_token(token_data)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }


async def switch_context(
    user_id: UUID,
    organization_id: UUID,
    workspace_id: UUID | None,
    db: Session
) -> dict:
    \"\"\"
    WHY: Allow user to switch active org/workspace
    HOW: Verify membership, issue new JWT with updated context

    Returns: New token with updated org_id/ws_id
    \"\"\"

    # Step 1: Verify user is member of organization
    org_member = db.query(OrganizationMember).filter(
        OrganizationMember.user_id == user_id,
        OrganizationMember.organization_id == organization_id
    ).first()

    if not org_member:
        raise HTTPException(403, "Not a member of this organization")

    # Step 2: If switching to workspace, verify membership
    if workspace_id:
        from app.models.workspace_member import WorkspaceMember
        from app.models.workspace import Workspace

        workspace = db.query(Workspace).filter(
            Workspace.id == workspace_id,
            Workspace.organization_id == organization_id
        ).first()

        if not workspace:
            raise HTTPException(404, "Workspace not found in this organization")

        # Check if user is workspace member or org admin/owner
        ws_member = db.query(WorkspaceMember).filter(
            WorkspaceMember.user_id == user_id,
            WorkspaceMember.workspace_id == workspace_id
        ).first()

        if not ws_member and org_member.role not in ["owner", "admin"]:
            raise HTTPException(403, "No access to this workspace")

    # Step 3: Get permissions for new context
    permissions = await get_user_permissions(user_id, organization_id, workspace_id, db)

    # Step 4: Get user email (if exists)
    user = db.query(User).filter(User.id == user_id).first()
    auth_identity = db.query(AuthIdentity).filter(
        AuthIdentity.user_id == user_id,
        AuthIdentity.provider == "email"
    ).first()

    email = auth_identity.provider_id if auth_identity else None

    # Step 5: Create new token
    token_data = {
        "sub": str(user_id),
        "email": email,
        "org_id": str(organization_id),
        "ws_id": str(workspace_id) if workspace_id else None,
        "perms": permissions
    }

    access_token = create_access_token(token_data)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }


SERVICE RESPONSIBILITIES:
-------------------------
WHY separate from strategies:
    - Strategies focus on verification
    - Service handles business logic (org creation, tokens, etc.)
    - Cleaner separation of concerns

WHY create default org:
    - Every user needs at least one organization
    - Makes onboarding smooth
    - User can create more orgs or join others later

WHY permissions in JWT:
    - Avoid database lookups on every request
    - Fast authorization checks
    - Can validate permissions client-side

WHY context switching:
    - Users belong to multiple orgs
    - Need way to change active context
    - Issues new JWT with different org_id/ws_id/perms
"""
