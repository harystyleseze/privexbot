# Production Deployment Issues - Critical Fixes Required

**Date**: October 2024
**Status**: ⚠️ **CRITICAL ISSUES FOUND - Must Fix Before Production**

---

## 🚨 CRITICAL ISSUES

### Issue 1: Production Dockerfiles Missing Database Migrations

**Affected Files**:
- `Dockerfile` (production)
- `Dockerfile.secretvm` (SecretVM)

**Problem**:
Neither production Dockerfile runs `alembic upgrade head` before starting the server. On first deployment, the database will be empty and the server will crash.

**Evidence**:
```dockerfile
# Current CMD (NO MIGRATIONS)
CMD ["gunicorn", "src.app.main:app", \
     "--workers", "4", \
     "--worker-class", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:8000", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]
```

Compare to **working** `Dockerfile.dev`:
```dockerfile
# Dev has entrypoint script that runs migrations first
CMD ["/app/scripts/docker-entrypoint.sh"]
```

**Impact**: ❌ **PRODUCTION DEPLOYMENT WILL FAIL**
- First deployment: Database tables don't exist → 500 errors
- Updates: Schema changes won't be applied → data corruption

---

### Issue 2: Old Docker Image with Incompatible Dependencies

**Affected Files**:
- `docker-compose.yml` (production)
- `docker-compose.secretvm.yml` (SecretVM)

**Problem**:
Both files use an **outdated Docker image** built BEFORE we fixed the bcrypt compatibility:

```yaml
image: harystyles/privexbot-backend@sha256:9fb3b1d1152e5965f8b0c22a7cc9f317a6564edae257bc208a8c9516e330608b
```

**What's wrong with this image**:
1. ❌ Has `bcrypt 5.x` (incompatible with passlib)
2. ❌ Missing `email-validator>=2.0.0`
3. ❌ Missing `web3>=6.0.0`
4. ❌ Missing migrations entrypoint

**Impact**: ❌ **AUTHENTICATION WILL FAIL**
```
AttributeError: module 'bcrypt' has no attribute '__about__'
ModuleNotFoundError: No module named 'email_validator'
ModuleNotFoundError: No module named 'web3'
```

---

### Issue 3: PostgreSQL Health Check - Minor Inconsistency

**Affected Files**:
- `docker-compose.yml` (production)
- `docker-compose.secretvm.yml` (SecretVM)

**Current**:
```yaml
test: ["CMD-SHELL", "pg_isready -U privexbot"]
```

**Status**: ✅ **Actually OK** (database name is `privexbot`, matches)

**Recommendation**: Add `-d privexbot` for clarity and consistency:
```yaml
test: ["CMD-SHELL", "pg_isready -U privexbot -d privexbot"]
```

---

## ✅ SCRIPTS STATUS

All deployment scripts are OK:

| Script | Status | Notes |
|--------|--------|-------|
| `scripts/docker/check.sh` | ✅ OK | Prerequisite checker |
| `scripts/docker/dev.sh` | ✅ OK | Works with fixed dev setup |
| `scripts/docker/build-push.sh` | ✅ OK | Builds correctly |
| `scripts/docker/secretvm-deploy.sh` | ✅ OK | Deployment helper |
| `scripts/test-secretvm.sh` | ✅ OK | Testing tool |

---

## 🔧 REQUIRED FIXES

### Fix 1: Create Production Entrypoint Script

**Create**: `scripts/docker/entrypoint-prod.sh`

```bash
#!/bin/bash
# Production entrypoint script
# WHY: Ensures database migrations are applied before server starts
# HOW: Runs alembic upgrade, then starts gunicorn

set -e

echo "🔄 Running database migrations..."
cd /app/src
alembic upgrade head

echo "🚀 Starting production server..."
cd /app
exec gunicorn src.app.main:app \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:8000 \
    --access-logfile - \
    --error-logfile -
```

---

### Fix 2: Update Production Dockerfiles

