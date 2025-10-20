"""
Test ADR-36 signature format
"""
import json
import hashlib
import base64

def create_adr36_sign_doc(signer: str, data: str) -> bytes:
    """Create ADR-36 compliant sign doc"""
    # Base64-encode the message data
    data_base64 = base64.b64encode(data.encode('utf-8')).decode('ascii')

    # Construct ADR-36 sign doc structure
    sign_doc = {
        "chain_id": "",
        "account_number": "0",
        "sequence": "0",
        "fee": {
            "gas": "0",
            "amount": []
        },
        "msgs": [
            {
                "type": "sign/MsgSignData",
                "value": {
                    "signer": signer,
                    "data": data_base64
                }
            }
        ],
        "memo": ""
    }

    # Canonically encode as JSON
    canonical_json = json.dumps(
        sign_doc,
        separators=(',', ':'),
        sort_keys=True,
        ensure_ascii=True
    )

    print("Canonical JSON:")
    print(canonical_json)
    print()

    # SHA256 hash
    sign_doc_hash = hashlib.sha256(canonical_json.encode('utf-8')).digest()

    return sign_doc_hash


if __name__ == "__main__":
    # Test with sample data
    signer = "secret1abc123"
    message = "Sign this message to authenticate with PrivexBot.\n\nAddress: secret1abc123\nNonce: test123\nTimestamp: 2024-01-01T00:00:00Z\n\nThis will not trigger any transaction or cost any fees.\n"

    sign_doc_hash = create_adr36_sign_doc(signer, message)
    print(f"Sign doc hash (hex): {sign_doc_hash.hex()}")
    print(f"Sign doc hash (base64): {base64.b64encode(sign_doc_hash).decode('ascii')}")
