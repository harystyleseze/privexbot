# SecretVM Production Deployment Guide

Complete guide for deploying PrivexBot Backend to SecretVM with Traefik reverse proxy.

## Table of Contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Network Configuration](#network-configuration)
- [Deployment Steps](#deployment-steps)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Maintenance](#maintenance)

---

## Overview

SecretVM is a Trusted Execution Environment (TEE) that provides confidential computation for sensitive workloads. This deployment includes:

- **Backend API**: FastAPI application with Gunicorn + Uvicorn workers
- **PostgreSQL 16**: Database for persistent storage
- **Redis 7**: In-memory cache and session store
- **PgAdmin**: Web-based PostgreSQL administration
- **Redis Commander**: Web-based Redis administration
- **Traefik v2.10**: Reverse proxy with automatic HTTPS

### Architecture

```
Internet (HTTPS)
       ↓
  Traefik (TLS Termination)
       ↓
  ┌────────────────────────┐
  │   traefik network      │
  ├────────────────────────┤
  │ - Backend API          │
  │ - PostgreSQL (internal)│
  │ - Redis (internal)     │
  │ - PgAdmin              │
  │ - Redis Commander      │
  └────────────────────────┘
```

---

## Prerequisites

### Local Machine Requirements

1. **Docker & Docker Compose**
   ```bash
   docker --version  # 20.10+ required
   docker compose version  # v2.0+ required
   ```

2. **Docker Hub Account** (for pushing images)
   ```bash
   docker login
   ```

3. **Required Tools**
   ```bash
   # Install if not available
   brew install curl jq  # macOS
   apt-get install curl jq  # Linux
   ```

4. **SecretVM Dev Portal Access**
   - Access to SecretVM development portal
   - Ability to upload compose files and .env files

### SecretVM Platform Requirements

1. **SSL Certificates**
   - SecretVM platform automatically mounts certificates at `/mnt/secure/cert/`
   - Files: `secret_vm_fullchain.pem` and `secret_vm_private.pem`

2. **Platform manages**:
   - Docker Engine and Docker Compose
   - Certificate mounting
   - Container orchestration
   - Service networking

---

## Network Configuration

### SecretVM Details
- **IP Address**: `67.43.239.18`
- **Base Domain**: `sapphire-finch.vm.scrtlabs.com`

### Subdomains (All with HTTPS)
| Service | Subdomain | Port | Purpose |
|---------|-----------|------|---------|
| Backend API | `api.sapphire-finch.vm.scrtlabs.com` | 8000 | FastAPI application |
| PgAdmin | `pgadmin.sapphire-finch.vm.scrtlabs.com` | 80 | Database admin |
| Redis UI | `redis-ui.sapphire-finch.vm.scrtlabs.com` | 8081 | Redis admin |
| Traefik | `traefik.sapphire-finch.vm.scrtlabs.com` | 8080 | Traefik dashboard |

### DNS Configuration (Required)

Ensure these DNS A records point to `67.43.239.18`:
```
api.sapphire-finch.vm.scrtlabs.com      → 67.43.239.18
pgadmin.sapphire-finch.vm.scrtlabs.com  → 67.43.239.18
redis-ui.sapphire-finch.vm.scrtlabs.com → 67.43.239.18
traefik.sapphire-finch.vm.scrtlabs.com  → 67.43.239.18
```

---

## Deployment Steps

### Step 1: Build and Push Docker Image

1. **Build and push the production image**
   ```bash
   ./scripts/docker/build-push.sh 0.1.0
   ```

2. **Copy the image digest from output**
   ```
   Image: harystyles/privexbot-backend@sha256:9fb3b1d1152e5965f8b0c22a7cc9f317a6564edae257bc208a8c9516e330608b
   ```

3. **Update `docker-compose.secretvm.yml` with the digest**
   ```yaml
   services:
     backend:
       image: harystyles/privexbot-backend@sha256:YOUR_DIGEST_HERE
   ```

### Step 2: Prepare Environment Configuration

1. **Create `.env` file from template**
   ```bash
   cp .env.secretvm .env.secretvm.local
   ```

2. **Update critical values in `.env.secretvm.local`**
   ```bash
   # Generate strong PostgreSQL password
   POSTGRES_PASSWORD=$(openssl rand -base64 32)

   # Generate strong JWT secret
   SECRET_KEY=$(openssl rand -hex 32)

   # Generate strong PgAdmin password
   PGADMIN_PASSWORD=$(openssl rand -base64 24)

   # Update CORS origins with your frontend domain
   BACKEND_CORS_ORIGINS=https://sapphire-finch.vm.scrtlabs.com,https://api.sapphire-finch.vm.scrtlabs.com,https://app.yourdomain.com
   ```

3. **Prepare .env for upload**
   ```bash
   ./scripts/docker/secretvm-deploy.sh prepare
   ```

   This creates `deploy/secretvm/.env` ready for upload.

### Step 3: Deploy to SecretVM Dev Portal

1. **Get the docker-compose.yml content**
   ```bash
   ./scripts/docker/secretvm-deploy.sh show
   ```

   This displays the complete `docker-compose.secretvm.yml` content for copying.

2. **Copy and paste to SecretVM Dev Portal**
   - Copy the entire docker-compose.yml content from terminal
   - Go to SecretVM Dev Portal (https://secretvm-portal-url)
   - Paste the content into the compose file field

3. **Upload .env file**
   - In SecretVM Dev Portal, upload `deploy/secretvm/.env`

4. **Deploy on SecretVM Platform**
   - Click "Deploy" button in the portal
   - SecretVM platform pulls the image and starts all services
   - Wait for deployment to complete

### Step 4: Verify Deployment

```bash
# Test all endpoints
./scripts/docker/secretvm-deploy.sh test
```

**Expected results:**
```
✅ Backend API health  - https://api.sapphire-finch.vm.scrtlabs.com/health
✅ Backend API status  - https://api.sapphire-finch.vm.scrtlabs.com/api/v1/status
✅ PgAdmin accessible  - https://pgadmin.sapphire-finch.vm.scrtlabs.com
✅ Redis UI accessible - https://redis-ui.sapphire-finch.vm.scrtlabs.com
✅ Traefik accessible  - https://traefik.sapphire-finch.vm.scrtlabs.com
```

---

## Testing

### Automated Testing

```bash
# Run all endpoint tests
./scripts/docker/secretvm-deploy.sh test
```

### Manual Testing

1. **Backend API Health**
   ```bash
   curl -k https://api.sapphire-finch.vm.scrtlabs.com/health
   # Expected: {"status": "healthy", "service": "privexbot-backend", "version": "0.1.0"}
   ```

2. **Backend API Status**
   ```bash
   curl -k https://api.sapphire-finch.vm.scrtlabs.com/api/v1/status
   # Expected: Environment, CORS, database info
   ```

3. **CORS Test** (from your frontend domain)
   ```bash
   curl -k -X POST https://api.sapphire-finch.vm.scrtlabs.com/api/v1/test \
     -H "Content-Type: application/json" \
     -H "Origin: https://app.yourdomain.com" \
     -d '{"test": "cors"}' \
     -v
   # Check for: Access-Control-Allow-Origin in response headers
   ```

4. **PgAdmin** (Browser)
   ```
   https://pgadmin.sapphire-finch.vm.scrtlabs.com
   Email: admin@scrtlabs.com
   Password: [from your .env PGADMIN_PASSWORD]
   ```

5. **Redis Commander** (Browser)
   ```
   https://redis-ui.sapphire-finch.vm.scrtlabs.com
   ```

6. **Traefik Dashboard** (Browser)
   ```
   https://traefik.sapphire-finch.vm.scrtlabs.com
   ```

### Expected Results

All services should return:
- **HTTP 200 OK** status
- **Valid HTTPS** certificate (not self-signed)
- **CORS headers** present when accessing from frontend domain
- **No 404, 502, 503 errors**

---

## Troubleshooting

### Issue: 404 Not Found

**Symptoms**: `curl https://api.sapphire-finch.vm.scrtlabs.com/health` returns 404

**Possible Causes**:
1. Traefik not routing correctly
2. Backend container not running
3. DNS not configured

**Solutions**:
```bash
# Check Traefik logs
ssh root@67.43.239.18
cd /mnt/secure/docker_wd
docker compose logs traefik

# Check backend container
docker compose ps backend
docker compose logs backend

# Verify DNS
nslookup api.sapphire-finch.vm.scrtlabs.com
# Should return 67.43.239.18
```

### Issue: 502 Bad Gateway

**Symptoms**: Traefik returns 502

**Possible Causes**:
1. Backend container unhealthy
2. Backend not listening on correct port
3. Network connectivity issue

**Solutions**:
```bash
# Check backend health
docker compose exec backend curl http://localhost:8000/health

# Check backend logs for errors
docker compose logs backend --tail=100

# Restart backend
docker compose restart backend
```

### Issue: 503 Service Unavailable

**Symptoms**: Traefik returns 503

**Possible Causes**:
1. Backend container not started
2. Health check failing
3. Dependency not ready (postgres/redis)

**Solutions**:
```bash
# Check all container status
docker compose ps

# Check startup order
docker compose logs postgres redis backend

# Check health checks
docker inspect privexbot-backend-secretvm | grep -A 10 Health

# Restart with proper ordering
docker compose down
docker compose up -d
```

### Issue: CORS Errors

**Symptoms**: Browser console shows CORS policy error

**Possible Causes**:
1. Frontend domain not in CORS origins
2. CORS middleware not configured

**Solutions**:
```bash
# Check current CORS config
curl -k https://api.sapphire-finch.vm.scrtlabs.com/api/v1/status | jq '.cors_origins'

# Update .env on SecretVM
ssh root@67.43.239.18
cd /mnt/secure/docker_wd
nano .env
# Add your frontend domain to BACKEND_CORS_ORIGINS

# Restart backend
docker compose restart backend
```

### Issue: SSL Certificate Error

**Symptoms**: `curl: (60) SSL certificate problem`

**Possible Causes**:
1. Certificates not mounted correctly
2. Certificates expired
3. Certificate paths incorrect in Traefik config

**Solutions**:
```bash
# Check certificates exist
ssh root@67.43.239.18
ls -la /mnt/secure/cert/

# Check Traefik can access certs
docker compose exec traefik ls -la /certs/

# Check certificate validity
openssl x509 -in /mnt/secure/cert/secret_vm_fullchain.pem -noout -dates

# Restart Traefik
docker compose restart traefik
```

### Issue: Database Connection Failed

**Symptoms**: Backend logs show "database connection failed"

**Possible Causes**:
1. PostgreSQL not ready
2. Wrong credentials
3. Network issue

**Solutions**:
```bash
# Check postgres is running
docker compose ps postgres

# Test connection from backend
docker compose exec backend psql -h postgres -U privexbot -d privexbot -c "SELECT version();"
# Enter password from POSTGRES_PASSWORD

# Check postgres logs
docker compose logs postgres

# Restart postgres
docker compose restart postgres
```

---

## Maintenance

### Viewing Logs

View logs through the SecretVM Dev Portal interface, or if you have access to the platform's logging system.

### Updating Backend Version

1. **Build and push new version**
   ```bash
   ./scripts/docker/build-push.sh 0.2.0
   ```

2. **Update `docker-compose.secretvm.yml` with new digest**
   ```yaml
   backend:
     image: harystyles/privexbot-backend@sha256:NEW_DIGEST_HERE
   ```

3. **Show updated compose file**
   ```bash
   ./scripts/docker/secretvm-deploy.sh show
   ```

4. **Copy and paste to SecretVM Dev Portal**
   - Update the compose file in the portal
   - Redeploy from the portal

### Database Backup

Use SecretVM platform tools or PgAdmin interface at `https://pgadmin.sapphire-finch.vm.scrtlabs.com` to:
- Export database backups
- Schedule automated backups
- Download backup files

### Database Restore

Use PgAdmin interface to restore from backup files.

### Scaling Workers

To increase backend workers:

1. **Edit `docker-compose.secretvm.yml` locally**
   ```yaml
   # Update CMD in backend service (currently 4 workers)
   # Change --workers 4 to --workers 8
   ```

2. **Show updated compose file**
   ```bash
   ./scripts/docker/secretvm-deploy.sh show
   ```

3. **Update in SecretVM Dev Portal and redeploy**

---

## Security Best Practices

### 1. Secrets Management
- ✅ Never commit `.env` files to git
- ✅ Use strong random passwords (32+ characters)
- ✅ Rotate secrets regularly (every 90 days)
- ✅ Use environment variables, not hardcoded values

### 2. Network Security
- ✅ Only expose necessary ports (80, 443)
- ✅ Use Traefik for TLS termination
- ✅ Keep database and redis internal (no Traefik routing)
- ✅ Configure CORS strictly (only allowed domains)

### 3. Container Security
- ✅ Run containers as non-root user (backend uses appuser)
- ✅ Use digest pinning for immutable deployments
- ✅ Keep images updated regularly
- ✅ Scan images for vulnerabilities

### 4. Access Control
- ✅ Restrict SSH access to SecretVM
- ✅ Use strong passwords for PgAdmin/Redis UI
- ✅ Consider IP whitelisting for admin interfaces
- ✅ Enable Traefik dashboard authentication in production

---

## Quick Reference

### Helper Script Commands
```bash
./scripts/docker/build-push.sh 0.1.0         # Build and push image
./scripts/docker/secretvm-deploy.sh prepare  # Prepare .env file
./scripts/docker/secretvm-deploy.sh show     # Display compose file for portal
./scripts/docker/secretvm-deploy.sh test     # Test all endpoints
```

### Deployment Workflow
```bash
# 1. Build and push
./scripts/docker/build-push.sh 0.1.0

# 2. Update digest in docker-compose.secretvm.yml

# 3. Prepare .env
./scripts/docker/secretvm-deploy.sh prepare

# 4. Get compose file content
./scripts/docker/secretvm-deploy.sh show

# 5. Copy & paste to SecretVM Dev Portal

# 6. Upload deploy/secretvm/.env to portal

# 7. Deploy from portal

# 8. Test
./scripts/docker/secretvm-deploy.sh test
```

### Endpoints
```bash
# Backend API
https://api.sapphire-finch.vm.scrtlabs.com/health
https://api.sapphire-finch.vm.scrtlabs.com/api/v1/status
https://api.sapphire-finch.vm.scrtlabs.com/api/docs

# Admin Interfaces
https://pgadmin.sapphire-finch.vm.scrtlabs.com
https://redis-ui.sapphire-finch.vm.scrtlabs.com
https://traefik.sapphire-finch.vm.scrtlabs.com
```

---

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section above
2. Review container logs for errors
3. Verify DNS and SSL certificate configuration
4. Check SecretVM documentation

**SecretVM Network**: `67.43.239.18` / `sapphire-finch.vm.scrtlabs.com`
