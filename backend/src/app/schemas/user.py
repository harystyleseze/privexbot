"""
Pydantic schemas for User API requests and responses.

WHY:
- Validate API input data
- Serialize database models to JSON responses
- Type safety and documentation
- Separate API contract from database models

HOW:
- Use Pydantic for automatic validation
- Define request schemas (what clients send)
- Define response schemas (what API returns)

PSEUDOCODE:
-----------
from pydantic import BaseModel, EmailStr, UUID4
from datetime import datetime

# Base schema with common fields
class UserBase(BaseModel):
    username: str
        WHY: Common field used in multiple schemas

# Schema for creating a user (API request)
class UserCreate(UserBase):
    \"\"\"
    WHY: Validate user creation data
    HOW: Used in signup endpoints
    \"\"\"
    username: str (min_length=3, max_length=50)
    # Note: password/email handled in AuthIdentity, not here

# Schema for user response (API response)
class UserResponse(UserBase):
    \"\"\"
    WHY: Return user data without sensitive info
    HOW: Convert User model to JSON
    \"\"\"
    id: UUID4
    username: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True  # WHY: Allow creating from ORM models
            HOW: user_response = UserResponse.from_orm(user_model)

# Schema for user in JWT or current user context
class UserInToken(BaseModel):
    \"\"\"
    WHY: Represent user data stored in JWT
    HOW: Created when generating tokens
    \"\"\"
    id: UUID4
    username: str
    email: str | None
        WHY: May not have email if logged in with wallet only

# Schema for current user with permissions
class CurrentUser(UserResponse):
    \"\"\"
    WHY: Include current context (org, workspace, permissions)
    HOW: Returned from /auth/me endpoint
    \"\"\"
    current_org_id: UUID4 | None
    current_workspace_id: UUID4 | None
    permissions: dict[str, bool]
        EXAMPLE: {"org:admin": true, "chatbot:create": true}
    organizations: list[OrganizationSummary]
        WHY: List orgs user belongs to for switching context

USAGE IN API:
-------------
@router.post("/signup", response_model=UserResponse)
def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    # user_data is validated automatically
    # Return UserResponse which excludes sensitive fields
    ...
"""
