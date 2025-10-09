"""
EVM wallet authentication strategy (MetaMask, Coinbase Wallet, etc.).

WHY:
- Support Web3 users with Ethereum wallets
- No passwords needed - use cryptographic signatures
- Follows EIP-4361 (Sign-In with Ethereum) standard

HOW:
- Challenge-response pattern with nonce
- Verify signature using eth_account library
- Create/link to user account

PSEUDOCODE:
-----------
from eth_account.messages import encode_defunct
from eth_account import Account
from app.utils.redis import store_nonce, get_nonce
from app.models.user import User
from app.models.auth_identity import AuthIdentity
import secrets

async def request_challenge(address: str) -> dict:
    \"\"\"
    WHY: Generate nonce for wallet signing
    HOW: Store in Redis with expiration

    Args:
        address: Ethereum address (0x...)

    Returns: Message to sign and nonce
    \"\"\"

    # Step 1: Validate address format
    if not address.startswith("0x") or len(address) != 42:
        raise HTTPException(400, "Invalid Ethereum address")
            WHY: Ensure it's a valid format

    # Step 2: Normalize address (checksummed)
    address = Account.to_checksum_address(address)
        WHY: Ethereum addresses are case-insensitive but checksummed for validation

    # Step 3: Generate random nonce
    nonce = secrets.token_urlsafe(32)
        WHY: Cryptographically secure random string
        HOW: Prevents replay attacks

    # Step 4: Store nonce in Redis
    store_nonce(address, nonce, "evm")
        WHY: Need to verify same nonce in next step
        HOW: Expires in 5 minutes (configurable)

    # Step 5: Create EIP-4361 compliant message
    message = f\"\"\"privexbot.com wants you to sign in with your Ethereum account:
{address}

Please sign this message to authenticate with PrivexBot.

URI: https://privexbot.com
Version: 1
Chain ID: 1
Nonce: {nonce}
Issued At: {datetime.utcnow().isoformat()}Z\"\"\"

    WHY EIP-4361: Standard format prevents phishing
    WHY include domain: User sees what they're signing into
    WHY nonce: Prevents replay attacks

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
    \"\"\"
    WHY: Verify wallet signature and authenticate user
    HOW: Use eth_account to verify cryptographic signature

    Args:
        address: Ethereum address (0x...)
        signed_message: The exact message that was signed
        signature: Hex signature from wallet

    Returns: User object
    Raises: HTTPException if signature invalid
    \"\"\"

    # Step 1: Normalize address
    address = Account.to_checksum_address(address)

    # Step 2: Get nonce from Redis (also deletes it)
    nonce = get_nonce(address, "evm")
        WHY getdel: Single-use nonce prevents replay

    if not nonce:
        raise HTTPException(400, "Nonce expired or invalid. Request new challenge.")
            WHY: Nonce may have expired (5 min) or already used

    # Step 3: Verify nonce matches message
    if nonce not in signed_message:
        raise HTTPException(400, "Message does not match challenge")
            WHY: Ensure they signed OUR message, not some other message

    # Step 4: Encode message for signature verification
    message_hash = encode_defunct(text=signed_message)
        WHY: Ethereum prepends "\x19Ethereum Signed Message:\n{len(message)}"
        HOW: encode_defunct handles this formatting

    # Step 5: Recover signer address from signature
    recovered_address = Account.recover_message(message_hash, signature=signature)
        WHY: Cryptographically prove who signed the message
        HOW: Uses ECDSA signature recovery

    # Step 6: Verify recovered address matches claimed address
    if recovered_address.lower() != address.lower():
        raise HTTPException(401, "Signature verification failed")
            WHY: Someone tried to use signature from different wallet

    # Step 7: Find or create user
    auth_identity = db.query(AuthIdentity).filter(
        AuthIdentity.provider == "evm",
        AuthIdentity.provider_id == address.lower()
    ).first()

    if auth_identity:
        # Existing user - log them in
        user = db.query(User).filter(User.id == auth_identity.user_id).first()

        if not user.is_active:
            raise HTTPException(401, "Account is inactive")

    else:
        # New user - create account
        username = f"user_{address[:8]}"  # Default username
            WHY: Need some username, user can change later

        user = User(username=username, is_active=True)
        db.add(user)
        db.flush()

        auth_identity = AuthIdentity(
            user_id=user.id,
            provider="evm",
            provider_id=address.lower(),  # Store lowercase for consistency
            data={
                "address": address,  # Store checksummed version for display
                "first_login": datetime.utcnow().isoformat()
            }
        )
        db.add(auth_identity)
        db.commit()

    return user


SECURITY NOTES:
---------------
WHY nonce:
    - Prevents replay attacks
    - Single-use ensures old signatures can't be reused
    - Time-limited (5 min expiration)

WHY verify recovered address:
    - Cryptographic proof of ownership
    - Can't fake without private key
    - User proves they own the wallet

WHY EIP-4361:
    - Standard format users recognize
    - Prevents phishing (users see domain)
    - Industry best practice

EXAMPLE FLOW:
-------------
1. Frontend: "Connect Wallet" -> MetaMask returns address
2. Frontend -> Backend: GET /auth/evm/challenge?address=0x123...
3. Backend: Generate nonce, store in Redis, return message
4. Frontend: Prompt MetaMask to sign message
5. User: Approves signature in MetaMask
6. Frontend -> Backend: POST /auth/evm/verify {address, message, signature}
7. Backend: Verify signature, get/create user, return JWT
"""
