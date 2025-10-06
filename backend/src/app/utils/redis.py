"""
Redis client for caching nonces in wallet authentication.

WHY:
- Wallet auth requires challenge-response pattern
- Nonces must be temporary and verified once
- Redis provides fast, in-memory storage with TTL (time-to-live)
- Prevents replay attacks

HOW:
- Store nonce with wallet address as key
- Set expiration (5 minutes default)
- Verify and delete after one use

PSEUDOCODE:
-----------
from redis import Redis
from app.core.config import settings

# Create Redis client
redis_client = Redis.from_url(
    settings.REDIS_URL,
    decode_responses=True  # WHY: Return strings instead of bytes
)

NONCE OPERATIONS:
-----------------

function store_nonce(address: str, nonce: str, provider: str):
    \"\"\"
    WHY: Save generated nonce for wallet signature verification
    HOW: Store with expiration to prevent old nonce reuse

    Args:
        address: Wallet address (0x123... or base58 string)
        nonce: Random string to sign
        provider: 'evm', 'solana', or 'cosmos'
    \"\"\"
    key = f"nonce:{provider}:{address}"
        WHY: Namespace by provider to separate EVM/Solana/Cosmos

    redis_client.setex(
        name=key,
        time=settings.NONCE_EXPIRE_SECONDS,  # Default: 300 (5 minutes)
        value=nonce
    )
        WHY setex: Set with expiration in one atomic operation
        WHY expiration: Old nonces become invalid automatically
        SECURITY: Prevents replay attacks with old signatures

function get_nonce(address: str, provider: str) -> str | None:
    \"\"\"
    WHY: Retrieve nonce for signature verification
    HOW: Get and immediately delete (single use)

    Returns: Nonce string or None if not found/expired
    \"\"\"
    key = f"nonce:{provider}:{address}"

    # Get and delete in one operation (atomic)
    nonce = redis_client.getdel(key)
        WHY getdel: Prevents nonce reuse (single-use token)
        SECURITY: Even if signature leaks, can't be reused

    return nonce

function delete_nonce(address: str, provider: str):
    \"\"\"
    WHY: Explicitly remove nonce (cleanup or on error)
    HOW: Delete the key from Redis
    \"\"\"
    key = f"nonce:{provider}:{address}"
    redis_client.delete(key)

AUTH FLOW USAGE:
----------------
1. Request Challenge:
    POST /auth/evm/challenge?address=0x123...
    ->  nonce = generate_random_string()
    ->  store_nonce(address, nonce, 'evm')
    ->  return {"message": f"Sign this: {nonce}"}

2. User signs message in wallet

3. Verify Signature:
    POST /auth/evm/verify
    {
        "address": "0x123...",
        "signature": "0xabc..."
    }
    ->  nonce = get_nonce(address, 'evm')  # Also deletes it
    ->  if not nonce: raise "Nonce expired or invalid"
    ->  verify_signature(address, nonce, signature)
    ->  if valid: create JWT token
    ->  if invalid: nonce already deleted, can't retry

SECURITY NOTES:
---------------
WHY expire nonces:
    - Prevents indefinite validity
    - Limits attack window
    - Auto-cleanup prevents Redis memory bloat

WHY single-use (getdel):
    - Prevents signature replay
    - Even if attacker captures valid signature, can't reuse
    - Must request new challenge each time

WHY namespace by provider:
    - Same wallet address on different chains are different identities
    - Prevents cross-chain nonce confusion
"""
