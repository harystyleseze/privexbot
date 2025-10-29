# Multi-Tenancy Architecture

## Overview

This dashboard implements a comprehensive multi-tenancy architecture with Organization and Workspace-based access control.

## Platform Overview

### Two Creation Modes:

1. **Simple Chatbots** - Form-based interface for quick FAQ bots and simple Q&A assistants
2. **Advanced Chatflows** - Visual drag-and-drop workflow builder (like n8n/Dify) for complex, multi-step conversational AI

Both modes support:

- 📚 RAG-powered Knowledge Bases (files, websites, Notion, Google Docs)
- 🌍 Multi-Channel Deployment (Website, Discord, Telegram, WhatsApp, API)
- 📊 Lead Capture & Analytics
- 🎨 Full Customization

## Hierarchy Structure

```
User
 └── Organizations (multiple)
      ├── Organization Role: owner | admin | member
      └── Workspaces (multiple per org)
           ├── Workspace Role: admin | editor | viewer
           ├── Chatbots (simple, form-based)
           ├── Chatflows (advanced, node-based) - Studio
           ├── Knowledge Bases (RAG)
           └── Leads (captured data)
```

## Core Entities

### 1. Organization

- Top-level tenant
- Owns workspaces
- Billing and subscription management
- Roles: Owner, Admin, Member

### 2. Workspace

- Sub-tenant within organization
- Contains chatbots, chatflows, knowledge bases
- Team collaboration unit
- Roles: Admin, Editor, Viewer

### 3. Chatbot (Simple)

- **Creation**: Form-based UI (accessible from Chatbots page)
- **Execution**: Linear, single AI call per message
- **Use Cases**: FAQ bots, simple Q&A assistants
- **Access**: Available to all workspace members (admin/editor/viewer)

### 4. Chatflow (Advanced)

- **Creation**: Visual drag-and-drop editor in **Studio page** (ReactFlow)
- **Execution**: Graph traversal, multiple AI calls, complex logic
- **Use Cases**: Multi-step workflows, conditional logic, integrations
- **Nodes**: LLM, KB Search, HTTP, Database, Condition, Loop, etc.
- **Access**: Requires workspace write permission (admin/editor only)

### 5. Knowledge Base

- **Purpose**: RAG (Retrieval-Augmented Generation)
- **Sources**: Files (PDF, Word, CSV), websites, Google Docs, Notion, Sheets
- **Architecture**: Draft mode → Finalize → Background processing (Celery)
- **Sharing**: One KB can serve multiple chatbots/chatflows
- **Vectors**: FAISS, Qdrant, Weaviate, Milvus, Pinecone support

### 6. Lead

- **Purpose**: Capture user info from bot interactions
- **Data**: Email, name, phone, geolocation (IP-based)
- **Sources**: Website widget, Discord, Telegram, WhatsApp
- **Analytics**: Geographic distribution, conversion tracking

## Access Control Logic

### Organizations Page

- **Availability**: Visible in ALL organizations the user belongs to
- **Purpose**: Central hub to view all organizations and their workspaces
- **Features**:
  - View all organizations user has access to
  - See role in each organization (Owner/Admin/Member)
  - Switch between organizations
  - View workspaces within current organization
  - See workspace roles and member counts

### Profile Page

- **Availability**: Only in default organization's default workspace
- **Purpose**: Personal user settings and information
- **Reason**: Profile is user-specific, not organization-specific

### Main Menu Items by Context

#### Always Available (in any org/workspace):

- **Dashboard** - Overview, stats, recent activity
- **Chatbots** - Simple form-based chatbot management (all roles)
- **Analytics** - Performance metrics, conversation analytics
- **Marketplace** - Pre-built templates and integrations
- **Referrals** - Referral program management
- **Organizations** - View/switch orgs and workspaces

#### Permission-Based:

