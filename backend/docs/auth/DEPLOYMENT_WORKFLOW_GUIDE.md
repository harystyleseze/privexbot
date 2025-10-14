# Production Deployment Workflow Guide

**Date**: October 2024
**Status**: ✅ All fixes applied - Ready for image rebuild
**Version**: 0.2.0

---

## 📋 Summary of Fixes Applied

All critical production deployment issues have been resolved:

### ✅ Fix 1: Production Entrypoint Script Created
**File**: `backend/scripts/docker/entrypoint-prod.sh`

```bash
#!/bin/bash
# Production entrypoint script for backend service
# WHY: Ensures database migrations are applied before server starts
# HOW: Runs alembic upgrade, then starts gunicorn with multiple workers

set -e

echo "🔄 Running database migrations..."
cd /app/src
alembic upgrade head

echo "🚀 Starting production server with gunicorn..."
cd /app
exec gunicorn src.app.main:app \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:8000 \
    --access-logfile - \
    --error-logfile -
```

### ✅ Fix 2: Production Dockerfiles Updated
**Files**: `Dockerfile` and `Dockerfile.secretvm`

Both files now:
- Copy the production entrypoint script
- Make it executable
- Use entrypoint script as CMD (runs migrations before starting server)

**Changes**:
```dockerfile
# Copy entrypoint script
COPY scripts/docker/entrypoint-prod.sh /app/scripts/
RUN chmod +x /app/scripts/entrypoint-prod.sh

# ... rest of Dockerfile ...

# Run entrypoint script (handles migrations and starts gunicorn)
CMD ["/app/scripts/entrypoint-prod.sh"]
```

### ✅ Fix 3: PostgreSQL Health Checks Updated
**Files**: `docker-compose.yml` and `docker-compose.secretvm.yml`

Both files now specify database name explicitly:
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U privexbot -d privexbot"]
  interval: 10s
  timeout: 5s
  retries: 5
```

---

## 🚀 Next Steps: Image Rebuild and Deployment

### Step 1: Build New Production Image

From the `backend/` directory, run:

```bash
# Build and push new image with version 0.2.0
./scripts/docker/build-push.sh 0.2.0
```

**Expected output**:
```
🚀 Building and pushing PrivexBot backend image...
📋 Version: 0.2.0
🏗️  Building image...
[docker build output...]
✅ Image built successfully
📤 Pushing to Docker Hub...
[docker push output...]
✅ Image pushed successfully
📝 Image digest: sha256:abc123def456...
```

**IMPORTANT**: Copy the image digest from the output. You'll need it in the next step.

### Step 2: Update Docker Compose Files with New Image Digest

After building, update both production compose files with the new image digest.

**Update `docker-compose.yml`** (line 7):
```yaml
services:
  backend:
    image: harystyles/privexbot-backend@sha256:NEW_DIGEST_HERE
```

**Update `docker-compose.secretvm.yml`** (line 14):
```yaml
services:
  backend:
    image: harystyles/privexbot-backend@sha256:NEW_DIGEST_HERE
```

Replace `NEW_DIGEST_HERE` with the actual digest from Step 1 output.

### Step 3: Test Production Image Locally

Before deploying to SecretVM, test the production image locally:

```bash
# 1. Make sure you have a .env file with required variables
# Example .env content:
#   POSTGRES_PASSWORD=your_secure_password
#   SECRET_KEY=your_jwt_secret_key
#   BACKEND_CORS_ORIGINS=["*"]

# 2. Start production stack
docker compose -f docker-compose.yml up

# 3. Watch logs in another terminal
docker logs -f privexbot-backend

# 4. Wait for migrations to complete and server to start
# You should see:
#   🔄 Running database migrations...
#   INFO:alembic.runtime.migration:Running upgrade -> abc123
#   🚀 Starting production server with gunicorn...
#   [INFO] Listening at: http://0.0.0.0:8000

# 5. Test health endpoint
curl http://localhost:8000/health

# Expected response:
# {"status":"healthy","service":"privexbot-backend","version":"0.1.0"}

# 6. Test API docs
curl http://localhost:8000/api/docs
# Should return HTML for Swagger UI

# 7. If everything looks good, stop the stack
docker compose -f docker-compose.yml down
```

### Step 4: Deploy to SecretVM

Once local testing is successful, deploy to SecretVM:

```bash
# 1. Prepare SecretVM deployment files
./scripts/docker/secretvm-deploy.sh prepare

# This creates deployment-bundle.tar.gz containing:
# - docker-compose.secretvm.yml (renamed to docker-compose.yml)
# - .env file
# - README with deployment instructions

# 2. Show deployment information
./scripts/docker/secretvm-deploy.sh show

# This displays:
# - SecretVM portal URL
# - Upload instructions
# - Deployment commands

