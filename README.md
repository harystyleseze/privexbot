# 📘 PrivexBot

## 🔖 Project Name

**PrivexBot — Privacy‑First AI Chatbot Builder Powered by Secret VM**

---

## 📌 Overview

PrivexBot is a privacy‑focused, secure chatbot builder platform that empowers organizations to build and deploy AI‑powered chatbots trained on their own data. Unlike many traditional platforms, **all** AI workloads — including data ingestion, training, and inference — are executed within **Secret VM** environments (Trusted Execution Environments, or TEEs) to ensure:

- Confidential computation
- Remote attestation
- Zero data leakage

PrivexBot supports multi‑platform deployment: widgets, Discord, Telegram, WhatsApp, Slack, custom domains or URLs, etc. Teams, enterprises, and agencies can build, manage, and distribute custom AI assistants (powered by **Secret AI**) with full control over knowledge base, workflow logic, and deployment.

---

## 🚀 Project Goals

- **Privacy & Security**: Ensure that user data, prompts, and AI model outputs remain confidential and tamper‑proof.
- **Ease of Use**: Provide both simple form‑based chatbot creation and more complex visual/workflow‑oriented “chatflows.”
- **Flexibility & Integrations**: Allow integrations with existing tools (Zapier, telegram, etc.), varied deployment modes (embed widget, APIs, etc.).
- **Scalability**: Should handle multiple bots, users, teams; versioning; memory/context in workflows.
- **Regulatory Compliance**: Designed with enterprise & data protection regulations in mind (e.g. HIPAA, GDPR).

---

## 🔐 Why Secret VMs and Trusted Infrastructure Matter

Running on Secret VMs introduces several key advantages:

- **End‑to‑end Confidentiality**: Data, prompts, responses are kept encrypted in memory during all compute.
- **Remote Attestation**: Ability to cryptographically verify that the code/data have not been altered.
- **Zero Trust Architecture**: Reduce risk surface; even administrators or platform hosts cannot access plaintext data.
- **Compliance & Auditing**: Helps satisfy enterprise / regulated‑industry security / privacy requirements.

---

## Project Structure

```
├── README.md
├── backend
│   ├── __init__.py
│   ├── pyproject.toml
│   ├── src
│   │   ├── Dockerfile
│   │   ├── __init__.py
│   │   ├── alembic.ini
│   │   └── app
│   │       ├── __init__.py
│   │       ├── alembic
│   │       │   ├── __init__.py
│   │       │   ├── env.py
│   │       │   ├── script.py.mako
│   │       │   └── versions
│   │       ├── api
│   │       │   ├── __init__.py
│   │       │   └── v1
│   │       │       ├── __init__.py
│   │       │       ├── dependencies.py
│   │       │       └── routes
│   │       │           ├── __init__.py
│   │       │           ├── auth.py
│   │       │           ├── chatbot.py
│   │       │           ├── org.py
│   │       │           └── workspace.py
│   │       ├── auth
│   │       │   ├── __init__.py
│   │       │   └── strategies
│   │       │       ├── __init__.py
│   │       │       ├── cosmos.py
│   │       │       ├── email.py
│   │       │       ├── evm.py
│   │       │       └── solana.py
│   │       ├── core
│   │       │   ├── __init__.py
│   │       │   ├── config.py
│   │       │   └── security.py
│   │       ├── db
│   │       │   ├── __init__.py
│   │       │   ├── base.py
│   │       │   ├── base_class.py
│   │       │   └── session.py
│   │       ├── main.py
│   │       ├── models
│   │       │   ├── __init__.py
│   │       │   ├── auth_identity.py
│   │       │   ├── chatbot.py
│   │       │   ├── organization.py
│   │       │   ├── organization_member.py
│   │       │   ├── user.py
│   │       │   ├── workspace.py
│   │       │   └── workspace_member.py
│   │       ├── schemas
│   │       │   ├── __init__.py
│   │       │   ├── chatbot.py
│   │       │   ├── organization.py
│   │       │   ├── token.py
│   │       │   ├── user.py
│   │       │   └── workspace.py
│   │       ├── services
│   │       │   ├── __init__.py
│   │       │   ├── auth_service.py
│   │       │   ├── permission_service.py
│   │       │   └── tenant_service.py
│   │       ├── tasks
│   │       │   ├── __init__.py
│   │       │   └── celery_worker.py
│   │       ├── tests
│   │       │   ├── __init__.py
│   │       │   ├── conftest.py
│   │       │   ├── test_auth.py
│   │       │   └── test_tenancy.py
│   │       └── utils
│   │           ├── __init__.py
│   │           └── redis.py
│   └── uv.lock
└── frontend
    ├── Dockerfile
    ├── README.md
    ├── components.json
    ├── eslint.config.js
    ├── index.html
    ├── package-lock.json
    ├── package.json
    ├── postcss.config.js
    ├── public
    │   └── vite.svg
    ├── src
    │   ├── api
    │   │   ├── apiClient.ts
    │   │   ├── auth.ts
    │   │   ├── chatbot.ts
    │   │   ├── organization.ts
    │   │   └── workspace.ts
    │   ├── components
    │   │   ├── App
    │   │   │   └── App.tsx
    │   │   ├── auth
    │   │   ├── common
    │   │   ├── dashboard
    │   │   └── ui
    │   │       └── button.tsx
    │   ├── contexts
    │   │   ├── AuthContext.tsx
    │   │   ├── TenantContext.tsx
    │   │   └── index.tsx
    │   ├── hooks
    │   │   ├── useAuth.ts
    │   │   └── useTenant.ts
    │   ├── lib
    │   │   └── utils.ts
    │   ├── main.tsx
    │   ├── pages
    │   │   ├── Dashboard.tsx
    │   │   ├── LoginPage.tsx
    │   │   └── OrgSwitchPage.tsx
    │   ├── routes
    │   │   └── PrivateRoute.tsx
    │   ├── styles
    │   │   └── index.css
    │   └── utils
    │       └── permissions.ts
    ├── tailwind.config.js
    ├── tsconfig.app.json
    ├── tsconfig.json
    ├── tsconfig.node.json
    └── vite.config.ts
```

