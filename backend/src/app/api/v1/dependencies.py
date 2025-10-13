"""
API dependencies for FastAPI routes.

WHY:
- Provide reusable dependencies for all routes
- Handle database sessions
- Handle authentication/authorization
- Keep route handlers clean and focused

HOW:
- Database: get_db provides session via dependency injection
- Auth: get_current_user extracts and validates JWT token
"""

from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.db.session import get_db as get_database_session
from app.core.security import decode_token
from app.models.user import User


# Re-export get_db for convenience
def get_db() -> Generator[Session, None, None]:
    """
    Provide database session to route handlers.

    WHY: Dependency injection pattern for database access
    HOW: Yields session, closes it after request completes

    Usage:
        @router.get("/users")
        def get_users(db: Session = Depends(get_db)):
            return db.query(User).all()
    """
    yield from get_database_session()


# HTTP Bearer token scheme
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Get currently authenticated user from JWT token.

    WHY: Protect routes that require authentication
    HOW: Extract token from Authorization header, decode, lookup user

    Args:
        credentials: HTTP Bearer token from header
        db: Database session

    Returns:
        User object if token valid

    Raises:
        HTTPException(401): If token invalid, expired, or user not found

    Usage:
        @router.get("/me")
        def get_profile(user: User = Depends(get_current_user)):
            return {"username": user.username}
    """
    # Extract token from "Bearer <token>"
    token = credentials.credentials

    # Decode and verify JWT
    try:
        payload = decode_token(token)
        user_id: str = payload.get("sub")

        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token"
            )

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

    # Lookup user in database
    user = db.query(User).filter(User.id == user_id).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive"
        )

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get current user and verify account is active.

    WHY: Additional check for active account status
    HOW: Builds on get_current_user, adds is_active check

    Note: get_current_user already checks is_active, so this is redundant
    but kept for explicit clarity and future extension.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user
