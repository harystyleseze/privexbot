# SecretVM Deployment Fix Guide

**Date**: 2025-10-09

## Test Results Summary

### ✅ WORKING Services:
- **Backend API**: Fully functional (health, status, docs endpoints)
- **Redis UI**: Fully functional
- **PostgreSQL**: Running (internal)
- **Redis**: Running (internal)
- **Traefik**: Routing and TLS working correctly

### ❌ ISSUES Found:
1. DNS not resolving (external issue)
2. Old .env file in use (CORS showing `silver-hedgehog.vm.scrtlabs.com`)
3. PgAdmin not accessible (404)
4. Traefik dashboard incorrect configuration (Bad Gateway)

---

## Fixes Applied

### Fix 1: Traefik Dashboard Configuration ✅

**File**: `docker-compose.secretvm.yml`

**Change**:
```yaml
# BEFORE (WRONG)
- traefik.http.services.traefik.loadbalancer.server.port=8080

# AFTER (CORRECT)
- traefik.http.routers.traefik.service=api@internal
```

**Why**: Traefik's own dashboard uses the special `api@internal` service, not a loadbalancer port.

---

### Fix 2: CORS Configuration ✅

**File**: `deploy/secretvm/.env`

**Change**:
```bash
# BEFORE (WRONG)
BACKEND_CORS_ORIGINS=https://sapphire-finch.vm.scrtlabs.com,https://api.sapphire-finch.vm.scrtlabs.com,https://silver-hedgehog.vm.scrtlabs.com

# AFTER (CORRECT)
BACKEND_CORS_ORIGINS=https://sapphire-finch.vm.scrtlabs.com,https://api.sapphire-finch.vm.scrtlabs.com
```

**Why**: Removed unnecessary domain and trailing slash that causes CORS issues.

---

## Deployment Steps (Do This Now)

### Step 1: Get Updated Compose File

```bash
./scripts/docker/secretvm-deploy.sh show
```

Copy the entire output (this has the Traefik dashboard fix).

---

### Step 2: Upload to SecretVM Portal

1. Go to SecretVM Dev Portal
2. **IMPORTANT**: Stop all running services first
3. Paste the updated compose file
4. Upload `deploy/secretvm/.env` file (this has the CORS fix)

---

### Step 3: Delete PostgreSQL Volume (CRITICAL)

In SecretVM Dev Portal:
1. Navigate to Volumes section
2. Delete volume: `postgres_data`
3. This removes old database with wrong password

**Why**: The old PostgreSQL volume has data with a different password than your current .env file.

---

### Step 4: Deploy

Click "Deploy" button in SecretVM portal.

Wait for all services to start (2-3 minutes).

---

### Step 5: Verify Deployment

#### Test via IP (Workaround for DNS Issue)

```bash
# Backend API Health
curl -k -H "Host: api.sapphire-finch.vm.scrtlabs.com" https://67.43.239.18/health

# Expected: {"status":"healthy","service":"privexbot-backend","version":"0.1.0"}

# Backend Status (Check CORS)
curl -k -H "Host: api.sapphire-finch.vm.scrtlabs.com" https://67.43.239.18/api/v1/status

# Expected: CORS should NOT include "silver-hedgehog" anymore

# Redis UI
curl -k -H "Host: redis-ui.sapphire-finch.vm.scrtlabs.com" https://67.43.239.18 -I

# Expected: HTTP/2 200

# PgAdmin
curl -k -H "Host: pgadmin.sapphire-finch.vm.scrtlabs.com" https://67.43.239.18 -I

# Expected: HTTP/2 200 (should work now)

# Traefik Dashboard
curl -k -H "Host: traefik.sapphire-finch.vm.scrtlabs.com" https://67.43.239.18 -I

# Expected: HTTP/2 200 (should work now)
```

---

### Step 6: Check Container Logs in Portal

Look for these success messages:

**Backend**:
```
INFO:     Application startup complete.
INFO:     Database connection successful
```

**PgAdmin**:
```
Starting pgAdmin 4
```

**Traefik**:
```
Server configuration reloaded on :443
```

---

## DNS Issue (External)

### Problem

```bash
nslookup api.sapphire-finch.vm.scrtlabs.com
# Returns: NXDOMAIN (not found)
```

### Cause

DNS records for `sapphire-finch.vm.scrtlabs.com` and subdomains are not configured or not propagated yet.

### Solutions

#### Option 1: Wait for SCRT Labs

Contact SCRT Labs support or check SecretVM portal for DNS configuration. This may take time to propagate.

#### Option 2: Temporary /etc/hosts Workaround

For testing from your local machine:

**macOS/Linux**:
```bash
sudo nano /etc/hosts
```

**Add these lines**:
```
67.43.239.18 sapphire-finch.vm.scrtlabs.com
67.43.239.18 api.sapphire-finch.vm.scrtlabs.com
67.43.239.18 pgadmin.sapphire-finch.vm.scrtlabs.com
67.43.239.18 redis-ui.sapphire-finch.vm.scrtlabs.com
67.43.239.18 traefik.sapphire-finch.vm.scrtlabs.com
```

Save and test:
```bash
curl -k https://api.sapphire-finch.vm.scrtlabs.com/health
```

**Windows**:
```
C:\Windows\System32\drivers\etc\hosts
```

Add the same lines, then test.

---

## Expected Results After Fix

### ✅ Backend API

```bash
curl -k https://api.sapphire-finch.vm.scrtlabs.com/health
```