- **Studio**: Page dedicated to **Chatflows** (advanced drag-and-drop workflow builder)
  - **Chatflows** are complex, multi-step conversational AI built with visual node editor (like n8n/Dify)
  - Different from **Chatbots** (simple form-based FAQ bots accessible to all workspace members)
  - Requires `workspace:write` permission (ability to create/edit resources)
  - Available to: Workspace Admin or Editor
  - Hidden for: Workspace Viewer (read-only access)
  - Resource Access: Users can view/edit chatflows they created or were explicitly granted access to

#### Context-Based:

- **Profile**: Only in default org + default workspace
  - Personal settings shouldn't be duplicated across contexts

## Context Switching

### Organization Switch

```typescript
switchOrganization(orgId, workspaceId?)
```

1. Sets new current organization
2. Loads all workspaces for that organization
3. Sets current workspace (specified or first available)
4. Updates JWT token with new context
5. Recalculates permissions

### Workspace Switch

```typescript
switchWorkspace(workspaceId);
```

1. Sets new current workspace within same organization
2. Updates JWT token with new context
3. Recalculates permissions
4. Menu items update based on new workspace role

## Permission Matrix

### Organization-Level Permissions

| Permission         | Owner | Admin | Member |
| ------------------ | ----- | ----- | ------ |
| `org:read`         | ✅    | ✅    | ✅     |
| `org:write`        | ✅    | ✅    | ❌     |
| `org:billing`      | ✅    | ❌    | ❌     |
| `org:members`      | ✅    | ✅    | ❌     |
| `workspace:create` | ✅    | ✅    | ❌     |

### Workspace-Level Permissions

| Permission             | Admin                 | Editor         | Viewer         |
| ---------------------- | --------------------- | -------------- | -------------- |
| `workspace:read`       | ✅                    | ✅             | ✅             |
| `workspace:write`      | ✅                    | ✅             | ❌             |
| `resource:create`      | ✅                    | ✅             | ❌             |
| `resource:delete`      | ✅                    | ❌             | ❌             |
| **Chatbots (Simple)**  | ✅ Create/Edit/Delete | ✅ View/Use    | ✅ View Only   |
| **Chatflows (Studio)** | ✅ Create/Edit/Delete | ✅ Create/Edit | ❌ No Access\* |
| **Knowledge Bases**    | ✅ Create/Edit/Delete | ✅ Create/Edit | ✅ View Only   |
| **Leads**              | ✅ View/Export/Delete | ✅ View/Export | ✅ View Only   |

\*Viewers cannot access Studio page but can interact with deployed chatflows

## User Scenarios

### Scenario 1: User Accepts Organization Invite

1. User receives invitation to join "Acme Corp"
2. User accepts → Added to organization as "Member"
3. **Organizations page appears in sidebar** (user can view all orgs and workspaces)
4. User can switch to "Acme Corp"
5. Sees workspaces they have access to in "Acme Corp"
6. Can switch between workspaces based on their permissions

### Scenario 2: User Invited to Specific Workspace

1. User invited to "Marketing" workspace in "Acme Corp" as **Editor**
2. User accepts → Added to org (if not already) and workspace
3. **Organizations page visible** to manage access
4. User switches to "Acme Corp"
5. Sees only workspaces they have access to
6. "Marketing" workspace appears with "Editor" role badge
7. **Studio menu appears** (Editor has `workspace:write` permission)
8. User can create chatflows in Studio
9. User can create/edit simple chatbots
10. User can view but not delete leads

### Scenario 3: User Creates New Organization

1. User creates "My Startup"
2. Automatically becomes **Owner** of organization
3. Default workspace created automatically
4. User has full access to:
   - All organization settings
   - Workspace creation
   - Member management
   - Billing (owner only)

### Scenario 4: Viewer Role Access

1. User invited to "Support" workspace as **Viewer**
2. Can access:
   - Dashboard (view only)
   - Chatbots page (can see list, test bots, but cannot create/edit)
   - Analytics (view only)
   - Knowledge Bases (view content, cannot edit)
   - Leads (view only, cannot export or delete)
