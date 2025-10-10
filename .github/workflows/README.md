# GitHub Actions Workflows

This directory contains CI/CD workflows for the PrivexBot project.

## Available Workflows

### `backend-docker.yml` - Backend Docker Build and Push

Automatically builds and pushes the backend Docker image to Docker Hub with comprehensive deployment instructions.

#### Triggers

- **Push to `main`**: Builds production image (version 0.1.0, environment: production)
- **Push to `dev`**: Builds development image (version 0.1.0, environment: development)
- **Push affecting backend**: Only triggers when files in `backend/` or workflow file change
- **Manual dispatch**: Build with custom version and environment selection

#### Required Secrets

Configure these in **Settings → Secrets and variables → Actions**:

| Secret Name | Value | Description |
|------------|-------|-------------|
| `DOCKER_USERNAME` | e.g `harystyles` | Docker Hub username |
| `DOCKER_PASSWORD` | `<your-token>` | Docker Hub access token or password |

#### How to Set Up Secrets

1. Go to your GitHub repository
2. Click **Settings**
3. Go to **Secrets and variables → Actions**
4. Click **New repository secret**
5. Add `DOCKER_USERNAME` with value `harystyles`
6. Add `DOCKER_PASSWORD` with your Docker Hub token

**Getting Docker Hub Token:**
1. Login to [Docker Hub](https://hub.docker.com)
2. Go to **Account Settings → Security**
3. Click **New Access Token**
4. Name it (e.g., "GitHub Actions - PrivexBot Backend")
5. Copy the token (you won't see it again!)
6. Use this token as `DOCKER_PASSWORD`

#### Manual Trigger

To manually trigger a build:

1. Go to **Actions** tab in GitHub
2. Click **Backend - Build and Push Docker Image**
3. Click **Run workflow**
4. Fill in:
   - **Version**: Semantic version (e.g., `0.1.0`, `0.2.0`)
   - **Environment**: `development`, `staging`, or `production`
5. Click **Run workflow**

**Note**: Version 1.0.0 is reserved for official product launch. Use 0.x.x versions for prelaunch.

#### Workflow Output

After the workflow completes, check the **Summary** tab for:

**1. Image Information**
- Image name: `harystyles/privexbot-backend`
- Version tag (e.g., `0.1.0`)
- Environment (development/staging/production)
- Build date and Git SHA
- Image digest (critical for SecretVM)

**2. Docker Hub Tags**
The workflow creates multiple tags:
```
docker.io/harystyles/privexbot-backend:0.1.0
docker.io/harystyles/privexbot-backend:main
docker.io/harystyles/privexbot-backend:latest
```

**3. Image Digest for SecretVM**
Copy this digest for SecretVM deployment:
```
docker.io/harystyles/privexbot-backend@sha256:9fb3b1d1152e5965f8b0c22a7cc9f317a6564edae257bc208a8c9516e330608b
```

**4. Deployment Instructions**
Complete step-by-step guide for:
- SecretVM deployment (primary - harystyles.store)
- Standalone production deployment
- Testing endpoints

**5. Download Artifacts**
- `image-info.json` - Machine-readable image information
- `deploy-instructions.md` - Complete deployment guide

Artifacts are retained for 90 days.

#### Using the Digest for SecretVM Deployment

**Step 1: Copy the digest from workflow summary**
```
Full Image: docker.io/harystyles/privexbot-backend@sha256:abc123...
```

**Step 2: Update `docker-compose.secretvm.yml`**
```yaml
services:
  backend:
    image: harystyles/privexbot-backend@sha256:abc123...
```

**Step 3: Deploy via SecretVM Dev Portal**
```bash
cd backend
./scripts/docker/secretvm-deploy.sh show
# Copy the output and paste into SecretVM Dev Portal
# Click "Deploy" in the portal
```

**Step 4: Test the deployment**
```bash
# Health check
curl https://api.harystyles.store/health

# API status
curl https://api.harystyles.store/api/v1/status

# Comprehensive tests
cd backend
./scripts/test-secretvm.sh
```

#### Production Services

After successful deployment, these services will be available:

| Service | URL | Description |
|---------|-----|-------------|
| Backend API | https://api.harystyles.store | FastAPI application |
| API Docs | https://api.harystyles.store/api/docs | Swagger UI (interactive) |
| PgAdmin | https://pgadmin.harystyles.store | Database management |
| Redis UI | https://redis-ui.harystyles.store | Redis management |
| Traefik | https://traefik.harystyles.store/dashboard/ | Reverse proxy dashboard |

#### Workflow Features

✅ **Multi-platform builds** - linux/amd64
✅ **Semantic versioning** - Automated and manual
✅ **Digest pinning** - Immutable SecretVM deployments
✅ **Build caching** - GitHub Actions cache for faster builds
✅ **Health checks** - Built into Docker image
✅ **Multi-stage builds** - Optimized production image
✅ **Deployment artifacts** - 90-day retention
✅ **Comprehensive summary** - Complete deployment guide in workflow output

#### Environment Configuration

Before deploying, ensure your `.env` file has:

**Development:**
```bash
BACKEND_CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

**Production (SecretVM):**
```bash
BACKEND_CORS_ORIGINS=https://harystyles.store,https://api.harystyles.store
```

**Security Variables:**
```bash
POSTGRES_PASSWORD=$(openssl rand -base64 32)
SECRET_KEY=$(openssl rand -hex 32)
PGADMIN_PASSWORD=$(openssl rand -base64 24)
```

---

### `frontend-docker.yml` - Frontend Docker Build and Push

Automatically builds and pushes the frontend Docker image to Docker Hub.

#### Triggers

- **Push to `main`**: Builds production image with timestamp version
- **Push to `dev`**: Builds development image with dev tag
- **Manual dispatch**: Build with custom version and environment

#### Required Secrets

Configure these in **Settings → Secrets and variables → Actions**:

| Secret Name | Value | Description |
|------------|-------|-------------|
| `DOCKER_USERNAME` | `harystyles` | Docker Hub username |
| `DOCKER_PASSWORD` | `<your-token>` | Docker Hub access token or password |

#### How to Set Up Secrets

1. Go to your GitHub repository
2. Click **Settings**
3. Go to **Secrets and variables → Actions**
4. Click **New repository secret**
5. Add `DOCKER_USERNAME` with value `harystyles`
6. Add `DOCKER_PASSWORD` with your Docker Hub token

**Getting Docker Hub Token:**
1. Login to [Docker Hub](https://hub.docker.com)
2. Go to **Account Settings → Security**
3. Click **New Access Token**
4. Name it (e.g., "GitHub Actions")
5. Copy the token (you won't see it again!)
6. Use this token as `DOCKER_PASSWORD`

#### Manual Trigger

To manually trigger a build:

1. Go to **Actions** tab in GitHub
2. Click **Frontend - Build and Push Docker Image**
3. Click **Run workflow**
4. Fill in:
   - **Version**: Semantic version (e.g., `0.1.0`, `0.2.0-rc.1`)
   - **Environment**: `development`, `staging`, or `production`
5. Click **Run workflow**

#### Workflow Output

After the workflow completes:

1. Check the **Actions** tab
2. Click on the completed workflow run
3. View the **Summary** tab for:
   - Image tags
   - Image digest (for SecretVM)
   - Deployment instructions
   - Link to Docker Hub

4. Download artifacts:
   - `image-info.json` - Machine-readable image information
   - `deploy-instructions.md` - Deployment guide

#### Using the Digest

The workflow outputs a digest in the summary. Copy this digest and update your `docker-compose.prod.yml`:

```yaml
services:
  frontend-prod:
    image: harystyles/privexbot-frontend@sha256:abc123...
```

## Workflow Features

✅ **Multi-environment support** - dev, staging, production
✅ **Semantic versioning** - Automated and manual versions
✅ **Digest pinning** - SecretVM compatible
✅ **Build caching** - Faster builds with GitHub Actions cache
✅ **Deployment artifacts** - Downloadable deployment info
✅ **Summary output** - Clear deployment instructions

## Troubleshooting

### Build fails with "denied: requested access to the resource is denied"

**Problem**: Docker Hub credentials are incorrect or missing.

**Solution**:
1. Verify `DOCKER_USERNAME` secret is set to `harystyles`
2. Verify `DOCKER_PASSWORD` is a valid Docker Hub token
3. Check the token has write permissions
4. Ensure the token hasn't expired

### Build succeeds but can't find the digest

**Problem**: Digest extraction failed.

**Solution**:
1. Check the workflow logs
2. Look for the "Get image digest" step
3. If empty, the image may not have been pushed
4. Verify Docker Hub credentials and retry

### Manual trigger doesn't appear

**Problem**: Workflow file may be on a different branch.

**Solution**:
1. Ensure workflow files are on the `main` branch
2. Push the workflow file to `main`
3. Refresh the Actions tab
4. Wait a few seconds for GitHub to detect the new workflow

### Backend workflow not triggering on push

**Problem**: Workflow doesn't run when expected.

**Solution**:
1. Check if changes were made to `backend/` directory or `.github/workflows/backend-docker.yml`
2. Workflow only triggers on `main` or `dev` branch pushes
3. Verify the workflow file syntax is valid (check Actions tab for errors)
4. Ensure the workflow file is committed to the branch

### Deployment fails on SecretVM

**Problem**: Backend container won't start after deployment.

**Solution**:
1. Check the image digest is correct in `docker-compose.secretvm.yml`
2. Verify `.env` file was uploaded to SecretVM portal
3. Check PostgreSQL and Redis are healthy before backend starts
4. Review backend logs in SecretVM portal
5. Ensure `BACKEND_CORS_ORIGINS` includes correct domains
6. Verify database credentials match in `.env`

### Health check fails after deployment

**Problem**: `curl https://api.harystyles.store/health` returns error.

**Solution**:
1. Check DNS points to correct IP (67.43.239.18)
2. Verify Traefik is running and routing correctly
3. Check backend container status
4. Review backend logs for startup errors
5. Ensure SSL certificates are mounted correctly
6. Wait 30-60 seconds for all services to fully start

### CORS errors in browser

**Problem**: Frontend gets CORS policy error when calling API.

**Solution**:
1. Check `BACKEND_CORS_ORIGINS` in `.env` includes your frontend domain
2. Restart backend after updating `.env`: redeploy via SecretVM portal
3. Verify the domain format (no trailing slashes)
4. Test with curl first to isolate CORS from other issues

## Best Practices

### General Workflow Practices

1. **Always use the digest** from workflow output for production and SecretVM deployments
2. **Download artifacts** for record-keeping and deployment reference
3. **Tag Git commits** with the version used (e.g., `git tag v0.1.0`)
4. **Test locally** before relying on CI builds
5. **Keep tokens secure** - never commit them to the repository or share them

### Backend-Specific Practices

1. **Use digest pinning** for SecretVM deployments (immutable deployments)
2. **Test the build locally** with `./scripts/docker/build-push.sh` before pushing to repo
3. **Update `docker-compose.secretvm.yml`** with the new digest from workflow output
4. **Test endpoints** after deployment using `./scripts/test-secretvm.sh`
5. **Keep environment variables secure** - use strong random passwords
6. **Monitor workflow outputs** for deployment instructions and potential issues
7. **Version incrementally** - use 0.x.x for prelaunch (1.0.0 reserved for launch)

### Deployment Workflow

**Recommended flow for backend updates:**

1. **Develop and test locally**
   ```bash
   cd backend
   ./scripts/docker/dev.sh up
   # Test changes at http://localhost:8000
   ```

2. **Push changes to trigger workflow**
   ```bash
   git add .
   git commit -m "Add feature X"
   git push origin main  # or dev
   ```

3. **Get digest from workflow**
   - Go to Actions tab
   - Click on completed workflow
   - Copy the image digest from Summary

4. **Update and deploy to SecretVM**
   ```bash
   # Update docker-compose.secretvm.yml with new digest
   ./scripts/docker/secretvm-deploy.sh show
   # Copy to SecretVM portal and deploy
   ```

5. **Verify deployment**
   ```bash
   ./scripts/test-secretvm.sh
   # Check all endpoints are healthy
   ```

## Adding More Workflows

To add more workflows:

1. Create a new `.yml` file in this directory
2. Define triggers, jobs, and steps
3. Commit and push to `main` branch
4. The workflow will appear in the Actions tab

### Current Workflows

- ✅ `backend-docker.yml` - Backend Docker builds and deployment
- ✅ `frontend-docker.yml` - Frontend Docker builds

### Potential Additional Workflows

Example workflow names for future expansion:
- `backend-tests.yml` - Backend unit and integration tests
- `frontend-tests.yml` - Frontend unit tests
- `e2e-tests.yml` - End-to-end tests
- `security-scan.yml` - Security vulnerability scanning
- `deploy-staging.yml` - Automated staging deployment
- `database-backup.yml` - Scheduled database backups

## Resources

### GitHub Actions Documentation
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Managing Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Using Artifacts](https://docs.github.com/en/actions/using-workflows/storing-workflow-data-as-artifacts)

### Backend Documentation
- [Backend README](../backend/README.md) - Complete backend guide
- [Docker Guide](../backend/docs/DOCKER.md) - Docker architecture and deployment
- [SecretVM Deployment](../backend/docs/SECRETVM_DEPLOYMENT.md) - SecretVM deployment guide
- [API Documentation](https://api.harystyles.store/api/docs) - Live Swagger UI
- [Deployment Status](../backend/docs/DEPLOYMENT_STATUS.md) - Current deployment status

### Helper Scripts
- `backend/scripts/docker/build-push.sh` - Local build and push
- `backend/scripts/docker/secretvm-deploy.sh` - SecretVM deployment helper
- `backend/scripts/test-secretvm.sh` - Production endpoint tests

### Production Services
- [Backend API](https://api.harystyles.store)
- [API Documentation](https://api.harystyles.store/api/docs)
- [PgAdmin](https://pgadmin.harystyles.store)
- [Redis UI](https://redis-ui.harystyles.store)
- [Traefik Dashboard](https://traefik.harystyles.store/dashboard/)

### Docker Hub
- [Backend Image](https://hub.docker.com/r/harystyles/privexbot-backend)
- [Frontend Image](https://hub.docker.com/r/harystyles/privexbot-frontend)

---

## Quick Reference

### Backend Workflow Commands

```bash
# Trigger workflow (automatic on push)
git push origin main  # Production build
git push origin dev   # Development build

# Manual trigger via GitHub UI
# Actions → Backend - Build and Push Docker Image → Run workflow

# Get deployment info
# Actions → Latest workflow run → Summary tab

# Deploy to SecretVM
cd backend
./scripts/docker/secretvm-deploy.sh show  # Get compose file
# Paste in SecretVM portal → Deploy

# Test deployment
./scripts/test-secretvm.sh

# Check production
curl https://api.harystyles.store/health
curl https://api.harystyles.store/api/v1/status
```

### Workflow Artifacts Location

After each workflow run, artifacts are available at:
- **GitHub Actions** → **Workflow run** → **Artifacts** section (bottom of page)
- Retention: 90 days
- Contains: `image-info.json`, `deploy-instructions.md`

---

**For issues or questions, check the troubleshooting section above or refer to the backend documentation.**
