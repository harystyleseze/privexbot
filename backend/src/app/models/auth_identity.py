"""
AuthIdentity model - Links users to authentication providers (email, wallets).

WHY:
- Allows multiple authentication methods per user
- User can link email + multiple wallets to same account
- Keeps auth-specific data separate from user data

HOW:
- When user signs up/logs in, check if provider_id exists
- If exists, get the user_id and authenticate
- If not, create new user and new auth_identity
- Store provider-specific data in JSONB for flexibility

PSEUDOCODE:
-----------
class AuthIdentity(Base):
    __tablename__ = "auth_identities"

    # Fields
    id: UUID (primary key, auto-generated)

    user_id: UUID (foreign key -> users.id, indexed, cascade delete)
        WHY: Links this auth method to a user account
        HOW: When user deleted, all their auth methods are deleted

    provider: str (enum: 'email', 'evm', 'cosmos', 'solana')
        WHY: Identifies which authentication method was used
        HOW: Use to determine which verification strategy to apply

    provider_id: str (email address or wallet address, indexed)
        WHY: The unique identifier from the provider (email or wallet address)
        HOW: Indexed for fast lookup during login
        EXAMPLE: 'user@example.com' or '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'

    data: JSONB (provider-specific data)
        WHY: Flexible storage for different provider requirements
        HOW:
            For email: {"password_hash": "...", "email_verified": true/false}
            For wallets: {"public_key": "...", "last_nonce": "...", "chain_id": "1"}
        EXAMPLE: Store extra metadata without schema changes

    created_at: datetime (auto-set on creation)
    updated_at: datetime (auto-update on modification)

    # Constraints
    unique_constraint: (provider, provider_id)
        WHY: Prevent duplicate registrations with same email/wallet
        HOW: Database enforces one email can't register twice
        EXAMPLE: '0x123...' can only link to one user for 'evm' provider

    # Relationships
    user: User (many-to-one back reference)
        WHY: Access user data from auth identity
        HOW: user_identity.user.username

USAGE FLOW:
-----------
1. User logs in with MetaMask (provider='evm', provider_id='0x123...')
2. Query: SELECT user_id FROM auth_identities WHERE provider='evm' AND provider_id='0x123...'
3. If found: Get user and create JWT
4. If not found: Create new User, create new AuthIdentity, link them
"""