3. Cannot access:
   - **Studio** (menu item hidden - no chatflow creation)
4. Cannot perform:
   - Create/edit/delete any resources
   - Change workspace settings
   - Invite members

### Scenario 5: Multi-Organization User

1. User belongs to 3 organizations:
   - "Personal" (Owner) - Default org
   - "Client A" (Admin) - Invited
   - "Agency X" (Viewer) - Invited
2. User switches to "Client A":
   - Organizations page shows all 3 orgs
   - Workspaces section shows only "Client A" workspaces
   - Studio appears (Admin has write access)
   - Can create chatflows and chatbots
3. User switches to "Agency X":
   - Studio disappears (Viewer has no write access)
   - Can view and test existing chatbots
   - Can view analytics but not export data

## API Endpoints Used

### Context Management

- `POST /api/v1/switch/organization` - Switch organization context
- `POST /api/v1/switch/workspace` - Switch workspace context

### Data Fetching

- `GET /api/v1/orgs/` - List all user's organizations
- `GET /api/v1/orgs/{org_id}/workspaces` - List workspaces in org
- `GET /api/v1/auth/me` - Get current user info

## UI Behavior

### Sidebar - Organizations Menu

```
When clicked → Shows:
├── Current Organization (highlighted)
│   ├── Role badge
│   ├── Plan type
│   └── Member count
├── Workspaces in Current Org
│   ├── Workspace 1 (Active badge if current)
│   │   ├── Role badge
│   │   └── Member count
│   ├── Workspace 2
│   └── ...
└── All Organizations List
    ├── Org 1 (Current indicator)
    ├── Org 2 (Switch button)
    └── ...
```

### Dynamic Menu Updates

- Menu items show/hide based on current context
- Permission checks run after every context switch
- Workspace roles affect Studio visibility
- Organization roles affect workspace creation ability

## Security Considerations

1. **JWT Token Updates**: Every context switch updates JWT with new org/workspace IDs
2. **Server-Side Validation**: All API calls validate user has access to requested resources
3. **Permission Checks**: UI checks are convenience - server enforces all permissions
4. **Workspace Isolation**: Users only see workspaces they have explicit access to
5. **Organization Boundaries**: Cannot access resources outside current organization

## Best Practices

### For Users

- Use Organizations page to understand your access levels
- Switch contexts deliberately - be aware of which org/workspace you're in
- Check role badges to understand your permissions

### For Developers

- Always check `hasPermission()` before showing sensitive UI
- Use `currentOrganization` and `currentWorkspace` from AppContext
- Call `switchOrganization()` or `switchWorkspace()` for context changes
- Trust server-side validation over client-side checks
- Update JWT after context switches

## Future Enhancements

### Organization & Access Management

- [ ] Organization invitations management UI
- [ ] Workspace invitations UI with role selection
- [ ] Role change requests workflow
- [ ] Audit logs per organization
- [ ] Resource usage by workspace

### Chatbot & Chatflow Features

- [ ] Chatflow templates marketplace
- [ ] Collaborative chatflow editing (real-time)
- [ ] Chatflow version comparison and diff
- [ ] Cross-workspace chatflow sharing (with permissions)
- [ ] Chatflow testing environment (sandbox mode)

### Knowledge Base Enhancements

- [ ] Knowledge base sharing across organizations (public/private)
- [ ] Multi-language knowledge base support
- [ ] Automatic knowledge base updates from sources
- [ ] KB usage analytics per chatbot/chatflow

### Deployment & Integration

- [ ] Multi-channel deployment wizard
- [ ] Custom domain support for widgets
- [ ] White-label branding options
- [ ] Advanced API rate limiting per workspace
- [ ] Webhook event streaming

### Analytics & Monitoring

- [ ] Real-time conversation monitoring
- [ ] A/B testing for chatbots
- [ ] Conversion funnel analytics
- [ ] Lead scoring and enrichment
- [ ] Custom dashboard builder
