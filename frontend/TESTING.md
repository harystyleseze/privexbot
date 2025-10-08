# Docker Setup Testing Guide

This guide will help you test the Docker setup for both development and production environments.

## Pre-Testing Checklist

Before testing, ensure you have:

- [ ] Docker installed (20.10+)
- [ ] Docker Compose installed (2.0+)
- [ ] Docker daemon running
- [ ] Logged in to Docker Hub (for production testing)

### Quick Check

```bash
cd frontend
./scripts/docker/check.sh
```

This script will verify all prerequisites.

---

## Testing Development Environment

### Step 1: Start Development Environment

```bash
cd frontend
./scripts/docker/dev.sh up
```

**Expected Output:**
```
ℹ  Starting development environment...
[+] Building ...
[+] Running 1/1
 ✔ Container privexbot-frontend-dev  Started
✔  Development environment started
ℹ  Frontend available at: http://localhost:5173
```

### Step 2: Verify Container is Running

```bash
docker ps
```

**Expected Output:**
```
CONTAINER ID   IMAGE                     STATUS         PORTS                    NAMES
abc123...      frontend-dev              Up 5 seconds   0.0.0.0:5173->5173/tcp  privexbot-frontend-dev
```

### Step 3: Check Logs

```bash
./scripts/docker/dev.sh logs
```

**Expected Output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://172.x.x.x:5173/
```

### Step 4: Access Application

Open your browser and navigate to: **http://localhost:5173**

**Expected Result:**
- Application loads successfully
- No console errors

### Step 5: Test Hot Reload

1. Open `src/App.tsx` in your editor
2. Make a small change (e.g., change a text string)
3. Save the file
4. Check browser

**Expected Result:**
- Browser automatically refreshes
- Changes are visible immediately
- No manual refresh needed

### Step 6: Test API Configuration

Open browser console and run:

```javascript
console.log(window.ENV_CONFIG);
```

**Expected Output:**
```javascript
{
  API_BASE_URL: "http://localhost:8000/api/v1",
  WIDGET_CDN_URL: "http://localhost:8080",
  ENVIRONMENT: "development"
}
```

### Step 7: Stop Development Environment

```bash
./scripts/docker/dev.sh down
```

**Expected Output:**
```
ℹ  Stopping development environment...
[+] Running 1/1
 ✔ Container privexbot-frontend-dev  Removed
✔  Development environment stopped
```

### Development Environment Test Results

- [ ] Container starts successfully
- [ ] Application accessible at localhost:5173
- [ ] Hot reload works
- [ ] ENV_CONFIG is loaded
- [ ] Logs show Vite server running
- [ ] Container stops cleanly

---

## Testing Production Build

### Step 1: Ensure Docker Hub Login

```bash
docker login
```

Enter credentials:
- Username: `harystyles`
- Password: Your Docker Hub token

### Step 2: Build Production Image

```bash
cd frontend
./scripts/docker/build-push.sh 0.1.0-test
```

**Expected Output:**
```
ℹ  PrivexBot Frontend - Build and Push Script
ℹ  Version: 0.1.0-test

ℹ  Checking prerequisites...
✔  All prerequisites met

✔  Version 0.1.0-test is valid

ℹ  Building Docker image: harystyles/privexbot-frontend:0.1.0-test
[+] Building ...
✔  Image built successfully

ℹ  Pushing image to Docker Hub...
✔  Image pushed successfully

╔════════════════════════════════════════════════════════════════╗
║                  IMAGE DIGEST (PRODUCTION)                     ║
╠════════════════════════════════════════════════════════════════╣
║  image: harystyles/privexbot-frontend@sha256:abc123...        ║
╚════════════════════════════════════════════════════════════════╝

✔  All steps completed successfully!
```

### Step 3: Verify Image on Docker Hub

1. Go to https://hub.docker.com
2. Login
3. Navigate to `harystyles/privexbot-frontend`
4. Check tags - you should see `0.1.0-test` and `latest`

### Step 4: Update Production Compose File

Copy the digest from the build output and update `docker-compose.prod.yml`:

```yaml
services:
  frontend-prod:
    image: harystyles/privexbot-frontend@sha256:abc123...
```

### Step 5: Test Production Container Locally

```bash
docker compose -f docker-compose.prod.yml up -d
```

**Expected Output:**
```
[+] Running 1/1
 ✔ Container privexbot-frontend-prod  Started