---

### Detailed Breakdown: Backend Structure

```
backend/
├── app/
│   ├── main.py
│   ├── __init__.py
│   ├── api/
│   ├── auth/
│   ├── core/
│   ├── db/
│   ├── models/
│   ├── schemas/
│   ├── services/
│   ├── utils/
│   ├── tasks/
│   ├── tests/
│   └── alembic/
├── requirements/
├── Dockerfile
├── alembic.ini
└── .env
```

#### 📌 app/main.py

**What:**
Entry point of the FastAPI application.

**Responsibilities:**

- Instantiate FastAPI app
- Include API routers
- Mount middleware, CORS, error handlers

**Integration:**

- Imports routes from `api/v1/routes/`
- Uses config from `core/config.py`

---

#### 📁 api/

**What:**
HTTP API layer, versioned (v1, v2, ...).

**Responsibilities:**

- Defines route handlers (auth.py, chatbot.py, etc.)
- Contains dependency injections (auth guards, permissions)

**Integration:**

- Uses Pydantic schemas for validation
- Calls services for business logic
- Uses auth for authentication/authorization

---

#### 📁 auth/

**What:**
Authentication strategies (email, blockchain wallets, etc.)

**Responsibilities:**

- Email login/signup
- Ethereum, Solana, Cosmos wallet auth
- Nonce creation, signature verification

**Integration:**

- Called by API auth routes
- Uses Redis (via utils/redis.py) for nonce caching

---

#### 📁 core/

**What:**
App-wide settings and security utilities.

**Responsibilities:**

- Config loader (`config.py`)
- JWT, password hashing (`security.py`)
- Constants and shared utilities

**Integration:**

- Used throughout app startup, services, and routes

---

#### 📁 db/

**What:**
Database connection and session management.

**Responsibilities:**

- SQLAlchemy session and base models
- Initializes ORM base classes and mixins

**Integration:**

- Used by models, services, and API layers

---

#### 📁 models/

**What:**
ORM models representing database tables.

**Responsibilities:**

- User, Organization, Workspace models
- Relationships and tenancy via foreign keys

**Integration:**

- Used by services, Alembic for migrations

---

#### 📁 schemas/