**Update `Dockerfile`**:
```dockerfile
# ... existing build stages ...

# Copy entrypoint script
COPY scripts/docker/entrypoint-prod.sh /app/scripts/
RUN chmod +x /app/scripts/entrypoint-prod.sh

# ... rest of Dockerfile ...

# Run entrypoint script (handles migrations and starts server)
CMD ["/app/scripts/entrypoint-prod.sh"]
```

**Update `Dockerfile.secretvm`** (same changes)

---

### Fix 3: Update PostgreSQL Health Checks

**Update both compose files** for consistency:

```yaml
postgres:
  # ...
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U privexbot -d privexbot"]
    interval: 10s
    timeout: 5s
    retries: 5
```

---

### Fix 4: Rebuild and Push New Images

**After fixes, rebuild images**:

```bash
# 1. Test locally first
cd backend
docker compose -f docker-compose.dev.yml up

# 2. Build production image with fixes
./scripts/docker/build-push.sh 0.2.0

# 3. Update compose files with new digest
# Replace sha256:9fb3b1d1... with new digest from build output

# 4. Test production locally
docker compose up

# 5. Deploy to SecretVM
./scripts/docker/secretvm-deploy.sh prepare
./scripts/docker/secretvm-deploy.sh show
# Upload to SecretVM portal
./scripts/docker/secretvm-deploy.sh test
```

---

## 📊 COMPARISON

### Development (✅ Working)
- ✅ Uses `Dockerfile.dev` with entrypoint script
- ✅ Runs migrations on startup
- ✅ Has bcrypt 4.x
- ✅ Has all dependencies
- ✅ Database health check correct
- ✅ All 25 integration tests pass

### Production (❌ **WILL FAIL**)
- ❌ No entrypoint script
- ❌ No migrations
- ❌ Old image with bcrypt 5.x
- ❌ Missing dependencies
- ⚠️ Health check OK but could be clearer

---

## 🎯 ACTION PLAN

**MUST DO BEFORE PRODUCTION DEPLOYMENT:**

1. ✅ **Create** `scripts/docker/entrypoint-prod.sh`
2. ✅ **Update** `Dockerfile` to use entrypoint
3. ✅ **Update** `Dockerfile.secretvm` to use entrypoint
4. ✅ **Update** PostgreSQL health checks in both compose files
5. ✅ **Rebuild** Docker images with new version (0.2.0)
6. ✅ **Update** image digests in `docker-compose.yml` and `docker-compose.secretvm.yml`
7. ✅ **Test** production image locally
8. ✅ **Deploy** to SecretVM with new image

---

## 🚀 DEPLOYMENT WORKFLOW (After Fixes)

```bash
# 1. Apply all fixes (run the commands below)

# 2. Build new image
./scripts/docker/build-push.sh 0.2.0

# 3. Get new digest from output
# Example: sha256:abc123...

# 4. Update docker-compose.yml
services:
  backend:
    image: harystyles/privexbot-backend@sha256:abc123...

# 5. Update docker-compose.secretvm.yml
services:
  backend:
    image: harystyles/privexbot-backend@sha256:abc123...

# 6. Test locally
docker compose -f docker-compose.yml up

# 7. Deploy to SecretVM
./scripts/docker/secretvm-deploy.sh prepare
./scripts/docker/secretvm-deploy.sh show
# Copy/paste to SecretVM portal
./scripts/docker/secretvm-deploy.sh test
```

---

## 💡 WHY THIS WASN'T CAUGHT EARLIER

The old Docker image worked when it was built because:
1. Dependencies were installed at that time
2. Database was already initialized manually
3. Testing was done on systems with existing schemas

Now that we:
- Fixed bcrypt compatibility
- Added new dependencies (email-validator, web3)
- Implemented proper migrations

The old image is incompatible.

---

## ✅ AFTER FIXES APPLIED

All deployments will:
- ✅ Run migrations automatically on startup
- ✅ Use bcrypt 4.x (compatible with passlib)
- ✅ Have all required dependencies
- ✅ Work on fresh databases
- ✅ Handle schema updates seamlessly
- ✅ Be consistent between dev and production

---

**Document Version**: 1.0
**Status**: Issues Identified - Fixes In Progress
**Priority**: 🚨 CRITICAL - Must fix before production deployment