# 3. Upload to SecretVM Portal
# - Log in to SecretVM portal at: https://portal.scrtlabs.com
# - Navigate to your VM: sapphire-finch
# - Go to Files section
# - Upload deployment-bundle.tar.gz to /mnt/secure/docker_wd/

# 4. Connect to SecretVM via SSH
ssh user@sapphire-finch.vm.scrtlabs.com

# 5. On SecretVM, extract and deploy
cd /mnt/secure/docker_wd
tar -xzf deployment-bundle.tar.gz
docker compose down  # Stop existing services
docker compose pull  # Pull new image
docker compose up -d # Start with new image

# 6. Monitor deployment
docker compose logs -f backend

# You should see:
#   🔄 Running database migrations...
#   🚀 Starting production server with gunicorn...

# 7. Test deployment
./scripts/docker/secretvm-deploy.sh test

# This tests:
# - Health endpoint: https://api.sapphire-finch.vm.scrtlabs.com/health
# - API docs: https://api.sapphire-finch.vm.scrtlabs.com/api/docs
```

---

## 🔍 Verification Checklist

After deployment, verify:

### Backend Service
- [ ] Container is running: `docker ps | grep privexbot-backend`
- [ ] No error logs: `docker logs privexbot-backend --tail 50`
- [ ] Migrations completed: Check logs for "Running database migrations..."
- [ ] Server started: Check logs for "Listening at: http://0.0.0.0:8000"
- [ ] Health check passing: `curl http://localhost:8000/health`

### PostgreSQL
- [ ] Container is running: `docker ps | grep privexbot-postgres`
- [ ] Health check passing: `docker inspect privexbot-postgres | grep Health`
- [ ] No connection errors in logs: `docker logs privexbot-postgres`

### Redis
- [ ] Container is running: `docker ps | grep privexbot-redis`
- [ ] Health check passing: `docker inspect privexbot-redis | grep Health`
- [ ] Redis responding: `docker exec privexbot-redis redis-cli ping` (should return PONG)

### Traefik (SecretVM only)
- [ ] Container is running: `docker ps | grep traefik`
- [ ] API accessible: `https://api.sapphire-finch.vm.scrtlabs.com/health`
- [ ] Dashboard accessible: `https://traefik.sapphire-finch.vm.scrtlabs.com`

---

## 🐛 Troubleshooting

### Issue: Backend container exits immediately

**Check logs**:
```bash
docker logs privexbot-backend
```

**Common causes**:
1. **Database not ready**: Wait for postgres health check to pass
2. **Missing .env file**: Ensure .env exists with required variables
3. **Migration failure**: Check alembic logs for SQL errors

**Solution**:
```bash
# Verify postgres is healthy
docker ps --filter "name=postgres" --format "table {{.Names}}\t{{.Status}}"

# Check postgres logs
docker logs privexbot-postgres --tail 20

# Restart backend after postgres is healthy
docker compose restart backend
```

### Issue: "Database 'privexbot' does not exist"

**Cause**: Database not created automatically

**Solution**:
```bash
# Create database manually
docker exec -it privexbot-postgres psql -U privexbot -c "CREATE DATABASE privexbot;"

# Or restart postgres (it should auto-create from POSTGRES_DB env var)
docker compose restart postgres
```

### Issue: Migration errors

**Check migration status**:
```bash
docker exec -it privexbot-backend bash
cd /app/src
alembic current
alembic history
```

**Rollback and retry**:
```bash
# Rollback last migration
docker exec -it privexbot-backend alembic downgrade -1

# Try upgrade again
docker exec -it privexbot-backend alembic upgrade head
```

### Issue: "Module 'bcrypt' has no attribute '__about__'"

**Status**: ℹ️ This is a harmless warning, not an error

**Explanation**: passlib 1.7.4 tries to read bcrypt version info that doesn't exist in bcrypt 4.x. Authentication still works correctly.

**Verification**:
```bash
# Test authentication endpoints still work
curl -X POST http://localhost:8000/api/v1/auth/email/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"Test123!"}'

# Should return 201 Created with user data
```

### Issue: "Permission denied" on entrypoint script

**Cause**: Script not executable

**Solution**:
```bash
# This shouldn't happen if Dockerfile is correct, but if it does:
docker exec -it privexbot-backend chmod +x /app/scripts/entrypoint-prod.sh
docker compose restart backend
```

---

## 📊 Deployment Comparison

### Before Fixes (❌ Would Fail)
```
User starts production deployment
  ↓
Docker Compose starts services
  ↓
Backend container starts → Runs gunicorn immediately
  ↓
FastAPI app initializes → Tries to connect to database
  ↓
❌ ERROR: relation "users" does not exist
  ↓
❌ Container crashes
```

