# PrivexBot Backend - Docker Deployment Guide

Complete guide for deploying the FastAPI backend in development, production, and SecretVM environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development Environment](#development-environment)
- [Production Deployment](#production-deployment)
- [SecretVM Deployment](#secretvm-deployment)
- [Environment Configuration](#environment-configuration)
- [Helper Scripts](#helper-scripts)
- [Database Management](#database-management)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have:

1. **Docker Engine** (v20.10+)
   ```bash
   docker --version
   ```

2. **Docker Compose** (v2.0+)
   ```bash
   docker compose version
   ```

3. **Docker Hub Account** (for production deployments)
   ```bash
   docker login
   ```

**Quick Check:**
```bash
./scripts/docker/check.sh
```

## Quick Start

### Development (Recommended for local testing)

```bash
# Start all services (backend, PostgreSQL, Redis)
./scripts/docker/dev.sh up

# Access:
# - API: http://localhost:8000
# - Docs: http://localhost:8000/api/docs
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379
```

### Production

```bash
# Build and push to Docker Hub
./scripts/docker/build-push.sh 0.1.0

# Update docker-compose.yml with digest
# Deploy
docker compose up -d
```

## Development Environment

### Starting the Development Environment

```bash
./scripts/docker/dev.sh up
```

This starts:
- **Backend (FastAPI)** on port 8000 with hot reload
- **PostgreSQL 16** on port 5432
- **Redis 7** on port 6379
- **Celery Worker** for background tasks (requires celery to be added to dependencies)

### Development Features

**Hot Reload:**
- Changes to `src/` automatically reload the server
- No container rebuild needed for code changes

**Volume Mounts:**
```yaml
volumes:
  - ./src:/app/src                    # Source code
  - ./pyproject.toml:/app/pyproject.toml
  - ./uv.lock:/app/uv.lock
```

**Database Access:**
```bash
# Access PostgreSQL shell
./scripts/docker/dev.sh db

# Run migrations
./scripts/docker/dev.sh migrate
```

**Container Shell:**
```bash
# Access backend container shell
./scripts/docker/dev.sh shell

# Inside container, you can:
python -m pytest              # Run tests
ipython                       # Interactive Python
alembic upgrade head          # Run migrations
```

### Development Workflow

1. **Start environment:**
   ```bash
   ./scripts/docker/dev.sh up
   ```

2. **Make code changes** in `src/`
   - Changes automatically reload

3. **Test your changes:**
   ```bash
   curl http://localhost:8000/health
   curl http://localhost:8000/api/v1/status
   ```

4. **View logs:**
   ```bash
   ./scripts/docker/dev.sh logs
   ```

5. **Stop environment:**
   ```bash
   ./scripts/docker/dev.sh down
   ```

### Rebuilding Containers

If you modify `Dockerfile.dev`, `pyproject.toml`, or `uv.lock`:

```bash
./scripts/docker/dev.sh build
./scripts/docker/dev.sh restart
```

Or rebuild and start:
```bash
docker compose -f docker-compose.dev.yml up --build
```

## Production Deployment

### Build and Push Image

```bash
# Build version 0.1.0
./scripts/docker/build-push.sh 0.1.0
```

This script:
1. Validates version format (semver)
2. Builds production Docker image
3. Tags as both `0.1.0` and `latest`
4. Pushes to Docker Hub (`harystyles/privexbot-backend`)
5. Extracts image digest for SecretVM deployment

**Output:**
```
Image: harystyles/privexbot-backend:0.1.0
Digest: sha256:abc123...
```

### Update docker-compose.yml

Replace the placeholder digest in `docker-compose.yml`:

```yaml
services:
  backend:
    image: harystyles/privexbot-backend@sha256:ACTUAL_DIGEST_HERE
```

### Configure Environment

1. **Copy environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env`:**
   ```bash
   # IMPORTANT: Change these values!
   POSTGRES_PASSWORD=STRONG_PASSWORD_HERE
   SECRET_KEY=RANDOM_SECRET_KEY_HERE
   BACKEND_CORS_ORIGINS=https://yourdomain.com
   ```

3. **Generate secure secret key:**
   ```python
   python3 -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

### Deploy

```bash
# Start all services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f backend

# Test
curl http://localhost:8000/health
```

### Production Architecture

```
┌─────────────────────────────────────┐
│         Docker Compose              │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────┐  ┌─────────────┐ │
│  │   Backend    │  │  PostgreSQL │ │
│  │   (FastAPI)  │──│     16      │ │
│  │   Port 8000  │  │  Port 5432  │ │
│  └──────┬───────┘  └─────────────┘ │
│         │                           │
│         │          ┌─────────────┐ │
│         └──────────│   Redis 7   │ │
│                    │  Port 6379  │ │
│                    └─────────────┘ │
│                                     │
│  ┌──────────────┐                  │
│  │Celery Worker │                  │
│  │(Background)  │                  │
│  └──────────────┘                  │
│                                     │
└─────────────────────────────────────┘
```

## SecretVM Deployment

SecretVM provides a trusted execution environment for confidential computation on Secret Network.

> **📚 For complete SecretVM deployment guide, see [SECRETVM_DEPLOYMENT.md](./SECRETVM_DEPLOYMENT.md)**
>
> This guide includes:
> - Detailed configuration steps
> - Helper script usage
> - Testing procedures
> - Troubleshooting common issues
> - Maintenance and backup procedures

### Quick Start

**Network**: `67.43.239.18` / `harystyles.store`

```bash
# 1. Prepare deployment
./scripts/docker/secretvm-deploy.sh prepare

# 2. Update .env.secretvm.local with your credentials

# 3. Deploy
./scripts/docker/secretvm-deploy.sh deploy

# 4. Test
./scripts/docker/secretvm-deploy.sh test
```

### Prerequisites

1. **SecretVM Access** with Secret Network
2. **Domain**: `harystyles.store` (IP: `67.43.239.18`)
3. **TLS Certificates** mounted at `/mnt/secure/cert/`
4. **SSH Access**: `ssh root@67.43.239.18`

### Build and Push

```bash
# Build and push with digest
./scripts/docker/build-push.sh 0.1.0
```

Copy the full digest output:
```
harystyles/privexbot-backend@sha256:abc123def456...
```

### Update docker-compose.secretvm.yml

Replace the digest in all services:

```yaml
services:
  backend:
    image: harystyles/privexbot-backend@sha256:ACTUAL_DIGEST_HERE
```

### Environment Configuration

1. **Copy template:**
   ```bash
   cp .env.example .env
   ```

2. **Configure for SecretVM:**
   ```bash
   # Production settings
   ENVIRONMENT=production

   # IMPORTANT: Strong passwords
   POSTGRES_PASSWORD=VERY_STRONG_PASSWORD
   SECRET_KEY=RANDOM_SECRET_KEY

   # SecretVM domain
   BACKEND_CORS_ORIGINS=https://harystyles.store,https://api.harystyles.store
   ```

### TLS Certificate Setup

SecretVM mounts TLS certificates at `/mnt/secure/cert/`:

```bash
/mnt/secure/cert/
├── secret_vm_fullchain.pem  # Full certificate chain
└── secret_vm_private.pem    # Private key
```

Traefik automatically loads these certificates (configured in `docker-compose.secretvm.yml`).

### Deploy to SecretVM

```bash
# Upload files to SecretVM
scp docker-compose.secretvm.yml user@secretvm:/app/
scp .env user@secretvm:/app/

# SSH into SecretVM
ssh user@secretvm

# Deploy
cd /app
docker compose -f docker-compose.secretvm.yml up -d

# Verify
docker compose -f docker-compose.secretvm.yml ps
docker compose -f docker-compose.secretvm.yml logs -f
```

### SecretVM Architecture

```
┌───────────────────────────────────────────────┐
│              SecretVM Environment             │
├───────────────────────────────────────────────┤
│                                               │
│  Internet (HTTPS)                             │
│       │                                       │
│       ↓                                       │
│  ┌─────────────────┐     Traefik Network     │
│  │    Traefik      │                          │
│  │  (Port 80/443)  │                          │
│  │  TLS Termination│                          │
│  └────────┬────────┘                          │
│           │                                   │
│           ↓         Backend Network           │
│  ┌─────────────────┐                          │
│  │   Backend API   │                          │
│  │   (Port 8000)   │                          │
│  └────────┬────────┘                          │
│           │                                   │
│      ┌────┴─────┐                             │
│      │          │                             │
│  ┌───▼───┐  ┌──▼─────┐                        │
│  │ PostgreSQL│  Redis│                        │
│  │ (5432) │  │ (6379)│                        │
│  └────────┘  └───────┘                        │
│                                               │
└───────────────────────────────────────────────┘
```

### Routing

Traefik handles:
- **HTTP → HTTPS** redirect
- **TLS Termination** with SecretVM certificates
- **Routing** to backend service

Access:
- **API**: `https://api.silver-hedgehog.vm.scrtlabs.com`
- **Docs**: `https://api.silver-hedgehog.vm.scrtlabs.com/api/docs`

## Environment Configuration

### Development (.env.dev)

```bash
PROJECT_NAME=PrivexBot
ENVIRONMENT=development
DEBUG=true

# Database (matches docker-compose.dev.yml)
DATABASE_URL=postgresql://privexbot:privexbot_dev@postgres:5432/privexbot_dev
POSTGRES_PASSWORD=privexbot_dev

# Redis
REDIS_URL=redis://redis:6379/0

# JWT (weak key for dev only)
SECRET_KEY=dev-secret-key-not-for-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# CORS (allow frontend dev servers)
BACKEND_CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173

# Celery
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2
```

### Production (.env)

```bash
PROJECT_NAME=PrivexBot
ENVIRONMENT=production
DEBUG=false

# Database - USE STRONG PASSWORD!
DATABASE_URL=postgresql://privexbot:CHANGE_PASSWORD@postgres:5432/privexbot
POSTGRES_PASSWORD=CHANGE_PASSWORD

# Redis
REDIS_URL=redis://redis:6379/0

# JWT - GENERATE NEW SECRET!
SECRET_KEY=CHANGE_TO_RANDOM_SECRET_KEY
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS - YOUR PRODUCTION DOMAIN
BACKEND_CORS_ORIGINS=https://yourdomain.com,https://api.yourdomain.com

# Celery
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2
```

### Security Best Practices

1. **Never commit `.env` files** (already in `.gitignore`)
2. **Generate strong secrets:**
   ```bash
   # PostgreSQL password (32 chars)
   openssl rand -base64 32

   # JWT secret key (64 chars)
   python3 -c "import secrets; print(secrets.token_urlsafe(64))"
   ```

3. **Restrict CORS origins** to your actual domains
4. **Use environment-specific settings** (dev vs prod)
5. **Rotate secrets regularly** in production

## Helper Scripts

### check.sh - Prerequisites Checker

```bash
./scripts/docker/check.sh
```

Verifies:
- Docker installation and version
- Docker Compose availability
- Docker daemon status
- Docker Hub login
- Required files exist

### dev.sh - Development Helper

```bash
./scripts/docker/dev.sh COMMAND
```

**Commands:**

| Command | Description |
|---------|-------------|
| `up` | Start development environment |
| `down` | Stop development environment |
| `restart` | Restart backend service |
| `logs` | View backend logs (follow mode) |
| `build` | Rebuild backend container |
| `clean` | Stop and remove containers/volumes |
| `shell` | Access backend container shell |
| `db` | Access PostgreSQL shell |
| `migrate` | Run database migrations |
| `test` | Run tests inside container |

**Examples:**
```bash
# Start dev environment
./scripts/docker/dev.sh up

# View real-time logs
./scripts/docker/dev.sh logs

# Access database
./scripts/docker/dev.sh db

# Run migrations
./scripts/docker/dev.sh migrate

# Clean everything (prompts for confirmation)
./scripts/docker/dev.sh clean
```

### build-push.sh - Build & Deploy

```bash
./scripts/docker/build-push.sh VERSION
```

**Version Format:**
- Semver: `X.Y.Z` (e.g., `0.1.0`, `1.2.3`)
- With tag: `X.Y.Z-tag` (e.g., `0.1.0-rc.1`)

**What it does:**
1. Validates version format
2. Builds production image
3. Tags with version and `latest`
4. Pushes to Docker Hub
5. Extracts digest for SecretVM

**Example:**
```bash
# Build version 0.1.0
./scripts/docker/build-push.sh 0.1.0

# Build release candidate
./scripts/docker/build-push.sh 0.2.0-rc.1
```

## Database Management

### Accessing PostgreSQL

**Development:**
```bash
# Using helper script
./scripts/docker/dev.sh db

# Direct access
docker compose -f docker-compose.dev.yml exec postgres \
  psql -U privexbot -d privexbot_dev
```

**Production:**
```bash
docker compose exec postgres \
  psql -U privexbot -d privexbot
```

### Running Migrations

**Development:**
```bash
# Using helper script
./scripts/docker/dev.sh migrate

# Direct command
docker compose -f docker-compose.dev.yml exec backend-dev \
  alembic upgrade head
```

**Production:**
```bash
docker compose exec backend \
  alembic upgrade head
```

### Creating Migrations

```bash
# Access container
./scripts/docker/dev.sh shell

# Inside container
alembic revision --autogenerate -m "Description of changes"
alembic upgrade head
```

### Database Backups

**Backup:**
```bash
docker compose exec postgres \
  pg_dump -U privexbot privexbot > backup_$(date +%Y%m%d).sql
```

**Restore:**
```bash
cat backup_20241009.sql | docker compose exec -T postgres \
  psql -U privexbot -d privexbot
```

## Troubleshooting

### Container Won't Start

**Check logs:**
```bash
docker compose logs backend
docker compose -f docker-compose.dev.yml logs backend-dev
```

**Common issues:**
- **Port already in use**: Stop other services on ports 8000, 5432, 6379
  ```bash
  lsof -i :8000
  kill -9 PID
  ```
- **Image build failed**: Clear cache and rebuild
  ```bash
  docker compose build --no-cache
  ```

### Database Connection Errors

**Error:** `connection refused`

**Solutions:**
1. Check PostgreSQL is healthy:
   ```bash
   docker compose ps
   ```
2. Wait for health check:
   ```bash
   docker compose logs postgres
   ```
3. Verify DATABASE_URL in `.env`

**Error:** `authentication failed`

**Solution:** Check POSTGRES_PASSWORD matches in:
- `.env` file
- `docker-compose.yml` postgres environment

### CORS Errors from Frontend

**Error:** `No 'Access-Control-Allow-Origin' header`

**Solutions:**
1. Check BACKEND_CORS_ORIGINS in `.env`:
   ```bash
   BACKEND_CORS_ORIGINS=http://localhost:5173,http://localhost:3000
   ```
2. Restart backend:
   ```bash
   ./scripts/docker/dev.sh restart
   ```
3. Verify in logs:
   ```bash
   docker compose logs backend | grep CORS
   ```

### Hot Reload Not Working

**Issue:** Code changes don't reload

**Solutions:**
1. Check volume mounts:
   ```bash
   docker compose -f docker-compose.dev.yml config
   ```
2. Ensure using `Dockerfile.dev` (not production)
3. Check uvicorn is running with `--reload`:
   ```bash
   docker compose logs backend-dev | grep reload
   ```

### Permission Errors

**Error:** `Permission denied` accessing files

**Solution:** Fix file ownership
```bash
sudo chown -R $USER:$USER .
```

### Container Health Check Failing

**Check health status:**
```bash
docker compose ps
# Look for "unhealthy" status
```

**View health check logs:**
```bash
docker inspect CONTAINER_NAME | grep -A 10 Health
```

**Common fixes:**
1. Backend not responding on port 8000
2. Health endpoint failing
3. Increase health check timeout in compose file

### Celery Worker Issues

**Error:** `celery: executable file not found`

**Solution:** Add celery to `pyproject.toml`:
```toml
dependencies = [
    "celery[redis]>=5.3.0",
    # ... other dependencies
]
```

Then rebuild:
```bash
./scripts/docker/dev.sh build
./scripts/docker/dev.sh up
```

### Clean Slate Restart

If all else fails:

```bash
# Stop everything
docker compose down -v
docker compose -f docker-compose.dev.yml down -v

# Remove images
docker rmi backend-backend-dev backend-celery-worker

# Rebuild and start
./scripts/docker/dev.sh build
./scripts/docker/dev.sh up
```

## Testing Endpoints

### Health Check
```bash
curl http://localhost:8000/health
# Expected: {"status":"healthy","service":"privexbot-backend","version":"0.1.0"}
```

### API Status
```bash
curl http://localhost:8000/api/v1/status
# Shows environment, CORS origins, service status
```

### Interactive API Docs
```bash
open http://localhost:8000/api/docs
# Swagger UI for testing all endpoints
```

### CORS Test from Frontend
```javascript
// From your frontend app
fetch('http://localhost:8000/api/v1/test', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ test: 'data' }),
})
.then(res => res.json())
.then(data => console.log(data))
// Should work without CORS errors
```

## Monitoring

### View Logs

**All services:**
```bash
docker compose logs -f
```

**Specific service:**
```bash
docker compose logs -f backend
docker compose logs -f postgres
docker compose logs -f redis
```

**Last N lines:**
```bash
docker compose logs --tail=100 backend
```

### Resource Usage

```bash
docker stats
```

Shows CPU, memory, network usage for all containers.

### Health Status

```bash
docker compose ps
```

Look for:
- **Up** status
- **healthy** in STATUS column
- Correct port mappings

## Versioning Strategy

Following semantic versioning (semver):

### Pre-Launch (MVP Phase)
- **0.x.x** versions (e.g., 0.1.0, 0.2.0, 0.3.0)
- Breaking changes allowed
- Rapid iteration

### Official Launch
- **1.0.0** - First production release
- **1.x.x** - Backward compatible features
- **2.x.x** - Breaking changes

### Examples
```bash
# MVP development
./scripts/docker/build-push.sh 0.1.0    # Initial version
./scripts/docker/build-push.sh 0.2.0    # Added features
./scripts/docker/build-push.sh 0.3.0-rc.1  # Release candidate

# Production
./scripts/docker/build-push.sh 1.0.0    # Official launch
./scripts/docker/build-push.sh 1.1.0    # New features
./scripts/docker/build-push.sh 1.1.1    # Bug fixes
./scripts/docker/build-push.sh 2.0.0    # Major update
```

## Next Steps

1. **Development**: Start with `./scripts/docker/dev.sh up`
2. **Add Features**: Develop in `src/app/`
3. **Database**: Set up Alembic migrations
4. **Authentication**: Implement JWT + wallet auth
5. **API Routes**: Build your endpoints
6. **Testing**: Add tests with pytest
7. **Production**: Build and deploy with `build-push.sh`
8. **SecretVM**: Deploy to confidential environment

## Additional Resources

- **FastAPI Docs**: https://fastapi.tiangolo.com
- **Docker Docs**: https://docs.docker.com
- **PostgreSQL**: https://www.postgresql.org/docs
- **Redis**: https://redis.io/docs
- **Celery**: https://docs.celeryproject.org
- **Alembic**: https://alembic.sqlalchemy.org
- **Secret Network**: https://docs.scrt.network

## Support

For issues or questions:
1. Check this documentation
2. Review container logs
3. Verify environment configuration
4. Try clean restart
5. Check Docker Hub for image availability

---

**Version**: 0.1.0
**Last Updated**: 2025-10-09
