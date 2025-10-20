# PrivexBot Authentication Implementation Guide

**Version**: 1.0
**Date**: 2025-10-12
**Status**: Step-by-Step Implementation
**Prerequisites**: Read `01_AUTH_SPECIFICATION.md` first

---

## Table of Contents

1. [Implementation Overview](#implementation-overview)
2. [Phase 1: Dependencies & Configuration](#phase-1-dependencies--configuration)
3. [Phase 2: Database Models](#phase-2-database-models)
4. [Phase 3: Security Module](#phase-3-security-module)
5. [Phase 4: Redis Utilities](#phase-4-redis-utilities)
6. [Phase 5: Auth Strategies](#phase-5-auth-strategies)
7. [Phase 6: Pydantic Schemas](#phase-6-pydantic-schemas)
8. [Phase 7: API Routes](#phase-7-api-routes)
9. [Phase 8: Database Migration](#phase-8-database-migration)
10. [Phase 9: Testing](#phase-9-testing)
11. [Phase 10: Integration](#phase-10-integration)

---

## Implementation Overview

### File Structure

```
backend/
├── pyproject.toml                          # UPDATE: Add auth dependencies
├── src/app/
│   ├── main.py                             # UPDATE: Register auth routes
│   ├── core/
│   │   ├── config.py                       #
│   │   └── security.py                     # IMPLEMENT: Password & JWT
│   ├── db/
│   │   ├── base.py                         # UPDATE: Import models
│   │   ├── base_class.py                   #
│   │   ├── session.py                      #
│   │   └── init_db.py                      #
│   ├── models/
│   │   ├── user.py                         # IMPLEMENT: User model
│   │   └── auth_identity.py                # IMPLEMENT: AuthIdentity model
│   ├── schemas/
│   │   ├── __init__.py                     # CREATE
│   │   ├── auth.py                         # CREATE: Auth request/response schemas
│   │   └── user.py                         # CREATE: User schemas
│   ├── auth/
│   │   ├── __init__.py                     # UPDATE: Export strategies
│   │   ├── strategies/
│   │   │   ├── __init__.py                 # UPDATE: Export all
│   │   │   ├── email.py                    # IMPLEMENT: Email auth
│   │   │   ├── evm.py                      # IMPLEMENT: EVM wallet auth
│   │   │   ├── solana.py                   # IMPLEMENT: Solana auth
│   │   │   └── cosmos.py                   # IMPLEMENT: Cosmos auth
│   │   └── dependencies.py                 # CREATE: Auth dependencies
│   ├── api/v1/
│   │   ├── __init__.py                     # UPDATE: Include auth router
│   │   └── routes/
│   │       └── auth.py                     # IMPLEMENT: Auth endpoints
│   └── utils/
│       ├── __init__.py                     # CREATE if not exists
│       └── redis.py                        # CREATE: Redis utilities
└── alembic/
    └── versions/
        └── 001_create_auth_tables.py       # GENERATE: Migration file
```

### Implementation Order

**Why This Order**:

1. Dependencies first (can't code without libraries)
2. Models next (database schema defines everything)
3. Security utilities (needed by strategies)
4. Redis utilities (needed by wallet auth)
5. Auth strategies (business logic)
6. Schemas (API contracts)
7. Routes (API endpoints)
8. Migrations (create database tables)
9. Testing (verify everything works)
10. Integration (wire it all together)

---

## Phase 1: Dependencies & Configuration

### Step 1.1: Add Dependencies

**File**: `backend/pyproject.toml`

**Action**: Add authentication dependencies to the `dependencies` array

**Code**:

```toml
[project]
name = "backend"
version = "0.1.0"
description = "PrivexBot Backend"
readme = "README.md"
requires-python = ">=3.11"
dependencies = [
    # Existing dependencies
    "alembic>=1.16.5",
    "celery[redis]>=5.4.0",
    "fastapi>=0.117.1",
    "psycopg2-binary>=2.9.10",
    "pydantic>=2.11.9",
    "pydantic-settings>=2.7.1",
    "python-dotenv>=1.1.1",
    "redis>=5.0.0",
    "sqlalchemy>=2.0.43",

    # NEW: Authentication
    "passlib[bcrypt]>=1.7.4",              # Password hashing
    "bcrypt>=4.0.0,<5.0.0",                 # Bcrypt backend
    "python-jose[cryptography]>=3.3.0",     # JWT tokens
    "python-multipart>=0.0.6",              # Form data parsing

    # NEW: Wallet authentication
    "eth-account>=0.10.0",                  # EVM signatures
    "pynacl>=1.5.0",                        # Solana Ed25519
    "base58>=2.1.1",                        # Solana addresses
    "ecdsa>=0.18.0",                        # Cosmos secp256k1
    "bech32>=1.2.0",                        # Cosmos addresses

    # NEW: Rate limiting
    "slowapi>=0.1.9",                       # Rate limiting
]
```

**Install**:

```bash
cd backend
uv pip install passlib[bcrypt] bcrypt python-jose[cryptography] python-multipart \
                eth-account pynacl base58 ecdsa bech32 slowapi
```

**Why Each Library**:

- `passlib[bcrypt]`: Industry-standard password hashing
- `python-jose[cryptography]`: JWT token creation/verification
- `eth-account`: Ethereum signature verification (EVM chains)
- `pynacl`: Ed25519 signatures (Solana)
- `ecdsa` + `bech32`: Cosmos wallet support
- `slowapi`: Prevent brute force attacks

---

### Step 1.2: Verify Configuration

**File**: `backend/src/app/core/config.py`

**Action**: Verify these settings exist (they should already be there)

**Required Settings**:

```python
class Settings(BaseSettings):
    # These should already exist
    SECRET_KEY: str = Field(default="dev-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REDIS_URL: str = Field(default="redis://localhost:6379/0")
    NONCE_EXPIRE_SECONDS: int = 300  # 5 minutes
```

**If Missing**: Add them

**Why**: These control JWT signing and nonce expiration

---

## Phase 2: Database Models

### Step 2.1: Implement User Model

**File**: `backend/src/app/models/user.py`

**Action**: Replace pseudocode with actual implementation

**Code**:

```python
"""User model - Core user identity"""
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base_class import Base
import uuid
from datetime import datetime


class User(Base):
    """
    User model - Independent of authentication method

    One user can have multiple auth methods (email + wallets)
    """
    __tablename__ = "users"

    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # User info
    username = Column(String(255), unique=True, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    auth_identities = relationship(
        "AuthIdentity",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<User(id={self.id}, username={self.username})>"
```

**Why Each Field**:

- `id`: UUID for security (hard to guess) and stability
- `username`: Human-readable identifier
- `is_active`: Soft delete (disable without losing data)
- `auth_identities`: One user, multiple login methods

---

### Step 2.2: Implement AuthIdentity Model

**File**: `backend/src/app/models/auth_identity.py`

**Action**: Replace pseudocode with actual implementation

**Code**:

```python
"""AuthIdentity model - Links users to authentication providers"""
from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.db.base_class import Base
import uuid
from datetime import datetime


class AuthIdentity(Base):
    """
    AuthIdentity model - Multiple auth methods per user

    Allows linking email + multiple wallets to same account
    """
    __tablename__ = "auth_identities"

    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Foreign key to user
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Provider info
    provider = Column(String(50), nullable=False)  # 'email', 'evm', 'solana', 'cosmos'
    provider_id = Column(String(255), nullable=False, index=True)  # email or wallet address

    # Provider-specific data (JSONB for flexibility)
    data = Column(JSONB, nullable=False, default=dict)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="auth_identities")

    # Constraints
    __table_args__ = (
        UniqueConstraint("provider", "provider_id", name="uq_provider_provider_id"),
    )

    def __repr__(self):
        return f"<AuthIdentity(provider={self.provider}, provider_id={self.provider_id})>"
```

**Why JSONB for data**:

- Email: Store `{password_hash, email_verified}`
- Wallets: Store `{address, public_key, chain_id}`
- Flexible: Add new fields without schema changes

**Why UniqueConstraint**:

- Prevents duplicate email/wallet registrations
- Database-level enforcement (race condition safe)

---

### Step 2.3: Update Base Imports

**File**: `backend/src/app/db/base.py`

**Action**: Uncomment User and AuthIdentity imports

**Code**:

```python
"""Import all models for Alembic migrations"""
from app.db.base_class import Base  # noqa

# Import models so they're registered with SQLAlchemy
from app.models.user import User  # noqa
from app.models.auth_identity import AuthIdentity  # noqa

# TODO: Uncomment other models as you implement them
# from app.models.organization import Organization  # noqa
# from app.models.workspace import Workspace  # noqa
# ... etc
```

**Why**: Alembic needs all models imported to generate migrations

---

## Phase 3: Security Module

### Step 3.1: Implement Security Utilities

**File**: `backend/src/app/core/security.py`

**Action**: Replace pseudocode with actual implementation

**Code**:

```python
"""Security utilities for password hashing and JWT tokens"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import jwt, JWTError
from passlib.context import CryptContext
from app.core.config import settings
from fastapi import HTTPException, status


# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    Hash password using bcrypt

    Args:
        password: Plain text password

    Returns:
        Hashed password string

    Example:
        >>> hashed = hash_password("SecurePass123")
        >>> hashed.startswith("$2b$")
        True
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify password against hash

    Args:
        plain_password: Password to check
        hashed_password: Stored hash

    Returns:
        True if password matches, False otherwise

    Example:
        >>> hashed = hash_password("SecurePass123")
        >>> verify_password("SecurePass123", hashed)
        True
        >>> verify_password("WrongPass", hashed)
        False
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create JWT access token

    Args:
        data: Token payload (user_id, email, etc.)
        expires_delta: Optional custom expiration

    Returns:
        JWT token string

    Example:
        >>> token = create_access_token({"sub": "user_id", "email": "user@example.com"})
        >>> len(token) > 0
        True
    """
    to_encode = data.copy()

    # Set expiration
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})

    # Encode JWT
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

    return encoded_jwt


def decode_token(token: str) -> Dict[str, Any]:
    """
    Decode and verify JWT token

    Args:
        token: JWT token string

    Returns:
        Token payload dict

    Raises:
        HTTPException: If token invalid or expired

    Example:
        >>> token = create_access_token({"sub": "user_id"})
        >>> payload = decode_token(token)
        >>> payload["sub"]
        'user_id'
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Validate password meets security requirements

    Args:
        password: Password to validate

    Returns:
        (is_valid, error_message) tuple

    Example:
        >>> validate_password_strength("weak")
        (False, "Password must be at least 8 characters")
        >>> validate_password_strength("SecurePass123")
        (True, "")
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters"

    if not any(c.isupper() for c in password):
        return False, "Password must contain at least one uppercase letter"

    if not any(c.islower() for c in password):
        return False, "Password must contain at least one lowercase letter"

    if not any(c.isdigit() for c in password):
        return False, "Password must contain at least one number"

    return True, ""
```

**Why Separate validate_password_strength**:

- Reusable in signup and password change
- Clear error messages for users
- Easy to adjust requirements

---

## Phase 4: Redis Utilities

### Step 4.1: Create Redis Helper Functions

**File**: `backend/src/app/utils/redis.py`

**Action**: Create new file with Redis utilities

**Code**:

```python
"""Redis utilities for nonce management"""
from typing import Optional
import redis
from app.core.config import settings


# Redis client (connection pool)
redis_client = redis.from_url(
    settings.REDIS_URL,
    decode_responses=True  # Return strings instead of bytes
)


def store_nonce(address: str, nonce: str, provider: str) -> None:
    """
    Store nonce in Redis with expiration

    Args:
        address: Wallet address or email
        nonce: Random nonce string
        provider: 'evm', 'solana', 'cosmos'

    Example:
        >>> store_nonce("0x123...", "abc123", "evm")
    """
    key = f"nonce:{provider}:{address}"
    redis_client.setex(
        key,
        settings.NONCE_EXPIRE_SECONDS,  # 300 seconds (5 minutes)
        nonce
    )


def get_nonce(address: str, provider: str) -> Optional[str]:
    """
    Get and delete nonce (single-use)

    Args:
        address: Wallet address or email
        provider: 'evm', 'solana', 'cosmos'

    Returns:
        Nonce if found and not expired, None otherwise

    Example:
        >>> store_nonce("0x123...", "abc123", "evm")
        >>> get_nonce("0x123...", "evm")
        'abc123'
        >>> get_nonce("0x123...", "evm")  # Second call
        None
    """
    key = f"nonce:{provider}:{address}"
    # GETDEL gets the value and deletes it atomically
    nonce = redis_client.getdel(key)
    return nonce


def delete_nonce(address: str, provider: str) -> None:
    """
    Manually delete nonce

    Args:
        address: Wallet address or email
        provider: 'evm', 'solana', 'cosmos'
    """
    key = f"nonce:{provider}:{address}"
    redis_client.delete(key)
```

**Why GETDEL**:

- Atomic operation (thread-safe)
- Single-use nonce (can't replay signature)
- No race conditions

**Why Key Pattern `nonce:{provider}:{address}`**:

- Namespaced (won't conflict with other Redis data)
- Provider prefix allows same address across chains
- Easy to debug (clear key names)

---

## Phase 5: Auth Strategies

### Step 5.1: Implement Email Strategy

**File**: `backend/src/app/auth/strategies/email.py`

**Action**: Replace pseudocode with actual implementation

**Code**:

```python
"""Email/password authentication strategy"""
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.models.auth_identity import AuthIdentity
from app.core.security import hash_password, verify_password, validate_password_strength
from typing import Optional


async def signup_with_email(
    email: str,
    password: str,
    username: str,
    db: Session
) -> User:
    """
    Create new user with email/password

    Args:
        email: User email address
        password: Plain text password (will be hashed)
        username: Desired username
        db: Database session

    Returns:
        Created User object

    Raises:
        HTTPException 400: Email already registered or validation error
    """
    # Step 1: Validate password strength
    is_valid, error_msg = validate_password_strength(password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )

    # Step 2: Check if email already exists
    existing = db.query(AuthIdentity).filter(
        AuthIdentity.provider == "email",
        AuthIdentity.provider_id == email.lower()
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Step 3: Check if username already exists
    existing_user = db.query(User).filter(User.username == username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )

    # Step 4: Create user
    user = User(
        username=username,
        is_active=True
    )
    db.add(user)
    db.flush()  # Get user.id without committing

    # Step 5: Hash password and create auth identity
    password_hash = hash_password(password)

    auth_identity = AuthIdentity(
        user_id=user.id,
        provider="email",
        provider_id=email.lower(),  # Store lowercase for consistency
        data={
            "password_hash": password_hash,
            "email_verified": False  # For future email verification
        }
    )
    db.add(auth_identity)
    db.commit()
    db.refresh(user)

    return user


async def login_with_email(
    email: str,
    password: str,
    db: Session
) -> User:
    """
    Authenticate user with email/password

    Args:
        email: User email
        password: Plain text password
        db: Database session

    Returns:
        User object if authentication successful

    Raises:
        HTTPException 401: Invalid credentials (same message for email/password errors)
    """
    # Step 1: Find auth identity
    auth_identity = db.query(AuthIdentity).filter(
        AuthIdentity.provider == "email",
        AuthIdentity.provider_id == email.lower()
    ).first()

    if not auth_identity:
        # Don't reveal if email exists (security)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    # Step 2: Get user and check active status
    user = db.query(User).filter(User.id == auth_identity.user_id).first()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    # Step 3: Verify password
    password_hash = auth_identity.data.get("password_hash")
    if not password_hash or not verify_password(password, password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    return user


async def change_password(
    user_id: str,
    old_password: str,
    new_password: str,
    db: Session
) -> bool:
    """
    Change user password

    Args:
        user_id: User UUID
        old_password: Current password
        new_password: New password
        db: Database session

    Returns:
        True if successful

    Raises:
        HTTPException 400: No email auth method
        HTTPException 401: Current password incorrect
    """
    # Validate new password
    is_valid, error_msg = validate_password_strength(new_password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )

    # Find email auth identity
    auth_identity = db.query(AuthIdentity).filter(
        AuthIdentity.user_id == user_id,
        AuthIdentity.provider == "email"
    ).first()

    if not auth_identity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No email authentication method found"
        )

    # Verify old password
    old_hash = auth_identity.data.get("password_hash")
    if not verify_password(old_password, old_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect"
        )

    # Update to new password
    new_hash = hash_password(new_password)
    auth_identity.data["password_hash"] = new_hash
    db.commit()

    return True
```

**Why lowercase email**:

- Case-insensitive login (user@Example.com = user@example.com)
- Consistent storage
- Prevents duplicate registrations with different cases

---

### Step 5.2: Implement EVM Strategy

**File**: `backend/src/app/auth/strategies/evm.py`

**Action**: Replace pseudocode with actual implementation

**Code**:

```python
"""EVM wallet authentication (MetaMask, Coinbase Wallet, etc.)"""
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from eth_account import Account
from eth_account.messages import encode_defunct
from app.models.user import User
from app.models.auth_identity import AuthIdentity
from app.utils.redis import store_nonce, get_nonce
from datetime import datetime
import secrets


async def request_challenge(address: str) -> dict:
    """
    Generate challenge for wallet to sign

    Args:
        address: Ethereum address (0x...)

    Returns:
        dict with 'message' and 'nonce'

    Raises:
        HTTPException 400: Invalid address format
    """
    # Step 1: Validate address format
    if not address.startswith("0x") or len(address) != 42:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Ethereum address format"
        )

    # Step 2: Normalize address (checksummed)
    try:
        address = Account.to_checksum_address(address)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Ethereum address"
        )

    # Step 3: Generate cryptographically random nonce
    nonce = secrets.token_urlsafe(32)

    # Step 4: Store nonce in Redis (5 min expiry)
    store_nonce(address, nonce, "evm")

    # Step 5: Create EIP-4361 compliant message
    message = f"""privexbot.com wants you to sign in with your Ethereum account:
{address}

Please sign this message to authenticate with PrivexBot.

URI: https://privexbot.com
Version: 1
Chain ID: 1
Nonce: {nonce}
Issued At: {datetime.utcnow().isoformat()}Z"""

    return {
        "message": message,
        "nonce": nonce
    }


async def verify_signature(
    address: str,
    signed_message: str,
    signature: str,
    db: Session
) -> User:
    """
    Verify wallet signature and authenticate user

    Args:
        address: Ethereum address (0x...)
        signed_message: The message that was signed
        signature: Hex signature from wallet
        db: Database session

    Returns:
        User object (existing or newly created)

    Raises:
        HTTPException 400: Nonce expired or message mismatch
        HTTPException 401: Signature verification failed
    """
    # Step 1: Normalize address
    try:
        address = Account.to_checksum_address(address)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Ethereum address"
        )

    # Step 2: Get and delete nonce (single-use)
    nonce = get_nonce(address, "evm")

    if not nonce:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nonce expired or invalid. Request new challenge."
        )

    # Step 3: Verify nonce is in message
    if nonce not in signed_message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message does not match challenge"
        )

    # Step 4: Encode message for signature verification
    message_hash = encode_defunct(text=signed_message)

    # Step 5: Recover signer address from signature
    try:
        recovered_address = Account.recover_message(message_hash, signature=signature)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Signature verification failed: {str(e)}"
        )

    # Step 6: Verify recovered address matches claimed address
    if recovered_address.lower() != address.lower():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Signature verification failed"
        )

    # Step 7: Find or create user
    auth_identity = db.query(AuthIdentity).filter(
        AuthIdentity.provider == "evm",
        AuthIdentity.provider_id == address.lower()
    ).first()

    if auth_identity:
        # Existing user - log them in
        user = db.query(User).filter(User.id == auth_identity.user_id).first()

        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is inactive"
            )
    else:
        # New user - create account
        username = f"user_{address[:8]}"  # e.g., "user_0x742d35"

        # Ensure username is unique
        counter = 1
        original_username = username
        while db.query(User).filter(User.username == username).first():
            username = f"{original_username}_{counter}"
            counter += 1

        user = User(username=username, is_active=True)
        db.add(user)
        db.flush()

        auth_identity = AuthIdentity(
            user_id=user.id,
            provider="evm",
            provider_id=address.lower(),
            data={
                "address": address,  # Store checksummed for display
                "first_login": datetime.utcnow().isoformat()
            }
        )
        db.add(auth_identity)
        db.commit()
        db.refresh(user)

    return user
```

**Why encode_defunct**:

- Ethereum prepends `"\x19Ethereum Signed Message:\n{len(message)}"`
- `encode_defunct` handles this automatically
- Ensures we verify the exact message wallet signed

---

### Step 5.3: Implement Solana Strategy

**File**: `backend/src/app/auth/strategies/solana.py`

**Action**: Replace pseudocode with actual implementation

**Code**:

```python
"""Solana wallet authentication (Phantom, Solflare, etc.)"""
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from nacl.signing import VerifyKey
from nacl.exceptions import BadSignatureError
from app.models.user import User
from app.models.auth_identity import AuthIdentity
from app.utils.redis import store_nonce, get_nonce
from datetime import datetime
import secrets
import base58


async def request_challenge(address: str) -> dict:
    """
    Generate challenge for Solana wallet to sign

    Args:
        address: Solana address (base58 encoded)

    Returns:
        dict with 'message' and 'nonce'

    Raises:
        HTTPException 400: Invalid address format
    """
    # Step 1: Validate address format (Solana addresses are ~44 chars base58)
    try:
        pubkey_bytes = base58.b58decode(address)
        if len(pubkey_bytes) != 32:
            raise ValueError("Invalid length")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Solana address"
        )

    # Step 2: Generate nonce
    nonce = secrets.token_urlsafe(32)

    # Step 3: Store in Redis
    store_nonce(address, nonce, "solana")

    # Step 4: Create message to sign
    message = f"""Sign this message to authenticate with PrivexBot.

Wallet: {address}
Nonce: {nonce}
Timestamp: {datetime.utcnow().isoformat()}Z

This request will not trigger any blockchain transaction or cost any gas fees."""

    return {
        "message": message,
        "nonce": nonce
    }


async def verify_signature(
    address: str,
    signed_message: str,
    signature: str,
    db: Session
) -> User:
    """
    Verify Solana wallet signature

    Args:
        address: Solana address (base58)
        signed_message: The message that was signed
        signature: Base58-encoded signature
        db: Database session

    Returns:
        User object

    Raises:
        HTTPException 400: Nonce/format errors
        HTTPException 401: Signature verification failed
    """
    # Step 1: Get and delete nonce
    nonce = get_nonce(address, "solana")

    if not nonce:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nonce expired or invalid"
        )

    # Step 2: Verify nonce in message
    if nonce not in signed_message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message does not match challenge"
        )

    # Step 3: Decode signature and public key
    try:
        signature_bytes = base58.b58decode(signature)
        pubkey_bytes = base58.b58decode(address)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid signature or address format"
        )

    # Step 4: Verify Ed25519 signature
    try:
        verify_key = VerifyKey(pubkey_bytes)
        message_bytes = signed_message.encode('utf-8')
        verify_key.verify(message_bytes, signature_bytes)
    except BadSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Signature verification failed"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Signature verification failed: {str(e)}"
        )

    # Step 5: Find or create user
    auth_identity = db.query(AuthIdentity).filter(
        AuthIdentity.provider == "solana",
        AuthIdentity.provider_id == address
    ).first()

    if auth_identity:
        user = db.query(User).filter(User.id == auth_identity.user_id).first()

        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is inactive"
            )
    else:
        # New user
        username = f"user_{address[:8]}"

        counter = 1
        original_username = username
        while db.query(User).filter(User.username == username).first():
            username = f"{original_username}_{counter}"
            counter += 1

        user = User(username=username, is_active=True)
        db.add(user)
        db.flush()

        auth_identity = AuthIdentity(
            user_id=user.id,
            provider="solana",
            provider_id=address,
            data={
                "address": address,
                "first_login": datetime.utcnow().isoformat()
            }
        )
        db.add(auth_identity)
        db.commit()
        db.refresh(user)

    return user
```

---

### Step 5.4: Implement Cosmos Strategy

**File**: `backend/src/app/auth/strategies/cosmos.py`

**Action**: Replace pseudocode with actual implementation

**Code**:

```python
"""Cosmos wallet authentication (Keplr, Cosmostation, etc.)"""
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from ecdsa import VerifyingKey, SECP256k1, BadSignatureError
from app.models.user import User
from app.models.auth_identity import AuthIdentity
from app.utils.redis import store_nonce, get_nonce
from datetime import datetime
import secrets
import hashlib
import base64


async def request_challenge(address: str) -> dict:
    """
    Generate challenge for Cosmos wallet

    Args:
        address: Cosmos address (bech32 format: cosmos1... or secret1...)

    Returns:
        dict with 'message' and 'nonce'

    Raises:
        HTTPException 400: Invalid address format
    """
    # Step 1: Validate address format
    if not (address.startswith("cosmos1") or address.startswith("secret1")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Cosmos address format. Must start with cosmos1 or secret1"
        )

    # Additional validation: bech32 addresses are ~45 chars
    if len(address) < 39 or len(address) > 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Cosmos address length"
        )

    # Step 2: Generate nonce
    nonce = secrets.token_urlsafe(32)

    # Step 3: Store in Redis
    store_nonce(address, nonce, "cosmos")

    # Step 4: Create message
    message = f"""Sign this message to authenticate with PrivexBot.

Address: {address}
Nonce: {nonce}
Timestamp: {datetime.utcnow().isoformat()}Z

This will not trigger any transaction or cost any fees."""

    return {
        "message": message,
        "nonce": nonce
    }


async def verify_signature(
    address: str,
    signed_message: str,
    signature: str,
    public_key: str,
    db: Session
) -> User:
    """
    Verify Cosmos wallet signature

    Args:
        address: Cosmos address (bech32)
        signed_message: The message that was signed
        signature: Base64-encoded signature
        public_key: Base64-encoded public key (provided by Keplr)
        db: Database session

    Returns:
        User object

    Raises:
        HTTPException 400: Nonce/format/pubkey errors
        HTTPException 401: Signature verification failed
    """
    # Step 1: Get and delete nonce
    nonce = get_nonce(address, "cosmos")

    if not nonce:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nonce expired or invalid"
        )

    # Step 2: Verify nonce in message
    if nonce not in signed_message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message does not match challenge"
        )

    # Step 3: Decode signature and public key
    try:
        signature_bytes = base64.b64decode(signature)
        pubkey_bytes = base64.b64decode(public_key)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid signature or public key format"
        )

    # Step 4: Verify signature using secp256k1
    try:
        # Create verifying key from public key
        vk = VerifyingKey.from_string(pubkey_bytes, curve=SECP256k1)

        # Hash the message (Cosmos signs the hash)
        message_hash = hashlib.sha256(signed_message.encode()).digest()

        # Verify signature
        vk.verify(signature_bytes, message_hash, hashfunc=hashlib.sha256)

    except BadSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Signature verification failed"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Signature verification failed: {str(e)}"
        )

    # Step 5: Find or create user
    auth_identity = db.query(AuthIdentity).filter(
        AuthIdentity.provider == "cosmos",
        AuthIdentity.provider_id == address
    ).first()

    if auth_identity:
        user = db.query(User).filter(User.id == auth_identity.user_id).first()

        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is inactive"
            )
    else:
        # New user
        username = f"user_{address[:12]}"  # Cosmos addresses are longer

        counter = 1
        original_username = username
        while db.query(User).filter(User.username == username).first():
            username = f"{original_username}_{counter}"
            counter += 1

        user = User(username=username, is_active=True)
        db.add(user)
        db.flush()

        auth_identity = AuthIdentity(
            user_id=user.id,
            provider="cosmos",
            provider_id=address,
            data={
                "address": address,
                "public_key": public_key,  # Store for reference
                "first_login": datetime.utcnow().isoformat()
            }
        )
        db.add(auth_identity)
        db.commit()
        db.refresh(user)

    return user
```

**Note**: Cosmos public key derivation to address is complex and requires `bech32` library. For simplicity, we trust the public key provided by Keplr wallet and verify the signature matches. In production, you may want to add address derivation validation.

---

## Phase 6: Pydantic Schemas

### Step 6.1: Create User Schemas

**File**: `backend/src/app/schemas/user.py`

**Action**: Create Pydantic models for API requests/responses

**Code**:

```python
"""Pydantic schemas for User"""
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from uuid import UUID


class UserBase(BaseModel):
    """Base user schema"""
    username: str


class UserCreate(UserBase):
    """Schema for creating user (not directly used in auth)"""
    pass


class UserResponse(UserBase):
    """Schema for user in API responses"""
    id: UUID
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuthMethodResponse(BaseModel):
    """Schema for linked auth methods"""
    provider: str
    provider_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

---

### Step 6.2: Create Auth Schemas

**File**: `backend/src/app/schemas/auth.py`

**Action**: Create schemas for auth endpoints

**Code**:

```python
"""Pydantic schemas for Authentication"""
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from app.schemas.user import UserResponse, AuthMethodResponse


# Email Auth Schemas
class EmailSignupRequest(BaseModel):
    """Request schema for email signup"""
    email: EmailStr
    password: str = Field(..., min_length=8)
    username: str = Field(..., min_length=3, max_length=50)


class EmailLoginRequest(BaseModel):
    """Request schema for email login"""
    email: EmailStr
    password: str


class ChangePasswordRequest(BaseModel):
    """Request schema for password change"""
    old_password: str
    new_password: str = Field(..., min_length=8)


# Wallet Auth Schemas
class ChallengeResponse(BaseModel):
    """Response schema for challenge requests"""
    message: str
    nonce: str


class EVMVerifyRequest(BaseModel):
    """Request schema for EVM signature verification"""
    address: str = Field(..., pattern=r"^0x[a-fA-F0-9]{40}$")
    message: str
    signature: str


class SolanaVerifyRequest(BaseModel):
    """Request schema for Solana signature verification"""
    address: str = Field(..., min_length=32, max_length=44)
    message: str
    signature: str


class CosmosVerifyRequest(BaseModel):
    """Request schema for Cosmos signature verification"""
    address: str = Field(..., pattern=r"^(cosmos1|secret1)[a-z0-9]{38,45}$")
    message: str
    signature: str
    public_key: str


# Link Auth Method Schemas
class LinkAuthMethodRequest(BaseModel):
    """Request schema for linking auth method to existing account"""
    provider: str = Field(..., pattern=r"^(evm|solana|cosmos)$")
    address: str
    message: str
    signature: str
    public_key: Optional[str] = None  # Required for Cosmos


# Token Response Schemas
class TokenResponse(BaseModel):
    """Response schema for successful authentication"""
    user: UserResponse
    token: str
    token_type: str = "bearer"


class LinkAuthMethodResponse(BaseModel):
    """Response schema for link auth method"""
    success: bool
    message: str
    linked_methods: List[AuthMethodResponse]


class GetLinkedMethodsResponse(BaseModel):
    """Response schema for get linked methods"""
    methods: List[AuthMethodResponse]
```

**Why Field validation**:

- `EmailStr`: Validates email format
- `pattern`: Regex validation for addresses
- `min_length`, `max_length`: Length constraints

---

## Phase 7: API Routes

### Step 7.1: Create Auth Dependencies

**File**: `backend/src/app/auth/dependencies.py`

**Action**: Create dependency for getting current user from JWT

**Code**:

```python
"""FastAPI dependencies for authentication"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.security import decode_token
from app.db.session import get_db
from app.models.user import User


# Bearer token scheme
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Get current user from JWT token

    Args:
        credentials: Authorization header with Bearer token
        db: Database session

    Returns:
        Current User object

    Raises:
        HTTPException 401: Invalid token or user not found

    Usage:
        @app.get("/protected")
        async def protected_route(current_user: User = Depends(get_current_user)):
            return {"user_id": current_user.id}
    """
    token = credentials.credentials

    # Decode JWT
    payload = decode_token(token)

    # Get user_id from token
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

    # Load user from database
    user = db.query(User).filter(User.id == user_id).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user"
        )

    return user
```

---

### Step 7.2: Implement Auth Routes

**File**: `backend/src/app/api/v1/routes/auth.py`

**Action**: Replace empty file with actual route implementations

**Code** (Part 1 - Email routes):

```python
"""Authentication API routes"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.auth_identity import AuthIdentity
from app.core.security import create_access_token
from app.schemas.auth import (
    EmailSignupRequest, EmailLoginRequest, ChangePasswordRequest,
    ChallengeResponse, EVMVerifyRequest, SolanaVerifyRequest, CosmosVerifyRequest,
    TokenResponse, LinkAuthMethodRequest, LinkAuthMethodResponse, GetLinkedMethodsResponse
)
from app.schemas.user import AuthMethodResponse
from app.auth.strategies import email, evm, solana, cosmos


router = APIRouter(prefix="/auth", tags=["authentication"])


# ============================================================================
# EMAIL AUTHENTICATION
# ============================================================================

@router.post("/signup/email", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup_email(
    request: EmailSignupRequest,
    db: Session = Depends(get_db)
):
    """
    Sign up with email and password

    Creates new user account with email authentication
    """
    # Create user
    user = await email.signup_with_email(
        email=request.email,
        password=request.password,
        username=request.username,
        db=db
    )

    # Create JWT token
    token_data = {
        "sub": str(user.id),
        "email": request.email,
        "username": user.username
    }
    token = create_access_token(token_data)

    return TokenResponse(
        user=user,
        token=token,
        token_type="bearer"
    )


@router.post("/login/email", response_model=TokenResponse)
async def login_email(
    request: EmailLoginRequest,
    db: Session = Depends(get_db)
):
    """
    Log in with email and password

    Authenticates existing user and returns JWT token
    """
    # Authenticate user
    user = await email.login_with_email(
        email=request.email,
        password=request.password,
        db=db
    )

    # Get email for token
    auth_identity = db.query(AuthIdentity).filter(
        AuthIdentity.user_id == user.id,
        AuthIdentity.provider == "email"
    ).first()

    # Create JWT token
    token_data = {
        "sub": str(user.id),
        "email": auth_identity.provider_id if auth_identity else None,
        "username": user.username
    }
    token = create_access_token(token_data)

    return TokenResponse(
        user=user,
        token=token,
        token_type="bearer"
    )


@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Change user password

    Requires authentication. Verifies old password and updates to new password.
    """
    await email.change_password(
        user_id=str(current_user.id),
        old_password=request.old_password,
        new_password=request.new_password,
        db=db
    )

    return {"success": True, "message": "Password changed successfully"}


# ============================================================================
# EVM WALLET AUTHENTICATION
# ============================================================================

@router.get("/evm/challenge", response_model=ChallengeResponse)
async def evm_challenge(address: str):
    """
    Get challenge message for EVM wallet to sign

    Returns message and nonce. User must sign this message with their wallet.
    """
    return await evm.request_challenge(address)


@router.post("/evm/verify", response_model=TokenResponse)
async def evm_verify(
    request: EVMVerifyRequest,
    db: Session = Depends(get_db)
):
    """
    Verify EVM wallet signature and authenticate user

    Verifies the signed message and creates/logs in user
    """
    # Verify signature and get/create user
    user = await evm.verify_signature(
        address=request.address,
        signed_message=request.message,
        signature=request.signature,
        db=db
    )

    # Create JWT token
    token_data = {
        "sub": str(user.id),
        "username": user.username
    }
    token = create_access_token(token_data)

    return TokenResponse(
        user=user,
        token=token,
        token_type="bearer"
    )


# ============================================================================
# SOLANA WALLET AUTHENTICATION
# ============================================================================

@router.get("/solana/challenge", response_model=ChallengeResponse)
async def solana_challenge(address: str):
    """
    Get challenge message for Solana wallet to sign

    Returns message and nonce for Phantom/Solflare wallet
    """
    return await solana.request_challenge(address)


@router.post("/solana/verify", response_model=TokenResponse)
async def solana_verify(
    request: SolanaVerifyRequest,
    db: Session = Depends(get_db)
):
    """
    Verify Solana wallet signature and authenticate user

    Verifies Ed25519 signature and creates/logs in user
    """
    user = await solana.verify_signature(
        address=request.address,
        signed_message=request.message,
        signature=request.signature,
        db=db
    )

    token_data = {
        "sub": str(user.id),
        "username": user.username
    }
    token = create_access_token(token_data)

    return TokenResponse(
        user=user,
        token=token,
        token_type="bearer"
    )


# ============================================================================
# COSMOS WALLET AUTHENTICATION
# ============================================================================

@router.get("/cosmos/challenge", response_model=ChallengeResponse)
async def cosmos_challenge(address: str):
    """
    Get challenge message for Cosmos wallet to sign

    Returns message and nonce for Keplr/Cosmostation wallet
    """
    return await cosmos.request_challenge(address)


@router.post("/cosmos/verify", response_model=TokenResponse)
async def cosmos_verify(
    request: CosmosVerifyRequest,
    db: Session = Depends(get_db)
):
    """
    Verify Cosmos wallet signature and authenticate user

    Verifies secp256k1 signature and creates/logs in user
    """
    user = await cosmos.verify_signature(
        address=request.address,
        signed_message=request.message,
        signature=request.signature,
        public_key=request.public_key,
        db=db
    )

    token_data = {
        "sub": str(user.id),
        "username": user.username
    }
    token = create_access_token(token_data)

    return TokenResponse(
        user=user,
        token=token,
        token_type="bearer"
    )


# ============================================================================
# ACCOUNT LINKING
# ============================================================================

@router.post("/link", response_model=LinkAuthMethodResponse)
async def link_auth_method(
    request: LinkAuthMethodRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Link wallet to existing account

    Requires authentication. Links wallet address to current user's account.
    """
    # Verify signature based on provider
    if request.provider == "evm":
        # Check if wallet already linked
        existing = db.query(AuthIdentity).filter(
            AuthIdentity.provider == "evm",
            AuthIdentity.provider_id == request.address.lower()
        ).first()

        if existing:
            if existing.user_id == current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Wallet already linked to your account"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Wallet already linked to another account"
                )

        # Verify signature (same as login)
        verified_user = await evm.verify_signature(
            address=request.address,
            signed_message=request.message,
            signature=request.signature,
            db=db
        )

        # If verification created new user, delete it and link to current user instead
        if verified_user.id != current_user.id:
            # Delete the newly created user
            db.query(AuthIdentity).filter(
                AuthIdentity.user_id == verified_user.id
            ).delete()
            db.query(User).filter(User.id == verified_user.id).delete()

            # Create auth identity for current user
            auth_identity = AuthIdentity(
                user_id=current_user.id,
                provider="evm",
                provider_id=request.address.lower(),
                data={"address": request.address}
            )
            db.add(auth_identity)
            db.commit()

    elif request.provider == "solana":
        # Similar logic for Solana
        existing = db.query(AuthIdentity).filter(
            AuthIdentity.provider == "solana",
            AuthIdentity.provider_id == request.address
        ).first()

        if existing:
            if existing.user_id == current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Wallet already linked to your account"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Wallet already linked to another account"
                )

        # Verify and link
        verified_user = await solana.verify_signature(
            address=request.address,
            signed_message=request.message,
            signature=request.signature,
            db=db
        )

        if verified_user.id != current_user.id:
            db.query(AuthIdentity).filter(AuthIdentity.user_id == verified_user.id).delete()
            db.query(User).filter(User.id == verified_user.id).delete()

            auth_identity = AuthIdentity(
                user_id=current_user.id,
                provider="solana",
                provider_id=request.address,
                data={"address": request.address}
            )
            db.add(auth_identity)
            db.commit()

    elif request.provider == "cosmos":
        # Similar logic for Cosmos
        existing = db.query(AuthIdentity).filter(
            AuthIdentity.provider == "cosmos",
            AuthIdentity.provider_id == request.address
        ).first()

        if existing:
            if existing.user_id == current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Wallet already linked to your account"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Wallet already linked to another account"
                )

        if not request.public_key:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Public key required for Cosmos"
            )

        verified_user = await cosmos.verify_signature(
            address=request.address,
            signed_message=request.message,
            signature=request.signature,
            public_key=request.public_key,
            db=db
        )

        if verified_user.id != current_user.id:
            db.query(AuthIdentity).filter(AuthIdentity.user_id == verified_user.id).delete()
            db.query(User).filter(User.id == verified_user.id).delete()

            auth_identity = AuthIdentity(
                user_id=current_user.id,
                provider="cosmos",
                provider_id=request.address,
                data={"address": request.address, "public_key": request.public_key}
            )
            db.add(auth_identity)
            db.commit()

    # Get all linked methods
    linked_methods = db.query(AuthIdentity).filter(
        AuthIdentity.user_id == current_user.id
    ).all()

    return LinkAuthMethodResponse(
        success=True,
        message=f"{request.provider.upper()} wallet linked successfully",
        linked_methods=[AuthMethodResponse.model_validate(m) for m in linked_methods]
    )


@router.get("/methods", response_model=GetLinkedMethodsResponse)
async def get_linked_methods(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all linked authentication methods for current user

    Returns list of all auth methods (email, wallets) linked to account
    """
    methods = db.query(AuthIdentity).filter(
        AuthIdentity.user_id == current_user.id
    ).all()

    return GetLinkedMethodsResponse(
        methods=[AuthMethodResponse.model_validate(m) for m in methods]
    )


@router.delete("/unlink/{provider}/{provider_id}")
async def unlink_auth_method(
    provider: str,
    provider_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Unlink authentication method from account

    Cannot unlink if it's the last auth method (must have at least one)
    """
    # Count total auth methods
    total_methods = db.query(AuthIdentity).filter(
        AuthIdentity.user_id == current_user.id
    ).count()

    if total_methods <= 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot unlink last authentication method"
        )

    # Find and delete auth method
    auth_identity = db.query(AuthIdentity).filter(
        AuthIdentity.user_id == current_user.id,
        AuthIdentity.provider == provider,
        AuthIdentity.provider_id == provider_id
    ).first()

    if not auth_identity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Authentication method not found"
        )

    db.delete(auth_identity)
    db.commit()

    return {"success": True, "message": "Authentication method unlinked"}
```

---

### Step 7.3: Register Auth Router

**File**: `backend/src/app/main.py`

**Action**: Import and include auth router

**Code**:

```python
"""PrivexBot Backend - FastAPI Application"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.init_db import init_db
from app.api.v1.routes import auth  # NEW: Import auth router

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Privacy-First AI Chatbot Builder API",
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# NEW: Include auth router
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)

# ... rest of main.py (health check, root, startup, etc.)
```

---

## Phase 8: Database Migration

### Step 8.1: Generate Migration

**Command**:

```bash
cd backend

# Generate migration file
alembic revision --autogenerate -m "create users and auth_identities tables"
```

**This will create**: `alembic/versions/xxx_create_users_and_auth_identities_tables.py`

---

### Step 8.2: Review Migration

**File**: `alembic/versions/xxx_create_users_and_auth_identities_tables.py`

**Action**: Review the auto-generated migration, ensure it includes:

**Expected Operations**:

```python
def upgrade():
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('username', sa.String(length=255), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('username')
    )
    op.create_index(op.f('ix_users_username'), 'users', ['username'])

    # Create auth_identities table
    op.create_table(
        'auth_identities',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('provider', sa.String(length=50), nullable=False),
        sa.Column('provider_id', sa.String(length=255), nullable=False),
        sa.Column('data', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('provider', 'provider_id', name='uq_provider_provider_id')
    )
    op.create_index(op.f('ix_auth_identities_provider_provider_id'), 'auth_identities', ['provider', 'provider_id'])
    op.create_index(op.f('ix_auth_identities_user_id'), 'auth_identities', ['user_id'])


def downgrade():
    op.drop_table('auth_identities')
    op.drop_table('users')
```

---

### Step 8.3: Apply Migration

**Command**:

```bash
# Apply migration
alembic upgrade head

# Verify tables created
psql -U privexbot -d privexbot_dev -c "\dt"
```

**Expected Output**:

```
              List of relations
 Schema |       Name        | Type  |   Owner
--------+-------------------+-------+-----------
 public | alembic_version   | table | privexbot
 public | auth_identities   | table | privexbot
 public | users             | table | privexbot
```

---

## Phase 9: Testing

### Step 9.1: Manual Testing with Postman/HTTPie

**Test Email Signup**:

```bash
# Signup
http POST http://localhost:8000/api/v1/auth/signup/email \
  email="test@example.com" \
  password="SecurePass123" \
  username="testuser"

# Expected: 201 Created, returns user + token
```

**Test Email Login**:

```bash
http POST http://localhost:8000/api/v1/auth/login/email \
  email="test@example.com" \
  password="SecurePass123"

# Expected: 200 OK, returns user + token
```

**Test Protected Route**:

```bash
TOKEN="<token_from_login>"

http GET http://localhost:8000/api/v1/auth/methods \
  "Authorization: Bearer ${TOKEN}"

# Expected: 200 OK, returns linked auth methods
```

---

### Step 9.2: Testing Wallet Authentication

**Test EVM Challenge**:

```bash
http GET "http://localhost:8000/api/v1/auth/evm/challenge?address=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"

# Expected: 200 OK, returns message and nonce
```

**Test EVM Verify** (requires actual wallet signature):

- Use frontend with MetaMask
- OR use ethers.js script to sign message
- POST to `/api/v1/auth/evm/verify` with signature

---

### Step 9.3: Test Account Linking

**Scenario**: User signs up with email, then links MetaMask wallet

```bash
# 1. Signup with email
RESPONSE=$(http POST http://localhost:8000/api/v1/auth/signup/email \
  email="link@example.com" \
  password="SecurePass123" \
  username="linkuser")

TOKEN=$(echo $RESPONSE | jq -r '.token')

# 2. Get EVM challenge (with auth)
http GET "http://localhost:8000/api/v1/auth/evm/challenge?address=0xABC..." \
  "Authorization: Bearer ${TOKEN}"

# 3. Sign message with wallet

# 4. Link wallet
http POST http://localhost:8000/api/v1/auth/link \
  "Authorization: Bearer ${TOKEN}" \
  provider="evm" \
  address="0xABC..." \
  message="<signed_message>" \
  signature="<signature>"

# Expected: 200 OK, wallet linked

# 5. Get linked methods
http GET http://localhost:8000/api/v1/auth/methods \
  "Authorization: Bearer ${TOKEN}"

# Expected: Returns both email and EVM methods
```

---

## Phase 10: Integration

### Step 10.1: Verify All Endpoints

**Create checklist**:

```
✅ POST /api/v1/auth/signup/email
✅ POST /api/v1/auth/login/email
✅ POST /api/v1/auth/change-password
✅ GET  /api/v1/auth/evm/challenge
✅ POST /api/v1/auth/evm/verify
✅ GET  /api/v1/auth/solana/challenge
✅ POST /api/v1/auth/solana/verify
✅ GET  /api/v1/auth/cosmos/challenge
✅ POST /api/v1/auth/cosmos/verify
✅ POST /api/v1/auth/link
✅ GET  /api/v1/auth/methods
✅ DELETE /api/v1/auth/unlink/{provider}/{provider_id}
```

---

### Step 10.2: Update API Documentation

**Test Swagger UI**:

```bash
# Start server
cd backend
uvicorn src.app.main:app --reload

# Open browser
open http://localhost:8000/api/docs
```

**Verify**:

- All auth endpoints appear in docs
- Schemas are correct
- Can test endpoints interactively

---

### Step 10.3: Environment Variables Checklist

**File**: `.env` or `.env.dev`

**Required Variables**:

```bash
# Database
DATABASE_URL=postgresql://privexbot:password@localhost:5432/privexbot_dev

# Redis
REDIS_URL=redis://localhost:6379/0

# Security
SECRET_KEY=<generate_with_openssl_rand_hex_32>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
NONCE_EXPIRE_SECONDS=300

# CORS
BACKEND_CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

## Summary

You've now implemented a complete multi-chain authentication system with:

✅ **4 Auth Methods**: Email, EVM, Solana, Cosmos
✅ **Account Linking**: Users can link multiple auth methods
✅ **Security**: Bcrypt, JWT, signature verification, nonce management
✅ **Database**: PostgreSQL with proper schema and migrations
✅ **API**: RESTful endpoints with Pydantic validation
✅ **Documentation**: Auto-generated Swagger UI

**Next Steps**:

1. Frontend integration (see specification doc)
2. Add rate limiting (slowapi)
3. Add email verification
4. Add password reset flow
5. Add refresh tokens
6. Add audit logging

**Testing**: See Phase 9 for comprehensive testing guide

**Troubleshooting**: Check logs, verify Redis connection, check database migrations
