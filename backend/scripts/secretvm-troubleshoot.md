# SecretVM Deployment Troubleshooting Guide

## Issues Found in Your Deployment

### 1. ❌ Database Password Authentication Failed

**Error**:
```
password authentication failed for user "privexbot"
```

**Cause**: PostgreSQL container has persisted data with a DIFFERENT password than your current .env file.

**Solution**: Reset PostgreSQL data

```bash
# Option A: Delete old volumes in SecretVM Dev Portal
# Go to portal → Stop services → Delete volumes → Redeploy

# Option B: If you have SSH/console access:
docker volume rm docker_wd_postgres_data
# Then redeploy
```

**Verify Password Match**:
Check your `.env` file has matching password:
```bash
POSTGRES_PASSWORD=Ebuka2025  # This must match across all deployments
```

---

### 2. ❌ PgAdmin Container Crashing

**Error in logs**:
```
privexbot-pgadmin-secretvm exited with code 1
unable to find the IP address for the container
```

**Cause**: PgAdmin environment variables format issue + missing network connectivity

**Fixed in updated docker-compose.secretvm.yml**:
- Changed environment variable format
- Added health check dependency
- Added CSRF protection configs

---

### 3. ❌ Traefik Not Routing External Traffic

**Symptoms**:
- Internal health checks work: `127.0.0.1 - "GET /health HTTP/1.1" 200` ✅  
- External access fails: `net::ERR_TUNNEL_CONNECTION_FAILED` ❌

**Possible Causes**:

#### A. Backend Container Not on Traefik Network

Check in SecretVM logs/portal:
```bash
docker inspect privexbot-backend-secretvm | grep NetworkMode
```

Should show: `"NetworkMode": "docker_wd_traefik"`

#### B. Traefik Not Seeing Backend Labels

Check Traefik dashboard:
```
https://traefik.sapphire-finch.vm.scrtlabs.com
```

Look for "backend" router - should show:
- Rule: `Host(api.sapphire-finch.vm.scrtlabs.com)`
- Service: `backend@docker`
- Status: Active

#### C. Port Binding Issue

The backend exposes port 8000 internally. Traefik should route to this.

**Verification**:
1. Check backend is running: `docker ps | grep backend`
2. Check backend responds internally: `docker exec privexbot-backend-secretvm curl http://localhost:8000/health`
3. Check Traefik logs for routing errors

---

### 4. ❌ CORS Origin With Trailing Slash

**Found in logs**:
```
CORS enabled for: ['https://sapphire-finch.vm.scrtlabs.com', 'https://api.sapphire-finch.vm.scrtlabs.com', 'https://silver-hedgehog.vm.scrtlabs.com/']
```

**Issue**: Last origin has trailing `/` which causes CORS failures

**Fixed in .env**: Removed trailing slash

---

## Complete Fix Checklist

### Step 1: Update docker-compose.secretvm.yml

✅ **Already fixed** - PgAdmin environment variables corrected

### Step 2: Update .env File

✅ **Already fixed** - Removed trailing slash from CORS origins

Verify your `.env` has:
```bash
BACKEND_CORS_ORIGINS=https://sapphire-finch.vm.scrtlabs.com,https://api.sapphire-finch.vm.scrtlabs.com
```

### Step 3: Reset PostgreSQL Data

**IMPORTANT**: Current PostgreSQL volume has old password.

In SecretVM Dev Portal:
1. Stop all services
2. Delete volume: `postgres_data`
3. Redeploy with updated files

This will create fresh database with correct password from `.env`

### Step 4: Redeploy

1. Show updated compose file:
   ```bash
   ./scripts/docker/secretvm-deploy.sh show
   ```

2. Copy to SecretVM Dev Portal

3. Upload updated `.env` file (from `deploy/secretvm/.env`)

4. Deploy

### Step 5: Verify Services

After deployment, check:

```bash
# Test backend
curl -k https://api.sapphire-finch.vm.scrtlabs.com/health

# Test PgAdmin  
curl -k https://pgadmin.sapphire-finch.vm.scrtlabs.com

# Test Redis UI
curl -k https://redis-ui.sapphire-finch.vm.scrtlabs.com
```

---

## Database Setup From Scratch

Your codebase has models commented out in `src/app/db/base.py`. 

### Current State:
- Models are pseudocode only (not implemented)
- `init_db()` only verifies connection, doesn't create tables
- Database will be empty after reset

### To Create Tables (Future):

When you implement models, uncomment in `src/app/db/base.py`:
```python
from app.models.user import User  # noqa
from app.models.organization import Organization  # noqa
# ... etc
```

Then `init_db()` will create all tables on startup.

### For Now (Testing):
Database starts empty, which is fine for testing endpoints.

---

## Testing External Access

### Test from Browser:
```
https://api.sapphire-finch.vm.scrtlabs.com/health
https://api.sapphire-finch.vm.scrtlabs.com/api/v1/status
https://api.sapphire-finch.vm.scrtlabs.com/api/docs
```

### Test from curl:
```bash
curl -v -k https://api.sapphire-finch.vm.scrtlabs.com/health
```

Look for:
- `HTTP/2 200` status
- Response: `{"status": "healthy", "service": "privexbot-backend", "version": "0.1.0"}`

### If Still Failing:

1. **Check Traefik Dashboard**:
   ```
   https://traefik.sapphire-finch.vm.scrtlabs.com
   ```
   - Verify "api" router exists
   - Check service is active

2. **Check Backend Logs** in SecretVM Portal:
   - Should see startup messages
   - Should see health check requests from Traefik

3. **Check DNS**:
   ```bash
   nslookup api.sapphire-finch.vm.scrtlabs.com
   ```
   Should return: `67.43.239.18`

4. **Check Firewall/Network**:
   - Ports 80 and 443 must be open on SecretVM
   - Traefik must be accessible from internet

---

## Common Errors & Solutions

### "Bad Gateway" (502)
- Backend container not healthy
- Check backend logs for startup errors
- Verify database connection

### "Service Unavailable" (503)  
- Backend container not started
- Health check failing
- Check dependencies (postgres/redis)

### "Not Found" (404)
- Traefik routing not configured
- Check labels on backend container
- Verify domain in Traefik dashboard

### "Connection Refused" / "Tunnel Error"
- Traefik not running
- Network configuration issue
- DNS not pointing to correct IP

---

## Quick Commands

### Show Compose File:
```bash
./scripts/docker/secretvm-deploy.sh show
```

### Test Endpoints:
```bash
./scripts/docker/secretvm-deploy.sh test
```

### Check Service Status (in SecretVM Portal):
Look for all containers showing "Running" status

---

## Final Checklist

Before redeploying:

- [ ] Updated docker-compose.secretvm.yml (PgAdmin fix)
- [ ] Updated .env (removed trailing slash)
- [ ] Verified POSTGRES_PASSWORD is consistent
- [ ] Ready to delete old postgres volume
- [ ] Have backup of any important data

After redeploying:

- [ ] All containers show "Running" status
- [ ] No error logs for pgadmin
- [ ] Backend shows database connection successful
- [ ] External URLs accessible from browser
- [ ] Health endpoint returns 200
- [ ] Status endpoint shows correct CORS origins

---

## Need More Help?

Check logs in SecretVM Dev Portal for:
- `privexbot-backend-secretvm` - Backend application logs
- `traefik-secretvm` - Routing and TLS logs  
- `privexbot-postgres-secretvm` - Database logs
- `privexbot-pgadmin-secretvm` - PgAdmin logs

Look for ERROR level messages and share them for further troubleshooting.