```

### Step 6: Verify Container is Running

```bash
docker ps
```

**Expected Output:**
```
CONTAINER ID   IMAGE                                 STATUS         PORTS                 NAMES
xyz789...      harystyles/privexbot-frontend@sha...  Up 10 seconds  0.0.0.0:80->80/tcp   privexbot-frontend-prod
```

### Step 7: Check Container Logs

```bash
docker logs privexbot-frontend-prod
```

**Expected Output:**
```
Generated runtime configuration:
window.ENV_CONFIG = {
  API_BASE_URL: "https://api.privexbot.com/api/v1",
  WIDGET_CDN_URL: "https://cdn.privexbot.com",
  ENVIRONMENT: "production"
};
```

### Step 8: Access Application

Open browser and navigate to: **http://localhost:80** or **http://localhost**

**Expected Result:**
- Application loads successfully
- Production build (minified, optimized)
- No console errors

### Step 9: Verify Runtime Configuration

Open browser console and run:

```javascript
console.log(window.ENV_CONFIG);
```

**Expected Output:**
```javascript
{
  API_BASE_URL: "https://api.privexbot.com/api/v1",
  WIDGET_CDN_URL: "https://cdn.privexbot.com",
  ENVIRONMENT: "production"
}
```

### Step 10: Test Nginx Configuration

Test these URLs in browser:

1. **Root**: http://localhost/ - Should load app
2. **Deep link**: http://localhost/dashboard - Should load app (not 404)
3. **Assets**: Check Network tab - Static assets should have long cache headers
4. **Config**: http://localhost/config.js - Should return config file

**Expected Results:**
- All routes work (SPA fallback working)
- Static assets cached properly
- config.js loads without cache

### Step 11: Test Health Check

```bash
docker inspect privexbot-frontend-prod | grep -A 10 Health
```

**Expected Output:**
Should show health check passing.

### Step 12: Test Image Digest Immutability

```bash
# Get current digest
docker inspect harystyles/privexbot-frontend:0.1.0-test --format='{{index .RepoDigests 0}}'

# Pull by digest
docker pull harystyles/privexbot-frontend@sha256:abc123...
```

**Expected Result:**
- Digest remains consistent
- Pull by digest works

### Step 13: Stop Production Container

```bash
docker compose -f docker-compose.prod.yml down
```

**Expected Output:**
```
[+] Running 1/1
 ✔ Container privexbot-frontend-prod  Removed
```

### Production Build Test Results

- [ ] Image builds successfully
- [ ] Image pushes to Docker Hub
- [ ] Digest is generated
- [ ] Container runs from digest
- [ ] Application accessible at localhost:80
- [ ] Runtime config generated correctly
- [ ] SPA routing works (deep links don't 404)
- [ ] Static assets cached properly
- [ ] Health check passes
- [ ] Container stops cleanly

---

## Testing GitHub Actions (Manual Trigger)

### Prerequisites

- [ ] GitHub repository exists
- [ ] Workflow file committed to `main` branch
- [ ] Docker Hub secrets configured

### Step 1: Verify Secrets

1. Go to GitHub repository
2. Settings → Secrets and variables → Actions
3. Verify secrets exist:
   - `DOCKER_USERNAME` = `harystyles`
   - `DOCKER_PASSWORD` = `<your-token>`

### Step 2: Trigger Workflow

1. Go to **Actions** tab
2. Click **Frontend - Build and Push Docker Image**
3. Click **Run workflow**
4. Fill in:
   - Branch: `main`
   - Version: `0.1.0-ci-test`
   - Environment: `development`
5. Click **Run workflow**

### Step 3: Monitor Workflow

1. Watch the workflow run
2. Check each step completes successfully
3. Look for any errors

### Step 4: Verify Summary

After completion:

1. Click on the completed workflow run
2. Go to **Summary** tab
3. Verify:
   - Image information is displayed
   - Tags are correct
   - Digest is shown
   - Deployment instructions are present

### Step 5: Download Artifacts

1. Scroll to **Artifacts** section
2. Download `docker-image-info-0.1.0-ci-test`
3. Extract and verify contents:
   - `image-info.json` - Machine-readable info
   - `deploy-instructions.md` - Deployment guide

### Step 6: Verify on Docker Hub

1. Go to Docker Hub
2. Check `harystyles/privexbot-frontend`
3. Verify `0.1.0-ci-test` tag exists

### GitHub Actions Test Results

- [ ] Workflow triggers successfully
- [ ] All steps complete without errors
- [ ] Summary shows correct information
- [ ] Artifacts are generated
- [ ] Image appears on Docker Hub
- [ ] Digest is valid and usable

---

## Common Issues and Solutions

### Issue: Port Already in Use

**Error**: `Bind for 0.0.0.0:5173 failed: port is already allocated`

**Solution**:
```bash
# Find process using port
lsof -i :5173

