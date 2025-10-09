# SecretVM Deployment - Ready to Deploy

## Status: ✅ All Fixes Applied

### Issues Fixed:
1. ✅ PgAdmin environment variables corrected
2. ✅ CORS trailing slash removed
3. ✅ Deployment workflow corrected (portal-based)
4. ✅ Scripts tested and working

---

## Deploy Now (5 Steps)

### Step 1: Reset PostgreSQL Volume
**Critical**: Old volume has wrong password

In SecretVM Dev Portal:
1. Stop all services
2. Delete volume: `postgres_data`
3. Continue to next step

### Step 2: Get Compose File
```bash
./scripts/docker/secretvm-deploy.sh show
```

Copy the entire output

### Step 3: Update SecretVM Dev Portal
1. Go to SecretVM Dev Portal
2. Paste the compose file content
3. Upload `deploy/secretvm/.env`

### Step 4: Deploy
Click "Deploy" button in portal

### Step 5: Test Deployment
```bash
./scripts/docker/secretvm-deploy.sh test
```

---

## Expected Results

After deployment, you should see:

```
✅ Backend API     - https://api.sapphire-finch.vm.scrtlabs.com/health
✅ Status endpoint - https://api.sapphire-finch.vm.scrtlabs.com/api/v1/status
✅ API Docs        - https://api.sapphire-finch.vm.scrtlabs.com/api/docs
✅ PgAdmin         - https://pgadmin.sapphire-finch.vm.scrtlabs.com
✅ Redis UI        - https://redis-ui.sapphire-finch.vm.scrtlabs.com
✅ Traefik         - https://traefik.sapphire-finch.vm.scrtlabs.com
```

---

## Database Setup

**Current State**: Database will be empty after volume reset

**Models Status**: All models are pseudocode (commented out in `src/app/db/base.py`)

**For Now**: Database starts empty, which is fine for testing endpoints

**Future**: When you implement models, uncomment them in `src/app/db/base.py`, then `init_db()` will create tables automatically on next deployment

---

## If Still Having Issues

### External Access Not Working?

1. **Check Traefik Dashboard**:
   ```
   https://traefik.sapphire-finch.vm.scrtlabs.com
   ```
   - Look for "api" router
   - Should show: Host(`api.sapphire-finch.vm.scrtlabs.com`)
   - Status should be: Active

2. **Check Backend Container**:
   In SecretVM portal logs, look for:
   - "Application startup complete"
   - "Database connection successful"

3. **Check DNS**:
   ```bash
   nslookup api.sapphire-finch.vm.scrtlabs.com
   ```
   Should return: `67.43.239.18`

### CORS Errors?

Check backend logs show:
```
CORS enabled for: ['https://sapphire-finch.vm.scrtlabs.com', 'https://api.sapphire-finch.vm.scrtlabs.com']
```

No trailing slashes!

---

## Credentials

Current `.env` has:
- POSTGRES_PASSWORD: `Ebuka2025`
- PGADMIN_PASSWORD: `Ebuka2025`
- SECRET_KEY: (already set)

**For production**: Generate stronger passwords:
```bash
openssl rand -base64 32
```

---

## Quick Reference

### Deployment Commands
```bash
# Show compose file for portal
./scripts/docker/secretvm-deploy.sh show

# Test endpoints after deployment
./scripts/docker/secretvm-deploy.sh test
```

### PgAdmin Login
- URL: https://pgadmin.sapphire-finch.vm.scrtlabs.com
- Email: privexbot@gmail.com
- Password: (from .env PGADMIN_PASSWORD)

### Connect to Database in PgAdmin
- Host: postgres
- Port: 5432
- Database: privexbot
- User: privexbot
- Password: (from .env POSTGRES_PASSWORD)

---

## Troubleshooting Guide

Full troubleshooting guide available at:
`scripts/secretvm-troubleshoot.md`