**Response**:
```json
{"status":"healthy","service":"privexbot-backend","version":"0.1.0"}
```

---

### ✅ Backend Status (CORS Verified)

```bash
curl -k https://api.sapphire-finch.vm.scrtlabs.com/api/v1/status
```

**Response** (should NOT include `silver-hedgehog`):
```json
{
  "status":"online",
  "environment":"production",
  "cors_origins":[
    "https://sapphire-finch.vm.scrtlabs.com",
    "https://api.sapphire-finch.vm.scrtlabs.com"
  ],
  "database":"PostgreSQL (configured)",
  "redis":"Redis (configured)",
  "api_prefix":"/api/v1"
}
```

---

### ✅ API Docs

Open in browser:
```
https://api.sapphire-finch.vm.scrtlabs.com/api/docs
```

Should see Swagger UI interface.

---

### ✅ PgAdmin

Open in browser:
```
https://pgadmin.sapphire-finch.vm.scrtlabs.com
```

**Login**:
- Email: `privexbot@gmail.com`
- Password: `Ebuka2025` (from .env `PGADMIN_PASSWORD`)

**Connect to Database**:
- Host: `postgres`
- Port: `5432`
- Database: `privexbot`
- Username: `privexbot`
- Password: `Ebuka2025` (from .env `POSTGRES_PASSWORD`)

---

### ✅ Redis UI

Open in browser:
```
https://redis-ui.sapphire-finch.vm.scrtlabs.com
```

Should see Redis Commander interface with your Redis data.

---

### ✅ Traefik Dashboard

Open in browser:
```
https://traefik.sapphire-finch.vm.scrtlabs.com
```

Should see Traefik dashboard with all routers:
- `api@docker` (backend)
- `pgadmin@docker` (pgadmin)
- `redisui@docker` (redis-ui)
- `traefik@docker` (traefik dashboard)

---

## Troubleshooting

### If PgAdmin Still Fails

Check container logs in SecretVM portal for `privexbot-pgadmin-secretvm`.

**If you see**:
```
exited with code 1
```

**Check**:
1. PGADMIN_PASSWORD is set in .env
2. Environment variables format is correct (using `-` not `:`)
3. Postgres container is healthy before PgAdmin starts

---

### If Backend Shows Old CORS

**This means** .env file was not uploaded or container not restarted.

**Solution**:
1. Verify `deploy/secretvm/.env` has correct CORS (no `silver-hedgehog`)
2. Re-upload .env to portal
3. Restart backend container in portal
4. Test again

---

### If Traefik Dashboard Still Fails

**Check**:
1. Traefik container is running
2. Logs show "Server configuration reloaded"
3. Router is configured with `api@internal` service

**Verify fix was applied**:
```bash
./scripts/docker/secretvm-deploy.sh show | grep -A 2 "traefik.http.routers.traefik"
```

Should see:
```yaml
- traefik.http.routers.traefik.service=api@internal
```

---

## Quick Test Script

Save this as `test-secretvm.sh`:

```bash
#!/bin/bash

# Test all SecretVM services

BASE_URL="https://67.43.239.18"

echo "=== Testing SecretVM Services ==="
echo

echo "1. Backend Health:"
curl -k -H "Host: api.sapphire-finch.vm.scrtlabs.com" $BASE_URL/health
echo

echo -e "\n2. Backend Status (CORS check):"
curl -k -H "Host: api.sapphire-finch.vm.scrtlabs.com" $BASE_URL/api/v1/status | jq '.cors_origins'
echo

echo -e "\n3. Redis UI:"
curl -k -H "Host: redis-ui.sapphire-finch.vm.scrtlabs.com" $BASE_URL -s -o /dev/null -w "HTTP Status: %{http_code}\n"

echo -e "\n4. PgAdmin:"
curl -k -H "Host: pgadmin.sapphire-finch.vm.scrtlabs.com" $BASE_URL -s -o /dev/null -w "HTTP Status: %{http_code}\n"

echo -e "\n5. Traefik Dashboard:"
curl -k -H "Host: traefik.sapphire-finch.vm.scrtlabs.com" $BASE_URL -s -o /dev/null -w "HTTP Status: %{http_code}\n"

echo -e "\n=== DNS Check ==="
echo "Checking DNS resolution:"
nslookup api.sapphire-finch.vm.scrtlabs.com || echo "DNS not resolving yet"
```

Run:
```bash
chmod +x test-secretvm.sh
./test-secretvm.sh
```

---

## Summary

### What You Need to Do:

1. ✅ **Get updated compose file**: `./scripts/docker/secretvm-deploy.sh show`
2. ✅ **Stop services** in SecretVM portal
3. ✅ **Delete volume**: `postgres_data`
4. ✅ **Upload files**: Paste compose + upload .env
5. ✅ **Deploy** from portal
6. ✅ **Test** with curl commands or test script
7. ⚠️ **DNS**: Add to /etc/hosts OR wait for SCRT Labs

### Expected Outcome:

- ✅ Backend API: Working
- ✅ Redis UI: Working
- ✅ PgAdmin: Working (after fixes)
- ✅ Traefik Dashboard: Working (after fixes)
- ✅ CORS: Correct (no `silver-hedgehog`)
- ⏳ DNS: Waiting for external configuration

---

## Files Updated

1. `docker-compose.secretvm.yml` - Traefik dashboard fix
2. `deploy/secretvm/.env` - CORS fix

Both files are ready to upload to SecretVM portal.

---

For detailed diagnostics, see: `SECRETVM_DIAGNOSTICS_REPORT.md`
