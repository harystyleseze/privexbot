"""
Security utilities for password hashing and JWT token management.

WHY:
- Centralized security operations for authentication
- Password hashing with bcrypt for secure storage
- JWT token creation/validation for stateless auth
- Password strength validation for user security

HOW:
- Use passlib with bcrypt for password hashing (work factor 12)
- Use python-jose for JWT token operations with HS256 algorithm
- Validate password requirements (min length, complexity)
- Handle token expiration automatically

PSEUDOCODE:
-----------

# Password Hashing
-----------------
function hash_password(password: str) -> str:
    # Use passlib with bcrypt to hash password
    # Bcrypt automatically handles salting
    # Return hashed password string

function verify_password(plain_password: str, hashed_password: str) -> bool:
    # Use passlib to verify plain password against hash
    # Constant-time comparison to prevent timing attacks
    # Return True if matches, False otherwise


# JWT Token Management
----------------------
function create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    # Create JWT payload with:
    #   - sub: user_id (subject)
    # ---- Use these when implementing multi-org/workspace:
    #   - org_id: current organization
    #   - ws_id: current workspace
    #   - perms: permissions dict
    #----
    #   - exp: expiration timestamp
    #   - iat: issued at timestamp
    #   - Additional claims from data dict
    # If expires_delta not provided, use default 30 minutes
    # Encode using SECRET_KEY and HS256 algorithm from config
    # Return JWT token string

function decode_token(token: str) -> dict:
    # Decode JWT token using SECRET_KEY
    # Verify signature with HS256 algorithm
    # Check expiration automatically
    # Return payload dict
    # Raise JWTError if invalid or expired

function validate_password_strength(password: str) -> tuple[bool, str]:
    # Check password meets requirements:
    #   - Minimum 8 characters
    #   - Contains uppercase letter
    #   - Contains lowercase letter
    #   - Contains digit
    #   - Contains special character
    # Return (is_valid, error_message)
    # If valid: (True, "")
    # If invalid: (False, "descriptive error message")
"""

# ACTUAL IMPLEMENTATION
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from jose import jwt, JWTError
from passlib.context import CryptContext
from app.core.config import settings
import re


# Password hashing context
# WHY bcrypt: Industry standard, slow by design (prevents brute force)
# WHY deprecated="auto": Automatically rehash if algorithm is deprecated
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt.

    WHY: Securely store passwords in database
    HOW: Bcrypt automatically generates salt and applies work factor

    Args:
        password: Plain text password

    Returns:
        Hashed password string (includes salt)

    Example:
        >>> hashed = hash_password("MySecurePass123!")
        >>> hashed
        '$2b$12$...'  # 60 character bcrypt hash
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.

    WHY: Authenticate user login attempts
    HOW: Constant-time comparison prevents timing attacks

    Args:
        plain_password: User-provided password
        hashed_password: Stored hash from database

    Returns:
        True if password matches, False otherwise

    Example:
        >>> hashed = hash_password("MySecurePass123!")
        >>> verify_password("MySecurePass123!", hashed)
        True
        >>> verify_password("WrongPassword", hashed)
        False
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT access token.

    WHY: Stateless authentication - no server-side session storage needed
    HOW: Encode user data + expiration into signed JWT token

    Args:
        data: Dictionary of claims to include in token (e.g., user_id, email)
        expires_delta: Optional custom expiration time (default: 30 minutes)

    Returns:
        Encoded JWT token string

    Example:
        >>> token = create_access_token({"sub": "user-uuid-123", "email": "user@example.com"})
        >>> token
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

    Token Payload Structure:
        {
            "sub": "user-uuid",           # Subject (user ID)
            "email": "user@example.com",  # User email (if provided)
            "exp": 1234567890,            # Expiration timestamp
            "iat": 1234567800             # Issued at timestamp
        }
    """
    to_encode = data.copy()

    # Set expiration time
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        # Default: 30 minutes from now
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    # Add standard JWT claims
    to_encode.update({
        "exp": expire,  # Expiration time
        "iat": datetime.utcnow()  # Issued at time
    })

    # Encode and sign token
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

    return encoded_jwt


def decode_token(token: str) -> Dict[str, Any]:
    """
    Decode and verify a JWT token.

    WHY: Validate authentication tokens from client requests
    HOW: Verify signature and check expiration automatically

    Args:
        token: JWT token string to decode

    Returns:
        Decoded payload dictionary

    Raises:
        JWTError: If token is invalid, expired, or signature doesn't match

    Example:
        >>> token = create_access_token({"sub": "user-123"})
        >>> payload = decode_token(token)
        >>> payload["sub"]
        'user-123'
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError as e:
        # Re-raise with context
        raise JWTError(f"Token validation failed: {str(e)}")


def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Validate password meets security requirements.

    WHY: Prevent weak passwords that are easy to crack
    HOW: Check length and character variety requirements

    Requirements:
        - Minimum 8 characters
        - At least one uppercase letter
        - At least one lowercase letter
        - At least one digit
        - At least one special character (!@#$%^&*(),.?":{}|<>)

    Args:
        password: Password string to validate

    Returns:
        Tuple of (is_valid, error_message)
        - If valid: (True, "")
        - If invalid: (False, "description of what's missing")

    Example:
        >>> validate_password_strength("weak")
        (False, "Password must be at least 8 characters long")
        >>> validate_password_strength("StrongPass123!")
        (True, "")
    """
    # Check minimum length
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"

    # Check for uppercase letter
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"

    # Check for lowercase letter
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter"

    # Check for digit
    if not re.search(r"\d", password):
        return False, "Password must contain at least one digit"

    # Check for special character
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "Password must contain at least one special character (!@#$%^&*(),.?\":{}|<>)"

    return True, ""