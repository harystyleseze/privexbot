"""
Pydantic schemas for Organization API requests and responses.

WHY:
- Validate organization creation/update
- Handle membership and role management
- Support multi-tenancy context

PSEUDOCODE:
-----------
from pydantic import BaseModel, UUID4
from datetime import datetime
from typing import Literal

# Organization Roles
OrgRole = Literal["owner", "admin", "member"]
    WHY: Type-safe roles
    OWNER: Full control, can delete org
    ADMIN: Can manage workspaces and members
    MEMBER: Basic access, workspace-dependent permissions

# Create Organization
class OrganizationCreate(BaseModel):
    \"\"\"
    WHY: Validate org creation
    HOW: Creator automatically becomes owner
    \"\"\"
    name: str (min_length=1, max_length=100)
        WHY: Organization display name

# Update Organization
class OrganizationUpdate(BaseModel):
    \"\"\"WHY: Partial updates allowed\"\"\"
    name: str | None

# Organization Response (basic)
class OrganizationResponse(BaseModel):
    \"\"\"
    WHY: Return organization data
    \"\"\"
    id: UUID4
    name: str
    created_by: UUID4 | None
    created_at: datetime
    updated_at: datetime
    member_count: int | None
        WHY: Show how many users in org
    workspace_count: int | None
        WHY: Show how many workspaces

    class Config:
        from_attributes = True

# Organization Member
class OrganizationMemberResponse(BaseModel):
    \"\"\"
    WHY: Show member details in org
    \"\"\"
    user_id: UUID4
    username: str
    email: str | None
    role: OrgRole
    joined_at: datetime
        WHY: When they joined the organization

# Add Member Request
class AddOrganizationMemberRequest(BaseModel):
    \"\"\"
    WHY: Invite user to organization
    HOW: Can use user_id or email
    \"\"\"
    user_id: UUID4 | None
    email: str | None
        WHY: Invite by email if user doesn't exist yet
    role: OrgRole = "member"
        WHY: Default to member, can specify admin

# Update Member Role
class UpdateMemberRoleRequest(BaseModel):
    \"\"\"
    WHY: Change user's role in org
    PERMISSION: Only owner/admin can do this
    \"\"\"
    role: OrgRole

# Organization with Members (detailed)
class OrganizationDetailedResponse(OrganizationResponse):
    \"\"\"
    WHY: Include full member list
    HOW: Used in GET /organizations/{id}
    \"\"\"
    members: list[OrganizationMemberResponse]
    workspaces: list[WorkspaceSummary]
        WHY: Show all workspaces in this org

USAGE:
------
POST /api/v1/organizations
{
    "name": "Acme Corp"
}
-> Creates org, current user becomes owner

POST /api/v1/organizations/{org_id}/members
{
    "email": "user@example.com",
    "role": "admin"
}
-> Invite user to org as admin
"""
