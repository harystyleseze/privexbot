"""
Pydantic schemas for authentication tokens and auth requests.

WHY:
- Validate authentication requests (login, wallet signature)
- Structure token responses
- Type-safe auth payloads

PSEUDOCODE:
-----------
from pydantic import BaseModel, EmailStr

# JWT Token Response
class Token(BaseModel):
    \"\"\"
    WHY: Standard OAuth2 token response
    HOW: Returned from all login/signup endpoints
    \"\"\"
    access_token: str
        WHY: JWT token string
    token_type: str = "bearer"
        WHY: Standard OAuth2 token type
    expires_in: int
        WHY: Seconds until token expires
        EXAMPLE: 1800 (30 minutes)

# Email Login Request
class EmailLoginRequest(BaseModel):
    \"\"\"
    WHY: Validate email/password login
    \"\"\"
    email: EmailStr
        WHY: Validates email format automatically
    password: str (min_length=8)
        WHY: Ensure minimum password length

# Email Signup Request
class EmailSignupRequest(BaseModel):
    \"\"\"
    WHY: Validate email signup with password
    \"\"\"
    username: str (min_length=3, max_length=50)
    email: EmailStr
    password: str (min_length=8, max_length=100)
        WHY: Strong password requirements

# Wallet Challenge Request
class WalletChallengeRequest(BaseModel):
    \"\"\"
    WHY: Request nonce for wallet signing
    HOW: Used in GET /auth/{provider}/challenge
    \"\"\"
    address: str
        WHY: Wallet address (0x... for EVM, base58 for Solana, etc.)
        VALIDATION: Format depends on provider (EVM, Solana, Cosmos)

# Wallet Challenge Response
class WalletChallengeResponse(BaseModel):
    \"\"\"
    WHY: Return message to sign and nonce
    HOW: Client signs this message with wallet
    \"\"\"
    message: str
        WHY: Formatted message following EIP-4361 (for EVM) or equivalent
        EXAMPLE: "Please sign this message to authenticate. Nonce: abc123"
    nonce: str
        WHY: Random string stored in Redis for verification

# Wallet Verify Request
class WalletVerifyRequest(BaseModel):
    \"\"\"
    WHY: Verify wallet signature
    HOW: Used in POST /auth/{provider}/verify
    \"\"\"
    address: str
        WHY: Wallet address that signed the message
    signature: str
        WHY: Signature from wallet (hex string)
    signed_message: str
        WHY: The exact message that was signed

# Context Switch Request
class SwitchContextRequest(BaseModel):
    \"\"\"
    WHY: Allow user to switch active org/workspace
    HOW: Issues new JWT with different org_id/ws_id
    \"\"\"
    organization_id: UUID4
    workspace_id: UUID4 | None
        WHY: Optional - can switch to org without specific workspace

AUTH FLOW EXAMPLES:
-------------------
1. Email Login:
    POST /auth/email/login
    Body: EmailLoginRequest
    Response: Token

2. Wallet Auth:
    Step 1: GET /auth/evm/challenge?address=0x123
        Response: WalletChallengeResponse

    Step 2: User signs message in wallet

    Step 3: POST /auth/evm/verify
        Body: WalletVerifyRequest
        Response: Token

3. Switch Organization:
    POST /auth/session/switch-context
    Body: SwitchContextRequest
    Response: Token (new JWT with updated context)
"""
