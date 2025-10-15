# Final Deployment Steps - Complete Guide

**Date**: October 2024
**Status**: ✅ All Issues Identified and Fixed
**Action Required**: Follow deployment steps below

---

## 🎯 Quick Summary

Your SecretVM deployment was failing because:

1. ❌ Docker Compose was overriding DATABASE_URL → **FIXED**
2. ❌ PostgreSQL initialized with different password → **Needs your action**

The enhanced entrypoint script is now showing you the exact error, which confirms the password mismatch issue.

---

## ✅ What We Fixed

### 1. Removed DATABASE_URL Override

**Files**: `docker-compose.yml` and `docker-compose.secretvm.yml`

Changed from:

```yaml
backend:
  environment:
    - DATABASE_URL=postgresql://privexbot:${POSTGRES_PASSWORD}@... # Override
  env_file:
    - .env
```

To:

```yaml
backend:
  # DATABASE_URL now read from .env only (no override)
  env_file:
    - .env
```

### 2. Fixed .env File Format

**File**: `.env.secretvm.local`

Changed from:

```bash
DATABASE_URL=postgresql://privexbot:${POSTGRES_PASSWORD}@...  # Variable not expanded
```

To:

```bash
DATABASE_URL=postgresql://privexbot:PW@...  # Hard-coded password
```

### 3. Enhanced Entrypoint Script

**File**: `scripts/docker/entrypoint-prod.sh`

Now shows:

- Database connection test results
- Exact error messages
- Troubleshooting tips
- Verbose migration output

---

## 🚀 Deployment Steps (Choose One Method)

### Method A: Fresh Start (Recommended - Simplest) ⭐

**Best for**: First deployment or when you don't have important data yet

**Steps:**

1. **Upload .env file to SecretVM**

   ```bash
   # Copy contents of backend/.env.secretvm.local
   # In SecretVM portal, edit /mnt/secure/docker_wd/.env
   # Paste contents and save
   ```

   **Verify it has:**

   ```bash
   POSTGRES_PASSWORD=PW
   DATABASE_URL=postgresql://privexbot:PW@postgres:5432/privexbot
   SECRET_KEY=sk-5CqWC1UoUPWvpyVpuMpcecgr_a8BO3NPqYBQC8I2bfwNS24htbDM1ffHl1vv4lMBmrMmgC6D
   BACKEND_CORS_ORIGINS=https://harystyles.shop,https://api.harystyles.shop
   PGADMIN_PASSWORD=PW
   ```

2. **Upload updated docker-compose.secretvm.yml**

   ```bash
   # Copy contents of backend/docker-compose.secretvm.yml
   # In SecretVM portal, replace /mnt/secure/docker_wd/docker-compose.yml
   # Save
   ```

3. **On SecretVM terminal (via SSH or portal):**

   ```bash
   cd /mnt/secure/docker_wd

   # Stop everything and remove volumes
   docker compose down -v

   # Verify volumes are gone
   docker volume ls | grep postgres
   # Should show nothing or no postgres_data

   # Start fresh
   docker compose up -d

   # Watch logs
   docker compose logs -f backend
   ```

4. **Expected output:**

   ```log
   🔄 Running database migrations...
   📊 Database URL: postgresql://privexbot:****@postgres:5432/privexbot
   🌍 Environment: production
   🔌 Testing database connection...
   ✅ Database connection successful
   📦 Applying database migrations...
   INFO [alembic.runtime.migration] Running upgrade  -> 3c4e4feca860
   ✅ Database migrations completed successfully
   🚀 Starting production server with gunicorn...
   [INFO] Listening at: http://0.0.0.0:8000
   ```

5. **Verify deployment:**

   ```bash
   # Test health endpoint
   curl http://localhost:8000/health

   # Should return:
   # {"status":"healthy","service":"privexbot-backend","version":"0.1.0"}

   # Test from outside
   curl https://api.sapphire-finch.vm.scrtlabs.com/health
   ```

---

### Method B: Keep Existing Data (Manual Password Change)

**Best for**: When you have important data and can't delete the database

**Steps:**

1. **Upload updated files** (same as Method A steps 1-2)

2. **On SecretVM, change PostgreSQL password:**

   ```bash
   cd /mnt/secure/docker_wd

   # Ensure PostgreSQL is running
   docker compose up -d postgres

   # Wait a few seconds for it to start
   sleep 5

   # Connect to PostgreSQL as superuser
   docker exec -it privexbot-postgres-secretvm psql -U postgres
   ```

3. **Inside PostgreSQL shell:**

   ```sql
   -- Change the password to match .env
   ALTER USER privexbot WITH PASSWORD 'PW';

   -- Verify it worked
   \du

   -- Exit
   \q
   ```

4. **Restart backend:**

   ```bash
   docker compose up -d backend

   # Watch logs
   docker compose logs -f backend
   ```

5. **Verify** (same as Method A step 5)

---

## 🔍 Troubleshooting

### If you still get "password authentication failed":

**Check .env file on SecretVM:**

```bash
docker exec -it privexbot-backend-secretvm cat /app/src/.env

# Should show:
# POSTGRES_PASSWORD=PW
# DATABASE_URL=postgresql://privexbot:PW@postgres:5432/privexbot
```

**Check PostgreSQL password:**

```bash
# Try connecting with the password from .env
docker exec -it privexbot-postgres-secretvm psql -U privexbot -d privexbot

# If it asks for password, type: PW
# If it works, password is correct
# If it fails, password is wrong → Use Method A (fresh start)
```

