# Authentication Documentation

This directory contains comprehensive documentation for implementing PrivexBot's authentication system.

## Documents

### 1. [Authentication Specification](./01_AUTH_SPECIFICATION.md)
**Read This First**

**Audience**: Senior Backend Engineers, Technical Leads

**Contents**:
- Complete authentication feature specification
- Authentication methods (Email, EVM, Solana, Cosmos)
- System architecture and design decisions
- Database design and relationships
- Security considerations and best practices
- Frontend integration guide
- API endpoint specifications
- Testing strategies
- Edge cases and solutions
- Dependencies and libraries

**Purpose**: Understand the complete authentication system before implementation.

---

### 2. [Implementation Guide](./02_IMPLEMENTATION_GUIDE.md)
**Step-by-Step Implementation**

**Audience**: Backend Engineers implementing the feature

**Contents**:
- 10-phase implementation plan
- Exact files to create/modify
- Complete code implementations (not pseudocode)
- Database migration steps
- Testing procedures
- Integration checklist

**Purpose**: Follow this guide to implement authentication from scratch.

---

## Quick Start

**For Understanding the System**:
1. Read `01_AUTH_SPECIFICATION.md` completely
2. Review the authentication flows
3. Understand the security considerations

**For Implementation**:
1. Ensure you've read the specification
2. Follow `02_IMPLEMENTATION_GUIDE.md` phase by phase
3. Test each phase before moving to the next
4. Use the testing section for validation

---

## Implementation Phases

```
Phase 1:  Dependencies & Configuration  ✓
Phase 2:  Database Models              ✓
Phase 3:  Security Module              ✓
Phase 4:  Redis Utilities              ✓
Phase 5:  Auth Strategies              ✓
Phase 6:  Pydantic Schemas             ✓
Phase 7:  API Routes                   ✓
Phase 8:  Database Migration           ✓
Phase 9:  Testing                      ✓
Phase 10: Integration                  ✓
```

---

## Architecture Overview

```
Frontend (React/Vue)
    ↓ HTTPS
Backend (FastAPI)
    ├── Auth Routes (/api/v1/auth)
    ├── Auth Strategies (email, evm, solana, cosmos)
    ├── Security Module (JWT, bcrypt)
    └── Redis (nonce management)
    ↓
PostgreSQL (users, auth_identities)
```

---

## Key Features

- ✅ **Email/Password Authentication**: Traditional auth with bcrypt
- ✅ **EVM Wallet Auth**: MetaMask, Coinbase Wallet (Ethereum, Polygon, etc.)
- ✅ **Solana Wallet Auth**: Phantom, Solflare
- ✅ **Cosmos Wallet Auth**: Keplr, Cosmostation (Secret Network compatible)
- ✅ **Account Linking**: Link multiple auth methods to one account
- ✅ **JWT Tokens**: Secure stateless authentication
- ✅ **Signature Verification**: Cryptographic proof of wallet ownership

---

## Testing Checklist

Before considering implementation complete:

**Email Auth**:
- [ ] Signup with email/password
- [ ] Login with email/password
- [ ] Password validation (minimum 8 chars, uppercase, lowercase, number)
- [ ] Duplicate email prevention
- [ ] Change password

**Wallet Auth**:
- [ ] EVM challenge generation
- [ ] EVM signature verification
- [ ] Solana challenge generation
- [ ] Solana signature verification
- [ ] Cosmos challenge generation
- [ ] Cosmos signature verification
- [ ] Nonce expiration (5 minutes)
- [ ] Single-use nonce enforcement

**Account Linking**:
- [ ] Link wallet to email account
- [ ] Link email to wallet account
- [ ] Link multiple wallets to same account
- [ ] Prevent linking wallet to multiple users
- [ ] Get all linked methods
- [ ] Unlink auth method (keep at least one)

**Security**:
- [ ] JWT token generation
- [ ] JWT token verification
- [ ] Protected route access (requires auth)
- [ ] Inactive user rejection
- [ ] Password hashing (never plain text)

---

## Dependencies

```toml
# Authentication
passlib[bcrypt]>=1.7.4              # Password hashing
bcrypt>=4.0.1                        # Bcrypt backend
python-jose[cryptography]>=3.3.0     # JWT tokens
python-multipart>=0.0.6              # Form data

# Wallet authentication
eth-account>=0.10.0                  # EVM signatures
pynacl>=1.5.0                        # Solana Ed25519
base58>=2.1.1                        # Solana addresses
ecdsa>=0.18.0                        # Cosmos secp256k1
bech32>=1.2.0                        # Cosmos addresses

# Rate limiting
slowapi>=0.1.9                       # Rate limiting
```

