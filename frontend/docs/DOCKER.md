# Docker Deployment Guide

Complete guide for deploying the PrivexBot Frontend using Docker across different environments.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Environment Setup](#environment-setup)
5. [Semantic Versioning Strategy](#semantic-versioning-strategy)
6. [Development Deployment](#development-deployment)
7. [Standalone Production Deployment](#standalone-production-deployment)
8. [SecretVM Deployment](#secretvm-deployment)
9. [Building Images](#building-images)
10. [CI/CD & GitHub Actions](#cicd--github-actions)
11. [Development Workflow](#development-workflow)
12. [Troubleshooting](#troubleshooting)
13. [Best Practices](#best-practices)

---

## Overview

The frontend supports three deployment modes:

| Mode | Use Case | Files | Features |
|------|----------|-------|----------|
| **Development** | Local development with hot reload | `docker-compose.dev.yml`<br>`Dockerfile.dev` | Hot reload, volume mounts, dev server |
| **Standalone Production** | Simple production deployment | `docker-compose.yml`<br>`Dockerfile` | Nginx, optimized build, no reverse proxy |
| **SecretVM Production** | Secure VM deployment with TLS | `docker-compose.secretvm.yml`<br>`Dockerfile.secretvm` | Traefik reverse proxy, TLS termination, digest pinning |

---

## Architecture

### Development Architecture

```
┌─────────────────────────────────┐
│   Developer Machine             │
│  ┌─────────────────────────┐   │
│  │  Docker Container        │   │
│  │  ┌──────────────────┐   │   │
│  │  │  Vite Dev Server  │   │   │
│  │  │  Port: 5173       │   │   │
│  │  │  Hot Reload ✓     │   │   │
│  │  └──────────────────┘   │   │
│  │  Volume: ./src ← src/   │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

### Standalone Production Architecture

```
┌─────────────────────────────────┐
│   Production Server              │
│  ┌─────────────────────────┐   │
│  │  Docker Container        │   │
│  │  ┌──────────────────┐   │   │
│  │  │  Nginx            │   │   │
│  │  │  Port: 80         │   │   │
│  │  │  Static Files     │   │   │
│  │  └──────────────────┘   │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
         ↓
    User Browser
```

### SecretVM Production Architecture

```
┌──────────────────────────────────────────┐
│   SecretVM (/mnt/secure/docker_wd/)      │
│                                           │
│  ┌────────────────────────────────────┐ │
│  │  Traefik (Reverse Proxy)            │ │
│  │  Ports: 80, 443                     │ │
│  │  TLS: /mnt/secure/cert/*.pem        │ │
│  └────────────────────────────────────┘ │
│           ↓ (traefik network)            │
│  ┌────────────────────────────────────┐ │
│  │  Frontend App                       │ │
│  │  Port: 8080 (internal)              │ │
│  │  Image: digest-pinned               │ │
│  │  Nginx serving static files         │ │
│  └────────────────────────────────────┘ │
└──────────────────────────────────────────┘
         ↓ HTTPS
    User Browser
```

---

## Prerequisites

### General Requirements

- **Docker**: v20.10+
- **Docker Compose**: v2.0+
- **Node.js**: v20+ (for local builds)
- **npm**: v9+

### For SecretVM Deployment

- SecretVM account with access to VM
- TLS certificates in `/mnt/secure/cert/`:
  - `secret_vm_fullchain.pem`
  - `secret_vm_private.pem`
- SSH access to SecretVM
- Domain configured to point to SecretVM IP

### Verify Installation

```bash
# Check Docker
docker --version
# Expected: Docker version 20.10.x or higher

# Check Docker Compose
docker compose version
# Expected: Docker Compose version v2.x.x

# Check Node.js (for local builds)
node --version
# Expected: v20.x.x

# Check npm
npm --version
# Expected: 9.x.x or higher
```

---

## Environment Setup

### Environment Files

The project uses environment files for configuration:

```
frontend/
├── .env.example              # Production environment template
├── .env.dev.example          # Development environment template
├── .env                      # Production environment (git-ignored)
└── .env.dev                  # Development environment (git-ignored)
```

### Create Environment Files

```bash
# Copy example files
cp .env.example .env
cp .env.dev.example .env.dev

# Edit with your values
vim .env
vim .env.dev
```

### Environment Variables

**Production (`.env`)**:
```bash
NODE_ENV=production
API_BASE_URL=https://api.privexbot.com/api/v1
WIDGET_CDN_URL=https://cdn.privexbot.com
ENVIRONMENT=production
```

**Development (`.env.dev`)**:
```bash
NODE_ENV=development
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_WIDGET_CDN_URL=http://localhost:8080
```

---

## Semantic Versioning Strategy

PrivexBot follows a **strict semantic versioning strategy** to manage releases:

### Version Format

```
MAJOR.MINOR.PATCH
```

- **MAJOR**: Breaking changes, incompatible API changes (reserved for official launch)
- **MINOR**: New features, backwards-compatible functionality
- **PATCH**: Bug fixes, backwards-compatible patches

### Version Ranges

| Version Range | Stage | Purpose | Examples |
|--------------|-------|---------|----------|
| **0.x.x** | **Pre-launch/MVP** | Development and testing before official release | 0.1.0, 0.2.0, 0.5.3 |
| **1.0.0** | **Official Launch** | First stable production release | Reserved for launch day |
| **1.x.x** | **Post-launch** | Production features and updates | 1.1.0, 1.2.0, 1.2.1 |

### Current Version Policy

**⚠️ Version 1.0.0 is RESERVED for official product launch**

All pre-launch development uses **0.x.x** versions:
- Start at `0.1.0` for first MVP release
- Increment MINOR for new features: `0.1.0` → `0.2.0`
- Increment PATCH for bug fixes: `0.2.0` → `0.2.1`

### Version Workflow

#### 1. Development

```bash
# Feature branch
git checkout -b feature/new-feature

# Make changes
# ...

# Commit and push
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature
```

#### 2. Versioning & Release

```bash
# Determine version based on changes
# - New feature: increment MINOR (0.1.0 → 0.2.0)
# - Bug fix: increment PATCH (0.2.0 → 0.2.1)

# Build and push with version tag
./scripts/docker/build-push.sh 0.2.0

# This will:
# - Build Docker image
# - Tag as harystyles/privexbot-frontend:0.2.0
# - Push to Docker Hub
# - Output digest for deployment
```

#### 3. Update Deployment Files

After building, update the digest in deployment files:

**For standalone production (`docker-compose.yml`)**:
```yaml
services:
  frontend:
    image: harystyles/privexbot-frontend@sha256:NEW_DIGEST_HERE
```

**For SecretVM (`docker-compose.secretvm.yml`)**:
```yaml
services:
  app:
    image: harystyles/privexbot-frontend@sha256:NEW_DIGEST_HERE
```

#### 4. Deploy

```bash
# Standalone production
docker compose pull
docker compose up -d

# SecretVM (on VM)
cd /mnt/secure/docker_wd/
docker compose down
docker pull harystyles/privexbot-frontend@sha256:NEW_DIGEST
docker compose up -d
```

### Version Tagging Best Practices

1. **Always use digest pinning in production**:
   ```yaml
   # ✅ Good - immutable
   image: harystyles/privexbot-frontend@sha256:abc123...

   # ❌ Bad - mutable, can change
   image: harystyles/privexbot-frontend:0.2.0
   image: harystyles/privexbot-frontend:latest
   ```

2. **Tag conventions**:
   - Version tags for Docker Hub: `0.1.0`, `0.2.0`, `0.2.1`
   - Git tags: `v0.1.0`, `v0.2.0`, `v0.2.1`

3. **Changelog maintenance**:
   - Keep CHANGELOG.md updated with each version
   - Document breaking changes clearly
   - Note migration steps for major updates

### Example Version Timeline

```
0.1.0  → Initial MVP release
0.1.1  → Bug fix: credential selector
0.2.0  → New feature: workflow builder
0.2.1  → Bug fix: deployment webhook
0.3.0  → New feature: analytics dashboard
...
1.0.0  → 🚀 OFFICIAL LAUNCH
1.0.1  → Bug fix: minor UI issue
1.1.0  → New feature: advanced analytics
```

---

## Development Deployment

For local development with hot reload.

### Quick Start

```bash
# Start development server
docker compose -f docker-compose.dev.yml up

# Or use the helper script
./scripts/docker/dev.sh up
```

### Development Commands

```bash
# Start in detached mode
docker compose -f docker-compose.dev.yml up -d

# View logs
docker compose -f docker-compose.dev.yml logs -f

# Stop services
docker compose -f docker-compose.dev.yml down

# Rebuild and start
docker compose -f docker-compose.dev.yml up --build
```

### Access Points

- **Frontend**: http://localhost:5173
- **Hot Reload**: ✅ Enabled (changes reflect immediately)

### Development Features

- ✅ **Hot Module Replacement (HMR)**: Changes reflect instantly
- ✅ **Volume Mounts**: Code changes sync to container
- ✅ **Source Maps**: Full debugging support
- ✅ **Fast Refresh**: React Fast Refresh enabled

---

## Standalone Production Deployment

Simple production deployment without reverse proxy.

### Build and Push Image

```bash
# Build and push to Docker Hub
./scripts/docker/build-push.sh 0.0.1

# Or manually
docker build -t harystyles/privexbot-frontend:0.0.1 .
docker push harystyles/privexbot-frontend:0.0.1
```

### Deploy

```bash
# Start production service
docker compose up -d

# View logs
docker compose logs -f frontend

# Stop service
docker compose down
```

### Update Image Digest

After building a new image, update `docker-compose.yml`:

```yaml
services:
  frontend:
    image: harystyles/privexbot-frontend@sha256:YOUR_NEW_DIGEST
```

Get the digest from build output or:
```bash
docker inspect harystyles/privexbot-frontend:0.0.1 | grep -i digest
```

### Access Points

- **Frontend**: http://localhost (port 80)
- **Health Check**: http://localhost/

---

## SecretVM Deployment

Secure deployment on SecretVM with Traefik and TLS.

### Understanding SecretVM

SecretVM is a Trusted Execution Environment (TEE) that provides:
- **Encrypted filesystem**: `/mnt/secure/`
- **Automatic TLS certificates**: `/mnt/secure/cert/`
- **Docker Compose automation**: Runs `docker-compose.yml` from `/mnt/secure/docker_wd/`
- **Attestation**: Cryptographic proof of secure execution

### Prerequisites Checklist

- [ ] SecretVM provisioned and accessible
- [ ] SSH access configured
- [ ] TLS certificates present in `/mnt/secure/cert/`
- [ ] Domain DNS configured to SecretVM IP
- [ ] Docker Hub image built and pushed

### Deployment Steps

#### 1. Prepare Image

```bash
# Build using simple Dockerfile
docker build -f Dockerfile.secretvm -t harystyles/privexbot-frontend:0.0.1 .

# Push to Docker Hub
docker push harystyles/privexbot-frontend:0.0.1

# Get digest
docker inspect harystyles/privexbot-frontend:0.0.1 | grep -i digest
```

#### 2. Update docker-compose.secretvm.yml

Update the digest in the file:
```yaml
services:
  app:
    image: harystyles/privexbot-frontend@sha256:YOUR_DIGEST_HERE
```

#### 3. Upload to SecretVM

```bash
# SSH into SecretVM
ssh user@your-secretvm.vm.scrtlabs.com

# Navigate to docker directory
cd /mnt/secure/docker_wd/

# Upload docker-compose.secretvm.yml as docker-compose.yml
# (On your local machine)
scp docker-compose.secretvm.yml user@your-secretvm:/mnt/secure/docker_wd/docker-compose.yml
```

#### 4. Deploy on SecretVM

```bash
# On SecretVM
cd /mnt/secure/docker_wd/

# Stop any existing deployment
docker compose down --remove-orphans

# Pull the image
docker pull harystyles/privexbot-frontend@sha256:YOUR_DIGEST

# Start services
docker compose up -d

# Verify services running
docker compose ps

# Check logs
docker compose logs -f
```

#### 5. Verify Deployment

**Check Traefik Discovery**:
```bash
docker logs docker_wd-traefik-1 | grep "Creating router"
# Expected: "Creating router app@docker"
```

**Test Direct Access**:
```bash
curl http://localhost:8080/
# Expected: HTML content
```

**Test via Traefik**:
```bash
curl -H "Host: your-domain.vm.scrtlabs.com" http://localhost
# Expected: HTML content
```

**Browser Test**:
- Visit: https://your-domain.vm.scrtlabs.com
- Expected: ✅ Page loads with HTTPS

### SecretVM File Structure

```
/mnt/secure/
├── docker_wd/
│   ├── docker-compose.yml          # Your deployment config
│   ├── .env (optional)              # Environment variables
│   └── usr/
│       └── (application data)
├── cert/
│   ├── secret_vm_fullchain.pem     # TLS certificate
│   └── secret_vm_private.pem       # TLS private key
└── system_info.json                 # VM information
```

### SecretVM Best Practices

1. **Always use digest pinning**:
   ```yaml
   image: harystyles/privexbot-frontend@sha256:abc123...
   ```
   Never use tags like `:latest` or `:0.0.1`

2. **File must be named `docker-compose.yml`**:
   SecretVM looks for this specific filename in `/mnt/secure/docker_wd/`

3. **Verify TLS certificates exist**:
   ```bash
   ls -la /mnt/secure/cert/
   # Should show: secret_vm_fullchain.pem and secret_vm_private.pem
   ```

4. **Check Traefik logs for routing**:
   Must see "Starting provider *docker.Provider" and "Creating router app@docker"

5. **Remove orphan containers**:
   ```bash
   docker compose down --remove-orphans
   ```

---

## Building Images

### Build Scripts

Located in `scripts/docker/`:

- **`build-push.sh`**: Build and push production images
- **`dev.sh`**: Manage development environment
- **`check.sh`**: Verify prerequisites

### Build Production Image

```bash
# Using script (recommended)
./scripts/docker/build-push.sh 0.0.1

# Manual build
docker build -f Dockerfile -t harystyles/privexbot-frontend:0.0.1 .
docker push harystyles/privexbot-frontend:0.0.1
```

### Build SecretVM Image

```bash
# Same as production (uses Dockerfile.secretvm which is identical)
docker build -f Dockerfile.secretvm -t harystyles/privexbot-frontend:0.0.1 .
docker push harystyles/privexbot-frontend:0.0.1
```

### Build Process

The Dockerfile uses multi-stage builds:

1. **Build Stage** (Node 20 Alpine):
   - Install dependencies with `npm ci`
   - Build application with `npm run build`
   - Output to `/app/dist`

2. **Production Stage** (Nginx Alpine):
   - Copy built files from build stage
   - Configure Nginx for SPA routing
   - Expose port 80
   - Run Nginx

### Image Optimization

- ✅ **Multi-stage build**: Reduces final image size (~50MB vs ~500MB)
- ✅ **Alpine Linux**: Minimal base image
- ✅ **Layer caching**: Dependency layers cached separately
- ✅ **`.dockerignore`**: Excludes unnecessary files

---

## CI/CD & GitHub Actions

Automated building and deployment using GitHub Actions.

### Overview

The CI/CD pipeline is located at the **project root** level: `/.github/workflows/`

The pipeline automates:
- ✅ **Building**: Build Docker images on main/dev branches
- ✅ **Pushing**: Push to Docker Hub with proper versioning
- ✅ **Digest Generation**: Outputs digest for SecretVM deployment
- ✅ **Deployment Artifacts**: Generates deployment instructions

### Workflow File

**`/.github/workflows/frontend-docker.yml`**

Located at the project root (not in frontend folder).

### Trigger Conditions

| Trigger | Condition | Action |
|---------|-----------|--------|
| **Push to `main`** | Changes in `frontend/**` | Build production image with timestamp version |
| **Push to `dev`** | Changes in `frontend/**` | Build development image with dev tag |
| **Manual dispatch** | Via Actions UI | Build with custom version and environment |

### Required GitHub Secrets

Configure these in **Settings → Secrets and variables → Actions**:

| Secret | Value | Description |
|--------|-------|-------------|
| `DOCKER_USERNAME` | `harystyles` | Docker Hub username |
| `DOCKER_PASSWORD` | `<token>` | Docker Hub access token |

#### Setting Up Secrets

1. **Create Docker Hub Access Token**:
   ```bash
   # 1. Visit https://hub.docker.com/settings/security
   # 2. Click "New Access Token"
   # 3. Name: "GitHub Actions"
   # 4. Permissions: Read & Write
   # 5. Copy token (you won't see it again!)
   ```

2. **Add to GitHub**:
   ```bash
   # 1. Go to repository Settings
   # 2. Navigate to: Secrets and variables → Actions
   # 3. Click "New repository secret"
   # 4. Add DOCKER_USERNAME: harystyles
   # 5. Add DOCKER_PASSWORD: <your-token>
   ```

### Automatic Versioning

The workflow uses a **default prelaunch version** for all builds:

**Default Version**: `0.1.0` (1.0.0 reserved for official launch)

**For all branches** (`main`, `dev`):
```bash
VERSION="0.1.0"  # Consistent prelaunch version

# Branch only determines environment
if [ "$BRANCH" == "main" ]; then
  ENVIRONMENT="production"
else
  ENVIRONMENT="development"
fi
```

**Tags created**:
- `harystyles/privexbot-frontend:0.1.0`
- `harystyles/privexbot-frontend:main` (or `dev`)
- `harystyles/privexbot-frontend:latest`

### Manual Trigger

To manually trigger a build with custom version:

1. Go to **Actions** tab in GitHub
2. Click **Frontend - Build and Push Docker Image**
3. Click **Run workflow**
4. Fill in:
   - **Version**: e.g., `0.2.0`, `0.3.0-rc.1`
   - **Environment**: `development`, `staging`, or `production`
5. Click **Run workflow**

### Workflow Output

After the workflow completes, you'll get:

#### 1. **GitHub Actions Summary**
Contains:
- Image tags
- Image digest (for SecretVM)
- Deployment instructions
- Link to Docker Hub

#### 2. **Downloadable Artifacts**
- `image-info.json` - Machine-readable build info
- `deploy-instructions.md` - Deployment guide

#### 3. **Console Output**
```bash
✅ Build completed successfully
📦 Version: 0.1.0
🌍 Environment: production
🔖 Git SHA: abc1234
🎯 Image: harystyles/privexbot-frontend@sha256:abc123...
📋 Check the Actions summary for full deployment instructions
```

### Using the Workflow

#### Standard Push Workflow

```bash
# 1. Make changes to frontend
cd frontend
# ... make changes ...

# 2. Commit and push to dev
git add .
git commit -m "feat: add new feature"
git push origin dev

# 3. GitHub Actions automatically:
#    - Detects changes in frontend/**
#    - Builds Docker image
#    - Tags with dev-timestamp
#    - Pushes to Docker Hub
#    - Outputs digest in summary

# 4. Check Actions tab for digest
#    Go to: Actions → Latest workflow run → Summary

# 5. Copy digest and update deployment files
```

#### Production Release Workflow

```bash
# 1. Merge dev to main
git checkout main
git merge dev
git push origin main

# 2. GitHub Actions automatically:
#    - Builds production image
#    - Tags with version 0.1.0 (prelaunch default)
#    - Pushes to Docker Hub
#    - Outputs digest for SecretVM

# 3. Go to Actions → View workflow run → Summary

# 4. Copy the full image digest from summary

# 5. Update docker-compose.secretvm.yml:
services:
  app:
    image: harystyles/privexbot-frontend@sha256:NEW_DIGEST_FROM_ACTIONS

# 6. Deploy to SecretVM (see deployment section below)
```

### Branch Strategy

| Branch | Purpose | Workflow Actions | Version |
|--------|---------|-----------------|---------|
| `feature/*` | Feature development | No automated build | - |
| `dev` | Development integration | Auto-build (development env) | `0.1.0` |
| `main` | Production-ready code | Auto-build (production env) | `0.1.0` |

**Note**: All prelaunch builds use version `0.1.0`. Version `1.0.0` is reserved for official launch.

### Image Tags Generated

The workflow creates multiple tags:

```yaml
tags:
  - harystyles/privexbot-frontend:0.1.0    # Version tag (prelaunch default)
  - harystyles/privexbot-frontend:main     # Branch tag (or 'dev')
  - harystyles/privexbot-frontend:latest   # Latest tag
```

**For SecretVM deployment**, always use the **digest** (sha256), not tags:
```yaml
image: harystyles/privexbot-frontend@sha256:abc123...  # ✅ Use digest
# NOT: harystyles/privexbot-frontend:0.1.0            # ❌ Don't use tag
```

### Deployment with CI/CD

#### Step 1: Get Digest from Workflow

After workflow completes:
1. Go to **Actions** tab
2. Click on completed workflow run
3. View **Summary** tab
4. Copy the full image digest:
   ```
   harystyles/privexbot-frontend@sha256:abc123def456...
   ```

#### Step 2: Update Deployment Files

**For standalone production (`docker-compose.yml`)**:
```yaml
services:
  frontend:
    image: harystyles/privexbot-frontend@sha256:abc123def456...
```

**For SecretVM (`docker-compose.secretvm.yml`)**:
```yaml
services:
  app:
    image: harystyles/privexbot-frontend@sha256:abc123def456...
```

#### Step 3: Deploy

**Standalone Production**:
```bash
ssh user@production-server
docker compose pull
docker compose up -d
```

**SecretVM**:
```bash
ssh user@silver-hedgehog.vm.scrtlabs.com
cd /mnt/secure/docker_wd/
docker compose down
docker pull harystyles/privexbot-frontend@sha256:abc123def456...
docker compose up -d
```

### Workflow Features

✅ **Automatic versioning** - Timestamp-based versions
✅ **Multi-environment support** - dev, staging, production
✅ **Digest pinning** - SecretVM compatible
✅ **Build caching** - GitHub Actions cache for faster builds
✅ **Deployment artifacts** - Downloadable build info
✅ **Summary output** - Clear deployment instructions
✅ **Platform targeting** - linux/amd64 for compatibility

### Troubleshooting CI/CD

#### Build fails with "access denied"

**Problem**: Docker Hub credentials incorrect or missing

**Solution**:
1. Verify `DOCKER_USERNAME` = `harystyles`
2. Verify `DOCKER_PASSWORD` is valid token
3. Check token has write permissions
4. Regenerate token if needed

#### Workflow doesn't trigger on push

**Problem**: Changes not in monitored paths

**Solution**:
The workflow only triggers when changes are in:
- `frontend/**`
- `.github/workflows/frontend-docker.yml`

Ensure your changes are in these paths.

#### Can't find digest in output

**Problem**: Digest extraction failed

**Solution**:
1. Check workflow logs: "Get image digest" step
2. Verify image was pushed successfully
3. Check Docker Hub for the image
4. Re-run workflow if needed

#### Manual trigger doesn't appear

**Problem**: Workflow not on main branch

**Solution**:
1. Ensure `frontend-docker.yml` is on `main` branch
2. Push workflow file to main
3. Refresh Actions tab

### Viewing Workflow Documentation

Complete workflow documentation is available at:
```
/.github/workflows/README.md
```

This includes:
- Detailed setup instructions
- Secret configuration
- Troubleshooting guide
- Best practices

---

## Development Workflow

Complete workflow for developing, testing, and deploying the frontend.

### 1. Local Development

#### Setup

```bash
# Clone repository
git clone <repository-url>
cd privexbot/frontend

# Install dependencies
npm install

# Create environment file
cp .env.dev.example .env.dev

# Start dev server
npm run dev
```

#### Development Cycle

```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes
# Edit files in src/

# 3. Test locally
npm run lint
npm run type-check
npm test
npm run build

# 4. Commit changes
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature

# 5. Create PR
gh pr create --title "Add new feature" --body "Description"
```

### 2. Docker Development

#### Local Testing

```bash
# Start Docker dev environment
docker compose -f docker-compose.dev.yml up

# Access at http://localhost:5173

# Hot reload works automatically
```

#### Production Build Testing

```bash
# Build production image
docker build -t frontend-test .

# Run locally
docker run -p 8080:80 frontend-test

# Test at http://localhost:8080

# Run diagnostics
./scripts/docker/diagnose.sh http://localhost:8080
```

### 3. Code Review & Merge

#### Pull Request Checklist

- [ ] All tests pass locally
- [ ] No linting errors
- [ ] TypeScript compiles successfully
- [ ] Production build works
- [ ] No console errors
- [ ] Code reviewed and approved
- [ ] CI/CD checks pass

#### Merge Process

```bash
# After approval, merge via GitHub UI or:
gh pr merge --squash

# Or rebase merge:
gh pr merge --rebase
```

### 4. Release Process

#### Determine Version

Based on changes:
- **Bug fix**: Increment PATCH (0.2.0 → 0.2.1)
- **New feature**: Increment MINOR (0.2.0 → 0.3.0)
- **Breaking change**: Wait for 1.0.0 (MVP is 0.x.x)

#### Update Version

```bash
# Update package.json version
npm version patch  # or minor, major
# This updates package.json and creates git tag

# Push changes
git push origin main --follow-tags
```

#### Build & Push

**Option 1: Automated (Recommended)**
- CI/CD automatically builds when code is pushed to main
- Check GitHub Actions for build status
- Get digest from commit comment

**Option 2: Manual**
```bash
# Build and push
./scripts/docker/build-push.sh 0.3.0

# Output will show digest
# Example: sha256:abc123def456...
```

### 5. Deployment

#### Update Deployment Files

**docker-compose.yml** (standalone production):
```yaml
services:
  frontend:
    image: harystyles/privexbot-frontend@sha256:NEW_DIGEST
```

**docker-compose.secretvm.yml** (SecretVM):
```yaml
services:
  app:
    image: harystyles/privexbot-frontend@sha256:NEW_DIGEST
```

#### Deploy to Environments

**Standalone Production**:
```bash
# SSH to server
ssh user@production-server

# Update and deploy
docker compose pull
docker compose up -d
docker compose logs -f
```

**SecretVM**:
```bash
# Option 1: Manual
ssh user@silver-hedgehog.vm.scrtlabs.com
cd /mnt/secure/docker_wd/
docker compose down
docker pull harystyles/privexbot-frontend@sha256:NEW_DIGEST
docker compose up -d

# Option 2: GitHub Actions
# Go to Actions → Deploy to SecretVM → Run workflow
```

#### Verify Deployment

```bash
# Check containers
docker compose ps

# Check logs
docker compose logs -f

# For SecretVM: Verify Traefik
docker logs docker_wd-traefik-1 | grep "Creating router"

# Test endpoint
curl https://silver-hedgehog.vm.scrtlabs.com
```

### 6. Rollback Process

If deployment fails:

```bash
# 1. Get previous working digest
git log --oneline | head -5
# Find previous deployment commit

# 2. Get digest from commit
git show COMMIT_HASH | grep sha256

# 3. Update docker-compose with previous digest

# 4. Redeploy
docker compose down
docker pull harystyles/privexbot-frontend@sha256:PREVIOUS_DIGEST
docker compose up -d
```

### Development Best Practices

1. **Test before committing**:
   ```bash
   npm run lint && npm run type-check && npm test && npm run build
   ```

2. **Use conventional commits**:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation
   - `refactor:` - Code refactoring
   - `test:` - Adding tests
   - `chore:` - Maintenance

3. **Keep PRs small**: Focus on single feature/fix

4. **Update documentation**: Keep docs in sync with code

5. **Version carefully**: Follow semantic versioning strictly

---

## Troubleshooting

See [docs/TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for detailed troubleshooting guide.

### Quick Diagnostics

```bash
# Check container status
docker compose ps

# View logs
docker compose logs -f

# Check container health
docker inspect <container_name> | grep -A 10 Health

# Test direct container access
docker exec <container_name> wget -qO- http://localhost

# Verify nginx config
docker exec <container_name> nginx -t
```

### Common Issues

#### Issue: 504 Gateway Timeout (SecretVM)

**Symptom**: Traefik returns 504 after 30 seconds

**Cause**: Traefik not discovering containers

**Fix**:
1. Check Traefik logs: `docker logs docker_wd-traefik-1`
2. Must see: "Starting provider *docker.Provider"
3. Must see: "Creating router app@docker"
4. Verify both containers on `traefik` network:
   ```bash
   docker network inspect traefik | grep -E "app|traefik"
   ```

#### Issue: Container Exits Immediately

**Symptom**: Container starts then exits with code 0 or 1

**Cause**: Usually Nginx configuration error

**Fix**:
1. Check container logs: `docker logs <container>`
2. Test nginx config: `docker exec <container> nginx -t`
3. Verify static files exist: `docker exec <container> ls /usr/share/nginx/html`

#### Issue: Page Loads But Assets Don't

**Symptom**: Blank page, network tab shows 404 for JS/CSS

**Cause**: Missing build files or wrong nginx config

**Fix**:
1. Verify dist folder built correctly: `ls dist/assets/`
2. Check nginx serves files: `docker exec <container> ls /usr/share/nginx/html/assets/`
3. Test asset access: `curl http://localhost/assets/index-*.js`

---

## Best Practices

### Security

1. **Never commit `.env` files**: Always git-ignored
2. **Use digest pinning in production**: Ensures immutability
3. **Keep base images updated**: Regularly update Node and Nginx versions
4. **Minimize image size**: Use Alpine variants
5. **Scan images for vulnerabilities**:
   ```bash
   docker scan harystyles/privexbot-frontend:0.0.1
   ```

### Performance

1. **Enable gzip compression**: Already configured in nginx.conf
2. **Use long-term caching**: Assets have content hashes
3. **Optimize bundle size**: Check with `npm run build` output
4. **Use CDN for static assets**: Configure via `WIDGET_CDN_URL`

### Development Workflow

1. **Use volume mounts in dev**: Faster iteration
2. **Keep dev and prod parity**: Use same Node version
3. **Test production builds locally**:
   ```bash
   docker build -t test-prod .
   docker run -p 8080:80 test-prod
   ```

### Deployment

1. **Tag images semantically**: Use semver (0.1.0, 0.2.0, 1.0.0)
2. **Keep deployment logs**: Save logs before each deployment
3. **Test before deploying**: Run tests in CI/CD
4. **Use health checks**: Monitor container health
5. **Plan rollback strategy**: Keep previous image available

---

## Additional Resources

- **Testing Guide**: [docs/TESTING.md](./TESTING.md)
- **Quick Start**: [docs/QUICK-START.md](./QUICK-START.md)
- **Troubleshooting**: [docs/TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **Main README**: [../README.md](../README.md)

---

## Support

For issues or questions:

1. Check [Troubleshooting Guide](./TROUBLESHOOTING.md)
2. Review container logs: `docker compose logs`
3. Verify configuration files
4. Check Docker/Docker Compose versions
