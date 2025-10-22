# Quick Start: Next Steps for Backend Implementation

**Priority**: Organization/Workspace Management (CRITICAL - START HERE)
**Estimated Time**: 1.5 weeks
**Why**: Enables full multi-tenancy functionality

---

## What to Implement First: Organization Management

### File to Create
`src/app/api/v1/routes/org.py`

### Required Endpoints (12 total)

```python
# src/app/api/v1/routes/org.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.db.session import get_db
from app.api.v1.dependencies import get_current_user
from app.services.tenant_service import TenantService
from app.schemas.organization import (
    OrganizationCreate,
    OrganizationUpdate,
    OrganizationResponse,
    OrganizationMemberCreate,
    OrganizationMemberUpdate,
    OrganizationMemberResponse,
)
from app.models.user import User

router = APIRouter(prefix="/orgs", tags=["organizations"])

# 1. Create Organization
@router.post("/", response_model=OrganizationResponse)
async def create_organization(
    org_data: OrganizationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new organization.

    User becomes the organization owner.
    Creates a default workspace automatically.
    """
    tenant_service = TenantService(db)
    organization = await tenant_service.create_organization(
        name=org_data.name,
        owner_id=current_user.id,
        billing_email=org_data.billing_email or current_user.email
    )
    return organization


# 2. List User's Organizations
@router.get("/", response_model=List[OrganizationResponse])
async def list_organizations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all organizations the current user belongs to.

    Returns organizations with user's role in each.
    """
    tenant_service = TenantService(db)
    organizations = await tenant_service.get_user_organizations(current_user.id)
    return organizations


# 3. Get Organization
@router.get("/{org_id}", response_model=OrganizationResponse)
async def get_organization(
    org_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get organization details.

    User must be a member of the organization.
    """
    tenant_service = TenantService(db)

    # Verify access
    if not await tenant_service.user_has_org_access(current_user.id, org_id):
        raise HTTPException(status_code=403, detail="Access denied")

    organization = await tenant_service.get_organization(org_id)
    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")

    return organization


# 4. Update Organization
@router.patch("/{org_id}", response_model=OrganizationResponse)
async def update_organization(
    org_id: UUID,
    org_data: OrganizationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update organization settings.

    Requires 'org:update' permission (admin or owner).
    """
    tenant_service = TenantService(db)

    # Verify permission
    if not await tenant_service.user_has_permission(
        current_user.id, org_id, "org:update"
    ):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    organization = await tenant_service.update_organization(org_id, org_data.dict(exclude_unset=True))
    return organization


# 5. Delete Organization
@router.delete("/{org_id}", status_code=204)
async def delete_organization(
    org_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete organization.

    Requires 'org:delete' permission (owner only).
    Cascades to all workspaces, chatbots, knowledge bases, etc.
    """
    tenant_service = TenantService(db)

    # Verify permission (owner only)
    if not await tenant_service.is_org_owner(current_user.id, org_id):
        raise HTTPException(status_code=403, detail="Only organization owner can delete")

    await tenant_service.delete_organization(org_id)
    return None


# 6. Invite Member
@router.post("/{org_id}/members", response_model=OrganizationMemberResponse)
async def invite_member(
    org_id: UUID,
    member_data: OrganizationMemberCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Invite a user to the organization.

    Requires 'org:invite' permission (admin or owner).
    """
    tenant_service = TenantService(db)

    # Verify permission
    if not await tenant_service.user_has_permission(
        current_user.id, org_id, "org:invite"
    ):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    member = await tenant_service.add_org_member(
        org_id=org_id,
        user_id=member_data.user_id,
        role=member_data.role
    )
    return member


# 7. List Members
@router.get("/{org_id}/members", response_model=List[OrganizationMemberResponse])
async def list_members(
    org_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List organization members.

    User must be a member of the organization.
    """
    tenant_service = TenantService(db)

    # Verify access
    if not await tenant_service.user_has_org_access(current_user.id, org_id):
        raise HTTPException(status_code=403, detail="Access denied")

    members = await tenant_service.get_org_members(org_id)
    return members


# 8. Update Member Role
@router.patch("/{org_id}/members/{user_id}", response_model=OrganizationMemberResponse)
async def update_member_role(
    org_id: UUID,
    user_id: UUID,
    member_data: OrganizationMemberUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update member's role.

    Requires 'org:update_member' permission (admin or owner).
    Cannot change owner's role.
    """
    tenant_service = TenantService(db)

    # Verify permission
    if not await tenant_service.user_has_permission(
        current_user.id, org_id, "org:update_member"
    ):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    # Prevent changing owner's role
    if await tenant_service.is_org_owner(user_id, org_id):
        raise HTTPException(status_code=400, detail="Cannot change organization owner's role")

    member = await tenant_service.update_org_member_role(
        org_id=org_id,
        user_id=user_id,
        role=member_data.role
    )
    return member


# 9. Remove Member
@router.delete("/{org_id}/members/{user_id}", status_code=204)
async def remove_member(
    org_id: UUID,
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Remove member from organization.

    Requires 'org:remove_member' permission (admin or owner).
    Cannot remove the owner.
    """
    tenant_service = TenantService(db)

    # Verify permission
    if not await tenant_service.user_has_permission(
        current_user.id, org_id, "org:remove_member"
    ):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    # Prevent removing owner
    if await tenant_service.is_org_owner(user_id, org_id):
        raise HTTPException(status_code=400, detail="Cannot remove organization owner")

    await tenant_service.remove_org_member(org_id, user_id)
    return None


# 10. Get Billing Info
@router.get("/{org_id}/billing")
async def get_billing_info(
    org_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get organization billing information.

    Requires 'org:billing' permission (owner or admin).
    """
    tenant_service = TenantService(db)

    # Verify permission
    if not await tenant_service.user_has_permission(
        current_user.id, org_id, "org:billing"
    ):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    # TODO: Implement billing info retrieval
    # For now, return stub
    return {
        "subscription_tier": "free",
        "billing_email": "user@example.com",
        "usage": {
            "chatbots": 0,
            "knowledge_bases": 0,
            "messages": 0
        }
    }


# 11. Update Billing Info
@router.patch("/{org_id}/billing")
async def update_billing_info(
    org_id: UUID,
    billing_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update organization billing information.

    Requires 'org:billing' permission (owner only).
    """
    tenant_service = TenantService(db)

    # Verify permission (owner only)
    if not await tenant_service.is_org_owner(current_user.id, org_id):
        raise HTTPException(status_code=403, detail="Only organization owner can update billing")

    # TODO: Implement billing update
    # For now, return stub
    return {"message": "Billing information updated"}
```

