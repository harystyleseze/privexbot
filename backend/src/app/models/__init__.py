"""
Models package - SQLAlchemy ORM models

This file imports all models to ensure they are registered with SQLAlchemy's
metadata for Alembic migrations to work properly.

NOTE: Only importing models that have actual implementations.
Other models are still pseudocode and will be imported once implemented.
"""

# Core user and authentication models (IMPLEMENTED)
from app.models.user import User
from app.models.auth_identity import AuthIdentity

# Multi-tenancy models (IMPLEMENTED)
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember
from app.models.invitation import Invitation

# NOTE: The following models are still pseudocode and not imported yet:
# - Chatbot
# - Chatflow
# - KnowledgeBase
# - Document
# - Chunk
# - ChatSession
# - ChatMessage
# - Lead
# - APIKey
# - Credential

__all__ = [
    # Core
    "User",
    "AuthIdentity",
    # Multi-tenancy
    "Organization",
    "OrganizationMember",
    "Workspace",
    "WorkspaceMember",
    "Invitation",
]