**What:**
Pydantic schemas for request validation and response serialization.

**Responsibilities:**

- Validate API inputs
- Control API outputs

**Integration:**

- Used in API routes and sometimes in services

---

#### 📁 services/

**What:**
Business logic layer.

**Responsibilities:**

- Authentication service (login/signup/JWT)
- Tenant resolution (org/workspace)
- Permission mapping (roles → permissions)

**Integration:**

- Called by API route handlers

---

#### 📁 utils/

**What:**
Helper functions and utilities.

**Responsibilities:**

- Redis client
- Common helpers used across modules

**Integration:**

- Used by auth, services, tasks

---

#### 📁 tasks/

**What:**
Background task runners (e.g., Celery workers).

**Responsibilities:**

- Runs asynchronous jobs (e.g., email sending)

**Integration:**

- Linked via async workflows, message brokers

---

#### 📁 tests/

**What:**
Backend unit and integration tests.

**Responsibilities:**

- Pytest tests
- Test fixtures and clients

**Integration:**

- Tests routes, services, auth, tenancy

---

#### 📁 alembic/

**What:**
Database schema migration tool.

**Responsibilities:**

- Migration scripts (`versions/`)
- Alembic environment config (`env.py`)
- Templates for migrations

**Integration:**

- Reflects `models/` for schema changes

---

#### 📁 requirements/

**What:**
Dependencies split by environment.

**Files:**

- `base.txt` (common)
- `dev.txt` (development)
- `prod.txt` (production)

---

### Detailed Breakdown: Frontend Structure

```
frontend/
├── public/
├── src/
│   ├── App.tsx
│   ├── index.tsx
│   ├── api/
│   ├── components/
│   ├── contexts/
│   ├── hooks/
│   ├── pages/
│   ├── routes/
│   ├── styles/
│   └── utils/
├── package.json
├── tsconfig.json
└── Dockerfile
```

---

#### 📁 public/

Static assets like HTML, favicon, and manifest files.

---

#### 📁 src/

React app source code.

- **App.tsx / index.tsx**:
  Entry points setting up providers and routing.

---

#### 📁 api/

Axios clients for backend communication.

- `auth.ts`: login/signup/logout requests
- `chatbot.ts`: chatbot CRUD
- `apiClient.ts`: base axios with JWT headers

---

#### 📁 components/

Reusable UI parts.

- `auth/`: login/register forms
- `dashboard/`: org/workspace switchers
- `common/`: buttons, modals, loaders

---

#### 📁 contexts/

Global state management using React Context.

- `AuthContext`: JWT, user info, permissions
- `TenantContext`: current org/workspace

---

#### 📁 hooks/

Reusable React hooks.

- `useAuth.ts`: auth actions
- `useTenant.ts`: tenant context management

---

#### 📁 pages/

Route components/screens.

- `LoginPage.tsx`
- `Dashboard.tsx`
- `OrgSwitchPage.tsx`

---

#### 📁 routes/

Route protection and navigation.

- `PrivateRoute.tsx`: protects routes requiring auth

---

#### 📁 styles/

Central styles (CSS, Tailwind config).

---

#### 📁 utils/

Helpers like permission checks (`hasPermission()`).

---

### How Backend & Frontend Interact

| Frontend Component  | Backend Component      | Purpose                          |
| ------------------- | ---------------------- | -------------------------------- |
| api/auth.ts         | api/v1/routes/auth.py  | Authentication API requests      |
| AuthContext         | JWT tokens             | Stores user info and permissions |
| TenantContext       | Auth/session switching | Tenant context switching         |
| Axios client        | Middleware             | Sends JWT with each request      |
| Permissions (utils) | permission_service.py  | Frontend permission checks       |

---

### Summary: Design Principles

| Goal            | Implementation                      |
| --------------- | ----------------------------------- |
| Multi-tenancy   | Foreign keys (org_id, workspace_id) |
| Flexible auth   | Pluggable auth strategies           |
| Scoped access   | JWT + permission service            |
| Permission UI   | AuthContext with claims             |
| Maintainability | Modular folder separation           |
| Scalability     | Redis, background tasks             |
| Security        | CORS, JWT, tenancy enforcement      |
