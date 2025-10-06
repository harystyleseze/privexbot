"""
Cosmos wallet authentication strategy (Keplr, Cosmostation, etc.).

WHY:
- Support Cosmos ecosystem (Secret Network runs on Cosmos)
- Use secp256k1 signatures (same curve as Bitcoin/Ethereum)
- Different address format (bech32: cosmos1..., secret1...)

HOW:
- Challenge-response with nonce
- Verify secp256k1 signatures
- Use cosmpy or cosmos SDK tools

PSEUDOCODE:
-----------
from cosmpy.aerial.wallet import LocalWallet
from cosmpy.crypto.address import Address
import hashlib
import base64
from app.utils.redis import store_nonce, get_nonce
from app.models.user import User
from app.models.auth_identity import AuthIdentity
import secrets

async def request_challenge(address: str) -> dict:
    \"\"\"
    WHY: Generate nonce for Cosmos wallet signing
    HOW: Similar pattern to EVM and Solana

    Args:
        address: Cosmos address (bech32 format: cosmos1..., secret1...)

    Returns: Message to sign and nonce
    \"\"\"

    # Step 1: Validate address format
    if not (address.startswith("cosmos1") or address.startswith("secret1")):
        raise HTTPException(400, "Invalid Cosmos address format")
            WHY: Support mainnet addresses
            NOTE: Can extend to support other Cosmos chains

    # Validate bech32 format
    try:
        Address(address)
            WHY: cosmpy validates bech32 encoding
    except:
        raise HTTPException(400, "Invalid Cosmos address")

    # Step 2: Generate nonce
    nonce = secrets.token_urlsafe(32)

    # Step 3: Store in Redis
    store_nonce(address, nonce, "cosmos")

    # Step 4: Create message to sign
    message = f\"\"\"Sign this message to authenticate with PrivexBot.

Address: {address}
Nonce: {nonce}
Timestamp: {datetime.utcnow().isoformat()}Z

This will not trigger any transaction or cost any fees.\"\"\"

    WHY clear message: Make intent obvious to user

    return {
        "message": message,
        "nonce": nonce
    }


async def verify_signature(
    address: str,
    signed_message: str,
    signature: str,
    public_key: str,  # NOTE: Cosmos wallets provide public key with signature
    db: Session
) -> User:
    \"\"\"
    WHY: Verify Cosmos wallet signature
    HOW: Use secp256k1 signature verification

    Args:
        address: Cosmos address (bech32)
        signed_message: Message that was signed
        signature: Base64-encoded signature
        public_key: Base64-encoded public key (provided by Keplr)

    Returns: User object

    NOTE: Unlike EVM, Cosmos wallets typically provide public key separately
    \"\"\"

    # Step 1: Get and delete nonce
    nonce = get_nonce(address, "cosmos")

    if not nonce:
        raise HTTPException(400, "Nonce expired or invalid")

    # Step 2: Verify nonce in message
    if nonce not in signed_message:
        raise HTTPException(400, "Message does not match challenge")

    # Step 3: Decode signature and public key
    try:
        signature_bytes = base64.b64decode(signature)
        pubkey_bytes = base64.b64decode(public_key)
            WHY: Cosmos uses base64 encoding
    except:
        raise HTTPException(400, "Invalid signature or public key format")

    # Step 4: Verify public key matches address
    try:
        # Derive address from public key
        derived_address = derive_cosmos_address(pubkey_bytes, address[:6])
            WHY: Verify they provided correct public key for claimed address
            HOW: Hash pubkey, encode as bech32 with correct prefix
            NOTE: address[:6] gets prefix like "cosmos" or "secret"

        if derived_address != address:
            raise HTTPException(400, "Public key does not match address")

    except Exception as e:
        raise HTTPException(400, f"Address verification failed: {str(e)}")

    # Step 5: Verify signature using secp256k1
    try:
        from ecdsa import VerifyingKey, SECP256k1
        from ecdsa.util import sigdecode_der

        # Create verifying key from public key
        vk = VerifyingKey.from_string(pubkey_bytes, curve=SECP256k1)
            WHY: secp256k1 is the curve used by Cosmos (same as Bitcoin)

        # Hash the message (SHA256)
        message_hash = hashlib.sha256(signed_message.encode()).digest()
            WHY: Cosmos signs hash of message, not message itself

        # Verify signature
        vk.verify(signature_bytes, message_hash, hashfunc=hashlib.sha256)
            WHY: Cryptographically verify signature
            THROWS: Exception if signature invalid

    except Exception as e:
        raise HTTPException(401, f"Signature verification failed: {str(e)}")

    # Step 6: Find or create user (same pattern)
    auth_identity = db.query(AuthIdentity).filter(
        AuthIdentity.provider == "cosmos",
        AuthIdentity.provider_id == address
    ).first()

    if auth_identity:
        user = db.query(User).filter(User.id == auth_identity.user_id).first()

        if not user.is_active:
            raise HTTPException(401, "Account is inactive")

    else:
        # Create new user
        username = f"user_{address[:12]}"
            WHY: Cosmos addresses are longer, take more chars

        user = User(username=username, is_active=True)
        db.add(user)
        db.flush()

        auth_identity = AuthIdentity(
            user_id=user.id,
            provider="cosmos",
            provider_id=address,
            data={
                "address": address,
                "public_key": public_key,  # Store for future reference
                "first_login": datetime.utcnow().isoformat()
            }
        )
        db.add(auth_identity)
        db.commit()

    return user


def derive_cosmos_address(pubkey_bytes: bytes, prefix: str) -> str:
    \"\"\"
    WHY: Derive Cosmos address from public key to verify ownership
    HOW: Follows Cosmos SDK address derivation

    Steps:
    1. SHA256 hash of public key
    2. RIPEMD160 hash of result
    3. Encode as bech32 with prefix
    \"\"\"
    import hashlib
    from bech32 import bech32_encode, convertbits

    # SHA256 then RIPEMD160
    sha = hashlib.sha256(pubkey_bytes).digest()
    ripe = hashlib.new('ripemd160', sha).digest()

    # Convert to bech32
    converted = convertbits(ripe, 8, 5)
    address = bech32_encode(prefix, converted)

    return address


COSMOS SPECIFICS:
-----------------
WHY secp256k1:
    - Same curve as Bitcoin and Ethereum (but different address format)
    - Industry standard for crypto signatures

WHY bech32:
    - Human-readable prefix (cosmos1, secret1, etc.)
    - Error detection via checksum
    - Used by Bitcoin SegWit and Cosmos

WHY public key required:
    - Can't recover public key from signature alone (unlike EVM)
    - Wallets provide it separately
    - Need to verify it matches the address

SECURITY NOTES:
---------------
WHY verify pubkey->address:
    - Prevents someone using different public key
    - Ensures cryptographic link between address and signature

WHY SHA256 + RIPEMD160:
    - Standard Cosmos SDK address derivation
    - Same as Bitcoin address derivation
    - Provides 160-bit security

EXAMPLE FLOW:
-------------
1. Frontend: Connect Keplr wallet
2. GET /auth/cosmos/challenge?address=cosmos1...
3. Backend: Generate nonce, return message
4. Frontend: Request Keplr to sign
5. Keplr: Returns signature AND public key
6. POST /auth/cosmos/verify {address, message, signature, public_key}
7. Backend: Verify pubkey matches address, verify signature, return JWT
"""
