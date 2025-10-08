# Deployment Troubleshooting Guide

## Issue: Blank Page on Production Deployment

### Symptoms
- Frontend container is running and healthy
- Nginx returns HTTP 200 for index.html and config.js
- Browser shows a blank page with no content
- **No requests for JavaScript/CSS assets in server logs**

### Root Cause Analysis

Based on the logs, the issue is that the browser is **not requesting the bundled JavaScript and CSS files**. This indicates one of the following problems:

1. **MIME Type Mismatch** (Most Likely)
   - ES modules (`type="module"`) require correct MIME type (`application/javascript`)
   - If served with wrong MIME type (e.g., `application/octet-stream`), browser rejects the module
   - Nginx needs explicit MIME type configuration for `.js` files

2. **Content Security Policy (CSP)**
   - Traefik or Nginx might be adding CSP headers that block scripts
   - Check browser console for CSP violation errors

3. **JavaScript Runtime Errors**
   - Module fails to load due to syntax or runtime errors
   - Check browser console for error messages

4. **Mixed Content Issues**
   - HTTPS page trying to load HTTP resources (though unlikely with relative paths)

### Fixes Applied (v0.0.2)

I've made the following changes to fix the MIME type issue:

#### 1. Updated `nginx.conf`
```nginx
# Include MIME types
include /etc/nginx/mime.types;
default_type application/octet-stream;

server {
    ...

    # Ensure correct MIME types for ES modules
    types {
        application/javascript js mjs;
        text/css css;
    }

    # Enabled access logging for debugging (previously disabled)
    location ~* ^/assets/.+\.(js|css|...)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        # access_log off;  # <- Commented out to see requests in logs
    }
}
```

#### 2. New Docker Image
- **Version**: `0.0.2`
- **Digest**: `sha256:2157b177916200b9e534c105f8a80158103b37d754fdba5f3c55fa319b278914`
- **Changes**:
  - Explicit MIME type configuration for `.js` and `.css` files
  - Enabled access logging for `/assets/*` (temporary, for debugging)

### Deployment Steps

#### Step 1: Update Your Docker Compose File

Your `docker-compose.prod.yml` has been updated with the new digest:

```yaml
image: harystyles/privexbot-frontend@sha256:2157b177916200b9e534c105f8a80158103b37d754fdba5f3c55fa319b278914
```

#### Step 2: Pull and Redeploy on SecretVM

SSH into your SecretVM instance and run:

```bash
# Navigate to your deployment directory
cd /path/to/deployment

# Pull the new image
docker pull harystyles/privexbot-frontend@sha256:2157b177916200b9e534c105f8a80158103b37d754fdba5f3c55fa319b278914

# Stop and remove old container
docker compose -f docker-compose.prod.yml down

# Start with new image
docker compose -f docker-compose.prod.yml up -d

# Check logs
docker compose -f docker-compose.prod.yml logs -f frontend-prod
```

#### Step 3: Verify the Fix

After deploying v0.0.2, you should see:

1. **In the logs**:
   ```
   GET /assets/index-DPTlAcC0.js HTTP/1.1" 200 221608
   GET /assets/index-ChclJr39.css HTTP/1.1" 200 50362
   ```
   ↑ These requests were **missing** before!

2. **In the browser**:
   - Page loads with content visible
   - No console errors related to MIME types
   - React app initializes correctly

### Debugging Tools

#### 1. Use the Diagnostic Script (Local Machine or SecretVM)

```bash
# Run from your local machine (if you can access the URL)
./scripts/docker/diagnose.sh https://silver-hedgehog.vm.scrtlabs.com

# Or run from within SecretVM
./scripts/docker/diagnose.sh http://localhost
```

This script will:
- Test if the page loads
- Check if config.js is accessible
- Extract asset filenames from index.html
- Test if JS/CSS assets are accessible
- Verify MIME types
- Check security headers (CSP, HSTS, etc.)

#### 2. Browser DevTools Checklist

Open DevTools (F12) and check:

**Console Tab:**
- Look for errors like:
  - `Failed to load module script: Expected a JavaScript module script but the server responded with a MIME type of "application/octet-stream"`
  - `Refused to execute script from '<URL>' because its MIME type ('text/plain') is not executable`
  - CSP violations
  - CORS errors

**Network Tab:**
- Reload the page and watch for:
  - `/` (index.html) - Should be 200 OK (~577 bytes)
  - `/config.js` - Should be 200 OK (~269 bytes)
  - `/assets/index-*.js` - Should be 200 OK (~220KB)
  - `/assets/index-*.css` - Should be 200 OK (~50KB)
- Check the **Type** column: Should show "script" for JS, "stylesheet" for CSS
- Check **Response Headers** → `Content-Type`: Should be `application/javascript` for JS files

