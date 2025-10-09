"""
Solana wallet authentication strategy (Phantom, Solflare, etc.).

WHY:
- Support Solana ecosystem users
- Different cryptography from EVM (Ed25519 vs ECDSA)
- No passwords - signature-based auth

HOW:
- Challenge-response with nonce
- Verify Ed25519 signatures
- Use solders library for Solana-specific operations

PSEUDOCODE:
-----------
from solders.pubkey import Pubkey
from solders.signature import Signature
from nacl.signing import VerifyKey
from nacl.exceptions import BadSignatureError
from app.utils.redis import store_nonce, get_nonce
from app.models.user import User
from app.models.auth_identity import AuthIdentity
import secrets
import base58

async def request_challenge(address: str) -> dict:
    \"\"\"
    WHY: Generate nonce for Solana wallet signing
    HOW: Similar to EVM but simpler message format

    Args:
        address: Solana address (base58 encoded, ~44 chars)

    Returns: Message to sign and nonce
    \"\"\"

    # Step 1: Validate address format
    try:
        pubkey = Pubkey.from_string(address)
            WHY: Validates it's a valid Solana public key
    except:
        raise HTTPException(400, "Invalid Solana address")

    # Step 2: Generate nonce
    nonce = secrets.token_urlsafe(32)

    # Step 3: Store in Redis
    store_nonce(address, nonce, "solana")

    # Step 4: Create message to sign
    message = f\"\"\"Sign this message to authenticate with PrivexBot.

Wallet: {address}
Nonce: {nonce}
Timestamp: {datetime.utcnow().isoformat()}Z

This request will not trigger any blockchain transaction or cost any gas fees.\"\"\"

    WHY simpler format: Solana doesn't have standard like EIP-4361 yet
    WHY "no gas fees": Reassure users this is just auth

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
    WHY: Verify Solana wallet signature
    HOW: Use Ed25519 signature verification

    Args:
        address: Solana address (base58)
        signed_message: The message that was signed
        signature: Base58-encoded signature

    Returns: User object
    \"\"\"

    # Step 1: Get and delete nonce
    nonce = get_nonce(address, "solana")

    if not nonce:
        raise HTTPException(400, "Nonce expired or invalid")

    # Step 2: Verify nonce in message
    if nonce not in signed_message:
        raise HTTPException(400, "Message does not match challenge")

    # Step 3: Decode signature and public key
    try:
        signature_bytes = base58.b58decode(signature)
            WHY: Solana uses base58 encoding

        pubkey_bytes = base58.b58decode(address)
            WHY: Address is base58-encoded public key

    except Exception:
        raise HTTPException(400, "Invalid signature or address format")

    # Step 4: Verify signature using Ed25519
    try:
        verify_key = VerifyKey(pubkey_bytes)
            WHY: Create verification key from public key

        message_bytes = signed_message.encode('utf-8')

        verify_key.verify(message_bytes, signature_bytes)
            WHY: Cryptographically verify signature
            HOW: Ed25519 signature verification
            THROWS: BadSignatureError if invalid

    except BadSignatureError:
        raise HTTPException(401, "Signature verification failed")
            WHY: Invalid signature or wrong message

    # Step 5: Find or create user (same as EVM)
    auth_identity = db.query(AuthIdentity).filter(
        AuthIdentity.provider == "solana",
        AuthIdentity.provider_id == address
    ).first()

    if auth_identity:
        user = db.query(User).filter(User.id == auth_identity.user_id).first()

        if not user.is_active:
            raise HTTPException(401, "Account is inactive")

    else:
        # Create new user
        username = f"user_{address[:8]}"

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

    return user


SOLANA vs EVM DIFFERENCES:
---------------------------
WHY different libraries:
    EVM: ECDSA signatures (eth_account)
    Solana: Ed25519 signatures (nacl, solders)

WHY different encoding:
    EVM: Hex (0x...)
    Solana: Base58 (alphanumeric)

WHY simpler message:
    EVM: Has EIP-4361 standard
    Solana: No standard yet, use clear text

SECURITY NOTES:
---------------
WHY Ed25519:
    - Faster than ECDSA
    - Smaller signatures
    - Widely used in modern crypto (Solana, SSH, Signal)

WHY base58:
    - Avoids confusing characters (0/O, I/l)
    - More user-friendly than hex
    - Standard in Bitcoin and Solana

EXAMPLE FLOW:
-------------
1. Frontend: Connect Phantom wallet
2. GET /auth/solana/challenge?address=5xF...
3. Backend: Generate nonce, return message
4. Frontend: Request Phantom to sign
5. User: Approve in Phantom
6. POST /auth/solana/verify {address, message, signature}
7. Backend: Verify Ed25519 signature, return JWT
"""
