# SecretVM Frontend Deployment Guide

## Overview

This guide explains how to deploy the PrivexBot frontend to SecretVM using Docker and Traefik for SSL termination.

**Domain Configuration:**
- Frontend: `https://harystyles.store`
- Backend API: `https://api.harystyles.store`
- IP Address: `67.43.239.18`

## Architecture

```
Internet → Traefik (443) → Frontend Container (80)
                         → Backend Container (8000)
```

- **Traefik**: Reverse proxy with automatic SSL
- **Frontend**: Nginx serving static React build
- **Backend**: FastAPI application

## Files Overview

### 1. `nginx.conf`
Nginx configuration for serving the SPA:
- Serves static files from `/usr/share/nginx/html`
- SPA fallback routing (all routes → `index.html`)
- Gzip compression
- Cache headers for static assets
- Security headers
- Health check endpoint at `/health`

### 2. `.env.secretvm`
SecretVM-specific environment variables:
```bash
VITE_API_BASE_URL=https://api.harystyles.store/api/v1
VITE_ENVIRONMENT=production
VITE_APP_NAME=PrivexBot
```

**CRITICAL**: Vite bakes these into the build at compile time!

### 3. `Dockerfile.secretvm`
Multi-stage Docker build:
1. **Build stage**: Compiles React app with `.env.secretvm` → `.env.production`
2. **Production stage**: Serves with Nginx

### 4. `docker-compose.secretvm.yml`
Orchestrates frontend + Traefik with:
- SSL/TLS termination
- Health checks
- Automatic container restart
- Traefik routing rules

### 5. `vite.config.ts`
Vite configuration with:
- Environment-based build configuration
- Explicit environment variable definitions
- Build optimization

## Build Process

### Step 1: Build Docker Image

```bash
cd frontend

# Build the image with SecretVM config
docker build -f Dockerfile.secretvm -t harystyles/privexbot-frontend:latest .

# Tag with specific version
docker tag harystyles/privexbot-frontend:latest harystyles/privexbot-frontend:1.0.0

# Push to Docker Hub
docker push harystyles/privexbot-frontend:latest
docker push harystyles/privexbot-frontend:1.0.0

# Get the SHA256 digest
docker inspect --format='{{index .RepoDigests 0}}' harystyles/privexbot-frontend:latest
```

### Step 2: Update docker-compose.secretvm.yml

Update the image digest in `docker-compose.secretvm.yml`:
```yaml
services:
  frontend:
    image: harystyles/privexbot-frontend@sha256:<NEW_SHA256_HERE>
```

### Step 3: Deploy to SecretVM

```bash
# SSH into SecretVM
ssh root@67.43.239.18

# Create deployment directory
mkdir -p /mnt/secure/docker_wd/frontend
cd /mnt/secure/docker_wd/frontend

# Upload docker-compose.secretvm.yml
# (Use scp or copy content manually)

# Pull latest image
docker compose pull

# Start services
docker compose up -d

# Check status
docker compose ps
docker compose logs -f frontend

# Verify health
curl http://localhost:80/health
```

## Environment Variables in Vite

### How Vite Handles Environment Variables

**Build Time (Compile Time):**
- Vite reads `.env` files during `npm run build`
- Values are **baked into the JavaScript bundle**
- Cannot be changed without rebuilding

**Runtime:**
- No environment variable injection at container startup
- All config must be set before build

### Environment File Precedence

Vite loads files in this order (later overrides earlier):
1. `.env` - All environments
2. `.env.local` - All environments, git-ignored
3. `.env.[mode]` - Specific mode only
4. `.env.[mode].local` - Specific mode, git-ignored

For production build: `.env.production` is used

## Deployment Checklist

### Pre-Deployment

- [ ] Update `.env.secretvm` with correct API URL
- [ ] Verify `harystyles.store` DNS points to `67.43.239.18`
- [ ] Ensure SSL certificates exist at `/mnt/secure/cert/` on SecretVM
- [ ] Verify backend is running at `api.harystyles.store`

