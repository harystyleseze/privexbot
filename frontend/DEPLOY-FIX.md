# Quick Deployment Fix - Traefik 404 Resolution

## Issue Fixed
The 404 error was caused by **missing service references** in Traefik router labels.

## What Was Wrong
```yaml
# ❌ BEFORE - Router not linked to service
- "traefik.http.routers.frontend-https.rule=Host(`silver-hedgehog.vm.scrtlabs.com`)"
- "traefik.http.routers.frontend-https.entrypoints=websecure"
- "traefik.http.services.frontend-prod.loadbalancer.server.port=80"
# Router doesn't know to use frontend-prod service!
```

## Fixed Configuration
```yaml
# ✅ AFTER - Router explicitly linked to service
- "traefik.http.routers.frontend-https.rule=Host(`silver-hedgehog.vm.scrtlabs.com`)"
- "traefik.http.routers.frontend-https.entrypoints=websecure"
- "traefik.http.routers.frontend-https.service=frontend-prod"  # <- Added!
- "traefik.http.services.frontend-prod.loadbalancer.server.port=80"
```

## Deploy the Fix (On SecretVM)

### Step 1: Upload Updated File

Upload the corrected `docker-compose.secretvm.yml` to your SecretVM.

### Step 2: Restart Services

```bash
# Navigate to deployment directory
cd /path/to/deployment

# Restart with updated configuration
docker compose -f docker-compose.secretvm.yml down
docker compose -f docker-compose.secretvm.yml up -d

# Watch logs
docker compose -f docker-compose.secretvm.yml logs -f
```

### Step 3: Verify Success

**Expected in Traefik logs**:
```
Creating router frontend-http@docker
Creating router frontend-https@docker
Creating service frontend-prod@docker
```

**Expected in browser** (https://silver-hedgehog.vm.scrtlabs.com):
- ✅ Page loads (no 404)
- ✅ Content displays
- ✅ Assets load: `/assets/index-*.js`, `/assets/index-*.css`

### Troubleshooting Commands

**Check Traefik router configuration**:
```bash
docker logs traefik-proxy 2>&1 | grep -i "router frontend"
```

**Check Traefik service configuration**:
```bash
docker logs traefik-proxy 2>&1 | grep -i "service frontend"
```

**Test direct access to frontend** (bypass Traefik):
```bash
# From SecretVM host
docker exec privexbot-frontend-prod wget -qO- http://localhost
```

**Verify Traefik can reach frontend**:
```bash
# Check network connectivity
docker exec traefik-proxy wget -qO- http://privexbot-frontend-prod
```

## Complete docker-compose.secretvm.yml (Corrected)

The updated file includes:

1. ✅ **No port conflict** - Frontend doesn't expose ports
2. ✅ **Correct routing** - Routers linked to service
3. ✅ **HTTPS support** - TLS with SecretVM certificates
4. ✅ **HTTP redirect** - Auto redirect HTTP → HTTPS
5. ✅ **Network isolation** - Proper network configuration

## What's Next

After successful deployment:

1. **Verify functionality** - Test chatbot features, API connectivity
2. **Check performance** - Monitor page load times
3. **Review logs** - Look for warnings or errors
4. **Plan updates** - Consider versioning strategy for future deployments

## Summary

**Root Cause**: Traefik routers not linked to service definition
**Fix**: Added `.service=frontend-prod` to both HTTP and HTTPS routers
**Status**: Ready to deploy

Upload `docker-compose.secretvm.yml` and restart services!
