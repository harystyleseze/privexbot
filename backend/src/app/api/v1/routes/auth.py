"""
Authentication API routes.

WHY:
- Provide REST API for all authentication methods
- Support email/password and wallet authentication
- Enable account linking (multiple auth methods per user)

HOW:
- Email: signup, login, change-password
- Wallets (EVM/Solana/Cosmos): challenge-response pattern
- JWT tokens for session management

ENDPOINTS:
-----------
Email Auth:
  POST /auth/email/signup - Register with email/password
  POST /auth/email/login - Login with email/password
  POST /auth/email/change-password - Change password (requires auth)

EVM Wallet Auth:
  POST /auth/evm/challenge - Get challenge message to sign
  POST /auth/evm/verify - Verify signature and login
  POST /auth/evm/link - Link wallet to existing account (requires auth)

Solana Wallet Auth:
  POST /auth/solana/challenge - Get challenge message to sign
  POST /auth/solana/verify - Verify signature and login
  POST /auth/solana/link - Link wallet to existing account (requires auth)

Cosmos Wallet Auth:
  POST /auth/cosmos/challenge - Get challenge message to sign
  POST /auth/cosmos/verify - Verify signature and login
  POST /auth/cosmos/link - Link wallet to existing account (requires auth)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict

from app.api.v1.dependencies import get_db, get_current_user
from app.models.user import User
from app.core.security import create_access_token
from app.core.config import settings
from app.schemas.token import (
    EmailSignupRequest,
    EmailLoginRequest,
    ChangePasswordRequest,
    WalletChallengeRequest,
    WalletVerifyRequest,
    CosmosWalletVerifyRequest,
    LinkWalletRequest,
    CosmosLinkWalletRequest,
    Token,
    WalletChallengeResponse
)
from app.schemas.user import UserProfile, AuthMethodInfo
from app.auth.strategies import email, evm, solana, cosmos


router = APIRouter(prefix="/auth", tags=["authentication"])


# ============================================================
# CURRENT USER
# ============================================================

@router.get("/me", response_model=UserProfile)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current authenticated user's profile.

    WHY: Allow frontend to fetch user details after login
    HOW: Extract user from JWT token, load auth methods from DB

    Flow:
    1. JWT token validated by get_current_user dependency
    2. Load user's authentication methods from database
    3. Return UserProfile with all linked auth methods

    Args:
        current_user: Authenticated user (from JWT token)
        db: Database session (injected)

    Returns:
        UserProfile with user data and linked auth methods

    Raises:
        HTTPException(401): Invalid or missing JWT token (from dependency)

    Example Response:
        {
            "id": "123e4567-e89b-12d3-a456-426614174000",
            "username": "alice_wonderland",
            "is_active": true,
            "created_at": "2024-01-15T10:30:00Z",
            "updated_at": "2024-01-15T10:30:00Z",
            "auth_methods": [
                {
                    "provider": "email",
                    "provider_id": "alice@example.com",
                    "linked_at": "2024-01-15T10:30:00Z"
                }
            ]
        }
    """
    # Get user's auth identities
    from app.models.auth_identity import AuthIdentity

    auth_identities = db.query(AuthIdentity).filter(
        AuthIdentity.user_id == current_user.id
    ).all()

    # Convert to AuthMethodInfo schemas
    auth_methods = [
        AuthMethodInfo(
            provider=auth.provider,
            provider_id=auth.provider_id,
            linked_at=auth.created_at
        )
        for auth in auth_identities
    ]

    # Return UserProfile
    return UserProfile(
        id=current_user.id,
        username=current_user.username,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
        auth_methods=auth_methods
    )


# ============================================================
# EMAIL AUTHENTICATION
# ============================================================

