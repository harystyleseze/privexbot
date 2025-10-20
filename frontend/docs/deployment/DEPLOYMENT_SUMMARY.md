# Deployment Summary - Environment Variable Fix

## Problem Statement

Production frontend at `https://harystyles.store` was connecting to `http://localhost:8000/api/v1` instead of `https://api.harystyles.store/api/v1`, causing CORS errors and making the app unusable.

Console output showed:
```
API_BASE_URL: 'http://localhost:8000/api/v1'
environment: 'unknown'
mode: 'production'
```

## Root Causes Identified

### 1. Environment Variable Name Mismatch
- **File**: `.env.secretvm`
- **Issue**: Defined `VITE_ENVIRONMENT=production`
- **Expected**: Code (auth.ts:32, env.ts:101) looks for `VITE_ENV`
- **Impact**: Environment showed as "unknown" in console

### 2. Vite Configuration Interference
- **File**: `vite.config.ts`
- **Issue**: Used `define` section to manually set `import.meta.env.*` values
- **Problem**: Vite's `define` is for global constants, NOT for `import.meta.env` variables
- **Impact**: Interfered with Vite's automatic environment variable loading
- **Conflict**: Manual definition prevented proper env var replacement

### 3. Docker Build Cache
- **Issue**: Previous builds used cached layers
- **Impact**: Changes to `.env.secretvm` weren't picked up
- **Solution**: Added `--no-cache` flag to build script

## Solutions Implemented

### Fix 1: Corrected Environment Variable Name
**File**: `frontend/.env.secretvm`

**Change**:
```diff
- VITE_ENVIRONMENT=production
+ VITE_ENV=production  # Fixed: code expects VITE_ENV, not VITE_ENVIRONMENT
```

**Impact**: Environment now correctly shows "production" instead of "unknown"

### Fix 2: Simplified Vite Configuration
**File**: `frontend/vite.config.ts`

**Before**:
```typescript
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(
        env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
      ),
      'import.meta.env.VITE_ENVIRONMENT': JSON.stringify(
        env.VITE_ENVIRONMENT || mode
      ),
      // ...
    },
    // ...
  }
})
```

**After**:
```typescript
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => {
  // Vite automatically loads VITE_* prefixed variables from .env files
  // No need for manual definition - just let Vite handle it
  // Files loaded: .env, .env.local, .env.[mode], .env.[mode].local

  return {
    plugins: [react()],
    // Removed define section - let Vite auto-load
    // ...
  }
})
```

**Why This Works**:
- Vite automatically loads `VITE_*` variables from `.env` files
- During build, Vite replaces all `import.meta.env.VITE_*` with actual values
- The `define` section was creating conflicts and preventing proper replacement
- Simpler configuration = fewer points of failure

**Impact**: Frontend now correctly uses `https://api.harystyles.store/api/v1`

### Fix 3: Enhanced Build Script
**File**: `frontend/scripts/docker/build-push.sh`

**New Features**:
1. **`--secretvm` flag**: Uses `Dockerfile.secretvm` and auto-updates `docker-compose.secretvm.yml`
2. **`--force` flag**: Skips confirmation prompts (for CI/CD)
3. **Auto-update compose**: Automatically updates docker-compose.secretvm.yml with new digest
4. **`--no-cache` build**: Ensures fresh build picks up env changes
5. **SecretVM-specific instructions**: Outputs copy-paste friendly deployment guide

**New Usage**:
```bash
# Build for SecretVM deployment
./scripts/docker/build-push.sh 0.0.2 --secretvm

# With force mode (no prompts)
./scripts/docker/build-push.sh 0.0.2 --secretvm --force
```

**What It Does**:
1. Builds using `Dockerfile.secretvm`
2. Copies `.env.secretvm` → `.env.production` during build
3. Runs `npm run build` (embeds env vars in bundle)
4. Pushes to `harystyles/privexbot-frontend:VERSION`
5. **Automatically updates** `docker-compose.secretvm.yml` with new digest
6. Outputs deployment instructions for SecretVM

**Key Improvements**:
- No manual editing of docker-compose.yml needed
- Guaranteed fresh build with `--no-cache`
- Clear separation between dev and SecretVM builds
- Automated workflow reduces human error

## Verification

### Confirmed Working:
```bash
# Build image
docker build --no-cache -f Dockerfile.secretvm -t harystyles/privexbot-frontend:latest .

# Test locally
docker run --rm -d -p 8888:80 --name test-frontend harystyles/privexbot-frontend:latest

# Verify production API URL is in bundle
docker exec test-frontend sh -c 'cat /usr/share/nginx/html/assets/*.js' | grep -o "https://api.harystyles.store/api/v1"
# Output: https://api.harystyles.store/api/v1 ✅

# Verify localhost is NOT in bundle
docker exec test-frontend sh -c 'cat /usr/share/nginx/html/assets/*.js' | grep -c "http://localhost:8000"
# Output: 0 ✅

# Cleanup
docker stop test-frontend
```

## Technical Deep Dive: How Vite Environment Variables Work

### Build-Time vs Runtime

**Frontend (Vite) - Build Time Only**:
```typescript
// Source code
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

// After build (what's in dist/assets/*.js)
const API_BASE_URL = "https://api.harystyles.store/api/v1";
```

**Key Points**:
1. Variables are **replaced during build**, not loaded at runtime
2. The Docker image contains **hardcoded values** in JavaScript bundle
3. **Cannot** change API URL without rebuilding the entire image
4. This is different from backend where env vars are read at container startup

