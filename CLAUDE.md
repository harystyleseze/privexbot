# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PrivexBot** is a privacy-first, multi-tenant SaaS platform for building and deploying AI chatbots. All AI workloads execute within Secret VM (Trusted Execution Environments) to ensure confidential computation. The platform supports both simple form-based chatbots and complex visual workflow-based chatflows.

**Architecture**: Monorepo with three packages:
- **backend/**: FastAPI (Python 3.11+) with PostgreSQL, Redis, Celery
- **frontend/**: React 19 + TypeScript + Vite with Tailwind CSS
- **widget/**: Vanilla JavaScript embeddable chat widget

**Multi-tenancy hierarchy**: `Organization → Workspace → Resources (Chatbots/Chatflows/KnowledgeBases)`

## Development Commands

### Backend (FastAPI)

```bash
cd backend

# Install dependencies (using uv)
uv pip install -e .

# Run development server
cd src && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Database migrations
cd src
alembic revision --autogenerate -m "description"
alembic upgrade head
alembic downgrade -1

# Run tests
pytest
pytest app/tests/test_auth.py  # Single test file
pytest -v  # Verbose
pytest -k "test_name"  # Run specific test

# Linting
ruff check .
mypy app/
```

### Frontend (React + TypeScript)

```bash
cd frontend

# Install dependencies
npm install

# Development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Linting
npm run lint
```

### Widget

```bash
cd widget

# Install dependencies
npm install

# Development build (watch mode)
npm run dev

# Production build
npm run build
```

## Architecture Deep Dive

### Multi-Tenancy Model

**Critical**: All database queries MUST filter by tenant context (org_id/workspace_id from JWT) to prevent data leakage between organizations.

**Hierarchy**:
```
User
├── OrganizationMember (role: owner/admin/member)
│   └── Organization
│       └── Workspace
│           ├── Chatbot (form-based, simple)
│           ├── Chatflow (visual workflow, complex)
│           └── KnowledgeBase (RAG documents)
```

**Key Points**:
- Users can belong to multiple organizations with different roles
- Organization owners/admins have access to ALL workspaces within their org
- Workspace members have role-based access (viewer/editor/admin)
- JWT contains: `user_id`, `org_id`, `ws_id`, `permissions[]`
- Context switching issues new JWT with updated org_id/ws_id

### Authentication Flow

**Multi-provider support**: Email/password, MetaMask (EVM), Phantom (Solana), Keplr (Cosmos)

**Models**:
- `User`: Core identity (username, is_active)
- `AuthIdentity`: Links user to auth methods (provider, provider_id, credentials)

**Flow**:
1. User authenticates via strategy (`app/auth/strategies/`)
2. Strategy verifies credentials (password hash or wallet signature)
3. `auth_service.py` orchestrates: creates/fetches user, assigns default org, gets permissions
4. Returns JWT with tenant context

**Important**: One user can have multiple auth identities (e.g., email + 3 wallets)

### Service Layer Architecture

**Location**: `backend/src/app/services/`

**Responsibilities**:
- `auth_service.py`: Authentication orchestration, JWT generation, context switching
- `tenant_service.py`: Multi-tenancy operations, membership management, access verification
- `permission_service.py`: Role → Permission mapping, RBAC enforcement

**Pattern**: Routes call services → Services contain business logic → Services call models

**Critical Function**: `tenant_service.verify_tenant_access()` - MUST be called before any resource access to enforce tenant isolation.

### Database Session Management

**Pattern**: Dependency injection via `app/api/v1/dependencies.py`

```python
from app.db.session import get_db

@router.get("/resource")
def get_resource(db: Session = Depends(get_db)):
    # db auto-closed after request
```

**Configuration**: SQLAlchemy with connection pooling (pool_size=10, max_overflow=20)

### Frontend Context Architecture

**Two main contexts** (in `frontend/src/contexts/`):
- `AuthContext`: JWT token, user info, login/logout, permissions
- `TenantContext`: Current org_id/ws_id, org/workspace switching

**Pattern**:
1. User logs in → JWT stored in AuthContext
2. JWT decoded to get default org_id/ws_id → Set in TenantContext
3. User switches org → Call `/api/v1/auth/switch-context` → New JWT issued
4. API requests include JWT in Authorization header → Backend validates tenant context

### Key Architectural Patterns

1. **Draft-First Creation**: Chatbots/KnowledgeBases are created in Redis as drafts before committing to PostgreSQL (allows preview/testing)

2. **Background Processing**: Document indexing, website crawling, etc. handled by Celery tasks (never block API requests)

3. **Separation of Chatbots vs Chatflows**:
   - **Chatbot**: Simple, form-based, good for FAQs
   - **Chatflow**: Complex, visual workflow builder (ReactFlow), multi-step logic
   - Both are separate models/tables/endpoints

4. **RAG Knowledge Bases**: Multi-source import (files, websites, Notion, Google Docs), chunking strategies, vector search

## Testing Strategy

**Backend**: pytest with fixtures in `conftest.py`
- Test database isolation (each test gets clean DB)
- Mock external services (AI inference, webhooks)
- Test multi-tenancy isolation rigorously

**Frontend**: Vitest + React Testing Library
- Component unit tests
- Context provider tests
- API client mocking

**Key Test Files**:
- `backend/src/app/tests/test_auth.py`: Auth flows
- `backend/src/app/tests/test_tenancy.py`: Multi-tenancy isolation

## Common Gotchas

1. **Multi-tenancy violations**: Always filter queries by org_id from JWT. Use `verify_tenant_access()` before resource access.

2. **Chatbot vs Chatflow confusion**: These are SEPARATE entities. Don't merge or confuse them in code.

3. **JWT context switching**: When user switches org/workspace, must issue NEW JWT with updated context (not just update claims).

4. **Redis for drafts**: Draft chatbots/KBs live in Redis. Must explicitly "commit" to PostgreSQL.

5. **Cascade deletes**: Organization deletion cascades to Workspaces → Chatbots/Chatflows/KBs. Ensure proper cascade configuration in SQLAlchemy relationships.

6. **Auth identity separation**: User and AuthIdentity are separate tables. One user can have multiple auth methods.

## Important Files to Understand

### Backend Core
- `backend/src/app/main.py`: FastAPI app entry point, CORS, middleware
- `backend/src/app/core/config.py`: Environment-based settings (DATABASE_URL, REDIS_URL, JWT_SECRET)
- `backend/src/app/db/session.py`: SQLAlchemy session factory and dependency
- `backend/src/app/api/v1/dependencies.py`: Reusable dependencies (get_current_user, verify_permissions)

### Multi-tenancy
- `backend/src/app/services/tenant_service.py`: Tenant operations and isolation
- `backend/src/app/models/organization.py`: Top-level tenant model
- `backend/src/app/models/workspace.py`: Workspace model

### Authentication
- `backend/src/app/services/auth_service.py`: Auth orchestration
- `backend/src/app/auth/strategies/`: Provider-specific auth (email, EVM, Solana, Cosmos)
- `backend/src/app/core/security.py`: JWT creation, password hashing

### Frontend State
- `frontend/src/contexts/AuthContext.tsx`: Auth state and JWT management
- `frontend/src/contexts/TenantContext.tsx`: Org/workspace context
- `frontend/src/api/apiClient.ts`: Axios instance with JWT headers

## Environment Variables

**Backend** (`.env` in backend/):
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection for nonce caching and draft storage
- `SECRET_KEY`: JWT signing key (must be strong random string)
- `BACKEND_CORS_ORIGINS`: Allowed origins for CORS (JSON array)

**Frontend** (`.env` in frontend/):
- `VITE_API_URL`: Backend API base URL (e.g., http://localhost:8000)

## Coding Conventions

1. **Type Safety**: Use Pydantic schemas for API validation, TypeScript strict mode for frontend

2. **Pseudocode Comments**: Many backend files contain pseudocode explaining WHY and HOW. Read these before modifying.

3. **Role Hierarchies**:
   - Organization: owner > admin > member
   - Workspace: admin > editor > viewer

4. **UUID Primary Keys**: All models use UUID for primary keys (security, no enumeration attacks)

5. **Soft Deletes**: Use `is_active` flags rather than hard deletes when possible

6. **Async Consistency**: Backend uses async/await for I/O operations. Keep it consistent.

## Permissions System

**Stored in JWT** as `perms` array for fast authorization.

**Permission format**: `{resource}:{action}`
- Examples: `chatbot:create`, `workspace:delete`, `org:invite`

**Checking permissions**:
- Backend: `permission_service.check_permission(user, "chatbot:create")`
- Frontend: `hasPermission(permissions, "chatbot:create")` from `utils/permissions.ts`

**Regenerated**: When user switches context or role changes
