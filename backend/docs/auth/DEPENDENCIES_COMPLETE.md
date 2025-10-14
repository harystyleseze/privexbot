# Complete Dependencies List

**Date**: October 2024
**Status**: ✅ All dependencies identified and documented

---

## Overview

This document lists all Python dependencies required for the PrivexBot authentication system, discovered through systematic error resolution.

---

## Complete Installation Command

```bash
# Core backend dependencies
pip install \
  pydantic-settings \
  psycopg2-binary \
  sqlalchemy \
  fastapi \
  pytest \
  "python-jose[cryptography]" \
  passlib \
  bcrypt \
  "pydantic[email]"

# Wallet authentication dependencies
pip install \
  web3 \
  eth-account \
  PyNaCl \
  base58 \
  bech32
```

---

## Dependency Categories

### 1. Core FastAPI Backend

| Package | Purpose | Required By |
|---------|---------|-------------|
| `fastapi` | Web framework | app.main |
| `pydantic-settings` | Settings management | app.core.config |
| `pydantic[email]` | Email validation | Email signup schemas |
| `uvicorn` | ASGI server | Server runtime |

### 2. Database & Storage

| Package | Purpose | Required By |
|---------|---------|-------------|
| `sqlalchemy` | ORM | Database models |
| `psycopg2-binary` | PostgreSQL driver | SQLAlchemy |
| `alembic` | Database migrations | Schema versioning |

### 3. Authentication & Security

| Package | Purpose | Required By |
|---------|---------|-------------|
| `python-jose[cryptography]` | JWT tokens | app.core.security |
| `passlib` | Password hashing | Email auth |
| `bcrypt` | Bcrypt algorithm | Passlib backend |

### 4. Wallet Authentication

#### EVM (Ethereum, Polygon, BSC, etc.)
| Package | Purpose | Required By |
|---------|---------|-------------|
| `web3` | Ethereum library | EVM strategy |
| `eth-account` | Account & signatures | EVM strategy |

#### Solana
| Package | Purpose | Required By |
|---------|---------|-------------|
| `PyNaCl` | Ed25519 signatures | Solana strategy |
| `base58` | Address encoding | Solana strategy |

#### Cosmos (Cosmos Hub, Osmosis, etc.)
| Package | Purpose | Required By |
|---------|---------|-------------|
| `ecdsa` | ECDSA signatures | Cosmos strategy |
| `bech32` | Address encoding | Cosmos strategy |

### 5. Testing

| Package | Purpose | Required By |
|---------|---------|-------------|
| `pytest` | Test framework | Unit & integration tests |
| `httpx` | Async HTTP client | FastAPI TestClient |

---

## Discovery Timeline

These dependencies were discovered through iterative error resolution:

1. **pydantic-settings** - Config module failed to load
2. **psycopg2-binary** - Database connection errors
3. **python-jose** - JWT token creation failed
4. **passlib, bcrypt** - Password hashing failed
5. **pydantic[email]** - Email validation failed
6. **eth-account, web3** - EVM wallet auth failed
7. **PyNaCl, base58** - Solana wallet auth failed
8. **bech32** - Cosmos wallet auth failed (already installed)

---

## Verification

### Check All Dependencies

```bash
python -c "
import pydantic_settings
import psycopg2
import jose
import passlib
import email_validator
import eth_account
import nacl
import base58
import bech32
print('✓ All dependencies installed')
"
```

### Server Import Test

```bash
cd backend/src
python -c "from app.main import app; print('✓ Server imports successfully')"
```

---

## Package Details

### python-jose[cryptography]
- **What it does**: JWT token encoding/decoding with cryptographic signing
- **Why [cryptography]**: Includes cryptography backend for better security
- **Alternatives**: PyJWT (but jose has better API)

### pydantic[email]
- **What it does**: Email validation using email-validator library
- **Installs**: email-validator, dnspython
- **Used in**: EmailStr type in Pydantic schemas

### psycopg2-binary
- **What it does**: PostgreSQL adapter for Python
- **Why -binary**: Pre-compiled binaries (easier install)
- **Production note**: Consider psycopg2 (source) for production

