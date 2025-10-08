# SecretVM Deployment - Step by Step Fix

## Issue Diagnosis

**Problem**: 504 Gateway Timeout
**Root Cause**: Traefik Docker provider not starting - logs show ONLY "Configuration loaded from flags" with no router discovery

## Steps to Fix

### Step 1: Clean Up Orphan Containers

```bash
# SSH into SecretVM
cd /mnt/secure/docker_wd

# Stop everything
docker compose down --remove-orphans

# Verify nothing running
docker ps

# Remove old containers if any
docker rm -f privexbot-frontend-prod 2>/dev/null || true
docker rm -f traefik-proxy 2>/dev/null || true
```

### Step 2: Upload Correct Compose File

Upload `docker-compose-secretvm-final.yml` as `/mnt/secure/docker_wd/docker-compose.yml`

**The file MUST be named `docker-compose.yml`** (not docker-compose.secretvm.yml) because SecretVM looks for this specific name.

### Step 3: Verify TLS Certificates Exist

```bash
# Check certs exist
ls -la /mnt/secure/cert/

# Should show:
# secret_vm_fullchain.pem
# secret_vm_private.pem
```

### Step 4: Deploy

```bash
cd /mnt/secure/docker_wd

# Pull latest image
docker pull harystyles/privexbot-frontend@sha256:c22827b655639479d0a81f5c5e627d901161c3b5d973d7839f8f36a581c363a7

# Start services
docker compose up -d

# CRITICAL: Watch Traefik logs for Docker provider startup
docker logs docker_wd-traefik-1 -f
```

### Step 5: Verify Traefik Logs

**Expected Traefik output:**
```
time="..." level=info msg="Configuration loaded from flags."
time="..." level=info msg="Traefik version 2.10.7 built on..."
time="..." level=info msg="Starting provider aggregator aggregator.ProviderAggregator"
time="..." level=info msg="Starting provider *docker.Provider"
time="..." level=info msg="Starting provider *file.Provider"
time="..." level=info msg="Starting provider *acme.ChallengeTLSALPN"
time="..." level=info msg="Starting provider *traefik.Provider"
```

**If you ONLY see "Configuration loaded from flags"**:
- Traefik is failing to start providers
- Check: `docker exec docker_wd-traefik-1 ls -la /etc/traefik/dynamic/`
- Should show: `tls.yml`

### Step 6: Verify Container Discovery

```bash
# Check Traefik can see the app container
docker exec docker_wd-traefik-1 wget -qO- http://app

# Should return: <!doctype html>...

# Check app is responding
curl http://localhost:8080/

# Should return: <!doctype html>...
```

### Step 7: Test in Browser

Visit: https://silver-hedgehog.vm.scrtlabs.com

**Expected**:
- ✅ 200 OK (not 504)
- ✅ Page displays
- ✅ Assets load

## If Still Getting 504

### Debug Checklist

1. **Verify Traefik sees containers**:
   ```bash
   docker logs docker_wd-traefik-1 2>&1 | grep -i "creating router"

   # Should show:
   # Creating router app@docker
   ```

2. **Verify network**:
   ```bash
   docker network inspect traefik | grep -E "app|traefik"

   # Should show both containers on the network
   ```

3. **Test direct Traefik access**:
   ```bash
   # From host
   curl -H "Host: silver-hedgehog.vm.scrtlabs.com" http://localhost
   ```

4. **Check Traefik config**:
   ```bash
   docker exec docker_wd-traefik-1 cat /etc/traefik/dynamic/tls.yml

   # Should show TLS config
   ```

5. **Verify Docker socket permissions**:
   ```bash
   docker exec docker_wd-traefik-1 ls -la /var/run/docker.sock

   # Should be readable
   ```

## Alternative: Minimal Test Without TLS

If TLS config is causing issues, test without it first:

```yaml
# Minimal docker-compose.yml (test only)
version: "3.8"

services:
  app:
    image: harystyles/privexbot-frontend@sha256:c22827b655639479d0a81f5c5e627d901161c3b5d973d7839f8f36a581c363a7
    ports:
      - "8080:80"
    networks:
      - traefik
    labels:
      - traefik.enable=true
      - traefik.http.routers.app.rule=Host(`silver-hedgehog.vm.scrtlabs.com`)
      - traefik.http.routers.app.entrypoints=web
      - traefik.http.services.app.loadbalancer.server.port=80

  traefik:
    image: traefik:v2.10
    command:
      - --api.insecure=false
      - --providers.docker=true
      - --providers.docker.exposedbydefault=false
      - --entrypoints.web.address=:80
    ports:
      - 80:80
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    networks:
      - traefik

networks:
  traefik:
    driver: bridge
```

Test with HTTP first: http://silver-hedgehog.vm.scrtlabs.com

If this works, then the issue is TLS-related.

## Success Criteria

✅ Traefik logs show "Creating router app@docker"
✅ App accessible via https://silver-hedgehog.vm.scrtlabs.com
✅ No 504 timeout
✅ Page loads with content

## Commands Reference

```bash
# View all logs
docker compose logs -f

# Restart Traefik only
docker compose restart traefik

# Restart app only
docker compose restart app

# Full restart
docker compose down && docker compose up -d

# Debug Traefik routing
docker exec docker_wd-traefik-1 wget -O- http://localhost:8080/api/http/routers

# Check what Traefik sees
docker exec docker_wd-traefik-1 sh -c "apk add curl && curl http://localhost:8080/api/rawdata"
```

---

**Key Point**: The file MUST be `docker-compose.yml` in `/mnt/secure/docker_wd/` for SecretVM to use it automatically.
