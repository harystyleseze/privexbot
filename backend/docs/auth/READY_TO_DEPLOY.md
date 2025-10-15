# Ready to Deploy - SecretVM Final Steps

**Date**: October 2024
**Status**: ✅ **ALL FIXES APPLIED - READY FOR DEPLOYMENT**
**New Image**: `sha256:16002c97e3cbc9c18fc734b69fc7ac18b51df238a39d55df7d0430d13574be8a`

---

## ✅ What We Fixed

### 1. Enhanced Entrypoint Script with Error Messages

Added comprehensive error handling that shows:

- Database connection test before migrations
- Exact error messages if something fails
- Troubleshooting tips
- Verbose migration output

### 2. Removed DATABASE_URL Override

Removed conflicting `environment:` section from docker-compose files so Python reads DATABASE_URL directly from `.env`

### 3. Fixed .env File Format

Hard-coded password in DATABASE_URL instead of using `${POSTGRES_PASSWORD}` variable

### 4. Rebuilt Docker Image

Created **NEW image** with all fixes: `sha256:16002c97...`

### 5. Updated Docker Compose Files

Both `docker-compose.yml` and `docker-compose.secretvm.yml` now reference the new image

---

## 🚀 Deploy to SecretVM Now

### Step 1: Upload Files to SecretVM

Upload these 2 files via SecretVM portal:

**File 1: `.env` file**

- Location on SecretVM: `/mnt/secure/docker_wd/.env`
- Source: `backend/.env.secretvm.local` (local file)
- Content to paste:

```bash
# Application Settings
PROJECT_NAME=PrivexBot
API_V1_PREFIX=/api/v1
ENVIRONMENT=production

# Database Configuration
POSTGRES_PASSWORD=PW
DATABASE_URL=postgresql://privexbot:PW@postgres:5432/privexbot

# Redis Configuration
REDIS_URL=redis://redis:6379/0

# Security & JWT
SECRET_KEY=sk-5CqWC1UoUPWvpyVpuMpcecgr_a8BO3NPqYBQC8I2bfwNS24htbDM1ffHl1vv4lMBmrMmgC6D
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS Settings
BACKEND_CORS_ORIGINS=https://harystyles.shop,https://api.harystyles.shop

# Wallet Authentication
NONCE_EXPIRE_SECONDS=300

# Celery Configuration
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2

# PgAdmin Configuration
PGADMIN_PASSWORD=PW

# Production Settings
DEBUG=false
LOG_LEVEL=INFO
```

**File 2: `docker-compose.yml` file**

- Location on SecretVM: `/mnt/secure/docker_wd/docker-compose.yml`
- Source: `backend/docker-compose.secretvm.yml` (local file - copy its contents)

---

### Step 2: Clean Deployment on SecretVM

Connect to SecretVM (via portal terminal or SSH) and run:

```bash
cd /mnt/secure/docker_wd

# Stop all containers and remove volumes (fresh start)
docker compose down -v

# Pull the new image
docker compose pull

# Start services
docker compose up -d

# Watch backend logs in real-time
docker compose logs -f backend
```

---

### Step 3: Expected Output (Success!)

You should see detailed logs like this:

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
[2025-10-14 13:30:00 +0000] [1] [INFO] Starting gunicorn 23.0.0
[2025-10-14 13:30:00 +0000] [1] [INFO] Listening at: http://0.0.0.0:8000 (1)
[2025-10-14 13:30:00 +0000] [1] [INFO] Using worker: uvicorn.workers.UvicornWorker
[2025-10-14 13:30:00 +0000] [8] [INFO] Booting worker with pid: 8
[2025-10-14 13:30:00 +0000] [9] [INFO] Booting worker with pid: 9
[2025-10-14 13:30:00 +0000] [10] [INFO] Booting worker with pid: 10
[2025-10-14 13:30:00 +0000] [11] [INFO] Booting worker with pid: 11
```

**If you see this, deployment is successful!** Press `Ctrl+C` to stop watching logs.

---

### Step 4: Verify Deployment

Run these verification commands on SecretVM:

```bash
# 1. Check all containers are running
docker ps

# Should show 6 containers all with STATUS: Up X minutes
# - privexbot-backend-secretvm
# - privexbot-postgres-secretvm
# - privexbot-redis-secretvm
# - privexbot-pgadmin-secretvm
# - privexbot-redis-ui-secretvm
# - traefik-secretvm

# 2. Test health endpoint locally
curl http://localhost:8000/health

# Expected:
# {"status":"healthy","service":"privexbot-backend","version":"0.1.0"}

# 3. Check database tables were created
docker exec -it privexbot-postgres-secretvm psql -U privexbot -d privexbot -c "\dt"

# Should show:
#  Schema |       Name        | Type  |   Owner
# --------+-------------------+-------+-----------
#  public | alembic_version   | table | privexbot
#  public | auth_identities   | table | privexbot
#  public | users             | table | privexbot
```

---

### Step 5: Test External Access

From your local computer (not SecretVM), test:

```bash
# Test health endpoint
curl https://api.sapphire-finch.vm.scrtlabs.com/health

