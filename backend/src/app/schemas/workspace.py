"""
Pydantic schemas for Workspace API requests and responses.

WHY:
- Validate workspace operations within organizations
- Handle workspace-level permissions
- Support fine-grained access control

PSEUDOCODE:
-----------
from pydantic import BaseModel, UUID4
from datetime import datetime
from typing import Literal

# Workspace Roles
WorkspaceRole = Literal["admin", "editor", "viewer"]
    WHY: Type-safe workspace permissions
    ADMIN: Full workspace control (manage members, chatbots)
    EDITOR: Can create/edit chatbots, cannot manage members
    VIEWER: Read-only access

# Create Workspace
class WorkspaceCreate(BaseModel):
    \"\"\"
    WHY: Create workspace within organization
    HOW: Must have org context in JWT
    \"\"\"
    name: str (min_length=1, max_length=100)
    organization_id: UUID4
        WHY: REQUIRED - link to parent organization
        VALIDATION: User must be member of this org

# Update Workspace
class WorkspaceUpdate(BaseModel):
    \"\"\"WHY: Partial updates\"\"\"
    name: str | None

# Workspace Response (basic)
class WorkspaceResponse(BaseModel):
    \"\"\"
    WHY: Return workspace data
    \"\"\"
    id: UUID4
    name: str
    organization_id: UUID4
    organization_name: str
        WHY: Display parent org name
    created_by: UUID4 | None
    created_at: datetime
    updated_at: datetime
    chatbot_count: int | None
        WHY: Number of bots in this workspace
    member_count: int | None

    class Config:
        from_attributes = True

# Workspace Member
class WorkspaceMemberResponse(BaseModel):
    \"\"\"
    WHY: Show member details in workspace
    \"\"\"
    user_id: UUID4
    username: str
    email: str | None
    role: WorkspaceRole
    joined_at: datetime

# Add Workspace Member
class AddWorkspaceMemberRequest(BaseModel):
    \"\"\"
    WHY: Add user to workspace
    VALIDATION: User must already be organization member
    \"\"\"
    user_id: UUID4
    role: WorkspaceRole = "viewer"
        WHY: Default to least privilege

# Update Workspace Member Role
class UpdateWorkspaceMemberRoleRequest(BaseModel):
    \"\"\"
    WHY: Change user's workspace role
    PERMISSION: Workspace admin or org admin/owner
    \"\"\"
    role: WorkspaceRole

# Workspace Detailed Response
class WorkspaceDetailedResponse(WorkspaceResponse):
    \"\"\"
    WHY: Include members and chatbots
    HOW: Used in GET /workspaces/{id}
    \"\"\"
    members: list[WorkspaceMemberResponse]
    chatbots: list[ChatbotSummary]
        WHY: Quick overview of bots in workspace

# Workspace Summary (for lists)
class WorkspaceSummary(BaseModel):
    \"\"\"
    WHY: Lightweight version for lists
    \"\"\"
    id: UUID4
    name: str
    chatbot_count: int
    user_role: WorkspaceRole | None
        WHY: Show current user's role in this workspace

PERMISSION FLOW:
----------------
When user accesses workspace:
1. Check user is org member (from org_id in JWT)
2. Check user is workspace member OR org admin/owner
3. If workspace member, check role for specific permission
4. If org admin/owner, grant admin-level access

USAGE:
------
POST /api/v1/workspaces
{
    "name": "Engineering Team",
    "organization_id": "uuid"
}
-> Creates workspace in org

POST /api/v1/workspaces/{ws_id}/members
{
    "user_id": "uuid",
    "role": "editor"
}
-> Add user to workspace as editor
"""