### After Fixes (✅ Works Correctly)
```
User starts production deployment
  ↓
Docker Compose starts services
  ↓
Backend container starts → Runs entrypoint script
  ↓
Entrypoint runs: alembic upgrade head
  ↓
✅ All database tables created/updated
  ↓
Entrypoint runs: gunicorn with uvicorn workers
  ↓
✅ FastAPI app starts successfully
  ↓
✅ Health check passes
  ↓
✅ API ready to serve requests
```

---

## 🔐 Security Considerations

### Environment Variables

**Never commit these to git**:
- `POSTGRES_PASSWORD`: Strong random password (min 16 chars)
- `SECRET_KEY`: Strong random key for JWT signing (min 32 chars)
- `PGADMIN_PASSWORD`: Strong password for PgAdmin access

**Generate secure values**:
```bash
# Generate POSTGRES_PASSWORD
openssl rand -base64 32

# Generate SECRET_KEY
openssl rand -hex 32

# Generate PGADMIN_PASSWORD
openssl rand -base64 24
```

### SecretVM Specific

- All TLS certificates are stored in `/mnt/secure/cert/`
- Traefik automatically handles HTTPS with certificates
- Services (postgres, redis) are NOT exposed to public internet
- Only backend is exposed via Traefik at `api.sapphire-finch.vm.scrtlabs.com`

---

## 📝 Version History

### Version 0.2.0 (Current)
**Release Date**: October 2024
**Changes**:
- ✅ Added production entrypoint script with database migrations
- ✅ Updated Dockerfile and Dockerfile.secretvm to use entrypoint
- ✅ Fixed PostgreSQL health checks in all compose files
- ✅ Fixed bcrypt version compatibility (use bcrypt 4.x)
- ✅ Added email-validator and web3 dependencies
- ✅ Improved logging and error messages

**Breaking Changes**: None - backward compatible

**Migration Notes**: No manual migration needed. Deployment will automatically:
1. Run all pending database migrations
2. Update to latest dependencies
3. Start with improved monitoring

### Version 0.1.0 (Initial)
**Release Date**: September 2024
**Features**:
- Basic authentication (Email/Password, MetaMask)
- Multi-tenancy (Organizations, Workspaces)
- Chatbot management
- Docker deployment

**Known Issues** (Fixed in 0.2.0):
- ❌ Production Dockerfiles didn't run migrations
- ❌ bcrypt 5.x compatibility issue
- ❌ Missing some dependencies

---

## 🎯 Quick Command Reference

```bash
# Local Development
cd backend
docker compose -f docker-compose.dev.yml up          # Start dev environment
docker compose -f docker-compose.dev.yml down        # Stop dev environment
docker compose -f docker-compose.dev.yml logs -f backend-dev  # Watch logs

# Production Build
./scripts/docker/build-push.sh 0.2.0                 # Build and push new image

# Local Production Testing
docker compose -f docker-compose.yml up              # Start production locally
docker compose -f docker-compose.yml down            # Stop production
docker logs -f privexbot-backend                     # Watch backend logs
curl http://localhost:8000/health                    # Test health endpoint

# SecretVM Deployment
./scripts/docker/secretvm-deploy.sh prepare          # Create deployment bundle
./scripts/docker/secretvm-deploy.sh show             # Show deployment info
./scripts/docker/secretvm-deploy.sh test             # Test SecretVM deployment

# Database Management
docker exec -it privexbot-backend alembic current    # Check current migration
docker exec -it privexbot-backend alembic upgrade head  # Run migrations
docker exec -it privexbot-postgres psql -U privexbot -d privexbot  # Connect to DB

# Container Management
docker ps                                            # List running containers
docker logs <container_name>                         # View container logs
docker exec -it <container_name> bash                # Enter container shell
docker compose restart <service_name>                # Restart specific service
```

---

## 📚 Related Documentation

- **PRODUCTION_DEPLOYMENT_ISSUES.md**: Detailed analysis of all issues found
- **LOGGING_ISSUES_RESOLVED.md**: Documentation of log errors and fixes
- **scripts/docker/README.md**: Deployment scripts documentation
- **CLAUDE.md**: Project architecture and development guide

---

## ✅ Deployment Readiness Checklist

Before deploying to production, ensure:

- [ ] All fixes have been applied (verified by reading this document)
- [ ] New image has been built with version 0.2.0
- [ ] docker-compose.yml has been updated with new image digest
- [ ] docker-compose.secretvm.yml has been updated with new image digest
- [ ] Local testing completed successfully
- [ ] .env file prepared with secure passwords and keys
- [ ] SecretVM TLS certificates are in place
- [ ] Backup plan in place (database backups, rollback procedure)
- [ ] Monitoring configured (health checks, log aggregation)

---

**Document Version**: 1.0
**Last Updated**: October 2024
**Status**: ✅ Ready for Production Deployment
**Next Action**: Build new image with `./scripts/docker/build-push.sh 0.2.0`