**Elements Tab:**
- Check if `<div id="root"></div>` is empty or has content
- If empty → React didn't initialize (check console for errors)
- If has content → Page is working correctly

#### 3. Manual MIME Type Check

From your terminal (or SecretVM):

```bash
# Check JS file MIME type
curl -sI https://silver-hedgehog.vm.scrtlabs.com/assets/index-DPTlAcC0.js | grep -i content-type

# Expected output:
# content-type: application/javascript
```

If you see `application/octet-stream` or `text/plain`, the MIME type fix didn't apply correctly.

### If Issue Persists After v0.0.2

#### Scenario 1: Assets Still Not Loading

**Check Browser Console:**
1. Open DevTools (F12) → Console tab
2. Look for specific error messages
3. Share the exact error with the development team

**Check Network Requests:**
1. Open DevTools (F12) → Network tab
2. Reload the page
3. Check if `/assets/*.js` requests appear
4. If they don't appear → Browser is refusing to request them (likely MIME type or CSP issue)
5. If they appear but fail → Check status code and response headers

#### Scenario 2: Assets Load But Page Is Still Blank

This suggests the assets are loading correctly, but there's a runtime JavaScript error:

**Check Console for:**
- React initialization errors
- API connection errors (check if `API_BASE_URL` is accessible)
- Module import errors
- Uncaught exceptions

**Common Causes:**
1. **API Not Accessible**: The frontend can't reach the backend API
   - Check if `API_BASE_URL` (https://api.privexbot.com/api/v1) is accessible from the browser
   - Check CORS headers on the API
   - Check if API is running

2. **Runtime Configuration Issue**: Check `/config.js` content:
   ```bash
   curl https://silver-hedgehog.vm.scrtlabs.com/config.js
   ```
   Should show:
   ```javascript
   window.ENV_CONFIG = {
     API_BASE_URL: "https://api.privexbot.com/api/v1",
     WIDGET_CDN_URL: "https://cdn.privexbot.com",
     ENVIRONMENT: "production"
   };
   ```

3. **React Router Issue**: Check if the app works on the root path `/` but fails on other routes

#### Scenario 3: HTTPS/Traefik Issues

If the issue is related to the Traefik reverse proxy:

**Check Traefik Logs:**
```bash
docker logs traefik
```

**Check Traefik Headers:**
```bash
curl -I https://silver-hedgehog.vm.scrtlabs.com/
```

Look for:
- `content-security-policy:` - Might block scripts
- `strict-transport-security:` - Forces HTTPS (good)
- `x-content-type-options: nosniff` - Requires correct MIME types (already have this)

**Verify TLS Configuration:**
- Ensure `/mnt/secure/cert/secret_vm_fullchain.pem` exists and is valid
- Check certificate expiry
- Verify Traefik can read the certificate files

### Quick Reference: Version History

| Version | Changes | Digest |
|---------|---------|--------|
| 0.0.1 | Initial deployment | `sha256:3abf5a7d...` |
| 0.0.2 | **MIME type fix for ES modules**<br>- Added explicit MIME types<br>- Enabled asset access logging | `sha256:2157b177...` |

### Next Steps After Successful Deployment

1. **Monitor Logs**: Watch for any new errors or warnings
   ```bash
   docker compose -f docker-compose.prod.yml logs -f
   ```

2. **Test Key Features**:
   - User authentication
   - API connectivity
   - Chatbot creation
   - Knowledge base management

3. **Performance Check**:
   - Measure page load time
   - Check for console warnings
   - Verify all assets load quickly

4. **Disable Debug Logging** (After Confirming Fix):
   In `nginx.conf`, uncomment the line:
   ```nginx
   access_log off;  # <- Uncomment this after debugging
   ```
   Then rebuild and redeploy (version 0.0.3)

### Contact & Support

If you continue to experience issues:

1. **Capture diagnostics**:
   ```bash
   ./scripts/docker/diagnose.sh https://silver-hedgehog.vm.scrtlabs.com > diagnostics.txt
   ```

2. **Export browser console logs**:
   - Open DevTools → Console
   - Right-click → "Save as..."

3. **Share logs**:
   - Container logs: `docker compose logs frontend-prod > container.log`
   - Traefik logs: `docker logs traefik > traefik.log`

4. **Provide details**:
   - Browser and version
   - Steps to reproduce
   - Expected vs actual behavior

---

## Summary

The most likely issue was **MIME type mismatch** preventing ES modules from loading. Version 0.0.2 includes explicit MIME type configuration that should resolve this.

**Action Required**: Deploy v0.0.2 and verify assets load correctly in browser DevTools.
