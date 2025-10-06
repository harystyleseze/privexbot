# Docker Hub Deployment Guide

## Table of Contents
1. [Understanding Docker Hub](#understanding-docker-hub)
2. [Prerequisites](#prerequisites)
3. [Step-by-Step Process](#step-by-step-process)
4. [Image Naming Best Practices](#image-naming-best-practices)
5. [Version Tagging Strategy](#version-tagging-strategy)
6. [Security Best Practices](#security-best-practices)
7. [Pulling and Running on Remote VM](#pulling-and-running-on-remote-vm)
8. [Automated CI/CD Pipeline](#automated-cicd-pipeline)
9. [Troubleshooting](#troubleshooting)

---

## Understanding Docker Hub

### What is Docker Hub?
Docker Hub is a **cloud-based registry service** that allows you to:
- Store and distribute Docker images
- Share images publicly or keep them private
- Access images from anywhere in the world
- Collaborate with teams

### How It Works (Simple Analogy)
Think of Docker Hub like **GitHub for Docker images**:
- **GitHub**: Stores source code → You `git push` code → Others `git clone` it
- **Docker Hub**: Stores Docker images → You `docker push` images → Others `docker pull` them

### The Journey of Your Image

```
┌─────────────────────────────────────────────────────────────┐
│ LOCAL MACHINE                                               │
│                                                             │
│  1. Build Image                                             │
│     docker build → privexbot/frontend:latest                │
│                           ↓                                 │
│  2. Tag for Docker Hub                                      │
│     docker tag → harystyles/privexbot-frontend:latest       │
│                           ↓                                 │
│  3. Login to Docker Hub                                     │
│     docker login (authenticate)                             │
│                           ↓                                 │
│  4. Push to Docker Hub                                      │
│     docker push → [Upload to cloud]                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ DOCKER HUB (Cloud Storage)                                  │
│                                                             │
│  📦 harystyles/privexbot-frontend:latest                    │
│  📦 harystyles/privexbot-frontend:v1.0.0                    │
│  📦 harystyles/privexbot-frontend:v1.1.0                    │
│                                                             │
│  Available to anyone, anywhere!                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ REMOTE VM (Your Production Server)                          │
│                                                             │
│  5. Pull from Docker Hub                                    │
│     docker pull harystyles/privexbot-frontend:latest        │
│                           ↓                                 │
│  6. Run Container                                           │
│     docker run -p 80:80 harystyles/privexbot-frontend       │
│                           ↓                                 │
│  7. Access via Browser                                      │
│     http://your-vm-ip:80 or https://yourdomain.com          │
└─────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

### 1. Docker Hub Account
- **Sign up**: https://hub.docker.com/signup
- **Free tier includes**:
  - Unlimited public repositories
  - 1 private repository
  - Unlimited pulls
  - 200 image pushes per 6 hours

### 2. Docker Installed Locally
```bash
docker --version
# Should show: Docker version 20.x or higher
```

### 3. Built Docker Image
```bash
docker images | grep privexbot
# Should show: privexbot/frontend:latest (49MB)
```

---

## Step-by-Step Process

### Step 1: Understanding Image Names

**Docker image names follow this format:**
```
[registry-url/][username/]repository[:tag]
```

**Examples:**
```bash
# Local image (no username)
privexbot/frontend:latest

# Docker Hub image (with username)
harystyles/privexbot-frontend:latest

# Private registry
myregistry.com/harystyles/privexbot-frontend:latest
```

**Breaking it down for YOUR case:**
```
harystyles/privexbot-frontend:latest
    ↓           ↓                ↓
 username   repository         tag
 (you)      (your app)      (version)
```

### Step 2: Tag Your Image

**Why tag?**
Your current image is named `privexbot/frontend:latest`. To push it to YOUR Docker Hub account, you need to rename it to include your username: `harystyles/privexbot-frontend:latest`

**Command:**
```bash
# Syntax: docker tag SOURCE_IMAGE TARGET_IMAGE

# Tag with 'latest' (for production use)
docker tag privexbot/frontend:latest harystyles/privexbot-frontend:latest

# ALSO tag with specific version (best practice)
docker tag privexbot/frontend:latest harystyles/privexbot-frontend:v1.0.0
```

**What this does:**
- Creates a NEW tag/reference pointing to the SAME image
- Does NOT duplicate the image (no extra disk space)
- Like creating a shortcut/alias to the same file

**Verify tags created:**
```bash
docker images | grep harystyles

# Expected output:
# harystyles/privexbot-frontend   latest    370603b47b37   49MB
# harystyles/privexbot-frontend   v1.0.0    370603b47b37   49MB
# (Same IMAGE ID = same image, different names)
```

### Step 3: Login to Docker Hub

**Command:**
```bash
docker login
```

**What happens:**
```
Username: harystyles           ← Enter your Docker Hub username
Password: **********           ← Enter your Docker Hub password (hidden)
Login Succeeded               ← Success message
```

**Alternative (more secure):**
```bash
# Use personal access token instead of password
# 1. Go to: https://hub.docker.com/settings/security
# 2. Click "New Access Token"
# 3. Give it a name: "privexbot-deployment"
# 4. Copy the token
# 5. Use it as password when logging in

docker login -u harystyles
Password: [paste-your-token-here]
```

**Where credentials are stored:**
```bash
# macOS/Linux
~/.docker/config.json

# View (credentials are base64 encoded)
cat ~/.docker/config.json
```

### Step 4: Push Image to Docker Hub

**Command:**
```bash
# Push latest tag
docker push harystyles/privexbot-frontend:latest

# Push versioned tag
docker push harystyles/privexbot-frontend:v1.0.0
```

**What happens during push:**
```
The push refers to repository [docker.io/harystyles/privexbot-frontend]
5f70bf18a086: Preparing           ← Layer 1
54f7e8ac135a: Preparing           ← Layer 2
ad6562704f37: Preparing           ← Layer 3
...
5f70bf18a086: Pushed              ← Upload complete
54f7e8ac135a: Pushed
ad6562704f37: Pushed
latest: digest: sha256:abc123... ← Final checksum
```

**Understanding layers:**
- Docker images are made of layers
- Only NEW/CHANGED layers are uploaded
- If you push v1.0.1 later, only changed layers upload (faster!)
- This is why subsequent pushes are much faster

**Time estimate:**
- First push: 2-5 minutes (49MB image)
- Subsequent pushes: 10-30 seconds (only changed layers)

### Step 5: Verify on Docker Hub

**Check via web:**
1. Go to: https://hub.docker.com/
2. Login with your account
3. Navigate to: https://hub.docker.com/r/harystyles/privexbot-frontend
4. You should see:
   - Repository name
   - Tags (latest, v1.0.0)
   - Image size
   - Last pushed date
   - Pull command

**Check via CLI:**
```bash
# Search for your image
docker search harystyles/privexbot-frontend

# Pull your own image (to test it's accessible)
docker pull harystyles/privexbot-frontend:latest
```

---

## Image Naming Best Practices

### 1. Repository Naming Conventions

**Good names:**
```bash
harystyles/privexbot-frontend     ✅ Clear, descriptive
harystyles/privexbot-backend      ✅ Service-specific
harystyles/privexbot-api          ✅ Purpose-focused
```

**Bad names:**
```bash
harystyles/app                    ❌ Too generic
harystyles/my-project             ❌ Not descriptive
harystyles/test123                ❌ No meaning
```

### 2. Naming Strategy for Multi-Service Apps

**Option A: Separate repositories (Recommended)**
```bash
harystyles/privexbot-frontend:latest
harystyles/privexbot-backend:latest
harystyles/privexbot-worker:latest
harystyles/privexbot-nginx:latest
```

**Pros:**
- Each service can have independent versions
- Smaller images
- Clearer purpose
- Better for microservices

**Option B: Single repository with tags**
```bash
harystyles/privexbot:frontend-latest
harystyles/privexbot:backend-latest
harystyles/privexbot:worker-latest
```

**Pros:**
- Everything under one umbrella
- Fewer repositories to manage

**Recommendation:** Use Option A (separate repositories)

---

## Version Tagging Strategy

### Why Version Tags Matter

**Problem with only using `latest`:**
```bash
# Day 1: Works perfectly
docker pull harystyles/privexbot-frontend:latest

# Day 10: You push a buggy update
docker pull harystyles/privexbot-frontend:latest  ← Gets broken version!

# How to rollback? You can't! No way to get Day 1 version.
```

**Solution: Use semantic versioning**
```bash
harystyles/privexbot-frontend:v1.0.0   ← Stable, immutable
harystyles/privexbot-frontend:v1.1.0   ← New features
harystyles/privexbot-frontend:latest   ← Points to v1.1.0
```

### Semantic Versioning (SemVer)

**Format: `vMAJOR.MINOR.PATCH`**

```
v1.2.3
 ↓ ↓ ↓
 │ │ └─ PATCH: Bug fixes (backwards compatible)
 │ └─── MINOR: New features (backwards compatible)
 └───── MAJOR: Breaking changes (NOT backwards compatible)
```

**Examples:**
```bash
v1.0.0  → Initial release
v1.0.1  → Fixed login bug
v1.1.0  → Added dark mode feature
v2.0.0  → Complete UI redesign (breaking change)
```

### Tagging Strategy (Best Practice)

**For each release, push THREE tags:**
```bash
# 1. Specific version (immutable, never changes)
docker tag privexbot/frontend:latest harystyles/privexbot-frontend:v1.2.3
docker push harystyles/privexbot-frontend:v1.2.3

# 2. Minor version (gets updated with patches)
docker tag privexbot/frontend:latest harystyles/privexbot-frontend:v1.2
docker push harystyles/privexbot-frontend:v1.2

# 3. Latest (always points to newest)
docker tag privexbot/frontend:latest harystyles/privexbot-frontend:latest
docker push harystyles/privexbot-frontend:latest
```

**Why this works:**
```bash
# Production: Use specific version (safe, predictable)
docker pull harystyles/privexbot-frontend:v1.2.3

# Staging: Use minor version (get patches automatically)
docker pull harystyles/privexbot-frontend:v1.2

# Development: Use latest (bleeding edge)
docker pull harystyles/privexbot-frontend:latest
```

### Environment-Specific Tags

**Another approach:**
```bash
# Environment tags
harystyles/privexbot-frontend:prod      → What's in production
harystyles/privexbot-frontend:staging   → What's being tested
harystyles/privexbot-frontend:dev       → Development version

# Version tags (for rollback)
harystyles/privexbot-frontend:v1.0.0
harystyles/privexbot-frontend:v1.1.0
```

### Git Commit SHA Tags (Advanced)

**For traceability:**
```bash
# Tag with git commit hash
GIT_SHA=$(git rev-parse --short HEAD)
docker tag privexbot/frontend:latest harystyles/privexbot-frontend:${GIT_SHA}
docker push harystyles/privexbot-frontend:${GIT_SHA}

# Example
harystyles/privexbot-frontend:a3f2c1b
```

**Benefits:**
- Exact source code tracking
- Easy to find which commit produced which image
- Useful for debugging

---

## Security Best Practices

### 1. Never Include Secrets in Images

**BAD (secrets baked into image):**
```dockerfile
# ❌ NEVER DO THIS
ENV DATABASE_PASSWORD=mysecretpassword
ENV API_KEY=sk-abc123xyz
```

**GOOD (secrets provided at runtime):**
```dockerfile
# ✅ Accept environment variables
ENV DATABASE_URL=${DATABASE_URL}
ENV API_KEY=${API_KEY}
```

```bash
# Provide secrets when running container
docker run \
  -e DATABASE_PASSWORD=mysecret \
  -e API_KEY=sk-abc123 \
  harystyles/privexbot-frontend:latest
```

### 2. Use Multi-Stage Builds (Already Done!)

**Your current Dockerfile.prod already does this:**
```dockerfile
# Stage 1: Build (includes source code, node_modules - 1.2GB)
FROM node:20-alpine AS builder
...

# Stage 2: Production (only built files - 49MB)
FROM nginx:1.25-alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
```

**Why this is secure:**
- Source code NOT included in final image
- Development dependencies NOT included
- Minimal attack surface
- Smaller = fewer vulnerabilities

### 3. Scan Images for Vulnerabilities

**Using Docker Scout (built-in):**
```bash
# Scan your image
docker scout cves harystyles/privexbot-frontend:latest

# View recommendations
docker scout recommendations harystyles/privexbot-frontend:latest
```

**Using Trivy (more detailed):**
```bash
# Install trivy
brew install trivy  # macOS
# or
apt-get install trivy  # Linux

# Scan image
trivy image harystyles/privexbot-frontend:latest
```

### 4. Use Official Base Images

**Your Dockerfile already uses official images:**
```dockerfile
FROM node:20-alpine AS builder      ✅ Official Node.js
FROM nginx:1.25-alpine AS production ✅ Official Nginx
```

**Why official images?**
- Regularly updated
- Security patches applied
- Trusted by Docker
- Well-maintained

### 5. Keep Images Updated

**Regular maintenance:**
```bash
# Rebuild monthly to get base image updates
docker pull node:20-alpine
docker pull nginx:1.25-alpine
./scripts/build-prod.sh

# Push new version
docker push harystyles/privexbot-frontend:v1.0.1
```

### 6. Use Private Repositories for Sensitive Apps

**Docker Hub plans:**
- **Free**: 1 private repository
- **Pro ($5/month)**: Unlimited private repos

**Make repository private:**
1. Go to: https://hub.docker.com/r/harystyles/privexbot-frontend/settings
2. Click "Make Private"
3. Only you (and authorized users) can pull it

**Pull from private repository:**
```bash
# Must login first
docker login
docker pull harystyles/privexbot-frontend:latest
```

### 7. Use Access Tokens Instead of Password

**Why?**
- More secure than password
- Can be revoked without changing password
- Can have limited permissions
- Can set expiration dates

**Setup:**
1. Go to: https://hub.docker.com/settings/security
2. Click "New Access Token"
3. Name: "production-deployment"
4. Access permissions: Read & Write
5. Generate token
6. Copy it (you'll only see it once!)

**Use token:**
```bash
# Save token in environment variable
export DOCKER_HUB_TOKEN="dckr_pat_abc123..."

# Login using token
echo $DOCKER_HUB_TOKEN | docker login -u harystyles --password-stdin
```

---

## Pulling and Running on Remote VM

### Scenario: You Have a Virtual Machine

**Your VM details:**
- **IP Address**: 203.0.113.45 (example)
- **OS**: Ubuntu 22.04
- **Docker**: Installed
- **Goal**: Run your frontend container

### Step 1: SSH into Your VM

```bash
ssh user@203.0.113.45
```

### Step 2: Install Docker (if not installed)

```bash
# Update package index
sudo apt-get update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group (no sudo needed)
sudo usermod -aG docker $USER

# Logout and login again for group changes
exit
ssh user@203.0.113.45

# Verify Docker works
docker --version
```

### Step 3: Pull Your Image from Docker Hub

```bash
# Pull latest version
docker pull harystyles/privexbot-frontend:latest

# Or pull specific version
docker pull harystyles/privexbot-frontend:v1.0.0

# Verify image downloaded
docker images
```

### Step 4: Run Your Container

**Option A: Simple run (testing)**
```bash
docker run -d \
  --name privexbot-frontend \
  -p 80:80 \
  -e API_BASE_URL=https://api.yourdomain.com/api/v1 \
  -e WIDGET_CDN_URL=https://cdn.yourdomain.com \
  -e ENVIRONMENT=production \
  harystyles/privexbot-frontend:latest
```

**Option B: Using docker-compose (recommended)**

Create `docker-compose.yml` on your VM:
```yaml
services:
  frontend:
    image: harystyles/privexbot-frontend:latest
    container_name: privexbot-frontend
    ports:
      - "80:80"
    environment:
      - API_BASE_URL=https://api.yourdomain.com/api/v1
      - WIDGET_CDN_URL=https://cdn.yourdomain.com
      - ENVIRONMENT=production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

Run it:
```bash
docker compose up -d
```

### Step 5: Access Your Application

**Via IP address:**
```
http://203.0.113.45
```

**Via domain (if you have one):**
```
https://yourdomain.com
```

### Step 6: Update to New Version (Zero Downtime)

```bash
# Pull new version
docker pull harystyles/privexbot-frontend:v1.1.0

# Update docker-compose.yml to use v1.1.0
# Then run
docker compose up -d

# Docker will:
# 1. Pull new image (if not already pulled)
# 2. Start new container
# 3. Stop old container (after new one is healthy)
# 4. Remove old container
```

---

## Automated CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Build and Push to Docker Hub

on:
  push:
    branches: [main]
    tags:
      - 'v*'

env:
  IMAGE_NAME: harystyles/privexbot-frontend

jobs:
  build-and-push:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: harystyles
          password: ${{ secrets.DOCKER_HUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.IMAGE_NAME }}
          tags: |
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          file: ./frontend/Dockerfile.prod
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=registry,ref=${{ env.IMAGE_NAME }}:buildcache
          cache-to: type=registry,ref=${{ env.IMAGE_NAME }}:buildcache,mode=max
```

**Setup:**
1. Go to: https://github.com/your-repo/settings/secrets/actions
2. Add secret: `DOCKER_HUB_TOKEN` (your Docker Hub token)
3. Commit workflow file
4. Push to main branch or create tag: `git tag v1.0.0 && git push --tags`

**What it does:**
- Automatically builds image on every push to main
- Pushes to Docker Hub with proper version tags
- Uses build cache for faster builds
- Triggers on git tags for releases

---

## Troubleshooting

### Problem 1: "unauthorized: authentication required"

**Cause:** Not logged in to Docker Hub

**Solution:**
```bash
docker login
# Enter username: harystyles
# Enter password: [your-password-or-token]
```

### Problem 2: "denied: requested access to the resource is denied"

**Cause:** Trying to push to someone else's repository

**Fix:** Make sure image name includes YOUR username
```bash
# Wrong
docker push privexbot/frontend:latest

# Correct
docker push harystyles/privexbot-frontend:latest
```

### Problem 3: Push is very slow

**Cause:** Large image or slow internet

**Solutions:**
1. Check image size: `docker images harystyles/privexbot-frontend`
2. Optimize Dockerfile (use multi-stage builds - already done!)
3. Use .dockerignore to exclude unnecessary files
4. Push from a server with better internet

### Problem 4: "image not found" when pulling on VM

**Cause:**
- Typo in image name
- Repository is private and not logged in
- Image not pushed yet

**Solution:**
```bash
# Check image exists on Docker Hub
docker search harystyles/privexbot-frontend

# If private, login first
docker login

# Pull with exact name
docker pull harystyles/privexbot-frontend:latest
```

### Problem 5: Container runs but app doesn't work

**Cause:** Environment variables not set correctly

**Debug:**
```bash
# Check what environment variables are set
docker exec privexbot-frontend env

# Check nginx is serving files
docker exec privexbot-frontend ls /usr/share/nginx/html

# Check config.js has correct values
docker exec privexbot-frontend cat /usr/share/nginx/html/config.js

# Check logs
docker logs privexbot-frontend
```

**Fix:** Set environment variables when running:
```bash
docker run -d \
  -p 80:80 \
  -e API_BASE_URL=https://your-actual-api.com/api/v1 \
  -e WIDGET_CDN_URL=https://your-actual-cdn.com \
  -e ENVIRONMENT=production \
  harystyles/privexbot-frontend:latest
```

### Problem 6: Old version still running after update

**Cause:** Docker cached the old image locally

**Solution:**
```bash
# Force pull new image
docker pull harystyles/privexbot-frontend:latest --no-cache

# Stop and remove old container
docker stop privexbot-frontend
docker rm privexbot-frontend

# Run new container
docker run -d \
  --name privexbot-frontend \
  -p 80:80 \
  harystyles/privexbot-frontend:latest

# Or with docker-compose
docker compose pull
docker compose up -d
```

---

## Complete Workflow Example

### Local Development → Docker Hub → Production VM

**On your local machine:**
```bash
# 1. Make code changes
cd /Users/user/Downloads/privexbot/privexbot-dev-eze/privexbot

# 2. Build production image
./scripts/build-prod.sh

# 3. Test locally
docker compose -f docker-compose.prod.yml up -d frontend
curl http://localhost:3001/health  # Should return "OK"

# 4. If tests pass, tag for Docker Hub
docker tag privexbot/frontend:latest harystyles/privexbot-frontend:v1.0.0
docker tag privexbot/frontend:latest harystyles/privexbot-frontend:latest

# 5. Login to Docker Hub (first time only)
docker login

# 6. Push to Docker Hub
docker push harystyles/privexbot-frontend:v1.0.0
docker push harystyles/privexbot-frontend:latest

# 7. Verify on Docker Hub
open https://hub.docker.com/r/harystyles/privexbot-frontend
```

**On your production VM:**
```bash
# 1. SSH into VM
ssh user@your-vm-ip

# 2. Pull latest image
docker pull harystyles/privexbot-frontend:latest

# 3. Create docker-compose.yml (first time only)
cat > docker-compose.yml <<'EOF'
services:
  frontend:
    image: harystyles/privexbot-frontend:latest
    container_name: privexbot-frontend
    ports:
      - "80:80"
    environment:
      - API_BASE_URL=https://api.yourdomain.com/api/v1
      - WIDGET_CDN_URL=https://cdn.yourdomain.com
      - ENVIRONMENT=production
    restart: unless-stopped
EOF

# 4. Start container
docker compose up -d

# 5. Check status
docker ps
docker logs privexbot-frontend

# 6. Access in browser
curl http://your-vm-ip/health
```

**For updates:**
```bash
# On VM
docker compose pull    # Pull latest image
docker compose up -d   # Restart with new image
```

---

## Summary

**Quick Command Reference:**

```bash
# 1. Tag image
docker tag privexbot/frontend:latest harystyles/privexbot-frontend:latest
docker tag privexbot/frontend:latest harystyles/privexbot-frontend:v1.0.0

# 2. Login
docker login

# 3. Push
docker push harystyles/privexbot-frontend:latest
docker push harystyles/privexbot-frontend:v1.0.0

# 4. Pull on remote VM
docker pull harystyles/privexbot-frontend:latest

# 5. Run on remote VM
docker run -d -p 80:80 \
  -e API_BASE_URL=https://api.yourdomain.com/api/v1 \
  harystyles/privexbot-frontend:latest
```

**Best Practices Checklist:**
- ✅ Use semantic versioning (v1.0.0, v1.1.0, etc.)
- ✅ Tag with both version AND latest
- ✅ Never include secrets in images
- ✅ Use multi-stage builds (already done!)
- ✅ Scan images for vulnerabilities
- ✅ Keep base images updated
- ✅ Use access tokens instead of passwords
- ✅ Test locally before pushing
- ✅ Document your deployment process

---

**Ready to proceed?** Let me know and I'll execute the commands to push your image to Docker Hub!
