# Chatbot vs Chatflow Separation

This document confirms that chatbots and chatflows are treated as **separate entities/models** throughout the codebase.

## Summary

- **Chatbot**: Simple form-based bots for FAQ, knowledge base, basic Q&A
- **Chatflow**: Advanced drag-and-drop workflow bots with ReactFlow, conditionals, API calls, and complex logic

## Files Updated to Ensure Separation

### 1. Models (Separate Tables)

**✅ `models/chatbot.py`** - Simple chatbot model
- Table: `chatbots`
- Config: Simple JSON settings
- Use case: FAQ, knowledge retrieval

**✅ `models/chatflow.py`** - NEW FILE CREATED
- Table: `chatflows`
- Config: ReactFlow nodes, edges, variables
- Use case: Multi-step workflows, API integration, conditional logic

**✅ `models/workspace.py`** - UPDATED
```python
chatbots: list[Chatbot] (one-to-many)
chatflows: list[Chatflow] (one-to-many)  # ADDED
```

**✅ `models/user.py`** - UPDATED
```python
created_chatbots: list[Chatbot]
created_chatflows: list[Chatflow]  # ADDED
```

### 2. Database Registration

**✅ `db/base.py`** - UPDATED
```python
from app.models.chatbot import Chatbot  # noqa
from app.models.chatflow import Chatflow  # noqa  # ADDED

NOTE: Chatbot and Chatflow are SEPARATE models
```

### 3. Schemas (Separate API Contracts)

**✅ `schemas/chatbot.py`** - EXISTS
- Supports simple chatbot configuration
- Form-based settings

**✅ `schemas/chatflow.py`** - NEW FILE CREATED
- ChatflowNode, ChatflowEdge, ChatflowConfig
- ReactFlow-specific structure
- Workflow variables and settings

### 4. Services

**✅ `services/permission_service.py`** - ALREADY SEPARATED
```python
ORGANIZATION_PERMISSIONS = {
    "owner": {
        "chatbot:create": True,
        "chatbot:edit": True,
        "chatbot:delete": True,
        "chatflow:create": True,   # Separate permission
        "chatflow:edit": True,     # Separate permission
        "chatflow:delete": True,   # Separate permission
    }
}

WORKSPACE_PERMISSIONS = {
    "admin": {
        "chatbot:create": True,
        "chatbot:edit": True,
        "chatbot:delete": True,
        "chatflow:create": True,   # Separate permission
        "chatflow:edit": True,     # Separate permission
        "chatflow:delete": True,   # Separate permission
    }
}
```

**✅ `services/tenant_service.py`** - ALREADY SEPARATED
```python
return {
    "chatbot_count": len(ws.chatbots),
    "chatflow_count": len(ws.chatflows)  # Separate count
}
```

### 5. Documentation

**✅ `CLAUDE.md`** - UPDATED
```markdown
- **`chatbots`**: Bot resources (simple form-based)
- **`chatflows`**: Bot resources (drag-and-drop workflows)
  Chatbot and chatflow should be treated as separate entities/models
```

## API Structure (To Be Implemented)

When implementing the API routes, ensure separation:

```
/api/v1/chatbots/          # Chatbot endpoints
├── POST /                 # Create chatbot
├── GET /{id}              # Get chatbot
├── PUT /{id}              # Update chatbot
└── DELETE /{id}           # Delete chatbot

/api/v1/chatflows/         # Chatflow endpoints (SEPARATE)
├── POST /                 # Create chatflow
├── GET /{id}              # Get chatflow
├── PUT /{id}              # Update chatflow
└── DELETE /{id}           # Delete chatflow
```

## Database Tables

Two separate tables will be created:

```sql
CREATE TABLE chatbots (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    workspace_id UUID REFERENCES workspaces(id),
    config JSONB,  -- Simple configuration
    created_by UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

CREATE TABLE chatflows (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    workspace_id UUID REFERENCES workspaces(id),
    config JSONB,  -- ReactFlow nodes/edges/variables
    version INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

## Key Differences

| Aspect | Chatbot | Chatflow |
|--------|---------|----------|
| **Model** | `models/chatbot.py` | `models/chatflow.py` |
| **Schema** | `schemas/chatbot.py` | `schemas/chatflow.py` |
| **Table** | `chatbots` | `chatflows` |
| **Config** | Simple JSON | ReactFlow graph (nodes/edges) |
| **Creation** | Form-based UI | Drag-and-drop ReactFlow |
| **Complexity** | Simple settings | Complex workflows |
| **Features** | Knowledge base, basic prompts | Conditionals, loops, API calls, variables |
| **Permissions** | `chatbot:*` | `chatflow:*` |
| **API Routes** | `/chatbots` | `/chatflows` |

## Verification Checklist

- [x] Separate model files created
- [x] Both models registered in `db/base.py`
- [x] Workspace has both relationships (chatbots + chatflows)
- [x] User has both creation relationships
- [x] Separate schema files
- [x] Separate permissions in permission service
- [x] Separate counts in tenant service
- [x] Documentation updated
- [ ] Separate API route files (to be implemented)
- [ ] Separate database migrations (to be created)
- [ ] Frontend separate builders (to be implemented)

## Conclusion

✅ **Chatbot and Chatflow are fully separated as distinct entities/models throughout the codebase.**

This separation provides:
- **Clarity**: Clear distinction between simple and advanced bots
- **Maintainability**: Separate code paths are easier to maintain
- **Scalability**: Can evolve features independently
- **Flexibility**: Different permissions, APIs, and UIs for each type
- **Type Safety**: Proper validation for each structure
