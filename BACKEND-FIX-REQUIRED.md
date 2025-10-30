# 🔴 CRITICAL: Backend Fix Required for Multi-Tenancy

## Problem

Frontend is **100% complete** but backend signup doesn't create default workspace, causing:
- Empty workspace list in sidebar
- Error: "No workspaces found in organization"
- Profile page logic broken (depends on `is_default: true` flag)

## Console Error from Frontend

```
[AppContext] Refreshing data...
[AppContext] Organizations loaded: { organizations: [...], total: 1 }
[AppContext] Loading workspaces for org: <org-id>
[AppContext] Workspaces loaded: []  ← EMPTY!
[AppContext] No workspaces found for organization!
Error: No workspaces found. Backend needs to create default workspace on signup.
```

## Network Error

```
GET http://localhost:8000/api/v1/api/v1/orgs/?page=1&page_size=20 → 404
```
**Fixed in frontend**: Removed duplicate `/api/v1/` from API client paths.

---

## Required Backend Changes

### File: `/backend/src/app/services/auth_service.py`

**Location**: In the `register_email()` function (around line 69-123)

**Current Code** (pseudocode from docstring):
```python
async def register_email(
    username: str,
    email: str,
    password: str,
    db: Session
) -> dict:
    """Handle email signup"""

    # Step 1: Create user
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

    # ❌ MISSING: No workspace created here!

    # Step 4: Get permissions and create token
    permissions = await get_user_permissions(user.id, org.id, None, db)

    token_data = {
        "sub": str(user.id),
        "email": email,
        "org_id": str(org.id),
        "ws_id": None,  # ❌ No workspace!
        "perms": permissions
    }

    access_token = create_access_token(token_data)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }
```

---

### **UPDATED CODE** (add after creating organization):

```python
async def register_email(
    username: str,
    email: str,
    password: str,
    db: Session
) -> dict:
    """Handle email signup - Creates user, org, AND workspace"""

    # Step 1: Create user with email auth
    user = await email.signup_with_email(email, password, username, db)

    # Step 2: Create default personal organization
    from app.models.organization import Organization
    from app.models.organization_member import OrganizationMember
    from app.models.workspace import Workspace
    from app.models.workspace_member import WorkspaceMember

    org = Organization(
        name=f"{username}'s Organization",
        created_by=user.id
    )
    db.add(org)
    db.flush()

    # Step 3: Add user as owner of organization
    org_member = OrganizationMember(
        user_id=user.id,
        organization_id=org.id,
        role="owner"
    )
    db.add(org_member)
    db.flush()  # Flush before creating workspace

    # ✅ NEW: Step 4: Create default workspace
    workspace = Workspace(
        name=f"{username}'s Workspace",  # Or just use username/org.name
        organization_id=org.id,
        created_by=user.id,
        is_default=True  # ← CRITICAL: Frontend Profile page logic depends on this!
    )
    db.add(workspace)
    db.flush()

    # ✅ NEW: Step 5: Add user as admin of workspace
    ws_member = WorkspaceMember(
        user_id=user.id,
        workspace_id=workspace.id,
        role="admin"  # Owner at org level, admin at workspace level
    )
    db.add(ws_member)
    db.commit()  # Commit all together

    # ✅ UPDATED: Step 6: Get permissions WITH workspace context
    permissions = await get_user_permissions(user.id, org.id, workspace.id, db)

    # ✅ UPDATED: Step 7: Create JWT with workspace ID
    token_data = {
        "sub": str(user.id),
        "email": email,
        "org_id": str(org.id),
        "ws_id": str(workspace.id),  # ✅ Include workspace ID
        "perms": permissions
    }

    access_token = create_access_token(token_data)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }
```

---

## Key Points

1. **`is_default=True` is CRITICAL**
   - Frontend Profile page only shows in default workspace
   - Logic: `isDefaultWorkspace = currentWorkspace?.is_default || ...`

2. **Workspace role should be "admin"**
   - User is "owner" at org level
   - User is "admin" at workspace level (owner can create new workspaces)

3. **JWT must include `ws_id`**
   - Backend endpoints filter by workspace context
   - Frontend needs workspace ID for permissions

4. **Commit order matters**:
   - Flush after org creation (need org.id for workspace)
   - Flush after workspace creation (need workspace.id for member)
   - Commit all at once to maintain transaction integrity

---

## Apply Same Fix to Wallet Auth

Check `authenticate_wallet()` function in same file. If wallet signup creates organization, it should also create workspace.

---

## Verification After Fix

### 1. Test Signup

```bash
# Start backend
cd backend/src
uvicorn app.main:app --reload

# Sign up via frontend or curl
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "testpass123"
  }'
```

### 2. Check Database

```sql
-- Should return 1 org
SELECT id, name, created_by FROM organizations WHERE created_by = (SELECT id FROM users WHERE username = 'testuser');

-- Should return 1 workspace with is_default = true
SELECT id, name, organization_id, is_default FROM workspaces WHERE organization_id = (SELECT id FROM organizations WHERE created_by = (SELECT id FROM users WHERE username = 'testuser'));

-- Should return workspace_id in user's memberships
SELECT w.id, w.name, wm.role, wm.user_id
FROM workspaces w
JOIN workspace_members wm ON w.id = wm.workspace_id
WHERE wm.user_id = (SELECT id FROM users WHERE username = 'testuser');
```

### 3. Check Frontend Console

After signup and login, you should see:

```
[AppContext] Refreshing data...
[AppContext] Organizations loaded: { organizations: [{ id: "...", name: "testuser's Organization", ... }], total: 1 }
[AppContext] Loading workspaces for org: <org-id>
[AppContext] Workspaces loaded: [{ id: "...", name: "testuser's Workspace", is_default: true, ... }]
[WorkspaceSwitcher] Workspaces: Array(1)
[WorkspaceSwitcher] Current Workspace: { id: "...", name: "testuser's Workspace", is_default: true }
[OrganizationSwitcher] Organizations: Array(1)
```

### 4. Check Sidebar UI

- ✅ Sidebar shows 1 workspace avatar
- ✅ Profile page visible in menu (because in default workspace)
- ✅ + icon shows (user has workspace:create permission)
- ✅ Org switcher at bottom shows 1 organization

---

## Timeline

**Estimated time to fix**: 15-30 minutes

**Steps**:
1. Open `/backend/src/app/services/auth_service.py`
2. Find `register_email()` function
3. Add workspace creation code after organization creation
4. Update token_data to include workspace_id
5. Test signup flow
6. Verify database has workspace with is_default=true
7. Check frontend console logs

**Once fixed, the entire multi-tenancy flow will work perfectly!** 🚀
