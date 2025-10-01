"""
Organization model - Top-level tenant entity.

WHY:
- Multi-tenancy: Isolate data between different companies/teams
- Top level in hierarchy: Organization -> Workspace -> Chatbot
- One user can belong to multiple organizations

HOW:
- Each organization is a separate tenant
- Users join organizations via OrganizationMember with roles
- Organizations contain workspaces which contain chatbots

PSEUDOCODE:
-----------
class Organization(Base):
    __tablename__ = "organizations"

    # Fields
    id: UUID (primary key, auto-generated)
        WHY: Unique identifier for this organization
        HOW: Used in JWT as org_id for tenant context

    name: str (organization name, required)
        WHY: Human-readable organization name
        EXAMPLE: "Acme Corp", "Engineering Team"

    created_by: UUID (foreign key -> users.id, nullable)
        WHY: Track who created this organization (usually becomes owner)
        HOW: First user to create org gets 'owner' role in OrganizationMember

    created_at: datetime (auto-set on creation)
    updated_at: datetime (auto-update on modification)

    # Relationships
    creator: User (many-to-one)
        WHY: Reference to the user who created this org

    members: list[OrganizationMember] (one-to-many, cascade delete)
        WHY: All users who belong to this organization
        HOW: When org deleted, all memberships are deleted

    workspaces: list[Workspace] (one-to-many, cascade delete)
        WHY: Subdivisions within this organization
        HOW: When org deleted, all workspaces (and their chatbots) are deleted

TENANT ISOLATION:
-----------------
WHY: Ensure Organization A cannot access Organization B's data
HOW: All queries must filter by org_id from JWT
EXAMPLE:
    # Get chatbots for current org
    chatbots = db.query(Chatbot)
        .join(Workspace)
        .join(Organization)
        .filter(Organization.id == current_user.org_id)
        .all()
"""