# Kill process or change port in docker-compose.dev.yml
```

### Issue: Changes Not Reflecting

**Problem**: Code changes don't show in browser

**Solutions**:
1. Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows/Linux)
2. Restart container: `./scripts/docker/dev.sh restart`
3. Rebuild: `./scripts/docker/dev.sh clean && ./scripts/docker/dev.sh up`

### Issue: Docker Daemon Not Running

**Error**: `Cannot connect to the Docker daemon`

**Solution**:
- macOS/Windows: Start Docker Desktop
- Linux: `sudo systemctl start docker`

### Issue: Not Logged in to Docker Hub

**Error**: `denied: requested access to the resource is denied`

**Solution**:
```bash
docker login
# Enter username: harystyles
# Enter password/token
```

### Issue: Build Fails with npm Error

**Problem**: Dependencies fail to install

**Solution**:
```bash
# Clear npm cache
docker compose -f docker-compose.dev.yml run --rm frontend-dev npm cache clean --force

# Rebuild
./scripts/docker/dev.sh clean
./scripts/docker/dev.sh up
```

### Issue: Nginx 404 on Routes

**Problem**: Direct navigation to routes returns 404

**Solution**:
- Verify `nginx.conf` has `try_files $uri $uri/ /index.html;`
- Rebuild production image
- Check Nginx logs: `docker logs privexbot-frontend-prod`

---

## Performance Testing

### Check Image Sizes

```bash
docker images harystyles/privexbot-frontend
```

**Good sizes:**
- Development: ~500MB-1GB (includes dev dependencies)
- Production: ~50-100MB (minimal, Alpine + Nginx)

### Check Build Time

```bash
time ./scripts/docker/build-push.sh 0.1.0-perf-test
```

**Good times:**
- First build: 2-5 minutes
- Cached build: 30-60 seconds

### Check Startup Time

```bash
time docker compose -f docker-compose.prod.yml up -d
```

**Good times:**
- First pull: 30-60 seconds
- Subsequent starts: 2-5 seconds

---

## Final Checklist

Before considering setup complete:

### Development
- [ ] Dev environment starts successfully
- [ ] Hot reload works
- [ ] Logs are accessible
- [ ] Can open shell in container
- [ ] Environment variables loaded
- [ ] Can stop/restart/clean

### Production
- [ ] Production build completes
- [ ] Image pushes to Docker Hub
- [ ] Digest extraction works
- [ ] Production container runs
- [ ] Runtime config generated
- [ ] SPA routing works
- [ ] Caching configured correctly
- [ ] Health check passes

### CI/CD
- [ ] GitHub secrets configured
- [ ] Workflow triggers successfully
- [ ] All workflow steps pass
- [ ] Summary generated correctly
- [ ] Artifacts uploaded
- [ ] Image available on Docker Hub

### Documentation
- [ ] DOCKER.md is comprehensive
- [ ] Scripts have README
- [ ] Workflow has README
- [ ] TESTING.md (this file) covers all scenarios

---

## Next Steps

After successful testing:

1. **Clean up test images** (optional):
   ```bash
   docker rmi harystyles/privexbot-frontend:0.1.0-test
   docker rmi harystyles/privexbot-frontend:0.1.0-ci-test
   docker rmi harystyles/privexbot-frontend:0.1.0-perf-test
   ```

2. **Tag your release**:
   ```bash
   git tag -a v0.1.0 -m "First MVP release"
   git push origin v0.1.0
   ```

3. **Build official release**:
   ```bash
   ./scripts/docker/build-push.sh 0.1.0
   ```

4. **Update CLAUDE.md** with Docker information

5. **Deploy to staging/production**

---

## Support

If you encounter issues not covered here:

1. Check `DOCKER.md` for detailed documentation
2. Run `./scripts/docker/check.sh` for diagnostics
3. Check Docker logs: `docker logs <container-name>`
4. Review GitHub Actions logs
5. Consult Docker documentation: https://docs.docker.com
