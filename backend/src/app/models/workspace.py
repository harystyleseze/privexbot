"""
Workspace model - Subdivision within an organization.

WHY:
- Organize resources within an organization (e.g., "Engineering", "Marketing")
- Finer-grained access control than organization level
- Separate chatbots by department or project

HOW:
- Lives within an organization (must have organization_id)
- Users access workspaces via WorkspaceMember with roles
- Contains chatbots and other resources

PSEUDOCODE:
-----------
class Workspace(Base):
    __tablename__ = "workspaces"

    # Fields
    id: UUID (primary key, auto-generated)
        WHY: Unique identifier for this workspace
        HOW: Used in JWT as ws_id for workspace context

    name: str (workspace name, required)
        WHY: Human-readable workspace name
        EXAMPLE: "Customer Support Bots", "Sales Team"

    organization_id: UUID (foreign key -> organizations.id, indexed, cascade delete)
        WHY: CRITICAL - Links workspace to parent organization for tenancy
        HOW: Indexed for fast queries, required field, cannot be null
        TENANT ISOLATION: All workspace operations must verify org_id matches user's org

    created_by: UUID (foreign key -> users.id, nullable)
        WHY: Track who created this workspace

    created_at: datetime (auto-set on creation)
    updated_at: datetime (auto-update on modification)

    # Relationships
    organization: Organization (many-to-one back reference)
        WHY: Access parent organization from workspace
        HOW: workspace.organization.name

    creator: User (many-to-one)
        WHY: Reference to user who created workspace

    members: list[WorkspaceMember] (one-to-many, cascade delete)
        WHY: All users who have access to this workspace
        HOW: When workspace deleted, all memberships deleted

    chatbots: list[Chatbot] (one-to-many, cascade delete)
        WHY: All simple chatbots in this workspace
        HOW: When workspace deleted, all chatbots deleted

    chatflows: list[Chatflow] (one-to-many, cascade delete)
        WHY: All advanced workflow chatflows in this workspace
        HOW: When workspace deleted, all chatflows deleted
        NOTE: Chatflows are SEPARATE from chatbots - different model/table

    knowledge_bases: list[KnowledgeBase] (one-to-many, cascade delete)
        WHY: All knowledge bases in this workspace
        HOW: When workspace deleted, all KBs (and their documents/chunks) deleted
        NOTE: Single KB can be accessed by multiple chatbots/chatflows via context settings
        DESIGN: No association table - KB has context_settings that control bot access

PERMISSION FLOW:
----------------
WHY: User needs proper access to view/edit workspace
HOW:
    1. Check user is member of parent organization
    2. Check user is member of this workspace OR is org admin/owner
    3. Check role in WorkspaceMember for specific permissions

EXAMPLE:
    User A in Organization X, Workspace Y:
    - Can access Workspace Y's chatbots and chatflows
    - Cannot access Workspace Z's chatbots/chatflows (even in same org)
    - Unless User A is org admin/owner (can access all workspaces)

RESOURCE TYPES IN WORKSPACE:
-----------------------------
- Chatbots: Simple form-based bots (FAQ, knowledge base)
- Chatflows: Advanced drag-and-drop workflow bots (multi-step, API integration)
- Knowledge Bases: RAG knowledge storage (documents, chunks, embeddings)
- All are separate tables/models with separate APIs

KNOWLEDGE BASE ACCESS PATTERN:
-------------------------------
WHY: Single KB can be shared across multiple bots
HOW: Bot config contains KB references, KB has context_settings for access control

EXAMPLE:
    Workspace has:
        - KB1 ("Product Docs")
        - Chatbot1 (uses KB1)
        - Chatbot2 (uses KB1)
        - Chatflow1 (uses KB1)

    KB1.context_settings = {
        "access_mode": "all",  # All bots in workspace can access
        "retrieval_config": {"top_k": 5}
    }

    Chatbot1.config = {
        "knowledge_bases": [
            {
                "kb_id": "KB1_id",
                "enabled": true,
                "override_retrieval": {"top_k": 3}  # Bot-specific override
            }
        ]
    }
"""