@router.post("/email/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
async def email_signup(
    request: EmailSignupRequest,
    db: Session = Depends(get_db)
):
    """
    Register a new user with email and password.

    WHY: Allow users to create account with traditional credentials
    HOW: Validate input, create user, return JWT token

    Flow:
    1. Validate email format and password strength
    2. Check if email already registered
    3. Hash password with bcrypt
    4. Create User and AuthIdentity records
    5. Generate JWT token
    6. Return token for immediate login

    Args:
        request: EmailSignupRequest with username, email, password
        db: Database session (injected)

    Returns:
        Token with access_token and expiration

    Raises:
        HTTPException(400): Email already registered or weak password
        HTTPException(400): Username already taken
    """
    # Call email strategy
    user = await email.signup_with_email(
        email=request.email,
        password=request.password,
        username=request.username,
        db=db
    )

    # Generate access token
    access_token = create_access_token(data={"sub": str(user.id)})

    return Token(
        access_token=access_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60  # Convert minutes to seconds
    )


@router.post("/email/login", response_model=Token)
async def email_login(
    request: EmailLoginRequest,
    db: Session = Depends(get_db)
):
    """
    Login with email and password.

    WHY: Authenticate existing users with credentials
    HOW: Verify password hash, return JWT token

    Flow:
    1. Find user by email
    2. Verify password matches hash
    3. Check account is active
    4. Generate JWT token
    5. Return token for authenticated requests

    Args:
        request: EmailLoginRequest with email and password
        db: Database session (injected)

    Returns:
        Token with access_token and expiration

    Raises:
        HTTPException(401): Invalid credentials or inactive account

    Security:
    - Same error for all failures (prevents user enumeration)
    - Bcrypt constant-time comparison (prevents timing attacks)
    """
    # Call email strategy
    user = await email.login_with_email(
        email=request.email,
        password=request.password,
        db=db
    )

    # Generate access token
    access_token = create_access_token(data={"sub": str(user.id)})

    return Token(
        access_token=access_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60  # Convert minutes to seconds
    )


@router.post("/email/change-password", response_model=Dict[str, str])
async def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Change user's password (requires authentication).

    WHY: Allow users to update password securely
    HOW: Verify current password, validate new password, update hash

    Flow:
    1. Extract user from JWT token
    2. Verify current password
    3. Validate new password strength
    4. Update password hash
    5. Return success message

    Args:
        request: ChangePasswordRequest with old and new passwords
        current_user: Authenticated user (from JWT token)
        db: Database session (injected)

    Returns:
        Success message

    Raises:
        HTTPException(400): No email auth method found
        HTTPException(400): New password doesn't meet requirements
        HTTPException(401): Current password incorrect

    Security:
    - Requires valid JWT token (prevents unauthorized changes)
    - Verifies old password (prevents takeover)
    - Enforces password strength (prevents weak passwords)
    """
    # Call email strategy
    await email.change_password(
        user_id=current_user.id,
        old_password=request.old_password,
        new_password=request.new_password,
        db=db
    )

    return {"message": "Password changed successfully"}


# ============================================================
# EVM WALLET AUTHENTICATION
# ============================================================

@router.post("/evm/challenge", response_model=WalletChallengeResponse)
async def evm_challenge(request: WalletChallengeRequest):
    """
    Generate challenge message for EVM wallet signature.

    WHY: Implement secure challenge-response authentication
    HOW: Generate nonce, store in Redis, return EIP-4361 message

    Flow:
    1. Validate Ethereum address format
    2. Generate cryptographically secure nonce
    3. Store nonce in Redis (5 min expiration)
    4. Create EIP-4361 compliant message
    5. Return message for user to sign in wallet

    Args:
        request: WalletChallengeRequest with address

    Returns:
        WalletChallengeResponse with message to sign and nonce

    Raises:
        HTTPException(400): Invalid address format

    Security:
    - Nonce expires in 5 minutes
    - Single-use nonce (deleted after verification)
    - EIP-4361 format prevents phishing
    """
    challenge = await evm.request_challenge(address=request.address)
    return WalletChallengeResponse(**challenge)


@router.post("/evm/verify", response_model=Token)
async def evm_verify(
    request: WalletVerifyRequest,
    db: Session = Depends(get_db)
):
    """
    Verify EVM wallet signature and authenticate user.

    WHY: Cryptographically prove wallet ownership without passwords
    HOW: Recover signer from signature, verify matches address

    Flow:
    1. Retrieve nonce from Redis (single-use)
    2. Verify nonce in signed message
    3. Recover signer address from signature
    4. Verify recovered address matches claimed address
    5. Find or create user
    6. Generate JWT token

    Args:
        request: WalletVerifyRequest with address, message, signature
        db: Database session (injected)

    Returns:
        Token with access_token and expiration

    Raises:
        HTTPException(400): Nonce expired or invalid
        HTTPException(401): Signature verification failed

    Security:
    - Nonce is single-use (prevents replay attacks)
    - ECDSA signature recovery proves private key ownership
    - No password needed - cryptographic proof
    """
    # Call EVM strategy
    user = await evm.verify_signature(
        address=request.address,
        signed_message=request.signed_message,
        signature=request.signature,
        db=db,
        username=request.username
    )

    # Generate access token
    access_token = create_access_token(data={"sub": str(user.id)})

    return Token(
        access_token=access_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60  # Convert minutes to seconds
    )


@router.post("/evm/link", response_model=Dict[str, str])
async def evm_link(
    request: LinkWalletRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Link EVM wallet to existing user account (requires authentication).

    WHY: Allow users to add wallet auth to email-only accounts
    HOW: Verify signature, create new AuthIdentity for existing user

    Flow:
    1. Extract user from JWT token
    2. Verify wallet signature (same as /verify)
    3. Check wallet not already linked to another account
    4. Create AuthIdentity linking wallet to user
    5. Return success message

    Args:
        request: LinkWalletRequest with address, message, signature
        current_user: Authenticated user (from JWT token)
        db: Database session (injected)

    Returns:
        Success message

    Raises:
        HTTPException(400): Wallet already linked to another account
        HTTPException(401): Signature verification failed

    Use Case:
    - User signed up with email, now wants to add MetaMask
    - User has multiple wallets, wants to link all to same account
    """
    # Call EVM strategy
    await evm.link_evm_to_user(
        user_id=str(current_user.id),
        address=request.address,
        signed_message=request.signed_message,
        signature=request.signature,
        db=db
    )

    return {"message": "Wallet linked successfully"}


# ============================================================
# SOLANA WALLET AUTHENTICATION
# ============================================================

@router.post("/solana/challenge", response_model=WalletChallengeResponse)
async def solana_challenge(request: WalletChallengeRequest):
    """
    Generate challenge message for Solana wallet signature.

    WHY: Implement secure challenge-response authentication
    HOW: Generate nonce, store in Redis, return message to sign

    Flow:
    1. Validate Solana address format (base58, 32 bytes)
    2. Generate cryptographically secure nonce
    3. Store nonce in Redis (5 min expiration)
    4. Create message to sign
    5. Return message for user to sign in wallet

    Args:
        request: WalletChallengeRequest with address

    Returns:
        WalletChallengeResponse with message to sign and nonce

    Raises:
        HTTPException(400): Invalid address format

    Security:
    - Nonce expires in 5 minutes
    - Single-use nonce (deleted after verification)
    - Clear message format (no standard like EIP-4361 yet)
    """
    challenge = await solana.request_challenge(address=request.address)
    return WalletChallengeResponse(**challenge)


@router.post("/solana/verify", response_model=Token)
async def solana_verify(
    request: WalletVerifyRequest,
    db: Session = Depends(get_db)
):
    """
    Verify Solana wallet signature and authenticate user.

    WHY: Cryptographically prove wallet ownership using Ed25519
    HOW: Verify signature against public key from address

    Flow:
    1. Retrieve nonce from Redis (single-use)
    2. Verify nonce in signed message
    3. Decode signature and address from base58
    4. Verify Ed25519 signature
    5. Find or create user
    6. Generate JWT token

    Args:
        request: WalletVerifyRequest with address, message, signature
        db: Database session (injected)

    Returns:
        Token with access_token and expiration

    Raises:
        HTTPException(400): Nonce expired or invalid
        HTTPException(401): Signature verification failed

    Security:
    - Nonce is single-use (prevents replay attacks)
    - Ed25519 signature verification proves private key ownership
    - Solana address IS the public key
    """
    # Call Solana strategy
    user = await solana.verify_signature(
        address=request.address,
        signed_message=request.signed_message,
        signature=request.signature,
        db=db,
        username=request.username
    )

    # Generate access token
    access_token = create_access_token(data={"sub": str(user.id)})

    return Token(
        access_token=access_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60  # Convert minutes to seconds
    )


@router.post("/solana/link", response_model=Dict[str, str])
async def solana_link(
    request: LinkWalletRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Link Solana wallet to existing user account (requires authentication).

    WHY: Allow users to add Solana wallet auth to existing accounts
    HOW: Verify signature, create new AuthIdentity for existing user

    Flow:
    1. Extract user from JWT token
    2. Verify wallet signature (same as /verify)
    3. Check wallet not already linked to another account
    4. Create AuthIdentity linking wallet to user
    5. Return success message

    Args:
        request: LinkWalletRequest with address, message, signature
        current_user: Authenticated user (from JWT token)
        db: Database session (injected)

    Returns:
        Success message

    Raises:
        HTTPException(400): Wallet already linked to another account
        HTTPException(401): Signature verification failed

    Use Case:
    - User signed up with email, now wants to add Phantom wallet
    - User has multiple wallets, wants to link all to same account
    """
    # Call Solana strategy
    await solana.link_solana_to_user(
        user_id=str(current_user.id),
        address=request.address,
        signed_message=request.signed_message,
        signature=request.signature,
        db=db
    )

    return {"message": "Wallet linked successfully"}


# ============================================================
# COSMOS WALLET AUTHENTICATION
# ============================================================

@router.post("/cosmos/challenge", response_model=WalletChallengeResponse)
async def cosmos_challenge(request: WalletChallengeRequest):
    """
    Generate challenge message for Cosmos wallet signature.

    WHY: Implement secure challenge-response authentication
    HOW: Generate nonce, store in Redis, return message to sign

    Flow:
    1. Validate Cosmos address format (bech32 encoding)
    2. Generate cryptographically secure nonce
    3. Store nonce in Redis (5 min expiration)
    4. Create message to sign
    5. Return message for user to sign in wallet

    Args:
        request: WalletChallengeRequest with address

    Returns:
        WalletChallengeResponse with message to sign and nonce

    Raises:
        HTTPException(400): Invalid address format

    Security:
    - Nonce expires in 5 minutes
    - Single-use nonce (deleted after verification)
    - Supports cosmos and secret networks
    """
    challenge = await cosmos.request_challenge(address=request.address)
    return WalletChallengeResponse(**challenge)


@router.post("/cosmos/verify", response_model=Token)
async def cosmos_verify(
    request: CosmosWalletVerifyRequest,
    db: Session = Depends(get_db)
):
    """
    Verify Cosmos wallet signature and authenticate user.

    WHY: Cryptographically prove wallet ownership using secp256k1
    HOW: Verify pubkey matches address, then verify signature

    Flow:
    1. Retrieve nonce from Redis (single-use)
    2. Verify nonce in signed message
    3. Decode signature and public key from base64
    4. Derive address from public key (verify it matches)
    5. Verify secp256k1 signature
    6. Find or create user
    7. Generate JWT token

    Args:
        request: CosmosWalletVerifyRequest with address, message, signature, public_key
        db: Database session (injected)

    Returns:
        Token with access_token and expiration

    Raises:
        HTTPException(400): Nonce expired or invalid
        HTTPException(400): Public key doesn't match address
        HTTPException(401): Signature verification failed

    Security:
    - Nonce is single-use (prevents replay attacks)
    - Public key must derive to claimed address
    - secp256k1 signature verification proves ownership

    Note: Unlike EVM (which recovers pubkey from signature), Cosmos
    wallets provide the public key separately and we must verify it matches.
    """
    # Call Cosmos strategy
    user = await cosmos.verify_signature(
        address=request.address,
        signed_message=request.signed_message,
        signature=request.signature,
        public_key=request.public_key,
        db=db,
        username=request.username
    )

    # Generate access token
    access_token = create_access_token(data={"sub": str(user.id)})

    return Token(
        access_token=access_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60  # Convert minutes to seconds
    )


@router.post("/cosmos/link", response_model=Dict[str, str])
async def cosmos_link(
    request: CosmosLinkWalletRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Link Cosmos wallet to existing user account (requires authentication).

    WHY: Allow users to add Cosmos wallet auth to existing accounts
    HOW: Verify signature and pubkey, create new AuthIdentity for existing user

    Flow:
    1. Extract user from JWT token
    2. Verify wallet signature (same as /verify)
    3. Check wallet not already linked to another account
    4. Create AuthIdentity linking wallet to user
    5. Return success message

    Args:
        request: CosmosLinkWalletRequest with address, message, signature, public_key
        current_user: Authenticated user (from JWT token)
        db: Database session (injected)

    Returns:
        Success message

    Raises:
        HTTPException(400): Wallet already linked to another account
        HTTPException(400): Public key doesn't match address
        HTTPException(401): Signature verification failed

    Use Case:
    - User signed up with email, now wants to add Keplr wallet
    - User has wallets on multiple Cosmos chains, wants to link all
    """
    # Call Cosmos strategy
    await cosmos.link_cosmos_to_user(
        user_id=str(current_user.id),
        address=request.address,
        signed_message=request.signed_message,
        signature=request.signature,
        public_key=request.public_key,
        db=db
    )

    return {"message": "Wallet linked successfully"}
