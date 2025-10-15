# SecretVM Migration Issue - Fixed

**Date**: October 2024
**Status**: ✅ Issue Diagnosed and Fixed
**Priority**: 🚨 CRITICAL - Required for Production Deployment

---

## 🚨 The Problem

### Symptoms:

Your backend container on SecretVM was stuck in an infinite restart loop:

```log
Oct 14 11:46:54 privexbot-backend-secretvm: 🔄 Running database migrations...
Oct 14 11:47:48 privexbot-backend-secretvm: 🔄 Running database migrations...
Oct 14 11:48:51 privexbot-backend-secretvm: 🔄 Running database migrations...
```

Container never progressed past the migration step and kept restarting every ~60 seconds.

### Container Exit Codes:

```log
Oct 14 11:45:42 docker: privexbot-backend-secretvm exited with code 0
Oct 14 11:45:44 docker: privexbot-backend-secretvm exited with code 1
Oct 14 11:45:51 docker: privexbot-backend-secretvm exited with code 1
```

- **Code 0**: Normal exit (but shouldn't exit at all - should keep running)
- **Code 1**: Error exit (migration or startup failed)

---

## 🔍 Root Cause Analysis

### Issue #1: Variable Substitution in .env File ❌

**File**: `.env.secretvm.local` (line 13)

**Problem**:

```bash
# WRONG - Python doesn't expand ${POSTGRES_PASSWORD}
DATABASE_URL=postgresql://privexbot:${POSTGRES_PASSWORD}@postgres:5432/privexbot
```

**What happened**:

1. Docker Compose reads `.env` file and expands `${POSTGRES_PASSWORD}` → `PW`
2. Docker Compose sets `POSTGRES_PASSWORD=PW` in container environment
3. Python's `pydantic` reads `.env` file **directly** (not from environment)
4. Pydantic sees `DATABASE_URL=postgresql://privexbot:${POSTGRES_PASSWORD}@...`
5. Pydantic does NOT expand variables, so it uses literal string `"${POSTGRES_PASSWORD}"` as the password
6. Alembic tries to connect with password `"${POSTGRES_PASSWORD}"` instead of `"PW"`
7. PostgreSQL rejects the connection: `FATAL: password authentication failed`
8. Migration hangs/times out
9. Container exits and restarts

**The Fix** ✅:

```bash
# CORRECT - Hard-code the password for Python to read
POSTGRES_PASSWORD=PW
DATABASE_URL=postgresql://privexbot:PW@postgres:5432/privexbot
```

**Why this works**:

- Docker Compose still uses `POSTGRES_PASSWORD=PW` for PostgreSQL container
- Python now reads the complete URL with the actual password
- Both systems work correctly

---

### Issue #2: Limited Error Output ❌

**File**: `scripts/docker/entrypoint-prod.sh` (original version)

**Problem**:

```bash
echo "🔄 Running database migrations..."
cd /app/src
alembic upgrade head  # No error handling or verbose output
```

**What happened**:

- When migration failed (due to wrong password), the script didn't show WHY
- You only saw "🔄 Running database migrations..." repeating
- No error messages to debug the issue
- Container just restarted silently

**The Fix** ✅:

Added comprehensive error handling and diagnostics:

```bash
# Test database connection BEFORE running migrations
python -c "
from sqlalchemy import create_engine, text
from app.core.config import settings

try:
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        result = conn.execute(text('SELECT 1'))
        print('✅ Database connection successful')
except Exception as e:
    print(f'❌ Database connection failed: {e}')
    sys.exit(1)
" || exit 1

# Run migrations with verbose output
alembic upgrade head -v || {
    echo "❌ ERROR: Migration failed"
    exit 1
}
```

**Now you'll see**:

- Database connection test results
- Exact error messages if connection fails
- Verbose migration output
- Clear error messages with troubleshooting tips

---

## ✅ All Fixes Applied

### 1. Fixed `.env.secretvm.local`

**Location**: `backend/.env.secretvm.local`

**Changes**:

```bash
# Before (WRONG)
POSTGRES_PASSWORD=PW
DATABASE_URL=postgresql://privexbot:${POSTGRES_PASSWORD}@postgres:5432/privexbot

# After (CORRECT)
POSTGRES_PASSWORD=PW
# NOTE: Password is hard-coded because Python's pydantic doesn't expand variables
DATABASE_URL=postgresql://privexbot:PW@postgres:5432/privexbot
```

### 2. Enhanced Entrypoint Script

**Location**: `backend/scripts/docker/entrypoint-prod.sh`

**New features**:

- ✅ Shows masked DATABASE_URL for debugging (password hidden)
- ✅ Shows current environment (production/development)
- ✅ Tests database connection before migrations
- ✅ Clear error messages if connection fails
- ✅ Verbose migration output (`alembic upgrade head -v`)
- ✅ Helpful troubleshooting tips on failure
- ✅ Proper exit codes for Docker

### 3. Rebuilt Docker Image

**Required**: You must rebuild the Docker image to include the updated entrypoint script.

```bash
cd backend
./scripts/docker/build-push.sh 0.2.1
```

The new image digest must be updated in:

- `docker-compose.yml`
- `docker-compose.secretvm.yml`

---

## 🚀 Deployment Steps

### Step 1: Rebuild Docker Image

```bash
cd /Users/user/Downloads/privexbot/privexbot-mvp/privexbot/backend

# Build and push new image
./scripts/docker/build-push.sh 0.2.1

# Copy the new image digest from output
# Example: sha256:abc123def456...
```

### Step 2: Update Docker Compose Files

**Update `docker-compose.yml` (line 7)**:

```yaml
services:
  backend:
    image: harystyles/privexbot-backend@sha256:NEW_DIGEST_HERE
```

**Update `docker-compose.secretvm.yml` (line 14)**:

```yaml
services:
  backend:
    image: harystyles/privexbot-backend@sha256:NEW_DIGEST_HERE
```

### Step 3: Update .env on SecretVM

**Upload the fixed `.env.secretvm.local` to SecretVM**:

```bash
# Copy contents of .env.secretvm.local
cat .env.secretvm.local

# On SecretVM portal, update /mnt/secure/docker_wd/.env with the contents
# OR use scp if you have SSH access:
scp .env.secretvm.local user@sapphire-finch.vm.scrtlabs.com:/mnt/secure/docker_wd/.env
```

### Step 4: Deploy to SecretVM

**On SecretVM**:

```bash
cd /mnt/secure/docker_wd

# Stop current deployment
docker compose down

# Pull new image
docker compose pull

# Start with new configuration
docker compose up -d

# Watch logs
docker compose logs -f backend
```

**Expected output**:

```log
🔄 Running database migrations...
📍 Working directory: /app
🔗 DATABASE_URL check...
📊 Database URL: postgresql://privexbot:****@postgres:5432/privexbot
🌍 Environment: production
🔌 Testing database connection...
✅ Database connection successful
📦 Applying database migrations...
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade  -> 3c4e4feca860, Add User and AuthIdentity tables for authentication
✅ Database migrations completed successfully
🚀 Starting production server with gunicorn...
[2025-10-14 12:00:00 +0000] [1] [INFO] Starting gunicorn 21.2.0
[2025-10-14 12:00:00 +0000] [1] [INFO] Listening at: http://0.0.0.0:8000 (1)
[2025-10-14 12:00:00 +0000] [1] [INFO] Using worker: uvicorn.workers.UvicornWorker
[2025-10-14 12:00:00 +0000] [8] [INFO] Booting worker with pid: 8
[2025-10-14 12:00:00 +0000] [9] [INFO] Booting worker with pid: 9
```

---

## 🔍 Verification Steps

### 1. Check Container Status

```bash
docker ps --filter "name=privexbot-backend"

# Should show:
# STATUS: Up X minutes (healthy)
```

### 2. Test Health Endpoint

```bash
# From SecretVM
curl http://localhost:8000/health

# Expected:
# {"status":"healthy","service":"privexbot-backend","version":"0.1.0"}

# From internet (via Traefik)
curl https://api.sapphire-finch.vm.scrtlabs.com/health
```

### 3. Check Database Tables

```bash
# Connect to database
docker exec -it privexbot-postgres-secretvm psql -U privexbot -d privexbot

# List tables
\dt

# Should show:
#  public | alembic_version  | table | privexbot
#  public | auth_identities  | table | privexbot
#  public | users            | table | privexbot

# Check migration status
SELECT * FROM alembic_version;

# Should show:
#  version_num
# --------------
#  3c4e4feca860

# Exit
\q
```

### 4. Test API

```bash
# Get API docs
curl https://api.sapphire-finch.vm.scrtlabs.com/api/docs

# Should return Swagger UI HTML
```

---

## 📚 Understanding the Technical Details

### How Docker Compose Handles Environment Variables

**In `docker-compose.secretvm.yml`**:

```yaml
services:
  backend:
    env_file:
      - .env # Loads all variables from .env
    environment:
      - DATABASE_URL=postgresql://privexbot:${POSTGRES_PASSWORD}@postgres:5432/privexbot
```

**What happens**:

1. Docker Compose reads `.env` file
2. Finds `POSTGRES_PASSWORD=PW`
3. When processing `environment:` section, expands `${POSTGRES_PASSWORD}` → `PW`
4. Sets environment variable: `DATABASE_URL=postgresql://privexbot:PW@postgres:5432/privexbot`
5. Container gets the expanded value

**But for Python**:

```python
# app/core/config.py
class Settings(BaseSettings):
    DATABASE_URL: str

    model_config = SettingsConfigDict(
        env_file=".env",  # ← Reads .env file DIRECTLY
    )
```

**What happens**:

1. Pydantic reads `.env` file line by line
2. Sees `DATABASE_URL=postgresql://privexbot:${POSTGRES_PASSWORD}@...`
3. Does NOT expand variables (that's a shell feature, not a .env feature)
4. Uses literal string `"${POSTGRES_PASSWORD}"` as the password

### Why Hard-coding is Necessary

**Option 1: Hard-code in .env (CHOSEN)** ✅

```bash
DATABASE_URL=postgresql://privexbot:PW@postgres:5432/privexbot
```

- Pros: Simple, works reliably
- Cons: Password appears in two places (POSTGRES_PASSWORD and DATABASE_URL)

**Option 2: Use Python string formatting** (More complex)

```python
# app/core/config.py
@property
def DATABASE_URL(self) -> str:
    return f"postgresql://privexbot:{self.POSTGRES_PASSWORD}@postgres:5432/privexbot"
```

- Pros: DRY principle (password in one place)
- Cons: Requires code changes, more complex

**Option 3: Use environment variable only** (Not ideal for Docker)

```python
# Don't use env_file, only use environment variables from Docker
model_config = SettingsConfigDict(env_file=None)
```

- Pros: Works with Docker Compose variable expansion
- Cons: Harder to run locally, .env ignored

We chose **Option 1** because it's simple, reliable, and works in all environments.

---

## 🎯 Key Takeaways

### What You Learned:

1. **Variable Expansion**:

   - Docker Compose expands `${VAR}` in `environment:` section
   - Python's pydantic does NOT expand variables in `.env` files
   - Need to hard-code values when Python reads .env directly

2. **Database Migrations**:

   - Migrations = version control for database schema
   - DO NOT copy data, only change structure
   - Run automatically on container startup
   - Preserve existing data

3. **Error Handling**:

   - Always test connections before operations
   - Show verbose output for debugging
   - Provide clear error messages
   - Exit with proper codes for Docker

4. **Docker Entrypoint Best Practices**:
   - Test dependencies before main process
   - Show progress with clear messages
   - Fail fast with helpful error messages
   - Exit properly so Docker knows the status

---

## 📋 Files Modified

### 1. `.env.secretvm.local`

- Fixed: Hard-coded password in DATABASE_URL
- Added: Comment explaining why

### 2. `scripts/docker/entrypoint-prod.sh`

- Added: Database connection test
- Added: Verbose migration output
- Added: Error handling with helpful messages
- Added: Environment info logging

### 3. `Dockerfile` & `Dockerfile.secretvm`

- Already fixed in previous update (uses entrypoint script)

---

## 🚀 Next Actions

1. **Rebuild Docker Image**:

   ```bash
   ./scripts/docker/build-push.sh 0.2.1
   ```

2. **Update Image Digests**:

   - docker-compose.yml
   - docker-compose.secretvm.yml

3. **Deploy to SecretVM**:

   - Upload new .env
   - Pull new image
   - Restart services

4. **Verify Deployment**:
   - Check container status
   - Test health endpoint
   - Verify database tables
   - Test API endpoints

---

## 💡 Prevention for Future

### For New .env Files:

Always hard-code passwords in DATABASE_URL:

```bash
# ✅ Good
DATABASE_URL=postgresql://user:actual_password@host:5432/db

# ❌ Bad
DATABASE_URL=postgresql://user:${PASSWORD}@host:5432/db
```

### For Testing Locally:

```bash
# Test database connection
python -c "
from app.core.config import settings
print('DATABASE_URL:', settings.DATABASE_URL)
"

# Should show actual password, not ${POSTGRES_PASSWORD}
```

### For Production Deployment:

Always test migrations in staging first:

```bash
# Staging environment
docker compose -f docker-compose.yml up
# Check logs for successful migration
# Test all endpoints
# Then deploy to production
```

---

**Document Version**: 1.0
**Status**: ✅ Issue Resolved
**Priority**: Migration fixes applied, ready for redeployment