---

## Required Service Methods

Add these methods to `src/app/services/tenant_service.py`:

```python
# Add to TenantService class

async def create_organization(
    self,
    name: str,
    owner_id: UUID,
    billing_email: str
) -> Organization:
    """
    Create organization with owner membership and default workspace.
    """
    # Create organization
    org = Organization(
        name=name,
        billing_email=billing_email,
        subscription_tier="free"
    )
    self.db.add(org)
    self.db.flush()

    # Add owner as member
    owner_member = OrganizationMember(
        organization_id=org.id,
        user_id=owner_id,
        role="owner"
    )
    self.db.add(owner_member)

    # Create default workspace
    default_workspace = Workspace(
        name="Default Workspace",
        organization_id=org.id
    )
    self.db.add(default_workspace)
    self.db.flush()

    # Add owner to default workspace
    ws_member = WorkspaceMember(
        workspace_id=default_workspace.id,
        user_id=owner_id,
        role="admin"
    )
    self.db.add(ws_member)

    self.db.commit()
    self.db.refresh(org)

    return org


async def get_user_organizations(self, user_id: UUID) -> List[Organization]:
    """
    Get all organizations user belongs to.
    """
    return (
        self.db.query(Organization)
        .join(OrganizationMember)
        .filter(OrganizationMember.user_id == user_id)
        .all()
    )


async def user_has_org_access(self, user_id: UUID, org_id: UUID) -> bool:
    """
    Check if user is a member of the organization.
    """
    return (
        self.db.query(OrganizationMember)
        .filter(
            OrganizationMember.user_id == user_id,
            OrganizationMember.organization_id == org_id
        )
        .first() is not None
    )


async def is_org_owner(self, user_id: UUID, org_id: UUID) -> bool:
    """
    Check if user is the organization owner.
    """
    member = (
        self.db.query(OrganizationMember)
        .filter(
            OrganizationMember.user_id == user_id,
            OrganizationMember.organization_id == org_id
        )
        .first()
    )
    return member and member.role == "owner"


async def add_org_member(
    self,
    org_id: UUID,
    user_id: UUID,
    role: str
) -> OrganizationMember:
    """
    Add member to organization.
    """
    # Check if already member
    existing = (
        self.db.query(OrganizationMember)
        .filter(
            OrganizationMember.organization_id == org_id,
            OrganizationMember.user_id == user_id
        )
        .first()
    )
    if existing:
        raise ValueError("User is already a member")

    member = OrganizationMember(
        organization_id=org_id,
        user_id=user_id,
        role=role
    )
    self.db.add(member)
    self.db.commit()
    self.db.refresh(member)

    return member


async def get_org_members(self, org_id: UUID) -> List[OrganizationMember]:
    """
    Get all organization members.
    """
    return (
        self.db.query(OrganizationMember)
        .filter(OrganizationMember.organization_id == org_id)
        .all()
    )


async def update_org_member_role(
    self,
    org_id: UUID,
    user_id: UUID,
    role: str
) -> OrganizationMember:
    """
    Update member's role.
    """
    member = (
        self.db.query(OrganizationMember)
        .filter(
            OrganizationMember.organization_id == org_id,
            OrganizationMember.user_id == user_id
        )
        .first()
    )
    if not member:
        raise ValueError("Member not found")

    member.role = role
    self.db.commit()
    self.db.refresh(member)

    return member


async def remove_org_member(self, org_id: UUID, user_id: UUID):
    """
    Remove member from organization.
    """
    member = (
        self.db.query(OrganizationMember)
        .filter(
            OrganizationMember.organization_id == org_id,
            OrganizationMember.user_id == user_id
        )
        .first()
    )
    if member:
        self.db.delete(member)
        self.db.commit()
```