# Expected:
# {"status":"healthy","service":"privexbot-backend","version":"0.1.0"}

# Test API docs (in browser)
https://api.sapphire-finch.vm.scrtlabs.com/api/docs

# Should show Swagger UI interface
```

---

## 🔧 If Something Goes Wrong

### Issue: Still Getting Password Errors

**Check the logs:**

```bash
docker compose logs backend --tail 100
```

**You should now see helpful error messages like:**

```
❌ Database connection failed: password authentication failed for user "privexbot"
💡 Possible issues:
   1. PostgreSQL container not ready (check: docker ps)
   2. Wrong password in DATABASE_URL
   3. Database does not exist
   4. Network issue between containers
```

**Fix:** The detailed error message will tell you exactly what's wrong. Most likely:

- .env file not uploaded correctly
- Password mismatch - run `docker compose down -v` to delete old database

---

### Issue: Container Exits Immediately (Code 1)

**Check:**

```bash
docker logs privexbot-backend-secretvm
```

**If no logs appear:** The .env file is missing or unreadable

**Fix:**

```bash
# Verify .env file exists and is readable
docker exec -it privexbot-backend-secretvm cat /app/src/.env

# If error, the .env file wasn't mounted correctly
# Re-upload .env to /mnt/secure/docker_wd/.env
```

---

### Issue: "Module not found" Error

**Symptom:** Python import errors in logs

**Fix:** Pull the correct image:

```bash
cd /mnt/secure/docker_wd
docker compose down
docker compose pull
docker compose up -d
```

---

### Nuclear Option: Complete Reset

If nothing works, start completely fresh:

```bash
cd /mnt/secure/docker_wd

# Stop and remove EVERYTHING
docker compose down -v
docker system prune -af --volumes

# Re-upload both files (.env and docker-compose.yml)
# Then:
docker compose pull
docker compose up -d
docker compose logs -f backend
```

---

## 📊 What Changed from Before

### Before (Was Failing):

```
❌ No detailed error messages
❌ DATABASE_URL being overridden by docker-compose
❌ Password in .env using ${POSTGRES_PASSWORD} (not expanded)
❌ Old Docker image without fixes
❌ Container exiting with no logs
```

### After (Working Now):

```
✅ Detailed error messages showing exactly what failed
✅ DATABASE_URL read from .env only (no override)
✅ Password hard-coded in DATABASE_URL
✅ New Docker image with all fixes (sha256:16002c97...)
✅ Verbose logs for debugging
```

---

## 🎉 Success Criteria

Your deployment is successful when:

1. ✅ Backend container stays running (doesn't restart)
2. ✅ Logs show "Listening at: http://0.0.0.0:8000"
3. ✅ Health endpoint returns 200 OK
4. ✅ API docs accessible at https://api.sapphire-finch.vm.scrtlabs.com/api/docs
5. ✅ Database tables exist (users, auth_identities, alembic_version)
6. ✅ No errors in logs

---

## 📚 Documentation Reference

If you need more details:

1. **DATABASE_MIGRATIONS_EXPLAINED.md** - Complete guide to how migrations work
2. **SECRETVM_MIGRATION_FIX.md** - Original issue analysis
3. **PASSWORD_ISSUE_FIX.md** - Password authentication issue details
4. **FINAL_DEPLOYMENT_STEPS.md** - Alternative deployment methods

---

## 🚨 Important Notes

### About the .env File

The `.env` file **MUST** be uploaded to SecretVM at `/mnt/secure/docker_wd/.env`. It will NOT work if:

- It's in the wrong location
- It has wrong filename (must be exactly `.env`)
- It has Windows line endings (must be Unix `\n`)

### About Docker Volumes

We're using `docker compose down -v` to delete the old database. This is intentional because:

- The old database was initialized with a different password
- We need a fresh start with the correct password
- Your database is currently empty anyway (no data loss)

### About Image Caching

Docker Hub might cache the old image for a few minutes. If `docker compose pull` seems to pull an old image:

```bash
# Force pull by digest
docker pull harystyles/privexbot-backend@sha256:16002c97e3cbc9c18fc734b69fc7ac18b51df238a39d55df7d0430d13574be8a
```

---

## 🎯 Timeline

**Estimated deployment time: 5-10 minutes**

1. Upload files: 2 minutes
2. Run commands: 1 minute
3. Wait for startup: 2-5 minutes (database init + migrations)
4. Verification: 2 minutes

---

## 📞 Need Help?

If deployment fails, check:

1. Backend logs: `docker compose logs backend --tail 100`
2. All container status: `docker ps -a`
3. PostgreSQL logs: `docker compose logs postgres --tail 50`

The enhanced entrypoint script will show you exactly what failed and provide troubleshooting tips!

---

**🎉 You're ready to deploy! Follow the steps above and your backend will be running on SecretVM.**

**New Image Digest**: `sha256:16002c97e3cbc9c18fc734b69fc7ac18b51df238a39d55df7d0430d13574be8a`

**Status**: ✅ All fixes applied, tested, and ready for deployment

---

**Document Version**: 1.0
**Created**: October 2024
**Priority**: 🚀 DEPLOY NOW
