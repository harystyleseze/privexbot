# SecretVM Deployment Fix - Port Conflict Resolution

## Issue Identified

**Error**: `ERR_CONNECTION_REFUSED` in browser

**Root Cause**: **Port Conflict** - Both `frontend-prod` and `traefik` services are trying to bind to port 80:

```yaml
# ❌ WRONG - Port conflict!
services:
  frontend-prod:
    ports:
      - "80:80"  # <- Trying to bind to port 80

  traefik:
    ports:
      - 80:80    # <- Also trying to bind to port 80!
      - 443:443
```

**Result**: One service fails to start, causing connection refused errors.

## The Fix

When using Traefik as a reverse proxy:
- ✅ **Traefik** binds to ports 80 and 443 (handles all external traffic)
- ✅ **Frontend** does NOT expose ports (only accessible through Traefik)
- ✅ Traefik routes requests to frontend based on Host header

## Deployment Steps

### Step 1: Stop Current Deployment

SSH into your SecretVM and stop the conflicting containers:

```bash
# Stop all services
docker compose -f docker-compose.prod.yml down

# Verify no containers are using port 80
docker ps | grep :80
```

### Step 2: Use the Corrected Configuration

I've created `docker-compose.secretvm.yml` with the correct configuration.

**Upload this file to your SecretVM** and deploy:

```bash
# Deploy with the corrected configuration
docker compose -f docker-compose.secretvm.yml up -d

# Verify both services are running
docker compose -f docker-compose.secretvm.yml ps
```

**Expected output**:
```
NAME                     STATUS              PORTS
privexbot-frontend-prod  Up (healthy)
traefik-proxy            Up                  0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
```

### Step 3: Verify the Fix

**Check Traefik logs**:
```bash
docker logs traefik-proxy --tail 50
```

Look for:
- ✅ `Configuration loaded from file` (TLS config)
- ✅ `Server configuration reloaded` (Docker provider)
- ✅ `Creating router frontend-https` (Frontend routing)

**Check Frontend logs**:
```bash
docker logs privexbot-frontend-prod --tail 20
```

Look for:
- ✅ `Generated runtime configuration:` (Config.js created)
- ✅ No Nginx errors

**Test in Browser**:
1. Open: https://silver-hedgehog.vm.scrtlabs.com
2. Open DevTools (F12) → Network tab
3. **Expected**:
   - ✅ Page loads (no connection errors)
   - ✅ Assets load: `/assets/index-*.js` and `/assets/index-*.css`
   - ✅ HTTPS connection (green padlock)

## Key Configuration Changes

### 1. Frontend Service - NO Port Exposure

```yaml
frontend-prod:
  image: harystyles/privexbot-frontend@sha256:2157b177916200b9e534c105f8a80158103b37d754fdba5f3c55fa319b278914

  # ✅ NO ports exposed - Traefik handles external access
  # ports:
  #   - "80:80"  # <- REMOVED

  networks:
    - privexbot-prod
    - traefik  # <- Must be on traefik network

  labels:
    - "traefik.enable=true"
    - "traefik.http.routers.frontend-https.rule=Host(`silver-hedgehog.vm.scrtlabs.com`)"
    - "traefik.http.services.frontend-prod.loadbalancer.server.port=80"
```

### 2. Traefik Service - Handles All External Traffic

```yaml
traefik:
  image: traefik:v2.10

  ports:
    - "80:80"    # ✅ Traefik binds to port 80 (HTTP)
    - "443:443"  # ✅ Traefik binds to port 443 (HTTPS)

  networks:
    - traefik

  volumes:
    - /var/run/docker.sock:/var/run/docker.sock:ro
    - /mnt/secure/cert:/certs:ro
```

### 3. HTTP to HTTPS Redirect

The configuration includes automatic HTTP → HTTPS redirect:

```yaml
labels:
  # HTTP Router (redirects to HTTPS)
  - "traefik.http.routers.frontend-http.rule=Host(`silver-hedgehog.vm.scrtlabs.com`)"
  - "traefik.http.routers.frontend-http.entrypoints=web"
  - "traefik.http.routers.frontend-http.middlewares=redirect-to-https"

  # Redirect middleware
  - "traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https"
```

## Troubleshooting

### Issue: Traefik doesn't detect frontend

**Check**:
```bash
# Verify both containers are on traefik network
docker network inspect traefik | grep privexbot-frontend-prod
```

**Fix**: Ensure frontend has `traefik.enable=true` label and is on `traefik` network.

### Issue: TLS certificate errors

**Check certificate files**:
```bash
# On SecretVM
ls -la /mnt/secure/cert/
```

**Expected files**:
- `secret_vm_fullchain.pem` (public certificate + chain)
- `secret_vm_private.pem` (private key)

**Verify certificate**:
```bash
openssl x509 -in /mnt/secure/cert/secret_vm_fullchain.pem -text -noout | grep -A 2 "Subject:"
```

### Issue: Still getting connection refused

**Diagnostic steps**:

1. **Check what's listening on ports**:
   ```bash
   netstat -tlnp | grep :80
   netstat -tlnp | grep :443
   ```

2. **Verify Traefik is running**:
   ```bash
   docker ps | grep traefik
   ```

3. **Check Traefik routing**:
   ```bash
   docker logs traefik-proxy | grep frontend
   ```

4. **Test direct container access** (should work):
   ```bash
   # From SecretVM host
   curl -H "Host: silver-hedgehog.vm.scrtlabs.com" http://localhost
   ```

5. **Test TLS** (should work):
   ```bash
   curl -k https://silver-hedgehog.vm.scrtlabs.com
   ```

## Alternative: Simple Deployment Without Traefik

If you want to test without Traefik first, use `docker-compose.prod.yml`:

```yaml
# docker-compose.prod.yml - Simple deployment
services:
  frontend-prod:
    image: harystyles/privexbot-frontend@sha256:2157b177916200b9e534c105f8a80158103b37d754fdba5f3c55fa319b278914

    ports:
      - "80:80"  # ✅ OK when NOT using Traefik

    networks:
      - privexbot-prod

    # NO Traefik labels needed
```

Deploy:
```bash
docker compose -f docker-compose.prod.yml up -d
```

Access via HTTP (not HTTPS): http://silver-hedgehog.vm.scrtlabs.com

## Summary

**Problem**: Port 80 conflict between frontend and Traefik
**Solution**: Frontend should NOT expose ports when using Traefik
**File**: Use `docker-compose.secretvm.yml` for Traefik deployments

**Next**: After successful deployment, verify in browser and check logs for any errors.
