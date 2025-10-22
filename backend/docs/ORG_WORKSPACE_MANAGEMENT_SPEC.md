# Organization & Workspace Management - Complete Specification

**Version**: 1.0.0
**Status**: Implementation Ready
**Priority**: CRITICAL - Enables Full Multi-Tenancy
**Last Updated**: 2025-10-21

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Database Schema](#database-schema)
4. [Subscription Tiers](#subscription-tiers)
5. [API Endpoints Specification](#api-endpoints-specification)
6. [Service Layer Architecture](#service-layer-architecture)
7. [Error Handling & Edge Cases](#error-handling--edge-cases)
8. [Testing Strategy](#testing-strategy)
9. [Implementation Roadmap](#implementation-roadmap)
10. [Security Considerations](#security-considerations)

---

## Executive Summary

### Purpose
Implement complete multi-tenancy management system enabling:
- Organizations as top-level tenant entities
- Workspaces as subdivisions within organizations
- Role-based access control (RBAC) at both org and workspace levels
- Subscription tier management with feature gating
- Context switching for multi-org users

### Key Deliverables
1. **4 Database Models**: Organization, OrganizationMember, Workspace, WorkspaceMember
2. **23 API Endpoints**: Full CRUD + membership management + context switching
3. **1 Service Module**: TenantService with all business logic
4. **Comprehensive Tests**: 60+ test cases covering all scenarios

### Success Criteria
- ✅ Users can create and manage multiple organizations
- ✅ Users can belong to multiple organizations with different roles
- ✅ Organizations can have multiple workspaces
- ✅ Subscription tiers properly enforce resource limits
- ✅ Context switching works seamlessly
- ✅ Complete tenant isolation (no cross-org data leakage)

---

## Architecture Overview

### Multi-Tenancy Hierarchy

```
User (can belong to multiple orgs)
  │
  ├─► OrganizationMember (role: owner/admin/member)
  │     │
  │     └─► Organization (top-level tenant)
  │           │  - name
  │           │  - billing_email
  │           │  - subscription_tier (free/starter/pro/enterprise)
  │           │  - subscription_status (active/cancelled/trial)
  │           │
  │           ├─► Workspace (subdivision)
  │           │     │  - name
  │           │     │  - settings (JSONB)
  │           │     │
  │           │     ├─► WorkspaceMember (role: admin/editor/viewer)
  │           │     │
  │           │     └─► Resources
  │           │           ├─► Chatbot
  │           │           ├─► Chatflow
  │           │           ├─► KnowledgeBase
  │           │           ├─► Lead
  │           │           └─► APIKey
  │           │
  │           └─► OrganizationMember (all members)
  │
  └─► (repeats for each organization)
```

### Access Control Flow

```
User Request → JWT (contains: user_id, org_id, ws_id, role, perms)
              ↓
         Authorization Middleware
              ↓
         Verify Tenant Access
              ├─► Check organization membership
              ├─► Check workspace membership (if ws_id)
              ├─► Verify role/permissions
              └─► Return authorized user context
              ↓
         Service Layer (business logic)
              ↓
         Database (filtered by tenant context)
```

### JWT Token Structure

```json
{
  "sub": "user-uuid",              // User ID
  "org_id": "org-uuid",            // Current organization
  "ws_id": "workspace-uuid",       // Current workspace (optional)
  "org_role": "admin",             // Role in current org
  "ws_role": "editor",             // Role in current workspace
  "perms": [                       // Computed permissions
    "org:read",
    "org:write",
    "workspace:create",
    "chatbot:create",
    "chatbot:edit"
  ],
  "subscription_tier": "pro",      // Organization's tier
  "exp": 1234567890,               // Expiration
  "iat": 1234567800                // Issued at
}
```

---

## Database Schema

### 1. Organization Model

```python
"""
Organization - Top-level tenant entity

WHY:
- Multi-tenancy isolation
- Subscription and billing management
- Top of the tenant hierarchy

RELATIONSHIPS:
- One Organization has many OrganizationMembers
- One Organization has many Workspaces
- Workspaces cascade delete when org deleted
"""

Table: organizations

Columns:
  id                    UUID            PRIMARY KEY DEFAULT uuid_generate_v4()
  name                  VARCHAR(255)    NOT NULL
  billing_email         VARCHAR(255)    NOT NULL
  subscription_tier     VARCHAR(50)     NOT NULL DEFAULT 'free'
                                        CHECK (subscription_tier IN ('free', 'starter', 'pro', 'enterprise'))
  subscription_status   VARCHAR(50)     NOT NULL DEFAULT 'trial'
                                        CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'suspended'))
  trial_ends_at         TIMESTAMP       NULL (trial expiration date)
  subscription_starts_at TIMESTAMP      NULL (paid subscription start)
  subscription_ends_at  TIMESTAMP       NULL (for cancelled subscriptions)
  settings              JSONB           NOT NULL DEFAULT '{}'
                                        -- Org-level settings (branding, defaults, etc.)
  created_by            UUID            FOREIGN KEY -> users.id ON DELETE SET NULL
  created_at            TIMESTAMP       NOT NULL DEFAULT NOW()
  updated_at            TIMESTAMP       NOT NULL DEFAULT NOW()

Indexes:
  - idx_org_billing_email ON billing_email
  - idx_org_subscription_tier ON subscription_tier
  - idx_org_created_by ON created_by

Settings JSONB Structure:
{
  "branding": {
    "logo_url": "https://...",
    "primary_color": "#3B82F6",
    "company_website": "https://..."
  },
  "defaults": {
    "default_model": "secret-ai-v1",
    "default_temperature": 0.7
  },
  "features": {
    "analytics_enabled": true,
    "integrations_enabled": true
  }
}
```

### 2. OrganizationMember Model

```python
"""
OrganizationMember - User membership in organization with role

WHY:
- Many-to-many relationship between users and organizations
- Role-based access control at org level
- One user can belong to multiple orgs

ROLES:
- owner: Full control, can delete org, manage billing
- admin: Can manage workspaces and members (except owners)
- member: Basic access, workspace-dependent permissions
"""

Table: organization_members

Columns:
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4()
  user_id          UUID        NOT NULL FOREIGN KEY -> users.id ON DELETE CASCADE
  organization_id  UUID        NOT NULL FOREIGN KEY -> organizations.id ON DELETE CASCADE
  role             VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'admin', 'member'))
  invited_by       UUID        NULL FOREIGN KEY -> users.id ON DELETE SET NULL
                               -- Who invited this user
  joined_at        TIMESTAMP   NOT NULL DEFAULT NOW()
  created_at       TIMESTAMP   NOT NULL DEFAULT NOW()
  updated_at       TIMESTAMP   NOT NULL DEFAULT NOW()

Constraints:
  - UNIQUE (user_id, organization_id)  -- User can only have one role per org

Indexes:
  - idx_orgmember_user ON user_id
  - idx_orgmember_org ON organization_id
  - idx_orgmember_role ON role

Cascade Behavior:
  - When user deleted → membership deleted
  - When organization deleted → all memberships deleted
```

### 3. Workspace Model

```python
"""
Workspace - Subdivision within an organization

WHY:
- Organize resources by department/project/team
- Finer-grained access control than org level
- Isolate chatbots/chatflows by use case

EXAMPLES:
- "Customer Support" workspace (support chatbots)
- "Marketing" workspace (lead generation chatbots)
- "Sales" workspace (sales qualification chatbots)
"""

Table: workspaces

Columns:
  id               UUID         PRIMARY KEY DEFAULT uuid_generate_v4()
  organization_id  UUID         NOT NULL FOREIGN KEY -> organizations.id ON DELETE CASCADE
  name             VARCHAR(255) NOT NULL
  description      TEXT         NULL
  settings         JSONB        NOT NULL DEFAULT '{}'
                                -- Workspace-specific settings
  is_default       BOOLEAN      NOT NULL DEFAULT FALSE
                                -- Each org has one default workspace
  created_by       UUID         NULL FOREIGN KEY -> users.id ON DELETE SET NULL
  created_at       TIMESTAMP    NOT NULL DEFAULT NOW()
  updated_at       TIMESTAMP    NOT NULL DEFAULT NOW()

Constraints:
  - UNIQUE (organization_id, name)  -- Workspace names unique within org

Indexes:
  - idx_workspace_org ON organization_id
  - idx_workspace_default ON (organization_id, is_default) WHERE is_default = TRUE
  - idx_workspace_created_by ON created_by

Settings JSONB Structure:
{
  "theme": {
    "color": "#3B82F6",
    "icon": "briefcase"
  },
  "defaults": {
    "chatbot_model": "secret-ai-v1",
    "enable_analytics": true
  },
  "integrations": {
    "slack_channel": "#customer-support",
    "webhook_url": "https://..."
  }
}

Cascade Behavior:
  - When organization deleted → all workspaces deleted
  - When workspace deleted → all resources (chatbots, chatflows, KBs) deleted
```

### 4. WorkspaceMember Model

```python
"""
WorkspaceMember - User membership in workspace with role

WHY:
- Many-to-many relationship between users and workspaces
- Role-based access control at workspace level
- Finer permissions than org level

ROLES:
- admin: Full workspace control (manage members, edit/delete resources)
- editor: Can create and edit resources, cannot manage members
- viewer: Read-only access to resources
"""

Table: workspace_members

Columns:
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4()
  user_id       UUID        NOT NULL FOREIGN KEY -> users.id ON DELETE CASCADE
  workspace_id  UUID        NOT NULL FOREIGN KEY -> workspaces.id ON DELETE CASCADE
  role          VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'editor', 'viewer'))
  invited_by    UUID        NULL FOREIGN KEY -> users.id ON DELETE SET NULL
  joined_at     TIMESTAMP   NOT NULL DEFAULT NOW()
  created_at    TIMESTAMP   NOT NULL DEFAULT NOW()
  updated_at    TIMESTAMP   NOT NULL DEFAULT NOW()

Constraints:
  - UNIQUE (user_id, workspace_id)  -- User can only have one role per workspace

Indexes:
  - idx_wsmember_user ON user_id
  - idx_wsmember_workspace ON workspace_id
  - idx_wsmember_role ON role

Permission Hierarchy (admin > editor > viewer):
  Viewer:  Read chatbots, chatflows, KBs, analytics
  Editor:  Viewer + Create/Edit/Delete chatbots, chatflows, KBs
  Admin:   Editor + Manage workspace members, workspace settings

Cascade Behavior:
  - When user deleted → membership deleted
  - When workspace deleted → all memberships deleted
```

### Database Migration Script

```sql
-- Create organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    billing_email VARCHAR(255) NOT NULL,
    subscription_tier VARCHAR(50) NOT NULL DEFAULT 'free'
        CHECK (subscription_tier IN ('free', 'starter', 'pro', 'enterprise')),
    subscription_status VARCHAR(50) NOT NULL DEFAULT 'trial'
        CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'suspended')),
    trial_ends_at TIMESTAMP NULL,
    subscription_starts_at TIMESTAMP NULL,
    subscription_ends_at TIMESTAMP NULL,
    settings JSONB NOT NULL DEFAULT '{}',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_org_billing_email ON organizations(billing_email);
CREATE INDEX idx_org_subscription_tier ON organizations(subscription_tier);
CREATE INDEX idx_org_created_by ON organizations(created_by);

-- Create organization_members table
CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, organization_id)
);

CREATE INDEX idx_orgmember_user ON organization_members(user_id);
CREATE INDEX idx_orgmember_org ON organization_members(organization_id);
CREATE INDEX idx_orgmember_role ON organization_members(role);

-- Create workspaces table
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    settings JSONB NOT NULL DEFAULT '{}',
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, name)
);

CREATE INDEX idx_workspace_org ON workspaces(organization_id);
CREATE UNIQUE INDEX idx_workspace_default ON workspaces(organization_id, is_default)
    WHERE is_default = TRUE;
CREATE INDEX idx_workspace_created_by ON workspaces(created_by);

-- Create workspace_members table
CREATE TABLE workspace_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, workspace_id)
);

CREATE INDEX idx_wsmember_user ON workspace_members(user_id);
CREATE INDEX idx_wsmember_workspace ON workspace_members(workspace_id);
CREATE INDEX idx_wsmember_role ON workspace_members(role);
```

---

## Subscription Tiers

### Tier Definitions

```python
"""
Subscription Tiers - Feature gating and resource limits

WHY: Monetization and resource management
HOW: Enforce limits in service layer before operations
"""

SUBSCRIPTION_TIERS = {
    "free": {
        "display_name": "Free",
        "price_monthly": 0,
        "limits": {
            "workspaces_per_org": 1,
            "chatbots_per_workspace": 2,
            "chatflows_per_workspace": 0,  # Pro feature
            "knowledge_bases_per_workspace": 1,
            "documents_per_kb": 10,
            "total_document_size_mb": 10,
            "messages_per_month": 100,
            "team_members": 2,
            "api_rate_limit_per_minute": 10,
        },
        "features": {
            "chatbot": True,
            "chatflow": False,  # Pro+
            "knowledge_base": True,
            "lead_capture": True,
            "analytics_basic": True,
            "analytics_advanced": False,  # Pro+
            "custom_branding": False,  # Starter+
            "api_access": False,  # Starter+
            "integrations_basic": True,  # Slack, Discord
            "integrations_advanced": False,  # Webhook, Zapier, etc.
            "priority_support": False,  # Pro+
            "sso": False,  # Enterprise
            "dedicated_instance": False,  # Enterprise
        }
    },

    "starter": {
        "display_name": "Starter",
        "price_monthly": 29,
        "limits": {
            "workspaces_per_org": 3,
            "chatbots_per_workspace": 10,
            "chatflows_per_workspace": 2,
            "knowledge_bases_per_workspace": 5,
            "documents_per_kb": 100,
            "total_document_size_mb": 100,
            "messages_per_month": 2000,
            "team_members": 5,
            "api_rate_limit_per_minute": 60,
        },
        "features": {
            "chatbot": True,
            "chatflow": True,
            "knowledge_base": True,
            "lead_capture": True,
            "analytics_basic": True,
            "analytics_advanced": False,  # Pro+
            "custom_branding": True,
            "api_access": True,
            "integrations_basic": True,
            "integrations_advanced": True,
            "priority_support": False,  # Pro+
            "sso": False,  # Enterprise
            "dedicated_instance": False,  # Enterprise
        }
    },

    "pro": {
        "display_name": "Professional",
        "price_monthly": 99,
        "limits": {
            "workspaces_per_org": 10,
            "chatbots_per_workspace": 50,
            "chatflows_per_workspace": 20,
            "knowledge_bases_per_workspace": 20,
            "documents_per_kb": 1000,
            "total_document_size_mb": 1000,
            "messages_per_month": 10000,
            "team_members": 20,
            "api_rate_limit_per_minute": 300,
        },
        "features": {
            "chatbot": True,
            "chatflow": True,
            "knowledge_base": True,
            "lead_capture": True,
            "analytics_basic": True,
            "analytics_advanced": True,
            "custom_branding": True,
            "api_access": True,
            "integrations_basic": True,
            "integrations_advanced": True,
            "priority_support": True,
            "sso": False,  # Enterprise
            "dedicated_instance": False,  # Enterprise
        }
    },

    "enterprise": {
        "display_name": "Enterprise",
        "price_monthly": "custom",  # Contact sales
        "limits": {
            "workspaces_per_org": -1,  # Unlimited
            "chatbots_per_workspace": -1,
            "chatflows_per_workspace": -1,
            "knowledge_bases_per_workspace": -1,
            "documents_per_kb": -1,
            "total_document_size_mb": -1,
            "messages_per_month": -1,
            "team_members": -1,
            "api_rate_limit_per_minute": 1000,
        },
        "features": {
            "chatbot": True,
            "chatflow": True,
            "knowledge_base": True,
            "lead_capture": True,
            "analytics_basic": True,
            "analytics_advanced": True,
            "custom_branding": True,
            "api_access": True,
            "integrations_basic": True,
            "integrations_advanced": True,
            "priority_support": True,
            "sso": True,
            "dedicated_instance": True,
        }
    }
}
```

### Subscription Tier Enforcement

```python
"""
HOW TO ENFORCE TIER LIMITS:

1. Before creating resource:
   - Get organization's subscription tier
   - Check current count vs limit
   - Raise error if limit exceeded

2. Feature checks:
   - Check if tier has feature enabled
   - Return error if feature not available
"""

# Example: Check workspace limit
def check_workspace_limit(org: Organization):
    tier_limits = SUBSCRIPTION_TIERS[org.subscription_tier]["limits"]
    max_workspaces = tier_limits["workspaces_per_org"]

    if max_workspaces == -1:  # Unlimited
        return True

    current_count = len(org.workspaces)

    if current_count >= max_workspaces:
        raise SubscriptionLimitError(
            f"Workspace limit reached ({max_workspaces}) for {org.subscription_tier} tier. "
            f"Upgrade to create more workspaces."
        )

    return True

# Example: Check feature access
def check_feature_access(org: Organization, feature: str):
    tier_features = SUBSCRIPTION_TIERS[org.subscription_tier]["features"]

    if not tier_features.get(feature, False):
        raise FeatureNotAvailableError(
            f"Feature '{feature}' not available in {org.subscription_tier} tier. "
            f"Please upgrade to access this feature."
        )

    return True
```

---

## API Endpoints Specification

### Organization Management (12 Endpoints)

#### 1. Create Organization

```http
POST /api/v1/organizations
Authorization: Bearer <token>

Request Body:
{
  "name": "Acme Corporation",
  "billing_email": "billing@acme.com"
}

Response: 201 Created
{
  "id": "uuid",
  "name": "Acme Corporation",
  "billing_email": "billing@acme.com",
  "subscription_tier": "free",  // Default to free trial
  "subscription_status": "trial",
  "trial_ends_at": "2025-11-20T00:00:00Z",  // 30 days from now
  "settings": {},
  "created_by": "user-uuid",
  "created_at": "2025-10-21T12:00:00Z",
  "updated_at": "2025-10-21T12:00:00Z",
  "member_count": 1,
  "workspace_count": 1,  // Default workspace created automatically
  "my_role": "owner"
}

Business Logic:
1. Create organization
2. Add creator as owner (OrganizationMember with role='owner')
3. Create default workspace ("General")
4. Add creator as workspace admin
5. Set trial period (30 days)
6. Return org with new JWT containing org_id

Errors:
- 400: Invalid data (name too long, invalid email)
- 401: Not authenticated
- 422: Validation errors
```

#### 2. List My Organizations

```http
GET /api/v1/organizations
Authorization: Bearer <token>

Query Parameters:
- skip (optional, default: 0)
- limit (optional, default: 50)

Response: 200 OK
{
  "items": [
    {
      "id": "uuid",
      "name": "Acme Corporation",
      "billing_email": "billing@acme.com",
      "subscription_tier": "pro",
      "subscription_status": "active",
      "trial_ends_at": null,
      "subscription_starts_at": "2025-09-01T00:00:00Z",
      "subscription_ends_at": null,
      "settings": {...},
      "created_at": "2025-01-15T12:00:00Z",
      "updated_at": "2025-10-20T15:30:00Z",
      "member_count": 15,
      "workspace_count": 5,
      "my_role": "owner"
    },
    {
      "id": "uuid-2",
      "name": "Freelance Projects",
      "billing_email": "me@freelance.com",
      "subscription_tier": "free",
      "subscription_status": "trial",
      "trial_ends_at": "2025-11-15T00:00:00Z",
      "settings": {...},
      "created_at": "2025-10-15T10:00:00Z",
      "updated_at": "2025-10-15T10:00:00Z",
      "member_count": 1,
      "workspace_count": 1,
      "my_role": "owner"
    }
  ],
  "total": 2,
  "skip": 0,
  "limit": 50
}

Business Logic:
1. Query OrganizationMember where user_id = current_user
2. Join with Organization
3. Include user's role in each org
4. Order by created_at DESC

Errors:
- 401: Not authenticated
```

#### 3. Get Organization Details

```http
GET /api/v1/organizations/{org_id}
Authorization: Bearer <token>

Response: 200 OK
{
  "id": "uuid",
  "name": "Acme Corporation",
  "billing_email": "billing@acme.com",
  "subscription_tier": "pro",
  "subscription_status": "active",
  "trial_ends_at": null,
  "subscription_starts_at": "2025-09-01T00:00:00Z",
  "subscription_ends_at": null,
  "settings": {
    "branding": {
      "logo_url": "https://...",
      "primary_color": "#3B82F6"
    }
  },
  "created_by": "user-uuid",
  "created_at": "2025-01-15T12:00:00Z",
  "updated_at": "2025-10-20T15:30:00Z",
  "member_count": 15,
  "workspace_count": 5,
  "my_role": "owner",
  "members": [  // Only if user is owner/admin
    {
      "user_id": "uuid",
      "username": "john_doe",
      "email": "john@acme.com",
      "role": "owner",
      "joined_at": "2025-01-15T12:00:00Z"
    },
    {
      "user_id": "uuid-2",
      "username": "jane_smith",
      "email": "jane@acme.com",
      "role": "admin",
      "joined_at": "2025-02-01T09:00:00Z"
    }
  ],
  "workspaces": [  // Summary only
    {
      "id": "ws-uuid",
      "name": "Customer Support",
      "description": "Customer support chatbots",
      "chatbot_count": 5,
      "chatflow_count": 2,
      "member_count": 8,
      "my_role": "admin"
    }
  ]
}

Business Logic:
1. Verify user is member of org
2. Return org details
3. Include members list if user is owner/admin
4. Include workspace summaries
5. Include user's role in org and each workspace

Errors:
- 401: Not authenticated
- 403: Not a member of this organization
- 404: Organization not found
```

#### 4. Update Organization

```http
PATCH /api/v1/organizations/{org_id}
Authorization: Bearer <token>

Request Body (all fields optional):
{
  "name": "Updated Name",
  "billing_email": "new-billing@acme.com",
  "settings": {
    "branding": {
      "logo_url": "https://new-logo.png",
      "primary_color": "#FF6B6B"
    }
  }
}

Response: 200 OK
{
  "id": "uuid",
  "name": "Updated Name",
  "billing_email": "new-billing@acme.com",
  // ... full org object
}

Business Logic:
1. Verify user is owner or admin
2. Update allowed fields
3. Cannot update subscription_tier (use separate endpoint)
4. Return updated org

Errors:
- 401: Not authenticated
- 403: Not owner/admin of this organization
- 404: Organization not found
- 422: Validation errors
```

#### 5. Delete Organization

```http
DELETE /api/v1/organizations/{org_id}
Authorization: Bearer <token>

Response: 200 OK
{
  "status": "deleted",
  "message": "Organization and all associated data have been deleted"
}

Business Logic:
1. Verify user is owner (only owners can delete)
2. Cancel subscription (if active)
3. Delete organization (cascades to workspaces, members, all resources)
4. Return success

WARNING: This is a destructive operation!
- All workspaces deleted
- All chatbots, chatflows, knowledge bases deleted
- All team members removed
- Cannot be undone

Errors:
- 401: Not authenticated
- 403: Not owner of this organization (only owners can delete)
- 404: Organization not found
```

#### 6. Invite Member to Organization

```http
POST /api/v1/organizations/{org_id}/members
Authorization: Bearer <token>

Request Body:
{
  "email": "newmember@example.com",  // Email to invite
  "role": "member"  // owner, admin, or member
}

Response: 201 Created
{
  "id": "membership-uuid",
  "user_id": "user-uuid",  // Created if email doesn't exist
  "organization_id": "org-uuid",
  "role": "member",
  "invited_by": "inviter-user-uuid",
  "joined_at": "2025-10-21T12:00:00Z",
  "user": {
    "id": "user-uuid",
    "username": "newmember",
    "email": "newmember@example.com"
  }
}

Business Logic:
1. Verify current user is owner/admin
2. Check if user with email exists
   - If yes: Create membership
   - If no: Create user account + send invitation email + create membership
3. Check subscription tier member limit
4. Only owners can invite other owners
5. Send invitation email with acceptance link
6. Return membership

Errors:
- 400: User already a member
- 401: Not authenticated
- 403: Not owner/admin, or trying to create owner without being owner
- 404: Organization not found
- 409: Subscription limit reached
```

#### 7. List Organization Members

```http
GET /api/v1/organizations/{org_id}/members
Authorization: Bearer <token>

Query Parameters:
- role (optional): Filter by role (owner, admin, member)
- skip (optional, default: 0)
- limit (optional, default: 50)

Response: 200 OK
{
  "items": [
    {
      "id": "membership-uuid",
      "user_id": "user-uuid",
      "username": "john_doe",
      "email": "john@acme.com",
      "role": "owner",
      "invited_by": null,
      "joined_at": "2025-01-15T12:00:00Z"
    },
    {
      "id": "membership-uuid-2",
      "user_id": "user-uuid-2",
      "username": "jane_smith",
      "email": "jane@acme.com",
      "role": "admin",
      "invited_by": "user-uuid",
      "joined_at": "2025-02-01T09:00:00Z"
    }
  ],
  "total": 15,
  "skip": 0,
  "limit": 50
}

Business Logic:
1. Verify user is member of org
2. Query organization_members
3. Join with users to get user details
4. Filter by role if specified
5. Return paginated list

Errors:
- 401: Not authenticated
- 403: Not a member of this organization
- 404: Organization not found
```

#### 8. Update Member Role

```http
PATCH /api/v1/organizations/{org_id}/members/{user_id}
Authorization: Bearer <token>

Request Body:
{
  "role": "admin"  // new role
}

Response: 200 OK
{
  "id": "membership-uuid",
  "user_id": "user-uuid",
  "organization_id": "org-uuid",
  "role": "admin",  // updated
  "joined_at": "2025-02-01T09:00:00Z"
}

Business Logic:
1. Verify current user is owner/admin
2. Cannot change role of organization owner (unless transferring ownership)
3. Only owners can promote to owner
4. Update role
5. Regenerate user's JWT with new permissions
6. Return updated membership

Errors:
- 400: Cannot change owner role
- 401: Not authenticated
- 403: Insufficient permissions
- 404: Organization or member not found
```

#### 9. Remove Member from Organization

```http
DELETE /api/v1/organizations/{org_id}/members/{user_id}
Authorization: Bearer <token>

Response: 200 OK
{
  "status": "removed",
  "message": "Member removed from organization"
}

Business Logic:
1. Verify current user is owner/admin
2. Cannot remove organization owner
3. Cannot remove yourself (use leave endpoint)
4. Delete OrganizationMember record
5. Also remove from all workspaces in org
6. Return success

Errors:
- 400: Cannot remove owner, or trying to remove self
- 401: Not authenticated
- 403: Insufficient permissions
- 404: Organization or member not found
```

#### 10. Leave Organization

```http
POST /api/v1/organizations/{org_id}/leave
Authorization: Bearer <token>

Response: 200 OK
{
  "status": "left",
  "message": "You have left the organization"
}

Business Logic:
1. Verify user is member of org
2. If user is owner:
   - If there are other owners → allow
   - If no other owners and has other members → error (must transfer or delete)
   - If no other members → allow (will trigger org deletion)
3. Delete OrganizationMember record
4. Delete all workspace memberships in this org
5. If user's current context was this org → switch to another org (or null)
6. Return success

Errors:
- 400: Owner trying to leave without transferring ownership
- 401: Not authenticated
- 404: Organization not found or not a member
```

#### 11. Transfer Organization Ownership

```http
POST /api/v1/organizations/{org_id}/transfer-ownership
Authorization: Bearer <token>

Request Body:
{
  "new_owner_id": "user-uuid"
}

Response: 200 OK
{
  "status": "transferred",
  "message": "Ownership transferred successfully",
  "new_owner": {
    "user_id": "user-uuid",
    "username": "new_owner",
    "email": "new_owner@acme.com",
    "role": "owner"
  }
}

Business Logic:
1. Verify current user is owner
2. Verify new owner is a member of org
3. Update new owner's role to "owner"
4. Update current owner's role to "admin"
5. Return success

Errors:
- 401: Not authenticated
- 403: Not owner of this organization
- 404: Organization or new owner not found
- 400: New owner not a member of organization
```

#### 12. Get Organization Usage Stats

```http
GET /api/v1/organizations/{org_id}/usage
Authorization: Bearer <token>

Response: 200 OK
{
  "organization_id": "uuid",
  "subscription_tier": "pro",
  "billing_period": {
    "start": "2025-10-01T00:00:00Z",
    "end": "2025-10-31T23:59:59Z"
  },
  "usage": {
    "workspaces": {
      "current": 5,
      "limit": 10,
      "percentage": 50
    },
    "chatbots": {
      "current": 25,
      "limit": 50,
      "percentage": 50
    },
    "chatflows": {
      "current": 8,
      "limit": 20,
      "percentage": 40
    },
    "knowledge_bases": {
      "current": 12,
      "limit": 20,
      "percentage": 60
    },
    "messages_this_month": {
      "current": 5432,
      "limit": 10000,
      "percentage": 54
    },
    "team_members": {
      "current": 15,
      "limit": 20,
      "percentage": 75
    },
    "storage_mb": {
      "current": 450,
      "limit": 1000,
      "percentage": 45
    }
  },
  "limits_exceeded": [],
  "warnings": [
    "Team members at 75% of limit"
  ]
}

Business Logic:
1. Verify user is member of org
2. Get subscription tier limits
3. Count current resources
4. Calculate percentages
5. Identify warnings (>80%) and exceeded limits
6. Return usage stats

Errors:
- 401: Not authenticated
- 403: Not a member of this organization
- 404: Organization not found
```

---

### Workspace Management (10 Endpoints)

#### 13. Create Workspace

```http
POST /api/v1/workspaces
Authorization: Bearer <token>

Request Body:
{
  "organization_id": "org-uuid",
  "name": "Customer Support",
  "description": "Workspace for customer support chatbots"
}

Response: 201 Created
{
  "id": "ws-uuid",
  "organization_id": "org-uuid",
  "name": "Customer Support",
  "description": "Workspace for customer support chatbots",
  "settings": {},
  "is_default": false,
  "created_by": "user-uuid",
  "created_at": "2025-10-21T12:00:00Z",
  "updated_at": "2025-10-21T12:00:00Z",
  "member_count": 1,
  "chatbot_count": 0,
  "chatflow_count": 0,
  "kb_count": 0,
  "my_role": "admin"
}

Business Logic:
1. Verify user is org owner/admin
2. Check workspace limit for subscription tier
3. Create workspace
4. Add creator as workspace admin (WorkspaceMember)
5. Return workspace with new JWT containing ws_id

Errors:
- 400: Name already exists in org
- 401: Not authenticated
- 403: Not owner/admin of organization
- 404: Organization not found
- 409: Workspace limit reached for subscription tier
```

#### 14. List Workspaces in Organization

```http
GET /api/v1/organizations/{org_id}/workspaces
Authorization: Bearer <token>

Query Parameters:
- skip (optional, default: 0)
- limit (optional, default: 50)

Response: 200 OK
{
  "items": [
    {
      "id": "ws-uuid",
      "organization_id": "org-uuid",
      "name": "Customer Support",
      "description": "Workspace for customer support chatbots",
      "settings": {},
      "is_default": true,
      "created_at": "2025-01-15T12:00:00Z",
      "updated_at": "2025-10-20T15:30:00Z",
      "member_count": 8,
      "chatbot_count": 12,
      "chatflow_count": 3,
      "kb_count": 5,
      "my_role": "admin"
    },
    {
      "id": "ws-uuid-2",
      "name": "Marketing",
      "description": "Marketing automation chatbots",
      "is_default": false,
      "member_count": 5,
      "chatbot_count": 8,
      "chatflow_count": 2,
      "kb_count": 3,
      "my_role": "editor"
    }
  ],
  "total": 5,
  "skip": 0,
  "limit": 50
}

Business Logic:
1. Verify user is member of org
2. If org owner/admin → show all workspaces
3. If org member → show only workspaces user is member of
4. Include user's role in each workspace
5. Include resource counts
6. Return paginated list

Errors:
- 401: Not authenticated
- 403: Not a member of this organization
- 404: Organization not found
```

#### 15. Get Workspace Details

```http
GET /api/v1/workspaces/{ws_id}
Authorization: Bearer <token>

Response: 200 OK
{
  "id": "ws-uuid",
  "organization_id": "org-uuid",
  "organization_name": "Acme Corporation",
  "name": "Customer Support",
  "description": "Workspace for customer support chatbots",
  "settings": {
    "theme": {
      "color": "#3B82F6",
      "icon": "headset"
    }
  },
  "is_default": false,
  "created_by": "user-uuid",
  "created_at": "2025-01-15T12:00:00Z",
  "updated_at": "2025-10-20T15:30:00Z",
  "member_count": 8,
  "chatbot_count": 12,
  "chatflow_count": 3,
  "kb_count": 5,
  "my_role": "admin",
  "members": [  // Only if user is workspace admin
    {
      "user_id": "uuid",
      "username": "john_doe",
      "email": "john@acme.com",
      "role": "admin",
      "joined_at": "2025-01-15T12:00:00Z"
    }
  ]
}

Business Logic:
1. Verify user has access to workspace
   - Org owner/admin: automatic access
   - Workspace member: check WorkspaceMember
2. Return workspace details
3. Include members list if user is workspace admin
4. Include user's role

Errors:
- 401: Not authenticated
- 403: No access to this workspace
- 404: Workspace not found
```

#### 16. Update Workspace

```http
PATCH /api/v1/workspaces/{ws_id}
Authorization: Bearer <token>

Request Body (all fields optional):
{
  "name": "Updated Name",
  "description": "Updated description",
  "settings": {
    "theme": {
      "color": "#FF6B6B",
      "icon": "briefcase"
    }
  }
}

Response: 200 OK
{
  "id": "ws-uuid",
  "name": "Updated Name",
  "description": "Updated description",
  // ... full workspace object
}

Business Logic:
1. Verify user is workspace admin or org owner/admin
2. Update allowed fields
3. Cannot change organization_id
4. Return updated workspace

Errors:
- 401: Not authenticated
- 403: Insufficient permissions (not admin)
- 404: Workspace not found
- 400: Name already exists in organization
```

#### 17. Delete Workspace

```http
DELETE /api/v1/workspaces/{ws_id}
Authorization: Bearer <token>

Response: 200 OK
{
  "status": "deleted",
  "message": "Workspace and all associated resources have been deleted"
}

Business Logic:
1. Verify user is workspace admin or org owner/admin
2. Cannot delete default workspace (must first set another as default)
3. Delete workspace (cascades to all chatbots, chatflows, KBs, members)
4. Return success

WARNING: Destructive operation!
- All chatbots deleted
- All chatflows deleted
- All knowledge bases deleted
- All workspace members removed

Errors:
- 400: Cannot delete default workspace
- 401: Not authenticated
- 403: Insufficient permissions
- 404: Workspace not found
```

#### 18. Add Member to Workspace

```http
POST /api/v1/workspaces/{ws_id}/members
Authorization: Bearer <token>

Request Body:
{
  "user_id": "user-uuid",  // Must be org member
  "role": "editor"  // admin, editor, or viewer
}

Response: 201 Created
{
  "id": "ws-membership-uuid",
  "user_id": "user-uuid",
  "workspace_id": "ws-uuid",
  "role": "editor",
  "invited_by": "inviter-user-uuid",
  "joined_at": "2025-10-21T12:00:00Z",
  "user": {
    "id": "user-uuid",
    "username": "jane_smith",
    "email": "jane@acme.com"
  }
}

Business Logic:
1. Verify current user is workspace admin or org owner/admin
2. Verify target user is member of organization
3. Check if already a workspace member
4. Create WorkspaceMember record
5. Send notification to user
6. Return membership

Errors:
- 400: User already a workspace member, or not org member
- 401: Not authenticated
- 403: Insufficient permissions
- 404: Workspace or user not found
```

#### 19. List Workspace Members

```http
GET /api/v1/workspaces/{ws_id}/members
Authorization: Bearer <token>

Query Parameters:
- role (optional): Filter by role (admin, editor, viewer)
- skip (optional, default: 0)
- limit (optional, default: 50)

Response: 200 OK
{
  "items": [
    {
      "id": "ws-membership-uuid",
      "user_id": "user-uuid",
      "username": "john_doe",
      "email": "john@acme.com",
      "role": "admin",
      "invited_by": null,
      "joined_at": "2025-01-15T12:00:00Z"
    },
    {
      "id": "ws-membership-uuid-2",
      "user_id": "user-uuid-2",
      "username": "jane_smith",
      "email": "jane@acme.com",
      "role": "editor",
      "invited_by": "user-uuid",
      "joined_at": "2025-02-10T14:00:00Z"
    }
  ],
  "total": 8,
  "skip": 0,
  "limit": 50
}

Business Logic:
1. Verify user has access to workspace
2. Query workspace_members
3. Join with users to get user details
4. Filter by role if specified
5. Return paginated list

Errors:
- 401: Not authenticated
- 403: No access to this workspace
- 404: Workspace not found
```

#### 20. Update Workspace Member Role

```http
PATCH /api/v1/workspaces/{ws_id}/members/{user_id}
Authorization: Bearer <token>

Request Body:
{
  "role": "admin"  // new role
}

Response: 200 OK
{
  "id": "ws-membership-uuid",
  "user_id": "user-uuid",
  "workspace_id": "ws-uuid",
  "role": "admin",  // updated
  "joined_at": "2025-02-10T14:00:00Z"
}

Business Logic:
1. Verify current user is workspace admin or org owner/admin
2. Update role
3. Regenerate user's JWT if it's the current user
4. Return updated membership

Errors:
- 401: Not authenticated
- 403: Insufficient permissions
- 404: Workspace or member not found
```

#### 21. Remove Member from Workspace

```http
DELETE /api/v1/workspaces/{ws_id}/members/{user_id}
Authorization: Bearer <token>

Response: 200 OK
{
  "status": "removed",
  "message": "Member removed from workspace"
}

Business Logic:
1. Verify current user is workspace admin or org owner/admin
2. Cannot remove yourself (use leave endpoint)
3. Delete WorkspaceMember record
4. Return success

Errors:
- 400: Trying to remove self
- 401: Not authenticated
- 403: Insufficient permissions
- 404: Workspace or member not found
```

#### 22. Leave Workspace

```http
POST /api/v1/workspaces/{ws_id}/leave
Authorization: Bearer <token>

Response: 200 OK
{
  "status": "left",
  "message": "You have left the workspace"
}

Business Logic:
1. Verify user is member of workspace
2. Delete WorkspaceMember record
3. If user's current context was this workspace → clear ws_id in JWT
4. Return success

Errors:
- 401: Not authenticated
- 404: Workspace not found or not a member
```

---

### Context Switching (1 Endpoint)

#### 23. Switch Organization/Workspace Context

```http
POST /api/v1/auth/switch-context
Authorization: Bearer <token>

Request Body:
{
  "organization_id": "org-uuid",
  "workspace_id": "ws-uuid"  // optional
}

Response: 200 OK
{
  "access_token": "new-jwt-token",
  "token_type": "bearer",
  "context": {
    "organization_id": "org-uuid",
    "organization_name": "Acme Corporation",
    "workspace_id": "ws-uuid",
    "workspace_name": "Customer Support",
    "org_role": "admin",
    "ws_role": "editor",
    "subscription_tier": "pro",
    "permissions": [
      "org:read",
      "workspace:read",
      "workspace:write",
      "chatbot:create",
      // ... computed permissions
    ]
  }
}

Business Logic:
1. Verify user is member of target organization
2. If workspace_id provided → verify user has access
3. Get user's role in org (and workspace if provided)
4. Compute permissions based on roles
5. Generate new JWT with updated context
6. Return new token

Errors:
- 401: Not authenticated
- 403: Not a member of target org/workspace
- 404: Organization or workspace not found
```

---

## Service Layer Architecture

### TenantService Implementation

```python
"""
TenantService - Core business logic for multi-tenancy management

WHY:
- Centralize tenant operations
- Enforce subscription limits
- Handle permission checks
- Manage cascading operations

Location: app/services/tenant_service.py
"""

class TenantService:
    """
    Tenant service handles all organization and workspace operations.

    Responsibilities:
    - Organization CRUD
    - Workspace CRUD
    - Membership management (org and workspace)
    - Permission verification
    - Subscription limit enforcement
    - Context switching
    """

    def __init__(self, db: Session):
        self.db = db

    # ========================================================================
    # ORGANIZATION OPERATIONS
    # ========================================================================

    async def create_organization(
        self,
        name: str,
        billing_email: str,
        creator_user_id: UUID,
        subscription_tier: str = "free"
    ) -> Organization:
        """
        Create new organization with default workspace.

        FLOW:
        1. Create organization (set trial period)
        2. Add creator as owner (OrganizationMember)
        3. Create default workspace ("General")
        4. Add creator as workspace admin
        5. Return organization

        RAISES:
        - ValidationError: Invalid data
        """

    async def list_user_organizations(
        self,
        user_id: UUID,
        skip: int = 0,
        limit: int = 50
    ) -> tuple[list[Organization], int]:
        """
        List all organizations user belongs to.

        RETURNS: (organizations, total_count)
        """

    async def get_organization(
        self,
        org_id: UUID,
        user_id: UUID,
        include_members: bool = False,
        include_workspaces: bool = False
    ) -> Organization:
        """
        Get organization details with optional related data.

        RAISES:
        - NotFoundError: Organization not found
        - PermissionError: User not a member
        """

    async def update_organization(
        self,
        org_id: UUID,
        user_id: UUID,
        updates: dict
    ) -> Organization:
        """
        Update organization details.

        PERMISSION: Owner or admin

        RAISES:
        - PermissionError: Insufficient permissions
        - ValidationError: Invalid data
        """

    async def delete_organization(
        self,
        org_id: UUID,
        user_id: UUID
    ) -> None:
        """
        Delete organization and all related data.

        PERMISSION: Owner only
        WARNING: Cascades to all workspaces and resources!

        FLOW:
        1. Verify user is owner
        2. Cancel subscription (if active)
        3. Delete organization (cascade handled by DB)

        RAISES:
        - PermissionError: Not owner
        """

    # ========================================================================
    # ORGANIZATION MEMBERSHIP OPERATIONS
    # ========================================================================

    async def invite_organization_member(
        self,
        org_id: UUID,
        inviter_user_id: UUID,
        email: str,
        role: str = "member"
    ) -> OrganizationMember:
        """
        Invite user to organization by email.

        FLOW:
        1. Verify inviter is owner/admin
        2. Check subscription tier member limit
        3. Find or create user by email
        4. Create OrganizationMember
        5. Send invitation email
        6. Return membership

        PERMISSION: Owner/admin
        LIMITATION: Only owners can invite owners

        RAISES:
        - PermissionError: Insufficient permissions
        - ValidationError: Invalid role or data
        - SubscriptionLimitError: Member limit reached
        - AlreadyMemberError: User already a member
        """

    async def list_organization_members(
        self,
        org_id: UUID,
        user_id: UUID,
        role_filter: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> tuple[list[OrganizationMember], int]:
        """
        List organization members with optional role filter.

        PERMISSION: Any org member can list

        RETURNS: (members, total_count)
        """

    async def update_member_role(
        self,
        org_id: UUID,
        target_user_id: UUID,
        requester_user_id: UUID,
        new_role: str
    ) -> OrganizationMember:
        """
        Update organization member's role.

        PERMISSION: Owner/admin
        RULES:
        - Cannot change owner role (except via transfer)
        - Only owners can promote to owner

        RAISES:
        - PermissionError: Insufficient permissions
        - ValidationError: Invalid role or trying to change owner
        """

    async def remove_organization_member(
        self,
        org_id: UUID,
        target_user_id: UUID,
        requester_user_id: UUID
    ) -> None:
        """
        Remove member from organization.

        PERMISSION: Owner/admin
        RULES:
        - Cannot remove owner
        - Cannot remove yourself (use leave instead)

        FLOW:
        1. Verify permissions
        2. Delete OrganizationMember
        3. Delete all WorkspaceMember records in this org

        RAISES:
        - PermissionError: Insufficient permissions
        - ValidationError: Trying to remove owner or self
        """

    async def leave_organization(
        self,
        org_id: UUID,
        user_id: UUID
    ) -> None:
        """
        User leaves organization.

        RULES:
        - Owner must transfer ownership first OR be last member

        FLOW:
        1. Check if owner
           - If owner and other members exist → error
           - If owner and last member → delete org
           - If not owner → delete membership
        2. Delete workspace memberships
        3. Switch context if current

        RAISES:
        - ValidationError: Owner trying to leave with members
        """

    async def transfer_ownership(
        self,
        org_id: UUID,
        current_owner_id: UUID,
        new_owner_id: UUID
    ) -> tuple[OrganizationMember, OrganizationMember]:
        """
        Transfer organization ownership.

        PERMISSION: Current owner only

        FLOW:
        1. Verify current user is owner
        2. Verify new owner is member
        3. Update new owner role to "owner"
        4. Update current owner role to "admin"
        5. Return both memberships

        RAISES:
        - PermissionError: Not current owner
        - ValidationError: New owner not a member
        """

    # ========================================================================
    # WORKSPACE OPERATIONS
    # ========================================================================

    async def create_workspace(
        self,
        organization_id: UUID,
        creator_user_id: UUID,
        name: str,
        description: Optional[str] = None,
        is_default: bool = False
    ) -> Workspace:
        """
        Create workspace within organization.

        PERMISSION: Org owner/admin

        FLOW:
        1. Verify user is org owner/admin
        2. Check workspace limit for subscription tier
        3. Validate name unique within org
        4. Create workspace
        5. Add creator as workspace admin
        6. Return workspace

        RAISES:
        - PermissionError: Not owner/admin
        - SubscriptionLimitError: Workspace limit reached
        - ValidationError: Name already exists
        """

    async def list_workspaces(
        self,
        organization_id: UUID,
        user_id: UUID,
        skip: int = 0,
        limit: int = 50
    ) -> tuple[list[Workspace], int]:
        """
        List workspaces in organization.

        ACCESS:
        - Org owner/admin: All workspaces
        - Org member: Only workspaces they're member of

        RETURNS: (workspaces, total_count)
        """

    async def get_workspace(
        self,
        workspace_id: UUID,
        user_id: UUID,
        include_members: bool = False
    ) -> Workspace:
        """
        Get workspace details.

        ACCESS:
        - Org owner/admin: Automatic
        - Workspace member: Check membership

        RAISES:
        - NotFoundError: Workspace not found
        - PermissionError: No access
        """

    async def update_workspace(
        self,
        workspace_id: UUID,
        user_id: UUID,
        updates: dict
    ) -> Workspace:
        """
        Update workspace details.

        PERMISSION: Workspace admin or org owner/admin

        RAISES:
        - PermissionError: Insufficient permissions
        - ValidationError: Name already exists
        """

    async def delete_workspace(
        self,
        workspace_id: UUID,
        user_id: UUID
    ) -> None:
        """
        Delete workspace and all resources.

        PERMISSION: Workspace admin or org owner/admin
        RULE: Cannot delete default workspace

        WARNING: Cascades to all chatbots, chatflows, KBs!

        RAISES:
        - PermissionError: Insufficient permissions
        - ValidationError: Trying to delete default workspace
        """

    # ========================================================================
    # WORKSPACE MEMBERSHIP OPERATIONS
    # ========================================================================

    async def add_workspace_member(
        self,
        workspace_id: UUID,
        target_user_id: UUID,
        requester_user_id: UUID,
        role: str = "viewer"
    ) -> WorkspaceMember:
        """
        Add member to workspace.

        PERMISSION: Workspace admin or org owner/admin
        REQUIREMENT: Target user must be org member

        RAISES:
        - PermissionError: Insufficient permissions
        - ValidationError: User not org member, or already workspace member
        """

    async def list_workspace_members(
        self,
        workspace_id: UUID,
        user_id: UUID,
        role_filter: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> tuple[list[WorkspaceMember], int]:
        """
        List workspace members.

        PERMISSION: Any workspace member

        RETURNS: (members, total_count)
        """

    async def update_workspace_member_role(
        self,
        workspace_id: UUID,
        target_user_id: UUID,
        requester_user_id: UUID,
        new_role: str
    ) -> WorkspaceMember:
        """
        Update workspace member role.

        PERMISSION: Workspace admin or org owner/admin

        RAISES:
        - PermissionError: Insufficient permissions
        """

    async def remove_workspace_member(
        self,
        workspace_id: UUID,
        target_user_id: UUID,
        requester_user_id: UUID
    ) -> None:
        """
        Remove member from workspace.

        PERMISSION: Workspace admin or org owner/admin
        RULE: Cannot remove yourself (use leave)

        RAISES:
        - PermissionError: Insufficient permissions
        - ValidationError: Trying to remove self
        """

    async def leave_workspace(
        self,
        workspace_id: UUID,
        user_id: UUID
    ) -> None:
        """
        User leaves workspace.

        FLOW:
        1. Delete WorkspaceMember
        2. Clear ws_id from JWT if current
        """

    # ========================================================================
    # PERMISSION & ACCESS VERIFICATION
    # ========================================================================

    async def verify_organization_access(
        self,
        org_id: UUID,
        user_id: UUID,
        required_role: Optional[str] = None
    ) -> OrganizationMember:
        """
        Verify user has access to organization.

        ARGS:
        - org_id: Organization to check
        - user_id: User to verify
        - required_role: Minimum role required (None = any member)

        RETURNS: OrganizationMember if has access

        RAISES:
        - PermissionError: No access or insufficient role
        """

    async def verify_workspace_access(
        self,
        workspace_id: UUID,
        user_id: UUID,
        required_role: Optional[str] = None
    ) -> tuple[Workspace, Optional[WorkspaceMember]]:
        """
        Verify user has access to workspace.

        ACCESS RULES:
        - Org owner/admin: Automatic access
        - Workspace member: Check role

        RETURNS: (Workspace, WorkspaceMember or None)

        RAISES:
        - PermissionError: No access or insufficient role
        """

    async def get_user_permissions(
        self,
        user_id: UUID,
        org_id: UUID,
        workspace_id: Optional[UUID] = None
    ) -> list[str]:
        """
        Compute user's permissions in context.

        FLOW:
        1. Get org role
        2. Map org role to org-level permissions
        3. If workspace_id: get workspace role and add workspace permissions
        4. Add subscription tier features as permissions
        5. Return permission list

        EXAMPLE OUTPUT:
        [
            "org:read",
            "org:write",
            "workspace:create",
            "workspace:read",
            "workspace:write",
            "chatbot:create",
            "chatbot:edit",
            "chatbot:delete",
            "chatflow:create",  # If tier supports
            // ...
        ]
        """

    # ========================================================================
    # SUBSCRIPTION & LIMITS
    # ========================================================================

    async def check_resource_limit(
        self,
        org_id: UUID,
        resource_type: str
    ) -> bool:
        """
        Check if organization can create more of resource type.

        RESOURCE TYPES:
        - "workspace"
        - "chatbot"
        - "chatflow"
        - "knowledge_base"
        - "team_member"

        FLOW:
        1. Get organization's subscription tier
        2. Get tier limit for resource
        3. Count current resources
        4. Return True if under limit

        RAISES:
        - SubscriptionLimitError: Limit reached
        """

    async def check_feature_access(
        self,
        org_id: UUID,
        feature: str
    ) -> bool:
        """
        Check if organization's tier has feature enabled.

        FEATURES:
        - "chatflow"
        - "analytics_advanced"
        - "custom_branding"
        - "api_access"
        - etc.

        RAISES:
        - FeatureNotAvailableError: Feature not in tier
        """

    async def get_organization_usage(
        self,
        org_id: UUID
    ) -> dict:
        """
        Get organization's current usage vs limits.

        RETURNS:
        {
            "subscription_tier": "pro",
            "usage": {
                "workspaces": {"current": 5, "limit": 10},
                "chatbots": {"current": 25, "limit": 50},
                // ...
            },
            "limits_exceeded": [],
            "warnings": [...]
        }
        """

    # ========================================================================
    # CONTEXT SWITCHING
    # ========================================================================

    async def switch_context(
        self,
        user_id: UUID,
        org_id: UUID,
        workspace_id: Optional[UUID] = None
    ) -> dict:
        """
        Switch user's organization/workspace context.

        FLOW:
        1. Verify org access
        2. If workspace_id: verify workspace access
        3. Get roles
        4. Compute permissions
        5. Generate new JWT
        6. Return token + context

        RETURNS:
        {
            "access_token": "jwt",
            "context": {
                "organization_id": "...",
                "workspace_id": "...",
                "org_role": "admin",
                "ws_role": "editor",
                "permissions": [...]
            }
        }

        RAISES:
        - PermissionError: No access to org/workspace
        """


# Global instance
def get_tenant_service(db: Session = Depends(get_db)) -> TenantService:
    """Dependency for injecting tenant service"""
    return TenantService(db)
```

---

## Error Handling & Edge Cases

### Custom Exception Classes

```python
"""
Custom exceptions for tenant management

Location: app/exceptions/tenant.py
"""

class TenantError(Exception):
    """Base exception for tenant errors"""
    pass

class SubscriptionLimitError(TenantError):
    """
    Raised when subscription limit reached

    Example:
        "Workspace limit reached (3) for starter tier. Upgrade to create more workspaces."
    """
    def __init__(self, resource: str, current: int, limit: int, tier: str):
        self.resource = resource
        self.current = current
        self.limit = limit
        self.tier = tier
        super().__init__(
            f"{resource.capitalize()} limit reached ({limit}) for {tier} tier. "
            f"Upgrade to create more {resource}s."
        )

class FeatureNotAvailableError(TenantError):
    """
    Raised when feature not available in current tier

    Example:
        "Feature 'chatflow' not available in free tier. Please upgrade to access this feature."
    """
    def __init__(self, feature: str, tier: str):
        self.feature = feature
        self.tier = tier
        super().__init__(
            f"Feature '{feature}' not available in {tier} tier. "
            f"Please upgrade to access this feature."
        )

class OrganizationNotFoundError(TenantError):
    """Raised when organization not found"""
    pass

class WorkspaceNotFoundError(TenantError):
    """Raised when workspace not found"""
    pass

class InsufficientPermissionsError(TenantError):
    """Raised when user lacks required permissions"""
    def __init__(self, required_role: str, current_role: str):
        super().__init__(
            f"Insufficient permissions. Required: {required_role}, Current: {current_role}"
        )

class AlreadyMemberError(TenantError):
    """Raised when user already a member"""
    pass

class NotOrganizationMemberError(TenantError):
    """Raised when user not a member of organization"""
    pass
```

### Edge Cases Handled

```python
"""
EDGE CASE 1: Owner trying to leave organization with other members

PROBLEM: If owner leaves, who manages the org?
SOLUTION: Force ownership transfer first

def leave_organization(org_id, user_id):
    member = get_member(org_id, user_id)

    if member.role == "owner":
        other_members = get_other_members(org_id, user_id)

        if other_members:
            raise ValidationError(
                "Cannot leave organization as owner while other members exist. "
                "Please transfer ownership first or remove all members."
            )
        else:
            # Last member - delete organization
            delete_organization(org_id)
    else:
        # Not owner - safe to leave
        delete_member(member)


EDGE CASE 2: Deleting default workspace

PROBLEM: Organization must always have a default workspace
SOLUTION: Prevent deletion unless another workspace is set as default

def delete_workspace(workspace_id, user_id):
    workspace = get_workspace(workspace_id)

    if workspace.is_default:
        other_workspaces = get_other_workspaces(workspace.organization_id, workspace_id)

        if not other_workspaces:
            raise ValidationError(
                "Cannot delete the only workspace. Organizations must have at least one workspace."
            )
        else:
            raise ValidationError(
                "Cannot delete default workspace. Please set another workspace as default first."
            )

    # Safe to delete
    db.delete(workspace)


EDGE CASE 3: Removing last organization owner

PROBLEM: Organization becomes orphaned
SOLUTION: Prevent removal - must transfer ownership first

def remove_organization_member(org_id, target_user_id, requester_user_id):
    target_member = get_member(org_id, target_user_id)

    if target_member.role == "owner":
        owners = get_members_by_role(org_id, "owner")

        if len(owners) <= 1:
            raise ValidationError(
                "Cannot remove the only owner. Please transfer ownership first."
            )

    # Safe to remove
    db.delete(target_member)


EDGE CASE 4: Subscription downgrade with resources exceeding new limits

PROBLEM: User downgrades from Pro (50 chatbots) to Free (2 chatbots), has 20 chatbots
SOLUTION: Soft enforcement - existing resources grandfathered, cannot create new

def check_resource_limit(org_id, resource_type):
    org = get_organization(org_id)
    tier_limits = SUBSCRIPTION_TIERS[org.subscription_tier]["limits"]
    max_count = tier_limits[f"{resource_type}s_per_workspace"]

    if max_count == -1:  # Unlimited
        return True

    current_count = count_resources(org_id, resource_type)

    if current_count >= max_count:
        # Soft limit - existing resources allowed, no new ones
        raise SubscriptionLimitError(
            resource=resource_type,
            current=current_count,
            limit=max_count,
            tier=org.subscription_tier,
            message=(
                f"Your {org.subscription_tier} plan allows {max_count} {resource_type}s. "
                f"You currently have {current_count}. Please upgrade or remove some {resource_type}s."
            )
        )


EDGE CASE 5: User invited to organization while not having account

PROBLEM: Email doesn't correspond to existing user
SOLUTION: Create pending user account + send invitation email

async def invite_organization_member(org_id, inviter_user_id, email, role):
    # Check if user exists
    user = db.query(User).filter(User.email == email).first()

    if not user:
        # Create pending user
        username = email.split("@")[0]  # Use email prefix as username
        user = User(
            username=username,
            email=email,
            is_active=False  # Inactive until they set password
        )
        db.add(user)
        db.flush()

        # Send invitation email with signup link
        await send_invitation_email(
            email=email,
            inviter_name=get_user_name(inviter_user_id),
            organization_name=get_org_name(org_id),
            invite_link=f"{FRONTEND_URL}/accept-invite?token={generate_invite_token(user.id, org_id)}"
        )

    # Create membership
    membership = OrganizationMember(
        user_id=user.id,
        organization_id=org_id,
        role=role,
        invited_by=inviter_user_id
    )
    db.add(membership)
    db.commit()

    return membership


EDGE CASE 6: Context switching to organization user no longer has access to

PROBLEM: User removed from org but tries to switch to it
SOLUTION: Verify membership before issuing new JWT

def switch_context(user_id, org_id, workspace_id=None):
    # Verify org access
    membership = db.query(OrganizationMember).filter(
        OrganizationMember.user_id == user_id,
        OrganizationMember.organization_id == org_id
    ).first()

    if not membership:
        raise PermissionError(
            "You do not have access to this organization. "
            "You may have been removed or the organization may have been deleted."
        )

    # Verify workspace access if specified
    if workspace_id:
        workspace = get_workspace(workspace_id)

        if workspace.organization_id != org_id:
            raise ValidationError("Workspace does not belong to this organization")

        # Check workspace access (org admin or workspace member)
        if membership.role not in ["owner", "admin"]:
            ws_member = db.query(WorkspaceMember).filter(
                WorkspaceMember.user_id == user_id,
                WorkspaceMember.workspace_id == workspace_id
            ).first()

            if not ws_member:
                raise PermissionError("You do not have access to this workspace")

    # Generate new JWT with validated context
    return generate_context_jwt(user_id, org_id, workspace_id, membership.role)


EDGE CASE 7: Concurrent membership modifications

PROBLEM: Race condition when multiple admins modify memberships simultaneously
SOLUTION: Use database transactions and unique constraints

@db.transaction
def add_organization_member(org_id, user_id, role):
    try:
        membership = OrganizationMember(
            user_id=user_id,
            organization_id=org_id,
            role=role
        )
        db.add(membership)
        db.commit()  # Will fail if already exists due to unique constraint
    except IntegrityError:
        db.rollback()
        raise AlreadyMemberError("User is already a member of this organization")


EDGE CASE 8: Trial expiration while user actively using platform

PROBLEM: Trial expires mid-session
SOLUTION:
  - Check on each request (middleware)
  - Graceful degradation (read-only access)
  - Notification system

def check_subscription_status(org_id):
    org = get_organization(org_id)

    if org.subscription_status == "trial":
        if datetime.utcnow() > org.trial_ends_at:
            # Trial expired
            org.subscription_status = "suspended"
            db.commit()

            raise SubscriptionExpiredError(
                "Your trial has expired. Please upgrade to continue using PrivexBot."
            )

    if org.subscription_status in ["cancelled", "suspended"]:
        # Allow read-only access
        if request.method in ["POST", "PATCH", "PUT", "DELETE"]:
            raise SubscriptionInactiveError(
                f"Your subscription is {org.subscription_status}. "
                "Upgrade to resume full access."
            )
```

---

## Testing Strategy

### Test Structure

```python
"""
Test organization: pytest with FastAPI TestClient

Files:
- test_organization.py: Organization CRUD and membership
- test_workspace.py: Workspace CRUD and membership
- test_tenant_permissions.py: Permission verification
- test_subscription_limits.py: Tier limit enforcement
- test_context_switching.py: Context switching flows
- test_tenant_edge_cases.py: Edge cases and error scenarios

Fixtures (in conftest.py):
- test_org: Create test organization
- test_workspace: Create test workspace
- org_owner: User with owner role
- org_admin: User with admin role
- org_member: User with member role
- ws_admin: User with workspace admin role
- ws_editor: User with workspace editor role
- ws_viewer: User with workspace viewer role
"""
```

### Sample Test Cases

```python
"""
test_organization.py
"""

class TestOrganizationCreation:
    """Test organization creation"""

    def test_create_organization_success(self, client, authenticated_user):
        """
        WHY: Verify organization creation works
        HOW: POST to /organizations with valid data
        EXPECT: 201, org created, creator is owner, default workspace created
        """

    def test_create_organization_creates_default_workspace(self, client, authenticated_user):
        """
        WHY: Every org must have at least one workspace
        HOW: Create org, verify default workspace exists
        EXPECT: Default workspace named "General" with creator as admin
        """

    def test_create_organization_invalid_email(self, client, authenticated_user):
        """
        WHY: Validate billing email format
        HOW: Try creating org with invalid email
        EXPECT: 422 validation error
        """

    def test_create_organization_name_too_long(self, client, authenticated_user):
        """
        WHY: Enforce name length limits
        HOW: Try creating org with 300-char name
        EXPECT: 422 validation error
        """


class TestOrganizationListing:
    """Test organization listing"""

    def test_list_my_organizations(self, client, authenticated_user, test_org):
        """
        WHY: Users should see all orgs they belong to
        HOW: Create 3 orgs with different roles, list them
        EXPECT: All 3 orgs returned with correct roles
        """

    def test_list_organizations_pagination(self, client, authenticated_user):
        """
        WHY: Handle large org lists
        HOW: Create 60 orgs, request with limit=50
        EXPECT: 50 orgs returned, total=60
        """

    def test_list_organizations_empty(self, client, authenticated_user):
        """
        WHY: Handle users with no orgs
        HOW: New user lists orgs
        EXPECT: Empty list
        """


class TestOrganizationMembership:
    """Test organization membership management"""

    def test_invite_member_as_owner(self, client, org_owner, test_org):
        """
        WHY: Owners can invite members
        HOW: Owner invites user with admin role
        EXPECT: 201, membership created, invitation email sent
        """

    def test_invite_member_as_member_fails(self, client, org_member, test_org):
        """
        WHY: Members cannot invite others
        HOW: Member tries to invite user
        EXPECT: 403 forbidden
        """

    def test_invite_member_exceeds_limit(self, client, org_owner):
        """
        WHY: Enforce subscription tier limits
        HOW: Free tier org (limit: 2), invite 3rd member
        EXPECT: 409 subscription limit error
        """

    def test_invite_member_duplicate(self, client, org_owner, test_org, existing_member):
        """
        WHY: Prevent duplicate memberships
        HOW: Invite user who's already a member
        EXPECT: 400 already a member error
        """

    def test_non_owner_cannot_invite_owner(self, client, org_admin, test_org):
        """
        WHY: Only owners can create other owners
        HOW: Admin tries to invite user with owner role
        EXPECT: 403 forbidden
        """

    def test_remove_member_as_owner(self, client, org_owner, test_org, org_member):
        """
        WHY: Owners can remove members
        HOW: Owner removes member
        EXPECT: 200, membership deleted, user removed from all workspaces
        """

    def test_cannot_remove_last_owner(self, client, org_owner, test_org):
        """
        WHY: Org must always have an owner
        HOW: Try to remove only owner
        EXPECT: 400 error
        """

    def test_leave_organization_as_member(self, client, org_member, test_org):
        """
        WHY: Members can leave orgs
        HOW: Member leaves org
        EXPECT: 200, membership deleted
        """

    def test_leave_organization_as_only_owner_fails(self, client, org_owner, test_org):
        """
        WHY: Owner must transfer ownership or delete org
        HOW: Only owner tries to leave
        EXPECT: 400 error
        """

    def test_transfer_ownership(self, client, org_owner, test_org, org_admin):
        """
        WHY: Enable ownership transfer
        HOW: Owner transfers to admin
        EXPECT: 200, roles swapped (new owner, old becomes admin)
        """


class TestWorkspaceCreation:
    """Test workspace creation and management"""

    def test_create_workspace_as_owner(self, client, org_owner, test_org):
        """
        WHY: Owners can create workspaces
        HOW: Owner creates workspace
        EXPECT: 201, workspace created, creator is admin
        """

    def test_create_workspace_as_member_fails(self, client, org_member, test_org):
        """
        WHY: Only owners/admins can create workspaces
        HOW: Member tries to create workspace
        EXPECT: 403 forbidden
        """

    def test_create_workspace_exceeds_limit(self, client, org_owner):
        """
        WHY: Enforce subscription tier limits
        HOW: Free tier (limit: 1), create 2nd workspace
        EXPECT: 409 subscription limit error
        """

    def test_create_workspace_duplicate_name(self, client, org_owner, test_org):
        """
        WHY: Workspace names must be unique within org
        HOW: Create two workspaces with same name
        EXPECT: 400 name already exists
        """

    def test_delete_default_workspace_fails(self, client, org_owner, test_workspace):
        """
        WHY: Org must always have default workspace
        HOW: Try to delete default workspace
        EXPECT: 400 error
        """

    def test_delete_workspace_cascades_resources(self, client, org_owner, test_workspace):
        """
        WHY: Verify cascade deletes work
        HOW: Create workspace with chatbots, delete workspace
        EXPECT: 200, workspace and chatbots deleted
        """


class TestPermissions:
    """Test permission verification"""

    def test_org_admin_can_access_all_workspaces(self, client, org_admin, test_workspaces):
        """
        WHY: Org admins have access to all workspaces
        HOW: Admin accesses workspace they're not explicitly member of
        EXPECT: 200, access granted
        """

    def test_workspace_viewer_cannot_edit(self, client, ws_viewer, test_chatbot):
        """
        WHY: Viewers have read-only access
        HOW: Viewer tries to edit chatbot
        EXPECT: 403 forbidden
        """

    def test_workspace_editor_can_create_chatbot(self, client, ws_editor, test_workspace):
        """
        WHY: Editors can create resources
        HOW: Editor creates chatbot
        EXPECT: 201, chatbot created
        """

    def test_cross_org_access_denied(self, client, org_member_a, org_b_chatbot):
        """
        WHY: Verify tenant isolation
        HOW: User from Org A tries to access Org B's chatbot
        EXPECT: 403 or 404
        """


class TestSubscriptionLimits:
    """Test subscription tier limits"""

    def test_free_tier_cannot_create_chatflow(self, client, free_org_owner):
        """
        WHY: Chatflows are Pro+ feature
        HOW: Free tier user tries to create chatflow
        EXPECT: 402 or 403 feature not available
        """

    def test_pro_tier_chatflow_limit(self, client, pro_org_owner, test_workspace):
        """
        WHY: Enforce chatflow limits
        HOW: Pro tier (limit: 20), create 21st chatflow
        EXPECT: 409 limit exceeded
        """

    def test_enterprise_unlimited_workspaces(self, client, enterprise_org_owner):
        """
        WHY: Enterprise has unlimited resources
        HOW: Enterprise creates 100 workspaces
        EXPECT: All created successfully
        """


class TestContextSwitching:
    """Test organization/workspace context switching"""

    def test_switch_to_different_org(self, client, multi_org_user):
        """
        WHY: Users can switch between orgs
        HOW: User in 2 orgs switches context
        EXPECT: 200, new JWT with updated org_id and permissions
        """

    def test_switch_to_workspace(self, client, authenticated_user, test_workspace):
        """
        WHY: Users can switch to specific workspace
        HOW: Switch context to org + workspace
        EXPECT: 200, JWT contains both org_id and ws_id
        """

    def test_switch_to_unauthorized_org_fails(self, client, authenticated_user, other_org):
        """
        WHY: Cannot switch to org you're not member of
        HOW: User tries to switch to org they don't belong to
        EXPECT: 403 forbidden
        """

    def test_switch_updates_permissions(self, client, multi_role_user):
        """
        WHY: Permissions change based on context
        HOW: User is owner in Org A, member in Org B, switch between them
        EXPECT: Permissions array different in each JWT
        """


class TestEdgeCases:
    """Test edge cases and error scenarios"""

    def test_concurrent_workspace_creation(self, client, org_owner):
        """
        WHY: Handle race conditions
        HOW: Submit 2 workspace creation requests simultaneously at tier limit
        EXPECT: One succeeds, one fails with limit error
        """

    def test_trial_expiration_blocks_write_operations(self, client, expired_trial_org, org_owner):
        """
        WHY: Expired trials get read-only access
        HOW: Trial expires, try to create chatbot
        EXPECT: 402 payment required
        """

    def test_org_deletion_removes_all_data(self, client, org_owner, populated_org):
        """
        WHY: Verify complete cleanup
        HOW: Delete org with workspaces, chatbots, members
        EXPECT: All related records deleted from database
        """
```

---

## Implementation Roadmap

### Phase 1: Database Models (Week 1, Days 1-2)
1. ✅ Read existing User model
2. ✅ Implement Organization model
3. ✅ Implement OrganizationMember model
4. ✅ Implement Workspace model
5. ✅ Implement WorkspaceMember model
6. ✅ Create Alembic migration
7. ✅ Run migration on dev database
8. ✅ Verify relationships and cascades

### Phase 2: Pydantic Schemas (Week 1, Days 3-4)
1. ✅ Create organization schemas (Create, Update, Response, Detailed)
2. ✅ Create workspace schemas
3. ✅ Create membership schemas
4. ✅ Create context switching schemas
5. ✅ Create subscription tier schemas
6. ✅ Add validation rules

### Phase 3: Service Layer (Week 2)
1. ✅ Implement TenantService skeleton
2. ✅ Organization operations (create, list, get, update, delete)
3. ✅ Organization membership operations
4. ✅ Workspace operations
5. ✅ Workspace membership operations
6. ✅ Permission verification methods
7. ✅ Subscription limit checks
8. ✅ Context switching logic
9. ✅ Error handling

### Phase 4: API Routes (Week 3)
1. ✅ Organization management routes (12 endpoints)
2. ✅ Workspace management routes (10 endpoints)
3. ✅ Context switching route (1 endpoint)
4. ✅ Add proper error handling
5. ✅ Add request validation
6. ✅ Add response formatting
7. ✅ Document all endpoints (OpenAPI)

### Phase 5: Authorization Middleware (Week 4, Days 1-2)
1. ✅ Create permission dependency
2. ✅ Update get_current_user to include org/ws context
3. ✅ Add subscription check middleware
4. ✅ Add feature gate middleware
5. ✅ Update existing chatbot/KB routes to use tenant context

### Phase 6: Testing (Week 4, Days 3-5)
1. ✅ Write organization tests (20+ tests)
2. ✅ Write workspace tests (15+ tests)
3. ✅ Write permission tests (10+ tests)
4. ✅ Write subscription limit tests (10+ tests)
5. ✅ Write context switching tests (5+ tests)
6. ✅ Write edge case tests (10+ tests)
7. ✅ Achieve 90%+ code coverage

### Phase 7: Integration & Documentation (Week 5)
1. ✅ Update authentication to create default org
2. ✅ Update chatbot routes to use workspace_id
3. ✅ Update frontend API client
4. ✅ Write API documentation
5. ✅ Create migration guide for existing users
6. ✅ End-to-end testing

---

## Security Considerations

### 1. Tenant Isolation
```python
"""
CRITICAL: All queries MUST filter by tenant context

WRONG:
    chatbot = db.query(Chatbot).filter(Chatbot.id == chatbot_id).first()
    # No tenant check! User could access any chatbot by ID

CORRECT:
    chatbot = db.query(Chatbot)
        .join(Workspace)
        .filter(
            Chatbot.id == chatbot_id,
            Workspace.organization_id == current_user.org_id  # TENANT CHECK
        ).first()
```

### 2. Permission Verification
```python
"""
CRITICAL: Always verify permissions before operations

WRONG:
    @router.delete("/chatbots/{chatbot_id}")
    def delete_chatbot(chatbot_id: UUID, user: User = Depends(get_current_user)):
        chatbot = get_chatbot(chatbot_id)
        db.delete(chatbot)  # No permission check!

CORRECT:
    @router.delete("/chatbots/{chatbot_id}")
    def delete_chatbot(chatbot_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
        chatbot = get_chatbot(chatbot_id)

        # Verify workspace access
        tenant_service.verify_workspace_access(
            workspace_id=chatbot.workspace_id,
            user_id=user.id,
            required_role="editor"  # Minimum role needed
        )

        db.delete(chatbot)
```

### 3. JWT Token Validation
- Verify signature on every request
- Check expiration
- Validate org_id and ws_id still valid (user not removed)
- Regenerate token after permission changes

### 4. Subscription Enforcement
- Check limits BEFORE creating resources
- Use soft limits for downgrades (grandfathered existing, block new)
- Check feature access on every relevant endpoint

### 5. Input Validation
- Validate all user inputs with Pydantic
- Sanitize organization/workspace names
- Validate email formats
- Check UUID formats

### 6. Cascade Deletes
- Organization delete → Workspaces → All resources
- Workspace delete → All resources
- User delete → Memberships
- Use database constraints, not application logic

### 7. Audit Logging
- Log all membership changes
- Log organization/workspace creation/deletion
- Log ownership transfers
- Log subscription changes

---

## Conclusion

This specification provides complete implementation details for Organization and Workspace management, enabling full multi-tenancy support in PrivexBot.

**Next Steps**:
1. Review and approve this specification
2. Begin Phase 1: Database Models implementation
3. Follow roadmap sequentially
4. Test thoroughly at each phase

**Estimated Timeline**: 5 weeks for complete implementation with comprehensive testing.

**Success Metrics**:
- All 23 API endpoints functional
- 90%+ test coverage
- Zero tenant isolation breaches
- Subscription limits enforced correctly
- Context switching works seamlessly

---

**Document Status**: ✅ Ready for Implementation
**Approval Required**: Product Owner, Tech Lead
**Dependencies**: None (builds on existing auth system)
**Risk Level**: Medium (affects core multi-tenancy)