---

## Database Tables

### users
```sql
id              UUID PRIMARY KEY
username        VARCHAR(255) UNIQUE NOT NULL
is_active       BOOLEAN DEFAULT TRUE
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### auth_identities
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users(id) ON DELETE CASCADE
provider        VARCHAR(50) NOT NULL  -- 'email', 'evm', 'solana', 'cosmos'
provider_id     VARCHAR(255) NOT NULL -- email or wallet address
data            JSONB NOT NULL        -- Provider-specific data
created_at      TIMESTAMP
updated_at      TIMESTAMP

UNIQUE (provider, provider_id)
```

---

## API Endpoints

### Email Auth
- `POST /api/v1/auth/signup/email` - Sign up with email
- `POST /api/v1/auth/login/email` - Log in with email
- `POST /api/v1/auth/change-password` - Change password

### EVM Wallet Auth
- `GET /api/v1/auth/evm/challenge` - Get challenge message
- `POST /api/v1/auth/evm/verify` - Verify signature

### Solana Wallet Auth
- `GET /api/v1/auth/solana/challenge` - Get challenge message
- `POST /api/v1/auth/solana/verify` - Verify signature

### Cosmos Wallet Auth
- `GET /api/v1/auth/cosmos/challenge` - Get challenge message
- `POST /api/v1/auth/cosmos/verify` - Verify signature

### Account Management
- `POST /api/v1/auth/link` - Link auth method to account
- `GET /api/v1/auth/methods` - Get all linked methods
- `DELETE /api/v1/auth/unlink/{provider}/{provider_id}` - Unlink method

---

## Security Best Practices

1. **Never store plain text passwords** - Always use bcrypt
2. **Use strong random secrets** - Generate SECRET_KEY with `openssl rand -hex 32`
3. **Validate all inputs** - Use Pydantic schemas
4. **Rate limit auth endpoints** - Prevent brute force attacks
5. **Use HTTPS in production** - Protect tokens in transit
6. **Verify signatures server-side** - Never trust client data
7. **Use single-use nonces** - Prevent replay attacks
8. **Check user.is_active** - Reject disabled accounts
9. **Same error messages** - Prevent user enumeration
10. **Short token expiration** - Minimize damage from stolen tokens

---

## Troubleshooting

**Issue: Can't install eth-account**
```bash
# Solution: Install with uv
uv pip install eth-account
```

**Issue: Redis connection refused**
```bash
# Solution: Start Redis
redis-server
# OR with Docker
docker run -d -p 6379:6379 redis:7
```

**Issue: Alembic can't find models**
```bash
# Solution: Ensure models imported in app/db/base.py
from app.models.user import User
from app.models.auth_identity import AuthIdentity
```

**Issue: JWT token invalid**
```bash
# Solution: Check SECRET_KEY matches between token creation and verification
# Ensure SECRET_KEY in .env matches settings.SECRET_KEY
```

**Issue: Signature verification fails**
```bash
# Solution:
# 1. Check nonce hasn't expired (5 minutes)
# 2. Verify message matches exactly (including whitespace)
# 3. Check signature format (hex for EVM, base58 for Solana/Cosmos)
```

---

## Support

For questions or issues during implementation:

1. **Check the specification** - Most questions answered in 01_AUTH_SPECIFICATION.md
2. **Review the implementation guide** - Step-by-step in 02_IMPLEMENTATION_GUIDE.md
3. **Check existing code** - Pseudocode in auth/strategies/* shows patterns
4. **Test incrementally** - Don't skip testing phases
5. **Review logs** - FastAPI logs show detailed error information

---

## Future Enhancements

**Planned features** (not in current implementation):
- [ ] Email verification (send verification link)
- [ ] Password reset via email
- [ ] Refresh tokens (long-lived tokens)
- [ ] OAuth2 providers (Google, GitHub)
- [ ] Two-factor authentication (2FA)
- [ ] Session management (view/revoke sessions)
- [ ] Audit logging (track auth events)
- [ ] Account recovery flow
- [ ] Social account linking

---

## Version History

**v1.0** (2025-10-12)
- Initial specification and implementation guide
- Email, EVM, Solana, Cosmos authentication
- Account linking functionality
- Complete implementation guide with code

---

**Last Updated**: 2025-10-12
**Status**: Ready for Implementation
**Maintainer**: Backend Team