### Vite's Loading Process

1. **Development** (`npm run dev`):
   - Loads `.env`, `.env.local`, `.env.development`, `.env.development.local`
   - Variables available via `import.meta.env.VITE_*`

2. **Production Build** (`npm run build`):
   - Loads `.env`, `.env.local`, `.env.production`, `.env.production.local`
   - **Replaces** all `import.meta.env.VITE_*` with actual string values
   - Values are **baked into** the JavaScript bundle

3. **Docker Build** (Dockerfile.secretvm):
   ```dockerfile
   # Copy SecretVM env config as .env.production
   COPY .env.secretvm .env.production

   # Build (Vite reads .env.production)
   RUN npm run build
   ```

### Why `define` Was Problematic

**The Issue**:
```typescript
// vite.config.ts with define
export default defineConfig({
  define: {
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL)
  }
})
```

**Problems**:
1. `define` is for **global constant replacement**, not env vars
2. Creates conflict with Vite's built-in env var system
3. May override Vite's automatic loading
4. Adds unnecessary complexity

**Correct Approach**:
```typescript
// vite.config.ts without define
export default defineConfig({
  // Just configure build, let Vite handle env vars automatically
  plugins: [react()],
  // ...
})
```

## Files Changed

### Modified Files:
1. `frontend/.env.secretvm` - Fixed VITE_ENV variable name
2. `frontend/vite.config.ts` - Removed `define` section, simplified config
3. `frontend/scripts/docker/build-push.sh` - Added `--secretvm` and `--force` flags

### Created Files:
1. `frontend/SECRETVM_DEPLOYMENT.md` - Comprehensive deployment guide
2. `frontend/DEPLOYMENT_SUMMARY.md` - This file

### Unchanged (Already Correct):
1. `frontend/Dockerfile.secretvm` - Already copies .env.secretvm → .env.production
2. `frontend/docker-compose.secretvm.yml` - User's format, kept as-is
3. `frontend/nginx.conf` - Already has SPA routing and health checks
4. `frontend/src/api/auth.ts` - Uses import.meta.env correctly
5. `frontend/src/config/env.ts` - Uses import.meta.env correctly

## Deployment Workflow

### For SecretVM Production:

```bash
# 1. Build and push (auto-updates docker-compose.secretvm.yml)
cd frontend
./scripts/docker/build-push.sh 0.0.2 --secretvm --force

# 2. Commit updated docker-compose
git add docker-compose.secretvm.yml
git commit -m "Update SecretVM deployment to v0.0.2"
git push

# 3. Copy docker-compose.secretvm.yml contents

# 4. Paste into SecretVM web interface and deploy
```

### What Happens on SecretVM:
1. Traefik receives HTTPS requests for `harystyles.store`
2. Routes to frontend container on port 80
3. Nginx serves static files from `/usr/share/nginx/html`
4. JavaScript bundle contains hardcoded API URL: `https://api.harystyles.store/api/v1`
5. Frontend makes API calls to backend via Traefik routing

### Expected Result:
- ✅ Frontend loads at `https://harystyles.store`
- ✅ API calls go to `https://api.harystyles.store/api/v1`
- ✅ No CORS errors (same domain with different subdomains)
- ✅ Environment shows "production"
- ✅ All features work correctly

## Key Takeaways

1. **Vite env vars are build-time only** - Cannot change at runtime like backend
2. **Simpler is better** - Removed `define` section, let Vite auto-load
3. **Variable names matter** - `VITE_ENV` not `VITE_ENVIRONMENT`
4. **Cache can hide issues** - Always use `--no-cache` for env changes
5. **Automation reduces errors** - Script now auto-updates docker-compose.yml
6. **Verification is critical** - Always test built image before deploying

## Troubleshooting Checklist

If production shows localhost URL:

- [ ] Check `.env.secretvm` has `VITE_ENV=production` (not VITE_ENVIRONMENT)
- [ ] Verify `vite.config.ts` doesn't have `define` section
- [ ] Rebuild with `--no-cache`: `./scripts/docker/build-push.sh VERSION --secretvm --force`
- [ ] Test built image: Run locally and check browser console
- [ ] Verify correct Dockerfile: Build logs should show "Building SecretVM Docker image"
- [ ] Check docker-compose uses correct digest: Must match pushed image

## Success Criteria

All must be true in production:

✅ Console shows: `API_BASE_URL: 'https://api.harystyles.store/api/v1'`
✅ Console shows: `environment: 'production'`
✅ No CORS errors in network tab
✅ API requests succeed
✅ Wallet authentication works
✅ No errors in console

## Next Steps

1. **Push to Docker Hub** (when network is available):
   ```bash
   docker push harystyles/privexbot-frontend:0.0.2
   docker push harystyles/privexbot-frontend:latest
   ```

2. **Deploy to SecretVM**:
   - Copy `docker-compose.secretvm.yml` (already updated by script)
   - Paste in SecretVM interface
   - Deploy

3. **Verify Production**:
   - Open `https://harystyles.store`
   - Check console for correct API URL
   - Test wallet login flows

## References

- **Vite Env Docs**: https://vitejs.dev/guide/env-and-mode.html
- **Docker Multi-Stage Builds**: https://docs.docker.com/build/building/multi-stage/
- **Traefik Routing**: https://doc.traefik.io/traefik/routing/routers/
- **SECRETVM_DEPLOYMENT.md**: Complete deployment guide
