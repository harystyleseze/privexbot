# Docker Guide - PrivexBot Frontend

Complete guide for dockerizing and deploying the PrivexBot frontend application for both development and production environments, including SecretVM deployment.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Project Structure](#project-structure)
4. [Development Environment](#development-environment)
5. [Production Build](#production-build)
6. [Deployment](#deployment)
7. [SecretVM Deployment](#secretvm-deployment)
8. [Versioning](#versioning)
9. [CI/CD with GitHub Actions](#cicd-with-github-actions)
10. [Troubleshooting](#troubleshooting)
11. [Best Practices](#best-practices)

---

## Overview

The PrivexBot frontend uses a **dual Docker setup**:

- **Development**: Hot-reload enabled, volume-mounted source code, dev dependencies
- **Production**: Multi-stage build, Nginx web server, minimal image size, runtime configuration

### Key Features

- ✅ **Multi-stage builds** for minimal production images
- ✅ **Runtime configuration** - same image works across environments
- ✅ **SecretVM compatible** - digest-pinned, immutable images
- ✅ **Hot reload** in development
- ✅ **Automated CI/CD** with GitHub Actions
- ✅ **Semantic versioning** for MVP and production releases

---

## Prerequisites

### Required

- **Docker** (20.10+)
- **Docker Compose** (2.0+)
- **Node.js** (20+) - for local development only
- **Git** - for version control

### Optional

- **Docker Hub account** - for pushing images (username: `harystyles`)
- **GitHub account** - for CI/CD automation

### Installation

#### macOS/Windows
```bash
# Install Docker Desktop
# Download from: https://www.docker.com/products/docker-desktop
```

#### Linux
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
```

### Verification

```bash
# Check your environment
cd frontend
./scripts/docker/check.sh
```

---

## Project Structure

```
frontend/
├── Dockerfile                  # Production Dockerfile (multi-stage)
├── Dockerfile.dev              # Development Dockerfile
├── docker-compose.dev.yml      # Development Compose file
├── docker-compose.prod.yml     # Production Compose file
├── nginx.conf                  # Nginx configuration for SPA
├── .dockerignore               # Files to exclude from Docker context
├── scripts/
│   └── docker/
│       ├── build-push.sh       # Build and push production image
│       ├── dev.sh              # Development environment management
│       ├── check.sh            # Environment verification
│       └── README.md           # Scripts documentation
├── src/                        # Application source code
├── public/
│   └── config.js               # Runtime configuration placeholder
└── package.json
```

---

## Development Environment

### Quick Start

```bash
# 1. Start development environment
./scripts/docker/dev.sh up

# 2. Access application
# Browser: http://localhost:5173

# 3. Make changes to src/ files
# Changes auto-reload in browser

# 4. View logs
./scripts/docker/dev.sh logs

# 5. Stop environment
./scripts/docker/dev.sh down
```

### Development Commands

```bash
# Start (build + run in background)
./scripts/docker/dev.sh up

# Start (foreground with logs)
docker compose -f docker-compose.dev.yml up --build

# Stop
./scripts/docker/dev.sh down

# Restart
./scripts/docker/dev.sh restart

# View logs
./scripts/docker/dev.sh logs

# Rebuild (clean slate)
./scripts/docker/dev.sh build

# Open shell in container
./scripts/docker/dev.sh shell

# Clean up everything
./scripts/docker/dev.sh clean
```

### How It Works

The development setup uses:
- **Base image**: `node:20-alpine`
- **Port**: 5173 (Vite dev server)
- **Volume mount**: Your local `src/` folder is mounted, changes reflect immediately
- **Hot reload**: Vite watches for changes and updates browser

**Configuration**: `docker-compose.dev.yml`
```yaml
services:
  frontend-dev:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "5173:5173"
    volumes:
      - .:/app              # Mount source code
      - /app/node_modules   # Preserve container's node_modules
```

### Environment Variables (Development)

Create `.env.local` in `frontend/` directory:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_WIDGET_CDN_URL=http://localhost:8080
VITE_ENV=development
```

---

## Production Build

### Overview

Production builds use a **multi-stage Dockerfile**:

1. **Stage 1 (Builder)**: Build static files with Node.js
2. **Stage 2 (Production)**: Serve with Nginx

### Build Process

```bash
# Build and push to Docker Hub
./scripts/docker/build-push.sh 0.1.0

# Output example:
╔════════════════════════════════════════════════════════════════╗
║                  IMAGE DIGEST (PRODUCTION)                     ║
╠════════════════════════════════════════════════════════════════╣
║  image: harystyles/privexbot-frontend@sha256:abc123...        ║
╚════════════════════════════════════════════════════════════════╝
```

### What Happens

1. ✅ Checks prerequisites (Docker running, logged in)
2. ✅ Validates version format
3. ✅ Builds multi-stage Docker image
4. ✅ Pushes to Docker Hub
5. ✅ Outputs digest for deployment

### Build Script Features

- **Semantic version validation**
- **Pre-build checks** (Docker installed, daemon running, logged in)
- **Multi-tag push** (version tag + latest)
- **Digest extraction** for immutable deployments
- **Color-coded output** for clarity

---

## Deployment

### Local Production Testing

```bash
# 1. Build image
./scripts/docker/build-push.sh 0.1.0

# 2. Copy digest from output

# 3. Update docker-compose.prod.yml
# Replace <digest> with actual digest

# 4. Run locally
docker compose -f docker-compose.prod.yml up -d

# 5. Access at http://localhost:80
```

### Environment Variables (Production)

Production uses **runtime configuration** via environment variables:

```yaml
# docker-compose.prod.yml
services:
  frontend-prod:
    image: harystyles/privexbot-frontend@sha256:...
    environment:
      - API_BASE_URL=https://api.privexbot.com/api/v1
      - WIDGET_CDN_URL=https://cdn.privexbot.com
      - ENVIRONMENT=production
```

These variables are injected into `/config.js` at container startup, allowing the same Docker image to work in different environments.

### How Runtime Config Works

1. **Build time**: Static files are compiled
2. **Container startup**: Entrypoint script generates `/config.js`
3. **Runtime**: Frontend reads `window.ENV_CONFIG` from config.js
4. **Benefit**: Same image for staging, production, etc.

**Example generated config.js:**
```javascript
window.ENV_CONFIG = {
  API_BASE_URL: "https://api.privexbot.com/api/v1",
  WIDGET_CDN_URL: "https://cdn.privexbot.com",
  ENVIRONMENT: "production"
};
```

---

## SecretVM Deployment

### Requirements

SecretVM has specific requirements for Docker deployments:

❗ **No `build:` directive** - Only pre-built images allowed
❗ **No `:latest` tag** - Must use digest pinning
❗ **Immutability** - Images must be reproducible and verifiable

### SecretVM-Ready Compose File

```yaml
version: "3.8"

services:
  frontend-prod:
    # ✅ Use digest, not :latest
    image: harystyles/privexbot-frontend@sha256:abc123...

    # ❌ No build directive
    # build: ...  # NOT ALLOWED

    ports:
      - "80:80"

    environment:
      - API_BASE_URL=https://api.example.com/api/v1
      - WIDGET_CDN_URL=https://cdn.example.com
      - ENVIRONMENT=production

    restart: unless-stopped
```

### Deployment Steps for SecretVM

1. **Build locally** or via CI:
   ```bash
   ./scripts/docker/build-push.sh 0.1.0
   ```

2. **Get digest** from output:
   ```
   harystyles/privexbot-frontend@sha256:abc123...
   ```

3. **Update docker-compose.prod.yml** with digest

4. **Upload to SecretVM**:
   - Via SecretVM Portal: Upload `docker-compose.prod.yml`
   - Via CLI: Follow SecretVM documentation

5. **Verify deployment**:
   - Check SecretVM dashboard
   - Verify attestation
   - Test application URL

### Why Digest Pinning?

- **Immutability**: Same digest = same code, always
- **Verifiability**: SecretVM can verify the exact image
- **Security**: Prevents image tampering
- **Reproducibility**: Deterministic deployments

---

## Versioning

### Semantic Versioning Strategy

We use **semantic versioning** with special consideration for MVP/prelaunch:

```
MAJOR.MINOR.PATCH[-PRERELEASE]

Examples:
  0.1.0         - First MVP version
  0.2.0         - Second MVP iteration
  0.3.0-rc.1    - Release candidate
  1.0.0         - Official launch (RESERVED)
  1.1.0         - Post-launch update
```

### Version Categories

| Version Range | Stage | Example | Description |
|--------------|-------|---------|-------------|
| `0.x.x` | MVP/Prelaunch | `0.1.0`, `0.5.0` | Not production-ready |
| `0.x.x-rc.N` | Release Candidate | `0.9.0-rc.1` | Testing before launch |
| `1.0.0` | **Official Launch** | `1.0.0` | **RESERVED** for official launch |
| `1.x.x+` | Production | `1.1.0`, `2.0.0` | Post-launch versions |

### Version Guidelines

- **Before launch**: Use `0.x.x` versions
- **Release candidates**: Use `-rc.N` suffix
- **Official launch**: Use `1.0.0` (script will warn you)
- **Post-launch**: Increment according to changes

### Versioning Script Protection

The `build-push.sh` script warns when using `1.0.0+`:

```bash
./scripts/docker/build-push.sh 1.0.0

⚠  Version 1.0.0 is >= 1.0.0 (official launch version)
Are you sure you want to use this version? (yes/no):
```

---

## CI/CD with GitHub Actions

### Automated Build and Push

The GitHub Actions workflow automatically builds and pushes images when you push to `main` or `dev` branches.

**Location**: `.github/workflows/frontend-docker.yml`

### Workflow Triggers

- **Push to `main`**: Build and tag as production
- **Push to `dev`**: Build and tag as development
- **Manual trigger**: Via GitHub Actions UI

### Workflow Steps

1. Checkout code
2. Login to Docker Hub
3. Setup Docker Buildx
4. Build and push image
5. Extract digest
6. Output digest in logs

### Required Secrets

Configure these in GitHub repository settings:

| Secret Name | Value | Description |
|------------|-------|-------------|
| `DOCKER_USERNAME` | `harystyles` | Docker Hub username |
| `DOCKER_PASSWORD` | `<your-token>` | Docker Hub access token |

### Setting Up Secrets

1. Go to GitHub repository
2. Settings → Secrets and variables → Actions
3. New repository secret
4. Add `DOCKER_USERNAME` and `DOCKER_PASSWORD`

### Workflow Output

After workflow completes:
1. Check Actions tab in GitHub
2. Find the build job
3. Look for "Output digest" step
4. Copy digest and update `docker-compose.prod.yml`

---

## Troubleshooting

### Common Issues

#### 1. Docker daemon not running

**Error**: `Cannot connect to the Docker daemon`

**Solution**:
```bash
# macOS/Windows: Start Docker Desktop

# Linux:
sudo systemctl start docker
```

#### 2. Not logged in to Docker Hub

**Error**: `denied: requested access to the resource is denied`

**Solution**:
```bash
docker login
# Username: harystyles
# Password: <your-token>
```

#### 3. Port already in use

**Error**: `Bind for 0.0.0.0:5173 failed: port is already allocated`

**Solution**:
```bash
# Find what's using the port
lsof -i :5173

# Kill the process or change port in docker-compose.dev.yml
```

#### 4. Changes not reflecting in dev

**Issue**: Code changes don't show in browser

**Solutions**:
```bash
# 1. Restart development environment
./scripts/docker/dev.sh restart

# 2. Clear browser cache and hard reload
# Chrome/Firefox: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows/Linux)

# 3. Rebuild from scratch
./scripts/docker/dev.sh clean
./scripts/docker/dev.sh up
```

#### 5. Build fails with "npm install" error

**Issue**: Dependency installation fails

**Solutions**:
```bash
# 1. Clear npm cache
docker compose -f docker-compose.dev.yml run --rm frontend-dev npm cache clean --force

# 2. Delete node_modules and package-lock.json, rebuild
rm -rf node_modules package-lock.json
npm install
./scripts/docker/dev.sh build
```

#### 6. Can't push to Docker Hub

**Error**: `denied: requested access to the resource is denied`

**Solutions**:
```bash
# 1. Verify login
docker login

# 2. Check username matches
docker info | grep Username
# Should show: Username: harystyles

# 3. If wrong username, logout and login again
docker logout
docker login
```

### Debug Mode

Enable verbose output:

```bash
# Development
docker compose -f docker-compose.dev.yml up --build

# Production build
docker build --no-cache --progress=plain -f Dockerfile .
```

---

## Best Practices

### Security

✅ **Never bake secrets into images**
- Use environment variables
- Use Docker secrets or external secret management

✅ **Use digest pinning in production**
- Not `:latest` tag
- Use `@sha256:...` digest

✅ **Minimize image size**
- Multi-stage builds
- Alpine base images
- `.dockerignore` file

✅ **Security headers in Nginx**
- X-Frame-Options
- X-Content-Type-Options
- CSP headers

### Performance

✅ **Layer caching**
- Copy `package.json` before source code
- Order Dockerfile commands strategically

✅ **Compression**
- Enable gzip in Nginx
- Optimize static assets

✅ **Caching strategy**
- Long-term cache for hashed assets
- No cache for index.html

### Development

✅ **Use volume mounts** for hot reload
✅ **Separate dev and prod configs**
✅ **Environment-specific settings**
✅ **Git ignore `.docker-digest`, `node_modules`**

### Deployment

✅ **Pin images by digest** (especially for SecretVM)
✅ **Test locally before deploying**
✅ **Use health checks**
✅ **Monitor logs after deployment**
✅ **Keep old digests for rollback**

### Versioning

✅ **Follow semantic versioning**
✅ **Tag Git commits** with version
✅ **Document changes** in CHANGELOG
✅ **Reserve 1.0.0** for official launch

---

## Quick Reference

### Common Commands

```bash
# Development
./scripts/docker/dev.sh up           # Start
./scripts/docker/dev.sh down         # Stop
./scripts/docker/dev.sh logs         # View logs

# Production
./scripts/docker/build-push.sh 0.1.0 # Build and push
docker compose -f docker-compose.prod.yml up -d  # Deploy

# Utilities
./scripts/docker/check.sh            # Check environment
docker ps                            # List containers
docker images                        # List images
docker logs <container>              # View logs
```

### File Locations

- **Development Dockerfile**: `Dockerfile.dev`
- **Production Dockerfile**: `Dockerfile`
- **Dev Compose**: `docker-compose.dev.yml`
- **Prod Compose**: `docker-compose.prod.yml`
- **Nginx Config**: `nginx.conf`
- **Scripts**: `scripts/docker/`
- **Runtime Config**: `public/config.js` (dev) / `/usr/share/nginx/html/config.js` (prod)

### Ports

- **Development**: 5173
- **Production**: 80

### Docker Hub

- **Repository**: `harystyles/privexbot-frontend`
- **Tags**: Version tags (e.g., `0.1.0`) + `latest`
- **Registry**: Docker Hub

---

## Support

### Documentation

- **Scripts README**: `scripts/docker/README.md`
- **Main README**: `../README.md`
- **CLAUDE.md**: `../CLAUDE.md` (for AI assistance)

### Issues

- GitHub Issues: Report bugs and feature requests
- Docker Docs: https://docs.docker.com
- Vite Docs: https://vitejs.dev
- Nginx Docs: https://nginx.org/en/docs

---

## Summary

✅ **Development**: `./scripts/docker/dev.sh up` → http://localhost:5173
✅ **Production**: `./scripts/docker/build-push.sh 0.1.0` → Update compose → Deploy
✅ **SecretVM**: Use digest pinning, no `:latest`, no `build:`
✅ **Versioning**: `0.x.x` for MVP, `1.0.0` for launch
✅ **CI/CD**: GitHub Actions automates builds on push

**Need help?** Run `./scripts/docker/check.sh` to verify your setup!
