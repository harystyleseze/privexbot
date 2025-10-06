"""
User model - Core user identity independent of authentication method.

WHY:
- Separates user identity from authentication methods
- Allows one user to have multiple login methods (email + multiple wallets)
- Central point for all user-related data and permissions

HOW:
- User is created when first authentication happens
- Links to auth_identities for different login methods
- Tracks memberships in organizations and workspaces

PSEUDOCODE:
-----------
class User(Base):
    __tablename__ = "users"

    # Fields
    id: UUID (primary key, auto-generated)
        WHY: Unique identifier, never changes even if username changes

    username: str (unique, indexed)
        WHY: Human-readable identifier, can be email or custom name
        HOW: Must be unique across all users

    is_active: bool (default: True)
        WHY: Soft delete - disable users without deleting their data
        HOW: Check this before allowing login or operations

    created_at: datetime (auto-set on creation)
    updated_at: datetime (auto-update on modification)

    # Relationships
    auth_identities: list[AuthIdentity] (one-to-many, cascade delete)
        WHY: One user can log in via email, MetaMask, Phantom, etc.
        HOW: When user deleted, all auth methods are deleted too

    organization_memberships: list[OrganizationMember] (one-to-many)
        WHY: Track which orgs this user belongs to and their roles

    workspace_memberships: list[WorkspaceMember] (one-to-many)
        WHY: Track which workspaces this user can access

    created_organizations: list[Organization] (one-to-many)
    created_workspaces: list[Workspace] (one-to-many)
    created_chatbots: list[Chatbot] (one-to-many)
    created_chatflows: list[Chatflow] (one-to-many)
        WHY: Track audit trail of who created what
        NOTE: Chatbots and chatflows are SEPARATE entities
"""