### web3 & eth-account
- **What they do**: Ethereum ecosystem libraries
- **web3**: High-level Ethereum interaction
- **eth-account**: Account management and message signing
- **Supports**: Ethereum, Polygon, BSC, Arbitrum, Optimism, etc.

### PyNaCl
- **What it does**: Python binding to libsodium (NaCl)
- **Used for**: Ed25519 signature verification (Solana)
- **Also called**: libsodium, sodium, NaCl

### base58
- **What it does**: Base58 encoding/decoding
- **Used by**: Solana (addresses, signatures)
- **Note**: Bitcoin-style base58 (no 0, O, I, l)

### bech32
- **What it does**: Bech32 address encoding
- **Used by**: Cosmos ecosystem (cosmos1..., osmo1..., etc.)
- **Standard**: BIP 173

---

## Optional Dependencies

These are not required but recommended:

```bash
# Development tools
pip install \
  ruff \
  mypy \
  black

# Testing tools
pip install \
  pytest-asyncio \
  pytest-cov

# Monitoring
pip install \
  prometheus-client
```

---

## Platform-Specific Notes

### macOS
- Some packages need Xcode Command Line Tools
- Install: `xcode-select --install`
- M1/M2: Some packages may need Rosetta

### Linux
- May need: `sudo apt-get install python3-dev libpq-dev`
- For PyNaCl: `sudo apt-get install libsodium-dev`

### Windows
- Microsoft C++ Build Tools may be required
- Or use pre-built wheels from PyPI

---

## Troubleshooting

### "No module named 'xxx'"
```bash
# Always use the same Python environment
which python
which pip

# Verify they match
python -m pip --version

# Install in correct environment
python -m pip install <package>
```

### "Could not build wheels for xxx"
```bash
# Update pip first
pip install --upgrade pip setuptools wheel

# Then retry installation
```

### Import works in terminal but not in server
```bash
# Check Python version mismatch
python --version  # Your terminal Python
uvicorn --version  # Check uvicorn Python

# Use specific Python
/path/to/python -m uvicorn app.main:app
```

---

## Quick Setup

For fresh installation:

```bash
# 1. Navigate to backend
cd backend

# 2. Create virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install all dependencies at once
pip install --upgrade pip
pip install \
  pydantic-settings psycopg2-binary sqlalchemy fastapi uvicorn \
  "python-jose[cryptography]" passlib bcrypt "pydantic[email]" \
  web3 eth-account PyNaCl base58 bech32 pytest

# 4. Verify installation
cd src
python -c "from app.main import app; print('✓ All dependencies OK')"
```

---

## CI/CD Configuration

### GitHub Actions Example

```yaml
- name: Install Dependencies
  run: |
    pip install --upgrade pip
    pip install \
      pydantic-settings psycopg2-binary sqlalchemy fastapi \
      "python-jose[cryptography]" passlib bcrypt "pydantic[email]" \
      web3 eth-account PyNaCl base58 bech32 pytest
```

### Docker Example

```dockerfile
RUN pip install --no-cache-dir \
    pydantic-settings psycopg2-binary sqlalchemy fastapi \
    python-jose[cryptography] passlib bcrypt pydantic[email] \
    web3 eth-account PyNaCl base58 bech32
```

---

## Requirements Files

### requirements.txt (Production)
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic-settings==2.0.3
pydantic[email]==2.4.2
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
web3==6.11.3
eth-account==0.10.0
PyNaCl==1.5.0
base58==2.1.1
bech32==1.2.0
```

### requirements-dev.txt (Development)
```
-r requirements.txt
pytest==7.4.3
pytest-asyncio==0.21.1
pytest-cov==4.1.0
ruff==0.1.6
mypy==1.7.0
```

---

## Summary

**Total Packages**: 15 core dependencies
- **Core**: 4 packages
- **Database**: 3 packages
- **Auth**: 3 packages
- **Wallets**: 5 packages

**Installation Size**: ~150 MB (including dependencies)

**Python Version**: 3.9+ required (tested with 3.9, 3.11)

---

**Document Version**: 1.0
**Last Updated**: October 2024
**Status**: Complete ✅