---

## Required Schemas

Create `src/app/schemas/organization.py`:

```python
from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
from datetime import datetime

# Organization Schemas
class OrganizationCreate(BaseModel):
    name: str
    billing_email: Optional[EmailStr] = None


class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    billing_email: Optional[EmailStr] = None
    subscription_tier: Optional[str] = None


class OrganizationResponse(BaseModel):
    id: UUID
    name: str
    billing_email: str
    subscription_tier: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Organization Member Schemas
class OrganizationMemberCreate(BaseModel):
    user_id: UUID
    role: str  # "owner", "admin", "member"


class OrganizationMemberUpdate(BaseModel):
    role: str


class OrganizationMemberResponse(BaseModel):
    id: UUID
    organization_id: UUID
    user_id: UUID
    role: str
    created_at: datetime

    class Config:
        from_attributes = True
```

---

## Register Routes

Update `src/app/main.py`:

```python
from app.api.v1.routes import org, workspace  # Add these imports

# Add to route registration
app.include_router(org.router, prefix="/api/v1")
app.include_router(workspace.router, prefix="/api/v1")
```

---

## Testing

Create `src/app/tests/test_org_management.py`:

```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.tests.conftest import test_user, test_db

client = TestClient(app)


def test_create_organization(test_user, test_db):
    """Test creating an organization."""
    response = client.post(
        "/api/v1/orgs/",
        json={"name": "Test Org", "billing_email": "billing@test.com"},
        headers={"Authorization": f"Bearer {test_user['access_token']}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Org"
    assert data["billing_email"] == "billing@test.com"


def test_list_organizations(test_user, test_db):
    """Test listing user's organizations."""
    response = client.get(
        "/api/v1/orgs/",
        headers={"Authorization": f"Bearer {test_user['access_token']}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1  # At least the default org


def test_invite_member(test_user, test_db):
    """Test inviting a member to organization."""
    # Create second user
    second_user = client.post(
        "/api/v1/auth/email/signup",
        json={
            "username": "testuser2",
            "email": "test2@example.com",
            "password": "Test1234!"
        }
    ).json()

    # Get org ID
    org = client.get(
        "/api/v1/orgs/",
        headers={"Authorization": f"Bearer {test_user['access_token']}"}
    ).json()[0]

    # Invite member
    response = client.post(
        f"/api/v1/orgs/{org['id']}/members",
        json={"user_id": second_user["user"]["id"], "role": "member"},
        headers={"Authorization": f"Bearer {test_user['access_token']}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "member"


def test_unauthorized_access(test_user, test_db):
    """Test that unauthorized users cannot access organizations."""
    # Create second user
    second_user_response = client.post(
        "/api/v1/auth/email/signup",
        json={
            "username": "testuser2",
            "email": "test2@example.com",
            "password": "Test1234!"
        }
    )
    second_user_token = second_user_response.json()["access_token"]

    # Get first user's org
    org = client.get(
        "/api/v1/orgs/",
        headers={"Authorization": f"Bearer {test_user['access_token']}"}
    ).json()[0]

    # Try to access with second user's token
    response = client.get(
        f"/api/v1/orgs/{org['id']}",
        headers={"Authorization": f"Bearer {second_user_token}"}
    )
    assert response.status_code == 403
```

