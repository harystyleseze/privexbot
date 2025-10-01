"""
Base class for all SQLAlchemy models.

WHY:
- Provides common functionality to all models
- Ensures consistent ID generation (UUID)
- Adds common fields (created_at, updated_at) automatically
- Single source of truth for model configuration

HOW:
- All models inherit from this Base class
- Automatically generates UUIDs for primary keys
- Auto-sets timestamps on create/update

PSEUDOCODE:
-----------
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, DateTime
import uuid

class Base:
    """Base class that all models inherit from"""

    # Automatic ID generation
    id: UUID (primary key)
        WHY: Every model needs unique identifier
        HOW: Auto-generate UUID on creation, never changes

    # Automatic timestamps (optional mixin)
    created_at: DateTime
        WHY: Track when record was created
        HOW: Set automatically to current UTC time on insert

    updated_at: DateTime
        WHY: Track last modification time
        HOW: Auto-update to current UTC time on every update

    # Table name generation
    __tablename__: str
        WHY: Derive table name from class name
        HOW: Convert CamelCase to snake_case automatically
        EXAMPLE: UserProfile -> user_profile

# Create declarative base
Base = declarative_base(cls=Base)

USAGE:
------
class User(Base):
    # Already has id, created_at, updated_at from Base
    username = Column(String)
"""