### Build & Push

- [ ] Build Docker image with `Dockerfile.secretvm`
- [ ] Push to Docker Hub
- [ ] Get SHA256 digest
- [ ] Update `docker-compose.secretvm.yml` with new digest

### Deploy

- [ ] Upload `docker-compose.secretvm.yml` to SecretVM
- [ ] Pull latest image
- [ ] Start containers with `docker compose up -d`
- [ ] Verify health check: `curl http://localhost:80/health`
- [ ] Test frontend: `https://harystyles.store`
- [ ] Test API connectivity from frontend

### Post-Deployment

- [ ] Check browser console for errors
- [ ] Verify API calls work (Network tab)
- [ ] Test wallet authentication flows
- [ ] Check Traefik dashboard: `https://traefik.harystyles.store`

## Troubleshooting

### Frontend shows wrong API URL

**Cause**: Environment variables baked at build time
**Fix**: Rebuild image with updated `.env.secretvm`

### CORS errors in browser

**Cause**: Backend CORS configuration
**Fix**: Update backend `.env` to include `https://harystyles.store` in `BACKEND_CORS_ORIGINS`

### SSL certificate errors

**Cause**: Missing or invalid certificates
**Fix**: Ensure certificates exist at `/mnt/secure/cert/` and are valid

### Container not starting

```bash
# Check logs
docker compose logs frontend

# Inspect container
docker inspect privexbot-frontend-secretvm

# Check health
docker compose ps
```

### Traefik routing issues

```bash
# Check Traefik logs
docker compose logs traefik

# Verify Traefik sees the service
docker compose config

# Check network
docker network ls
docker network inspect traefik
```

## Testing Locally

You can test the SecretVM build locally:

```bash
# Build with SecretVM config
docker build -f Dockerfile.secretvm -t privexbot-frontend:test .

# Run locally
docker run -p 8080:80 privexbot-frontend:test

# Test
curl http://localhost:8080/health
open http://localhost:8080
```

**Note**: API calls will fail unless you update `.env.secretvm` to point to `http://localhost:8000/api/v1`

## Security Considerations

1. **HTTPS Only**: Always use HTTPS in production
2. **Security Headers**: Set in `nginx.conf`
3. **Environment Variables**: Never commit secrets (use `.env.*.local` or Docker secrets)
4. **Image Digests**: Use SHA256 digests for immutable deployments
5. **Health Checks**: Monitor container health

## Updating the Deployment

To update the frontend:

1. Make code changes
2. Update `.env.secretvm` if needed
3. Build new image
4. Push to Docker Hub
5. Update digest in `docker-compose.secretvm.yml`
6. SSH to SecretVM
7. Run `docker compose pull && docker compose up -d`

Docker Compose will automatically:
- Pull the new image
- Recreate the container
- Keep zero downtime with health checks

## Monitoring

### Health Check

```bash
# Local health check
docker exec privexbot-frontend-secretvm wget -O - http://localhost:80/health

# External health check
curl https://harystyles.store/health
```

### Logs

```bash
# Follow logs
docker compose logs -f frontend

# Last 100 lines
docker compose logs --tail 100 frontend

# Filter by time
docker compose logs --since 10m frontend
```

### Metrics

```bash
# Container stats
docker stats privexbot-frontend-secretvm

# Traefik dashboard
open https://traefik.harystyles.store
```

## Rollback

If deployment fails:

```bash
# Revert to previous image
# Update docker-compose.secretvm.yml with old SHA256 digest

docker compose pull
docker compose up -d

# Or use specific version
docker pull harystyles/privexbot-frontend:1.0.0
# Update compose file with 1.0.0 tag
docker compose up -d
```

## References

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Traefik Docker Provider](https://doc.traefik.io/traefik/providers/docker/)
- [Nginx Configuration](https://nginx.org/en/docs/)