---

## Next: Workspace Management

After completing organization management, implement workspace management following the same pattern:

1. Create `src/app/api/v1/routes/workspace.py`
2. Add service methods to `TenantService`
3. Create workspace schemas
4. Write tests

**Estimated Time**: 3 days

---

## Then: Context Switching

Add context switching endpoint to `src/app/api/v1/routes/auth.py`:

```python
@router.post("/switch-context", response_model=Token)
async def switch_context(
    context_data: ContextSwitch,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Switch user's organization/workspace context.

    Issues new JWT with updated context.
    """
    tenant_service = TenantService(db)

    # Verify user has access to target org/workspace
    if not await tenant_service.user_has_workspace_access(
        current_user.id,
        context_data.workspace_id
    ):
        raise HTTPException(status_code=403, detail="Access denied")

    # Get permissions for new context
    permissions = await permission_service.get_user_permissions(
        user_id=current_user.id,
        org_id=context_data.org_id,
        workspace_id=context_data.workspace_id
    )

    # Generate new JWT with updated context
    access_token = create_access_token(
        data={
            "sub": str(current_user.id),
            "org_id": str(context_data.org_id),
            "workspace_id": str(context_data.workspace_id),
            "permissions": permissions
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": current_user
    }
```

**Estimated Time**: 4 hours

---

## Summary

**Total Estimated Time for Multi-Tenancy**: 1.5 weeks

**Deliverables**:
- [x] 12 organization endpoints
- [x] 10 workspace endpoints
- [x] 1 context switching endpoint
- [x] Service layer methods
- [x] Pydantic schemas
- [x] Comprehensive tests

**After This**:
- ✅ Multi-tenancy fully functional
- ✅ Users can manage teams
- ✅ Users can switch contexts
- ✅ Authorization middleware complete

**Then Move To**: Inference service implementation (Week 3)
