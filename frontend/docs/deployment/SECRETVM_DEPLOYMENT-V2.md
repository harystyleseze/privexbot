# SecretVM Deployment Guide

This guide explains how to deploy the PrivexBot frontend to SecretVM production environment.

## Overview

**Important**: SecretVM does not provide SSH/terminal access. All deployments are done via:
1. Building Docker images locally
2. Pushing to Docker Hub
3. Copy-pasting docker-compose.yml into SecretVM web interface

## Production Configuration

- **Domain**: https://harystyles.store
- **API Backend**: https://api.harystyles.store/api/v1
- **Docker Image**: harystyles/privexbot-frontend
- **Environment**: Production (VITE_ENV=production)

## Environment Variables

Environment variables are **baked into the build** at compile time. The `.env.secretvm` file is copied to `.env.production` during the Docker build process.

**File**: `.env.secretvm`
```bash
VITE_API_BASE_URL=https://api.harystyles.store/api/v1
VITE_ENV=production
VITE_APP_NAME=PrivexBot
VITE_APP_VERSION=0.0.1
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=false
```

**Critical**: These values are embedded in the JavaScript bundle during `npm run build` and cannot be changed at runtime.

## Deployment Workflow

### Step 1: Build and Push Image

Use the enhanced build script with `--secretvm` flag:

```bash
cd frontend
./scripts/docker/build-push.sh 0.0.2 --secretvm
```

**What this does**:
1. Builds using `Dockerfile.secretvm` (not regular `Dockerfile`)
2. Copies `.env.secretvm` to `.env.production` during build
3. Runs `npm run build` which embeds environment variables
4. Pushes image to `harystyles/privexbot-frontend:0.0.2`
5. **Automatically updates** `docker-compose.secretvm.yml` with new digest
6. Outputs deployment instructions

**Flags**:
- `--secretvm`: Use SecretVM Dockerfile and auto-update docker-compose
- `--force`: Skip version confirmation prompts (for CI/CD)

**Example with force mode**:
```bash
./scripts/docker/build-push.sh 0.0.2 --secretvm --force
```

### Step 2: Verify Environment Variables

After build completes, verify the correct API URL is embedded:

```bash
# Test the built image locally
docker run --rm -d -p 8888:80 --name test-frontend harystyles/privexbot-frontend:0.0.2

# Check if production API URL is in the bundle
docker exec test-frontend sh -c 'cat /usr/share/nginx/html/assets/*.js' | grep -o "https://api.harystyles.store/api/v1"

# Should output: https://api.harystyles.store/api/v1

# Verify localhost is NOT in bundle (should output 0)
docker exec test-frontend sh -c 'cat /usr/share/nginx/html/assets/*.js' | grep -c "http://localhost:8000" || echo "0 (correct!)"

# Clean up test container
docker stop test-frontend
```

### Step 3: Commit Updated docker-compose.secretvm.yml

The build script automatically updated `docker-compose.secretvm.yml` with the new digest:

```bash
git add docker-compose.secretvm.yml
git commit -m "Update SecretVM deployment to v0.0.2"
git push
```

### Step 4: Deploy to SecretVM

Since SecretVM has no SSH access:

1. **Open** `docker-compose.secretvm.yml` in your editor
2. **Copy** the entire file contents
3. **Navigate** to SecretVM deployment web interface
4. **Paste** the docker-compose.yml content
5. **Deploy** via web interface

The compose file already contains:
- ✅ Traefik routing for `harystyles.store`
- ✅ TLS/SSL configuration
- ✅ Health checks
- ✅ Production image digest (updated by build script)

## Troubleshooting

### Issue: Frontend shows localhost API URL in production

**Symptom**: Console shows `API_BASE_URL: 'http://localhost:8000/api/v1'` on production

**Cause**: Environment variables not embedded during build