**Check backend logs for detailed error:**

```bash
docker compose logs backend --tail 100
```

**Nuclear option (delete everything and start over):**

```bash
cd /mnt/secure/docker_wd

# Stop and remove EVERYTHING
docker compose down -v
docker system prune -af --volumes

# Upload fresh .env and docker-compose.yml
# Then:
docker compose up -d
docker compose logs -f backend
```

---

## ✅ Verification Checklist

After deployment, verify:

### 1. Containers Running

```bash
docker ps

# Should show all 6 containers running:
# - privexbot-backend-secretvm
# - privexbot-postgres-secretvm
# - privexbot-redis-secretvm
# - privexbot-pgadmin-secretvm
# - privexbot-redis-ui-secretvm
# - traefik-secretvm
```

### 2. Backend Healthy

```bash
# Check backend logs (should show no errors)
docker compose logs backend --tail 50

# Test health endpoint
curl http://localhost:8000/health
```

### 3. Database Initialized

```bash
# Connect to database
docker exec -it privexbot-postgres-secretvm psql -U privexbot -d privexbot

# List tables
\dt

# Should show:
#  Schema |       Name        | Type  |   Owner
# --------+-------------------+-------+-----------
#  public | alembic_version   | table | privexbot
#  public | auth_identities   | table | privexbot
#  public | users             | table | privexbot

# Check migration status
SELECT * FROM alembic_version;

# Should show:
#  version_num
# --------------
#  3c4e4feca860

# Exit
\q
```

### 4. External Access Working

```bash
# From your local computer
curl https://api.sapphire-finch.vm.scrtlabs.com/health

# Should return JSON with status healthy
```

### 5. API Docs Accessible

```bash
# Visit in browser:
https://api.sapphire-finch.vm.scrtlabs.com/api/docs

# Should show Swagger UI
```

### 6. Traefik Dashboard

```bash
# Visit in browser:
https://traefik.sapphire-finch.vm.scrtlabs.com

# Should show Traefik dashboard with all services
```

---

## 📚 What You Learned

### 1. Database Migrations

- **Purpose**: Version control for database structure (not data)
- **How**: Alembic generates SQL from Python models
- **When**: Runs automatically on container startup via entrypoint script
- **Effect**: Creates/modifies tables, preserves data

### 2. Environment Variables in Docker

- **Docker Compose expansion**: `${VAR}` expanded in `environment:` section
- **Python .env**: Variables NOT expanded, read as literal strings
- **Override order**: `environment:` > `.env file` > `env_file:` directive
- **Solution**: Don't use `${VAR}` in .env files, use literal values

### 3. PostgreSQL Initialization

- **First start**: Uses `POSTGRES_PASSWORD` to create user
- **Subsequent starts**: Ignores `POSTGRES_PASSWORD`, uses stored password
- **Important**: Changing .env doesn't change password in existing database
- **Fix**: Delete volume OR manually change password

### 4. Docker Volumes

- **Purpose**: Persist data between container restarts
- **Location**: `/var/lib/docker/volumes/` on host
- **Problem**: Old data persists even after updating .env
- **Solution**: Delete volume with `docker compose down -v`

---

## 🎯 Final Notes

### Security Best Practices

**Never commit passwords to Git:**

```bash
# .gitignore should have:
.env
.env.*
!.env.example
```

**Use strong passwords in production:**

```bash
# Generate strong password:
openssl rand -base64 32

# Use it in both places:
POSTGRES_PASSWORD=<generated>
DATABASE_URL=postgresql://privexbot:<generated>@...
```

**Store secrets securely:**

- Use SecretVM's secret management
- Or use environment variables from portal (not .env files)
- Keep backups in password manager

### Development vs Production

**Development:**

- Database: `privexbot_dev`
- Password: Can be simple
- Data: Test data, can be deleted
- Resets: Frequent

**Production:**

- Database: `privexbot`
- Password: Must be strong
- Data: Real user data, must preserve
- Resets: Rare, planned

### Backup Strategy

**Before major changes:**

```bash
# Backup database
docker exec privexbot-postgres-secretvm pg_dump -U privexbot privexbot > backup_$(date +%Y%m%d).sql

# Backup .env
cp /mnt/secure/docker_wd/.env /mnt/secure/docker_wd/.env.backup

# If something goes wrong, restore:
docker exec -i privexbot-postgres-secretvm psql -U privexbot privexbot < backup_20241014.sql
```

---

## 📞 Need Help?

**Check these documents:**

1. `DATABASE_MIGRATIONS_EXPLAINED.md` - Complete guide to migrations
2. `SECRETVM_MIGRATION_FIX.md` - Fix for migration hanging issue
3. `PASSWORD_ISSUE_FIX.md` - Fix for password authentication issue
4. This file - Complete deployment guide

**Common issues and solutions:**

- Password fails → Delete volume, restart fresh
- Migrations hang → Check database connection, verify .env correct
- Container crashes → Check logs with `docker compose logs backend`
- Can't access API → Check Traefik config, verify DNS

---

## 🚀 You're Ready!

Follow **Method A** above for the cleanest deployment. It will:

- Delete old database with wrong password
- Initialize PostgreSQL with correct password
- Run migrations to create tables
- Start backend successfully

Expected time: **5 minutes**

Good luck! 🎉

---

**Document Version**: 1.0
**Status**: Complete deployment guide
**Last Updated**: October 2024
