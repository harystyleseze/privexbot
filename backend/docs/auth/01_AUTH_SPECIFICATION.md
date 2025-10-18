# PrivexBot Authentication System Specification

**Version**: 1.0
**Date**: 2025-10-12
**Status**: Implementation Ready
**Audience**: Senior Backend Engineers

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication Methods](#authentication-methods)
3. [System Architecture](#system-architecture)
4. [Database Design](#database-design)
5. [Authentication Flows](#authentication-flows)
6. [Account Linking](#account-linking)
7. [Security Considerations](#security-considerations)
8. [Frontend Integration](#frontend-integration)
9. [API Endpoints](#api-endpoints)
10. [Testing Strategy](#testing-strategy)
11. [Edge Cases & Solutions](#edge-cases--solutions)
12. [Dependencies](#dependencies)

---

## Overview

### Purpose

Implement a flexible, secure authentication system that supports:

- **Traditional email/password authentication**
- **Multi-chain wallet authentication** (EVM, Cosmos, Solana)
- **Account linking** (users can link multiple auth methods to one account)
- **Single sign-on experience** (sign in with any linked method)

### Core Principles

1. **Separation of Concerns**: User identity is separate from authentication methods
2. **Flexibility**: Users can add/remove authentication methods
3. **Security**: Industry-standard cryptographic verification for all methods
4. **Simplicity**: Minimal code changes, leverage existing patterns
5. **No Over-Engineering**: Use proven libraries, avoid custom crypto

### Value Proposition

**For Users:**

- Sign up with email, later link wallets for easier access
- Web3 users can sign in with any wallet (no password needed)
- One account, multiple login options

**For Business:**

- Support both Web2 and Web3 user bases
- Future-proof (easy to add new auth methods)
- Reduced friction (users choose their preferred auth method)

---

## Authentication Methods

### 1. Email/Password Authentication

**WHY**: Traditional, familiar, works for all users

**HOW**:

- Password hashed with bcrypt (industry standard)
- Email stored as provider_id in auth_identities
- Password hash stored in JSONB `data` field

**LIBRARIES**:

- `passlib[bcrypt]` - Password hashing and verification
- `bcrypt` - Low-level bcrypt implementation

**FLOW**:

```
1. User provides email + password
2. Backend hashes password (bcrypt, auto-salted)
3. Store User + AuthIdentity with password_hash in data
4. On login: verify password, issue JWT
```

**SECURITY**:

- Bcrypt is intentionally slow (prevents brute force)
- Automatic salting (prevents rainbow table attacks)
- Never store plain text passwords
- Same error message for invalid email/password (prevents user enumeration)

---

### 2. EVM Wallet Authentication (Ethereum, Polygon, etc.)

**WHY**: Support Web3 users with MetaMask, Coinbase Wallet, etc.

**HOW**:

- Challenge-response pattern with single-use nonce
- Cryptographic signature verification (ECDSA)
- Follows EIP-4361 (Sign-In with Ethereum) standard

**LIBRARIES**:

- `eth-account` - Ethereum signature verification and address utilities

**FLOW**:

```
1. Frontend connects wallet (MetaMask) → get address
2. Request challenge: GET /auth/evm/challenge?address=0x...
3. Backend generates nonce, stores in Redis (5 min expiry), returns message
4. Frontend prompts wallet to sign message
5. User approves in wallet
6. Verify signature: POST /auth/evm/verify {address, message, signature}
7. Backend verifies signature, finds/creates user, returns JWT
```

**CRYPTOGRAPHY**:

- ECDSA signature with secp256k1 curve
- Signature recovery to prove wallet ownership
- No private keys ever touch backend

**SECURITY**:

- Single-use nonce prevents replay attacks
- 5-minute expiration prevents stale signatures
- EIP-4361 format prevents phishing (users see domain they're signing into)

---

### 3. Solana Wallet Authentication (Phantom, Solflare, etc.)

**WHY**: Support Solana ecosystem users

**HOW**:

- Challenge-response with nonce
- Ed25519 signature verification (different from EVM's ECDSA)
- Base58 address encoding (vs hex for EVM)

**LIBRARIES**:

- `pynacl` - Ed25519 signature verification
- `base58` - Solana address encoding/decoding

**FLOW**:

```
1. Connect Phantom wallet → get address
2. GET /auth/solana/challenge?address=5xF...
3. Backend generates nonce, returns message
4. Frontend requests Phantom to sign
5. POST /auth/solana/verify {address, message, signature}
6. Backend verifies Ed25519 signature, returns JWT
```

**DIFFERENCES FROM EVM**:

- Ed25519 vs ECDSA (different cryptographic schemes)
- Base58 vs Hex encoding
- No standard like EIP-4361 (use clear message format)

**SECURITY**:

- Ed25519 is faster and simpler than ECDSA
- Base58 avoids confusing characters (0/O, I/l)
- Same nonce expiry pattern (5 minutes)

---

### 4. Cosmos Wallet Authentication (Keplr, Cosmostation, etc.)

**WHY**: Support Cosmos ecosystem (Secret Network is a Cosmos chain)

**HOW**:

- Challenge-response with nonce
- Secp256k1 signature verification (same curve as EVM, different address format)
- Bech32 address encoding (cosmos1..., secret1...)
- Public key provided separately (unlike EVM)

**LIBRARIES**:

- `ecdsa` - secp256k1 signature verification
- `bech32` - Cosmos address validation and derivation

**FLOW**:

```
1. Connect Keplr wallet → get address
2. GET /auth/cosmos/challenge?address=cosmos1...
3. Backend generates nonce, returns message
4. Frontend requests Keplr to sign
5. Keplr returns signature AND public key
6. POST /auth/cosmos/verify {address, message, signature, public_key}
7. Backend verifies pubkey matches address, verifies signature, returns JWT
```

**UNIQUE ASPECTS**:

- Public key provided separately (can't recover from signature alone)
- Must verify public key derives to correct address
- Bech32 encoding with human-readable prefix

**SECURITY**:

- Verify public key → address derivation (prevents key substitution)
- SHA256 + RIPEMD160 address derivation (Cosmos SDK standard)

---

## System Architecture

### Component Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                         Frontend                                       │
│  (React/vite/typescript with Wallet Connectors: MetaMask, Phantom, etc)│
└────────────────────┬───────────────────────────────────────────────────┘
                     │ HTTPS/REST
                     ▼
┌──────────────────────────────────────────────────────────────┐
│                      FastAPI Backend                         │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐   │
│  │           Auth Routes (/api/v1/auth)                  │   │
│  │  - POST /signup/email                                 │   │
│  │  - POST /login/email                                  │   │
│  │  - GET  /evm/challenge                                │   │
│  │  - POST /evm/verify                                   │   │
│  │  - GET  /solana/challenge                             │   │
│  │  - POST /solana/verify                                │   │
│  │  - GET  /cosmos/challenge                             │   │
│  │  - POST /cosmos/verify                                │   │
│  │  - POST /link                                         │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐   │
│  │              Auth Strategies                          │   │
│  │  - email.py    (bcrypt password hashing)              │   │
│  │  - evm.py      (ECDSA signature verification)         │   │
│  │  - solana.py   (Ed25519 signature verification)       │   │
│  │  - cosmos.py   (secp256k1 + bech32)                   │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐   │
│  │            Security Module                            │   │
│  │  - hash_password()                                    │   │
│  │  - verify_password()                                  │   │
│  │  - create_access_token()                              │   │
│  │  - decode_token()                                     │   │
│  └───────────────────────────────────────────────────────┘   │
└────────────────┬────────────────────────┬────────────────────┘
                 │                        │
                 ▼                        ▼
      ┌──────────────────┐    ┌─────────────────────┐
      │   PostgreSQL     │    │      Redis          │
      │                  │    │                     │
      │  users           │    │  wallet_nonces:{    │
      │  auth_identities │    │    address: nonce   │
      │                  │    │  } (5 min TTL)      │
      └──────────────────┘    └─────────────────────┘
```

### Data Flow

**Authentication Flow:**

```
1. Frontend → Backend: Auth request (email+password OR wallet signature)
2. Backend → Auth Strategy: Validate credentials/signature
3. Auth Strategy → Database: Find/create user and auth_identity
4. Auth Strategy → Security Module: Generate JWT token
5. Backend → Frontend: Return JWT + user info
6. Frontend: Store JWT in localStorage/cookie
7. Frontend: Include JWT in Authorization header for subsequent requests
```

**Authorization Flow:**

```
1. Frontend → Backend: API request with JWT in header
2. Backend Middleware: Decode JWT, verify signature
3. Middleware → Database: Load user, check is_active
4. Middleware: Inject user into request context
5. Route Handler: Access current_user from context
6. Route Handler: Check permissions (org/workspace membership)
7. Backend → Frontend: Return requested data
```

---

## Database Design

### Users Table

```python
Table: users
─────────────────────────────────────────────────
Column        Type          Constraints
─────────────────────────────────────────────────
id            UUID          PRIMARY KEY, DEFAULT gen_random_uuid()
username      VARCHAR(255)  UNIQUE, NOT NULL, INDEX
is_active     BOOLEAN       DEFAULT TRUE, NOT NULL
created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
updated_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP, AUTO-UPDATE

Indexes:
- PRIMARY KEY (id)
- UNIQUE INDEX (username)
```

**WHY**:

- UUID primary key: Stable, never changes, hard to guess
- username: Human-readable identifier (can be email or custom)
- is_active: Soft delete (keep data, disable access)

---

### Auth Identities Table

```python
Table: auth_identities
─────────────────────────────────────────────────────────
Column        Type          Constraints
─────────────────────────────────────────────────────────
id            UUID          PRIMARY KEY, DEFAULT gen_random_uuid()
user_id       UUID          FOREIGN KEY users(id) ON DELETE CASCADE, INDEX
provider      VARCHAR(50)   NOT NULL, CHECK IN ('email', 'evm', 'cosmos', 'solana')
provider_id   VARCHAR(255)  NOT NULL, INDEX
data          JSONB         NOT NULL, DEFAULT '{}'
created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
updated_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP, AUTO-UPDATE

Indexes:
- PRIMARY KEY (id)
- INDEX (user_id)
- INDEX (provider, provider_id)
- UNIQUE CONSTRAINT (provider, provider_id)
```

**WHY**:

- user_id: Links auth method to user account
- provider: Identifies auth strategy ('email', 'evm', etc.)
- provider_id: Unique identifier from provider (email or wallet address)
- data (JSONB): Flexible storage for provider-specific data
- UNIQUE (provider, provider_id): Prevents duplicate registrations

**Data Field Structure**:

```json
// For email
{
  "password_hash": "$2b$12$...",
  "email_verified": false
}

// For EVM wallets
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "first_login": "2025-10-12T10:30:00Z"
}

// For Solana wallets
{
  "address": "5xF2gqEHCDmW9Px8kP...",
  "first_login": "2025-10-12T10:30:00Z"
}

// For Cosmos wallets
{
  "address": "cosmos1abcd...",
  "public_key": "base64_encoded_pubkey",
  "first_login": "2025-10-12T10:30:00Z"
}
```

---

### Redis Nonce Storage

```
Key Pattern: nonce:{provider}:{address}
Value: random_nonce_string
TTL: 300 seconds (5 minutes)

Examples:
- nonce:evm:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb → "Xy7k9mN..."
- nonce:solana:5xF2gqEHCDmW9Px8kP... → "aB3c4dE..."
- nonce:cosmos:cosmos1abcd... → "pQ2r3sT..."
```

**WHY Redis**:

- Fast read/write for challenge-response
- Automatic expiration (TTL)
- Single-use pattern (GETDEL command)

---

## Authentication Flows

### 1. Email Signup Flow

```
┌─────────┐                 ┌─────────┐                ┌──────────┐
│ Frontend│                 │ Backend │                │ Database │
└────┬────┘                 └────┬────┘                └─────┬────┘
     │                           │                           │
     │ POST /auth/signup/email   │                           │
     │ {email, password,         │                           │
     │  username}                │                           │
     ├──────────────────────────►│                           │
     │                           │                           │
     │                           │ Check if email exists     │
     │                           ├──────────────────────────►│
     │                           │                           │
     │                           │◄──────────────────────────┤
     │                           │ (email not found)         │
     │                           │                           │
     │                           │ hash_password(password)   │
     │                           │                           │
     │                           │ Create User               │
     │                           ├──────────────────────────►│
     │                           │                           │
     │                           │ Create AuthIdentity       │
     │                           │ (provider='email',        │
     │                           │  provider_id=email,       │
     │                           │  data={password_hash})    │
     │                           ├──────────────────────────►│
     │                           │                           │
     │                           │ create_access_token(user) │
     │                           │                           │
     │ {user, token}             │                           │
     │◄──────────────────────────┤                           │
     │                           │                           │
     │ Store token (localStorage)│                           │
     │                           │                           │
```

**Error Cases**:

- Email already exists → 400 "Email already registered"
- Invalid email format → 422 Validation error
- Password too weak → 422 Validation error

---

### 2. Email Login Flow

```
┌─────────┐                 ┌─────────┐                ┌──────────┐
│ Frontend│                 │ Backend │                │ Database │
└────┬────┘                 └────┬────┘                └─────┬────┘
     │                           │                           │
     │ POST /auth/login/email    │                           │
     │ {email, password}         │                           │
     ├──────────────────────────►│                           │
     │                           │                           │
     │                           │ Find AuthIdentity         │
     │                           │ WHERE provider='email'    │
     │                           │   AND provider_id=email   │
     │                           ├──────────────────────────►│
     │                           │                           │
     │                           │◄──────────────────────────┤
     │                           │ (auth_identity found)     │
     │                           │                           │
     │                           │ Get User (check active)   │
     │                           ├──────────────────────────►│
     │                           │                           │
     │                           │ verify_password(password, │
     │                           │   stored_hash)            │
     │                           │                           │
     │                           │ create_access_token(user) │
     │                           │                           │
     │ {user, token}             │                           │
     │◄──────────────────────────┤                           │
     │                           │                           │
```

**Error Cases**:

- Email not found → 401 "Invalid credentials" (same message as password)
- Wrong password → 401 "Invalid credentials"
- User inactive → 401 "Invalid credentials"

**Security Note**: Same error message prevents user enumeration

---

### 3. EVM Wallet Authentication Flow

```
┌─────────┐        ┌─────────┐        ┌─────────┐        ┌──────────┐
│ Frontend│        │ MetaMask│        │ Backend │        │Redis/DB  │
└────┬────┘        └────┬────┘        └────┬────┘        └─────┬────┘
     │                  │                  │                    │
     │ connectWallet()  │                  │                    │
     ├─────────────────►│                  │                    │
     │                  │                  │                    │
     │◄─────────────────┤                  │                    │
     │ {address: 0x...} │                  │                    │
     │                  │                  │                    │
     │ GET /auth/evm/challenge?address=0x...                    │
     ├────────────────────────────────────►│                    │
     │                  │                  │                    │
     │                  │                  │ generate_nonce()   │
     │                  │                  │                    │
     │                  │                  │ Store nonce (5min) │
     │                  │                  ├───────────────────►│
     │                  │                  │                    │
     │                  │                  │ Build EIP-4361 msg │
     │                  │                  │                    │
     │ {message, nonce} │                  │                    │
     │◄────────────────────────────────────┤                    │
     │                  │                  │                    │
     │ signMessage(msg) │                  │                    │
     ├─────────────────►│                  │                    │
     │                  │ [User approves]  │                    │
     │◄─────────────────┤                  │                    │
     │ {signature}      │                  │                    │
     │                  │                  │                    │
     │ POST /auth/evm/verify                                    │
     │ {address, message, signature}       │                    │
     ├────────────────────────────────────►│                    │
     │                  │                  │                    │
     │                  │                  │ Get & delete nonce │
     │                  │                  ├───────────────────►│
     │                  │                  │                    │
     │                  │                  │ verify_signature() │
     │                  │                  │ (ECDSA recovery)   │
     │                  │                  │                    │
     │                  │                  │ Find/create user   │
     │                  │                  ├───────────────────►│
     │                  │                  │                    │
     │                  │                  │ create_jwt(user)   │
     │                  │                  │                    │
     │ {user, token}    │                  │                    │
     │◄────────────────────────────────────┤                    │
     │                  │                  │                    │
```

**Error Cases**:

- Nonce expired/not found → 400 "Nonce expired, request new challenge"
- Nonce mismatch → 400 "Message does not match challenge"
- Signature invalid → 401 "Signature verification failed"
- Recovered address mismatch → 401 "Signature verification failed"

---

### 4. Account Linking Flow (Add Wallet to Existing Account)

```
┌─────────┐        ┌─────────┐        ┌─────────┐        ┌──────────┐
│ Frontend│        │ Wallet  │        │ Backend │        │ Database │
└────┬────┘        └────┬────┘        └────┬────┘        └─────┬────┘
     │                  │                  │                    │
     │ [User already    │                  │                    │
     │  logged in with  │                  │                    │
     │  email]          │                  │                    │
     │                  │                  │                    │
     │ connectWallet()  │                  │                    │
     ├─────────────────►│                  │                    │
     │◄─────────────────┤                  │                    │
     │ {address}        │                  │                    │
     │                  │                  │                    │
     │ GET /auth/evm/challenge?address=0x...                    │
     │ (with JWT in Authorization header)  │                    │
     ├────────────────────────────────────►│                    │
     │                  │                  │                    │
     │                  │                  │ [Same challenge    │
     │                  │                  │  generation]       │
     │                  │                  │                    │
     │ {message, nonce} │                  │                    │
     │◄────────────────────────────────────┤                    │
     │                  │                  │                    │
     │ signMessage()    │                  │                    │
     ├─────────────────►│                  │                    │
     │◄─────────────────┤                  │                    │
     │ {signature}      │                  │                    │
     │                  │                  │                    │
     │ POST /auth/link  │                  │                    │
     │ {provider: 'evm',│                  │                    │
     │  address, message,│                 │                    │
     │  signature}      │                  │                    │
     │ (with JWT)       │                  │                    │
     ├────────────────────────────────────►│                    │
     │                  │                  │                    │
     │                  │                  │ Verify JWT, get    │
     │                  │                  │ current_user       │
     │                  │                  │                    │
     │                  │                  │ Verify signature   │
     │                  │                  │ (same as login)    │
     │                  │                  │                    │
     │                  │                  │ Check if wallet    │
     │                  │                  │ already linked to  │
     │                  │                  │ different user     │
     │                  │                  ├───────────────────►│
     │                  │                  │                    │
     │                  │                  │ Create AuthIdentity│
     │                  │                  │ (user_id=current,  │
     │                  │                  │  provider='evm',   │
     │                  │                  │  provider_id=addr) │
     │                  │                  ├───────────────────►│
     │                  │                  │                    │
     │ {success: true,  │                  │                    │
     │  linked_methods} │                  │                    │
     │◄────────────────────────────────────┤                    │
     │                  │                  │                    │
```

**Error Cases**:

- Not authenticated → 401 "Authentication required"
- Wallet already linked to different user → 409 "Wallet already linked to another account"
- Wallet already linked to same user → 400 "Wallet already linked to your account"
- Invalid signature → 401 "Signature verification failed"

---

## Account Linking

### Use Cases

1. **User signs up with email, later links wallet**:

   - Easier login (no password needed)
   - Web3 features (sign transactions)

2. **User signs up with wallet, later adds email**:

   - Account recovery option
   - Email notifications

3. **User links multiple wallets to same account**:
   - Use different wallets for different purposes
   - Switch between devices/wallets

### Linking Rules

**Allowed**:

- ✅ One user can have multiple auth methods
- ✅ Link email to account created with wallet
- ✅ Link wallet to account created with email
- ✅ Link multiple wallets (EVM, Solana, Cosmos) to same account

**Not Allowed**:

- ❌ One auth method (email/wallet) cannot be linked to multiple users
- ❌ Cannot link if auth method already exists for different user

### Implementation

**Endpoint**: `POST /auth/link`

**Request**:

```json
{
  "provider": "evm" | "solana" | "cosmos" | "email",
  "address": "0x..." | "5xF..." | "cosmos1..." | null,
  "email": "user@example.com" | null,
  "message": "signed_message",
  "signature": "signature_string",
  "public_key": "cosmos_public_key" | null
}
```

**Response**:

```json
{
  "success": true,
  "message": "Wallet linked successfully",
  "linked_methods": [
    {
      "provider": "email",
      "provider_id": "user@example.com"
    },
    {
      "provider": "evm",
      "provider_id": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
    }
  ]
}
```

**Logic**:

```python
async def link_auth_method(
    current_user: User,  # From JWT
    provider: str,
    provider_id: str,
    # verification data (signature, etc.)
    db: Session
):
    # 1. Verify signature (same as login verification)

    # 2. Check if provider_id already exists
    existing = db.query(AuthIdentity).filter(
        AuthIdentity.provider == provider,
        AuthIdentity.provider_id == provider_id
    ).first()

    if existing:
        if existing.user_id == current_user.id:
            raise HTTPException(400, "Already linked to your account")
        else:
            raise HTTPException(409, "Already linked to another account")

    # 3. Create new auth identity for current user
    new_identity = AuthIdentity(
        user_id=current_user.id,
        provider=provider,
        provider_id=provider_id,
        data={...}  # Provider-specific data
    )
    db.add(new_identity)
    db.commit()

    # 4. Return all linked methods
    return get_linked_methods(current_user.id, db)
```

---

## Security Considerations

### Password Security

**Bcrypt Best Practices**:

- Use bcrypt with work factor 12 (default in passlib)
- Automatic salting (each password gets unique salt)
- Slow by design (0.3-0.5 seconds per hash)
- Prevents brute force attacks

**Password Requirements**:

```python
MIN_PASSWORD_LENGTH = 8
REQUIRE_UPPERCASE = True
REQUIRE_LOWERCASE = True
REQUIRE_NUMBER = True
REQUIRE_SPECIAL_CHAR = False  # Optional

# Example validation
def validate_password(password: str) -> bool:
    if len(password) < MIN_PASSWORD_LENGTH:
        return False
    if REQUIRE_UPPERCASE and not any(c.isupper() for c in password):
        return False
    if REQUIRE_LOWERCASE and not any(c.islower() for c in password):
        return False
    if REQUIRE_NUMBER and not any(c.isdigit() for c in password):
        return False
    return True
```

---

### Wallet Authentication Security

**Nonce Management**:

- Single-use nonce (GETDEL in Redis)
- 5-minute expiration
- Cryptographically random (secrets.token_urlsafe)

**Signature Verification**:

- Never trust client-provided data
- Always verify cryptographic signatures server-side
- Verify recovered address matches claimed address

**Replay Attack Prevention**:

- Nonce is single-use (deleted after verification)
- Include timestamp in message
- Short expiration window (5 minutes)

---

### JWT Token Security

**Token Structure**:

```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "username": "johndoe",
  "org_id": "current_organization_id",
  "ws_id": "current_workspace_id",
  "iat": 1697123456,
  "exp": 1697125256
}
```

**Configuration**:

- Algorithm: HS256 (HMAC-SHA256)
- Secret: Strong random string (32+ chars)
- Expiration: 30 minutes (configurable)
- Refresh tokens: Optional future enhancement

**Security Measures**:

- Sign with SECRET_KEY (never expose)
- Verify signature on every request
- Check expiration timestamp
- Check user.is_active before granting access

---

### Rate Limiting

**Endpoints to Rate Limit**:

```python
# Auth endpoints
POST /auth/signup/email        → 5 requests / 15 minutes / IP
POST /auth/login/email         → 10 requests / 15 minutes / IP
GET  /auth/*/challenge         → 20 requests / 15 minutes / IP
POST /auth/*/verify            → 20 requests / 15 minutes / IP

# Use slowapi or fastapi-limiter
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/auth/login/email")
@limiter.limit("10/15minutes")
async def login_email(...):
    ...
```

---

## Frontend Integration

### Wallet Connection Libraries

**EVM (MetaMask, Coinbase Wallet)**:

```javascript
// Use ethers.js or wagmi
import { useAccount, useSignMessage } from "wagmi";

// Connect wallet
const { address } = useAccount();

// Sign message
const { signMessage } = useSignMessage();
const signature = await signMessage({ message });
```

**Solana (Phantom, Solflare)**:

```javascript
// Use @solana/wallet-adapter
import { useWallet } from "@solana/wallet-adapter-react";

const { publicKey, signMessage } = useWallet();

// Sign message
const encodedMessage = new TextEncoder().encode(message);
const signature = await signMessage(encodedMessage);
const signatureBase58 = base58.encode(signature);
```

**Cosmos (Keplr, Cosmostation)**:

```javascript
// Use @keplr-wallet/types
const chainId = "secret-4";
await window.keplr.enable(chainId);

const offlineSigner = window.keplr.getOfflineSigner(chainId);
const accounts = await offlineSigner.getAccounts();
const address = accounts[0].address;

// Sign message
const signed = await window.keplr.signArbitrary(chainId, address, message);
// signed.signature and signed.pub_key
```

---

### Auth Flow Example (React)

```typescript
// 1. Email signup
async function signupWithEmail(
  email: string,
  password: string,
  username: string
) {
  const response = await fetch("/api/v1/auth/signup/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, username }),
  });

  const { user, token } = await response.json();

  // Store token
  localStorage.setItem("auth_token", token);

  return user;
}

// 2. EVM wallet login
async function loginWithMetaMask() {
  // Connect wallet
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  // Get challenge
  const challengeRes = await fetch(
    `/api/v1/auth/evm/challenge?address=${address}`
  );
  const { message, nonce } = await challengeRes.json();

  // Sign message
  const signature = await signer.signMessage(message);

  // Verify signature
  const verifyRes = await fetch("/api/v1/auth/evm/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, message, signature }),
  });

  const { user, token } = await verifyRes.json();

  localStorage.setItem("auth_token", token);

  return user;
}

// 3. Make authenticated requests
async function getProfile() {
  const token = localStorage.getItem("auth_token");

  const response = await fetch("/api/v1/profile", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
}

// 4. Link wallet to existing account
async function linkMetaMask() {
  const token = localStorage.getItem("auth_token");

  // Get signature (same as login)
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  const challengeRes = await fetch(
    `/api/v1/auth/evm/challenge?address=${address}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  const { message, nonce } = await challengeRes.json();

  const signature = await signer.signMessage(message);

  // Link wallet
  const linkRes = await fetch("/api/v1/auth/link", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      provider: "evm",
      address,
      message,
      signature,
    }),
  });

  return linkRes.json();
}
```

---

## API Endpoints

### Authentication Endpoints

#### 1. Email Signup

```
POST /api/v1/auth/signup/email
```

**Request**:

```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "username": "johndoe"
}
```

**Response** (201):

```json
{
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "created_at": "2025-10-12T10:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Errors**:

- 400: Email already registered
- 422: Validation error (invalid email, weak password)

---

#### 2. Email Login

```
POST /api/v1/auth/login/email
```

**Request**:

```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response** (200):

```json
{
  "user": {
    "id": "uuid",
    "username": "johndoe"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Errors**:

- 401: Invalid credentials

---

#### 3. EVM Challenge

```
GET /api/v1/auth/evm/challenge?address=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

**Response** (200):

```json
{
  "message": "privexbot.com wants you to sign in with your Ethereum account:\n0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb\n\nPlease sign this message to authenticate with PrivexBot.\n\nURI: https://privexbot.com\nVersion: 1\nChain ID: 1\nNonce: Xy7k9mN2pQ3rS4tU5vW6xY7zA8bC9dE0\nIssued At: 2025-10-12T10:30:00Z",
  "nonce": "Xy7k9mN2pQ3rS4tU5vW6xY7zA8bC9dE0"
}
```

**Errors**:

- 400: Invalid Ethereum address

---

#### 4. EVM Verify

```
POST /api/v1/auth/evm/verify
```

**Request**:

```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "message": "privexbot.com wants you to sign in...",
  "signature": "0x1234567890abcdef..."
}
```

**Response** (200):

```json
{
  "user": {
    "id": "uuid",
    "username": "user_0x742d35"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Errors**:

- 400: Nonce expired or invalid
- 400: Message does not match challenge
- 401: Signature verification failed

---

#### 5. Solana Challenge

```
GET /api/v1/auth/solana/challenge?address=5xF2gqEHCDmW9Px8kP...
```

**Response** (200):

```json
{
  "message": "Sign this message to authenticate with PrivexBot.\n\nWallet: 5xF2gqEHCDmW9Px8kP...\nNonce: aB3c4dE5fG6hI7jK8lM9nO0pQ1rS2tU3\nTimestamp: 2025-10-12T10:30:00Z\n\nThis request will not trigger any blockchain transaction or cost any gas fees.",
  "nonce": "aB3c4dE5fG6hI7jK8lM9nO0pQ1rS2tU3"
}
```

**Errors**:

- 400: Invalid Solana address

---

#### 6. Solana Verify

```
POST /api/v1/auth/solana/verify
```

**Request**:

```json
{
  "address": "5xF2gqEHCDmW9Px8kP...",
  "message": "Sign this message to authenticate...",
  "signature": "base58_encoded_signature"
}
```

**Response** (200): Same as EVM verify

**Errors**: Same as EVM verify

---

#### 7. Cosmos Challenge

```
GET /api/v1/auth/cosmos/challenge?address=cosmos1abcd...
```

**Response** (200):

```json
{
  "message": "Sign this message to authenticate with PrivexBot.\n\nAddress: cosmos1abcd...\nNonce: pQ2r3sT4uV5wX6yZ7aB8cD9eF0gH1iJ2\nTimestamp: 2025-10-12T10:30:00Z\n\nThis will not trigger any transaction or cost any fees.",
  "nonce": "pQ2r3sT4uV5wX6yZ7aB8cD9eF0gH1iJ2"
}
```

**Errors**:

- 400: Invalid Cosmos address format

---

#### 8. Cosmos Verify

```
POST /api/v1/auth/cosmos/verify
```

**Request**:

```json
{
  "address": "cosmos1abcd...",
  "message": "Sign this message to authenticate...",
  "signature": "base64_signature",
  "public_key": "base64_public_key"
}
```

**Response** (200): Same as EVM verify

**Errors**: Same as EVM verify + address derivation errors

---

#### 9. Link Auth Method

```
POST /api/v1/auth/link
Authorization: Bearer {token}
```

**Request**:

```json
{
  "provider": "evm",
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "message": "privexbot.com wants you to sign in...",
  "signature": "0x1234567890abcdef..."
}
```

**Response** (200):

```json
{
  "success": true,
  "message": "Wallet linked successfully",
  "linked_methods": [
    {
      "provider": "email",
      "provider_id": "user@example.com",
      "created_at": "2025-10-10T10:00:00Z"
    },
    {
      "provider": "evm",
      "provider_id": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "created_at": "2025-10-12T10:30:00Z"
    }
  ]
}
```

**Errors**:

- 401: Authentication required (no token)
- 400: Already linked to your account
- 409: Wallet already linked to another account

---

#### 10. Get Linked Methods

```
GET /api/v1/auth/methods
Authorization: Bearer {token}
```

**Response** (200):

```json
{
  "methods": [
    {
      "provider": "email",
      "provider_id": "user@example.com",
      "created_at": "2025-10-10T10:00:00Z"
    },
    {
      "provider": "evm",
      "provider_id": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "created_at": "2025-10-12T10:30:00Z"
    },
    {
      "provider": "solana",
      "provider_id": "5xF2gqEHCDmW9Px8kP...",
      "created_at": "2025-10-12T11:00:00Z"
    }
  ]
}
```

---

#### 11. Unlink Auth Method

```
DELETE /api/v1/auth/unlink/{provider}/{provider_id}
Authorization: Bearer {token}
```

**Response** (200):

```json
{
  "success": true,
  "message": "Authentication method unlinked"
}
```

**Errors**:

- 400: Cannot unlink last auth method (must have at least one)
- 404: Auth method not found

---

## Testing Strategy

### Unit Tests

**Test Auth Strategies**:

```python
# test_email_strategy.py
def test_hash_password():
    """Test password hashing produces different hashes for same password"""
    hash1 = hash_password("password123")
    hash2 = hash_password("password123")
    assert hash1 != hash2  # Different salts

def test_verify_password():
    """Test password verification"""
    password = "SecurePass123"
    hashed = hash_password(password)
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPass", hashed) is False

def test_signup_email_duplicate():
    """Test that duplicate email raises error"""
    # Create first user
    user1 = await signup_with_email("test@example.com", "pass123", "user1", db)

    # Attempt duplicate
    with pytest.raises(HTTPException) as exc:
        await signup_with_email("test@example.com", "pass456", "user2", db)
    assert exc.value.status_code == 400
```

```python
# test_evm_strategy.py
def test_evm_address_validation():
    """Test EVM address format validation"""
    valid = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
    invalid = "invalid_address"

    await request_challenge(valid)  # Should succeed

    with pytest.raises(HTTPException):
        await request_challenge(invalid)

def test_signature_verification():
    """Test EVM signature verification"""
    # Use known private key for testing
    from eth_account import Account

    private_key = "0x..."
    account = Account.from_key(private_key)
    address = account.address

    # Get challenge
    challenge = await request_challenge(address)
    message = challenge["message"]

    # Sign message
    signed = account.sign_message(encode_defunct(text=message))
    signature = signed.signature.hex()

    # Verify
    user = await verify_signature(address, message, signature, db)
    assert user is not None

def test_nonce_single_use():
    """Test that nonce can only be used once"""
    address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"

    # Get challenge
    challenge = await request_challenge(address)
    message = challenge["message"]
    signature = "valid_signature"  # Assume valid

    # First verification succeeds
    user1 = await verify_signature(address, message, signature, db)

    # Second verification fails (nonce already used)
    with pytest.raises(HTTPException) as exc:
        await verify_signature(address, message, signature, db)
    assert exc.value.status_code == 400
```

---

### Integration Tests

```python
# test_auth_flow.py
@pytest.mark.integration
async def test_email_signup_and_login():
    """Test complete email signup and login flow"""
    email = "test@example.com"
    password = "SecurePass123"
    username = "testuser"

    # Signup
    response = await client.post("/api/v1/auth/signup/email", json={
        "email": email,
        "password": password,
        "username": username
    })
    assert response.status_code == 201
    signup_data = response.json()
    assert "token" in signup_data

    # Login
    response = await client.post("/api/v1/auth/login/email", json={
        "email": email,
        "password": password
    })
    assert response.status_code == 200
    login_data = response.json()
    assert "token" in login_data

@pytest.mark.integration
async def test_wallet_authentication():
    """Test EVM wallet authentication flow"""
    account = Account.from_key("0x...")  # Test private key
    address = account.address

    # Request challenge
    response = await client.get(f"/api/v1/auth/evm/challenge?address={address}")
    assert response.status_code == 200
    challenge = response.json()

    # Sign message
    signed = account.sign_message(encode_defunct(text=challenge["message"]))
    signature = signed.signature.hex()

    # Verify signature
    response = await client.post("/api/v1/auth/evm/verify", json={
        "address": address,
        "message": challenge["message"],
        "signature": signature
    })
    assert response.status_code == 200
    data = response.json()
    assert "token" in data

@pytest.mark.integration
async def test_link_wallet_to_email_account():
    """Test linking wallet to existing email account"""
    # Create email account
    email_response = await client.post("/api/v1/auth/signup/email", json={
        "email": "test@example.com",
        "password": "SecurePass123",
        "username": "testuser"
    })
    token = email_response.json()["token"]

    # Get EVM challenge (authenticated)
    account = Account.from_key("0x...")
    address = account.address

    response = await client.get(
        f"/api/v1/auth/evm/challenge?address={address}",
        headers={"Authorization": f"Bearer {token}"}
    )
    challenge = response.json()

    # Sign and link
    signed = account.sign_message(encode_defunct(text=challenge["message"]))
    signature = signed.signature.hex()

    response = await client.post("/api/v1/auth/link",
        json={
            "provider": "evm",
            "address": address,
            "message": challenge["message"],
            "signature": signature
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200

    # Verify wallet is now linked
    methods = await client.get(
        "/api/v1/auth/methods",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert len(methods.json()["methods"]) == 2
```

---

### Manual Testing

**Use Postman/Insomnia**:

1. Test email signup/login
2. Test each wallet type with real wallet browser extensions
3. Test account linking
4. Test error cases (expired nonce, invalid signature, etc.)

**Test with Real Wallets**:

1. MetaMask (EVM)
2. Phantom (Solana)
3. Keplr (Cosmos/Secret Network)

---

## Edge Cases & Solutions

### Edge Case 1: Nonce Expired

**Scenario**: User gets challenge, waits 6 minutes, tries to verify

**Solution**:

- Nonce expires after 5 minutes in Redis
- verify_signature gets None from Redis
- Return 400 "Nonce expired or invalid. Request new challenge."
- Frontend should automatically request new challenge

---

### Edge Case 2: User Tries to Link Already-Linked Wallet

**Scenario**: User A links wallet 0x123. User B tries to link same wallet.

**Solution**:

- Check unique constraint (provider, provider_id)
- If exists and belongs to different user → 409 "Wallet already linked to another account"
- If exists and belongs to same user → 400 "Wallet already linked to your account"

---

### Edge Case 3: Race Condition - Simultaneous Signups

**Scenario**: Two requests try to create user with same email simultaneously

**Solution**:

- Database unique constraint on (provider, provider_id) prevents this
- One request succeeds, other gets IntegrityError
- Catch IntegrityError, return 400 "Email already registered"

```python
try:
    db.add(auth_identity)
    db.commit()
except IntegrityError:
    db.rollback()
    raise HTTPException(400, "Email/wallet already registered")
```

---

### Edge Case 4: JWT Token Stolen

**Scenario**: Attacker steals JWT token from user's browser

**Mitigation**:

- Short expiration (30 minutes)
- HTTPS only (secure transmission)
- HTTPOnly cookies (future enhancement)
- Refresh token rotation (future enhancement)
- Monitor for suspicious activity (IP changes, multiple devices)

**If Token Compromised**:

- User changes password → invalidate all tokens (future: token blacklist)
- For now: rely on short expiration

---

### Edge Case 5: User Loses Access to All Auth Methods

**Scenario**: User forgets password and wallet address, or loses wallet

**Solution**:

- Support multiple auth methods (encourage linking email + wallet)
- Password reset via email (future enhancement)
- Account recovery process for support team
- Store user data even if auth methods are inaccessible

---

### Edge Case 6: Wallet Address Changes Checksum

**Scenario**: User provides 0xabcd, later provides 0xABCD (same address, different case)

**Solution**:

- Always normalize addresses:
  - EVM: `Account.to_checksum_address(address)`
  - Store lowercase in provider_id for consistency
  - Display checksummed version in UI

---

### Edge Case 7: Network Issues During Signature

**Scenario**: User signs message, but network fails before reaching backend

**Solution**:

- Frontend should retry with same signature
- Backend should handle idempotent verification
- Nonce already deleted? Return appropriate error
- Frontend requests new challenge and restarts flow

---

## Dependencies

### Python Packages (Add to pyproject.toml)

```toml
[project.dependencies]
# Existing
alembic = ">=1.16.5"
celery = {extras = ["redis"], version = ">=5.4.0"}
fastapi = ">=0.117.1"
psycopg2-binary = ">=2.9.10"
pydantic = ">=2.11.9"
pydantic-settings = ">=2.7.1"
python-dotenv = ">=1.1.1"
redis = ">=5.0.0,<6.0.0"
sqlalchemy = ">=2.0.43"

# NEW: Authentication
passlib = {extras = ["bcrypt"], version = ">=1.7.4"}  # Password hashing
bcrypt = ">=4.0.1"                                     # Bcrypt backend
python-jose = {extras = ["cryptography"], version = ">=3.3.0"}  # JWT tokens
python-multipart = ">=0.0.6"                           # Form data parsing

# NEW: Wallet authentication
eth-account = ">=0.10.0"      # EVM signature verification
pynacl = ">=1.5.0"            # Solana Ed25519 verification
base58 = ">=2.1.1"            # Solana address encoding
ecdsa = ">=0.18.0"            # Cosmos secp256k1
bech32 = ">=1.2.0"            # Cosmos address validation

# NEW: Rate limiting
slowapi = ">=0.1.9"           # Rate limiting for FastAPI
```

### Install Dependencies

```bash
cd backend
uv pip install passlib[bcrypt] bcrypt python-jose[cryptography] python-multipart \
                eth-account pynacl base58 ecdsa bech32 slowapi
```

---

## Summary

This specification provides a complete, production-ready authentication system with:

✅ **4 Authentication Methods**: Email, EVM, Solana, Cosmos
✅ **Account Linking**: Link multiple auth methods to one account
✅ **Security**: Industry-standard cryptography, bcrypt, JWT, nonce management
✅ **Simplicity**: Minimal code, leverage existing libraries
✅ **Flexibility**: Easy to add new auth methods
✅ **Testing**: Comprehensive test strategy
✅ **Documentation**: Clear frontend integration guide

**Next Steps**: See `02_IMPLEMENTATION_GUIDE.md` for step-by-step implementation instructions.