**Solution**:
1. Verify `.env.secretvm` has correct values
2. Ensure `Dockerfile.secretvm` copies `.env.secretvm` to `.env.production`
3. Rebuild with `--no-cache`: The build script already uses `--no-cache` by default
4. Verify the build used Dockerfile.secretvm (check build logs for "Building SecretVM Docker image")

### Issue: CORS errors in production

**Symptom**: `Access to XMLHttpRequest blocked by CORS policy`

**Causes**:
1. Frontend trying to connect to localhost instead of production API
2. Backend CORS not configured for `https://harystyles.store`

**Solutions**:
1. Verify frontend is using correct API URL (see verification steps above)
2. Ensure backend `BACKEND_CORS_ORIGINS` includes `https://harystyles.store`

### Issue: Environment shows "unknown" instead of "production"

**Cause**: Wrong environment variable name

**Fix**: Ensure `.env.secretvm` uses `VITE_ENV=production` (NOT `VITE_ENVIRONMENT`)

## File Structure

```
frontend/
├── .env.secretvm              # SecretVM production env vars
├── Dockerfile.secretvm        # Production build Dockerfile
├── docker-compose.secretvm.yml # Deployment configuration
├── nginx.conf                 # Nginx config (SPA routing, health checks)
├── vite.config.ts            # Vite automatically loads VITE_* vars
└── scripts/
    └── docker/
        └── build-push.sh      # Enhanced build script with --secretvm flag
```

## How Vite Environment Variables Work

1. **Build Time**: Vite reads `.env.production` during `npm run build`
2. **Replacement**: All `import.meta.env.VITE_*` references are replaced with actual values
3. **Result**: Values are **hardcoded** into the JavaScript bundle
4. **Runtime**: No way to change these values - they're compiled in

**Example**:
```typescript
// Source code (auth.ts)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

// After build (compiled)
const API_BASE_URL = "https://api.harystyles.store/api/v1";
```

## Security Notes

1. **No Runtime Env Injection**: Unlike backend, frontend env vars are baked in at build time
2. **Public Exposure**: All VITE_* variables are visible in browser bundle (don't put secrets!)
3. **Image Digests**: Use SHA256 digests in docker-compose for immutable deployments
4. **TLS Certificates**: Mounted from `/mnt/secure/cert` on SecretVM host

## Version Management

Follow semantic versioning:
- `0.x.x`: MVP/prelaunch versions
- `0.x.x-rc.N`: Release candidates
- `1.0.0`: Official launch version (reserved)
- `1.x.x+`: Post-launch versions

## Quick Reference

**Build for SecretVM**:
```bash
./scripts/docker/build-push.sh 0.0.2 --secretvm --force
```

**Verify build**:
```bash
docker run --rm -p 8888:80 harystyles/privexbot-frontend:0.0.2
# Open http://localhost:8888 and check console for API_BASE_URL
```

**Deploy**:
1. Copy `docker-compose.secretvm.yml` contents
2. Paste in SecretVM web interface
3. Click Deploy

## Changes Made to Fix localhost → Production Issue

### Issue
Production frontend connected to `http://localhost:8000/api/v1` instead of `https://api.harystyles.store/api/v1`

### Root Causes
1. **Environment variable name mismatch**: `.env.secretvm` had `VITE_ENVIRONMENT=production` but code expected `VITE_ENV`
2. **Vite config interference**: `define` section in vite.config.ts was conflicting with Vite's automatic env loading

### Fixes Applied
1. **Updated `.env.secretvm`**: Changed `VITE_ENVIRONMENT` → `VITE_ENV`
2. **Simplified `vite.config.ts`**: Removed `define` section, let Vite auto-load VITE_* variables
3. **Enhanced `build-push.sh`**: Added `--secretvm` flag and auto-update of docker-compose
4. **Added `--no-cache`**: Ensures fresh build picks up env changes

### Result
✅ Production build now correctly uses `https://api.harystyles.store/api/v1`
✅ CORS errors resolved
✅ Environment shows "production" instead of "unknown"
