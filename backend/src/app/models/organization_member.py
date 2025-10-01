"""
OrganizationMember model - User membership in organization with role.

WHY:
- Define which users belong to which organizations
- Assign roles (owner, admin, member) for permissions
- Enable multi-org support (one user can be in many orgs)

HOW:
- Junction table between User and Organization
- Stores role for RBAC (Role-Based Access Control)
- Unique constraint prevents duplicate memberships

PSEUDOCODE:
-----------
class OrganizationMember(Base):
    __tablename__ = "organization_members"

    # Fields
    id: UUID (primary key, auto-generated)

    user_id: UUID (foreign key -> users.id, indexed, cascade delete)
        WHY: Which user this membership is for
        HOW: When user deleted, their memberships are deleted

    organization_id: UUID (foreign key -> organizations.id, indexed, cascade delete)
        WHY: Which organization this membership is in
        HOW: When org deleted, all memberships are deleted

    role: str (enum: 'owner', 'admin', 'member', required)
        WHY: Determines what user can do in this organization
        HOW: Used by permission_service to calculate permissions

        ROLES EXPLAINED:
        - 'owner': Full control
            * Delete organization
            * Manage all members and workspaces
            * Transfer ownership
            * Billing and settings

        - 'admin': Management permissions
            * Create/delete workspaces
            * Add/remove members (except owner)
            * Manage workspace access
            * Cannot delete org

        - 'member': Basic access
            * Access assigned workspaces
            * Cannot manage org or add users
            * Workspace permissions determined by WorkspaceMember role

    created_at: datetime (auto-set on creation)
    updated_at: datetime (auto-update on modification)

    # Constraints
    unique_constraint: (user_id, organization_id)
        WHY: User can only have one role per organization
        HOW: Database enforces this, prevents duplicate memberships
        EXAMPLE: User cannot be both 'admin' and 'member' in same org

    # Relationships
    user: User (many-to-one back reference)
        WHY: Access user details from membership

    organization: Organization (many-to-one back reference)
        WHY: Access org details from membership

PERMISSION CALCULATION:
-----------------------
WHY: JWT needs to know user's permissions in current org
HOW: When creating JWT or switching org context:
    1. Query this table for user's role in selected org
    2. Map role to permissions (permission_service.py)
    3. Store in JWT perms field

EXAMPLE:
    user_id=123, organization_id=456, role='admin'
    Permissions: {
        "org:read": true,
        "org:write": true,
        "workspace:create": true,
        "workspace:delete": true,
        "member:invite": true,
        "org:delete": false  # Only owner can delete org
    }
"""
