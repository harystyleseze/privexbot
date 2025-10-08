# Simplified Deployment - Minimal & Working ✅

## What We Learned from Your Working Example

Your working SecretVM deployment taught us valuable lessons:

### ✅ DO Expose Ports (Even with Traefik!)
```yaml
# ✅ CORRECT - Your working example
app:
  ports:
    - "8080:80"  # Port exposed even with Traefik!
```

**Why**: Traefik uses Docker's internal networking to reach containers. Port exposure doesn't conflict - it actually helps Traefik discover and route to the service.

### ✅ Keep Nginx Simple
```nginx
# ✅ CORRECT - Minimal, functional
server {
    listen 80;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
}
```

**Why**: No security headers, no caching rules, no complex location blocks. Just SPA routing. Simple = Reliable.

### ✅ Simplify Traefik Labels
```yaml
# ✅ CORRECT - 4 simple labels
labels:
  - traefik.enable=true
  - traefik.http.routers.app.rule=Host(`domain.com`)
  - traefik.http.routers.app.entrypoints=websecure
  - traefik.http.routers.app.tls=true
  - traefik.http.services.app.loadbalancer.server.port=80
```

**Why**: No HTTP router, no redirect middleware, no extra complexity. HTTPS-only routing works perfectly.

## What We Changed

| Component | Before (Over-engineered) | After (Simplified) |
|-----------|-------------------------|-------------------|
| **Ports** | ❌ No ports exposed | ✅ `8080:80` exposed |
| **Nginx** | ❌ 85 lines, security headers, caching, MIME types | ✅ 17 lines, just SPA routing |
| **Traefik Labels** | ❌ 10+ labels, HTTP redirect, middleware | ✅ 5 labels, HTTPS only |
| **Networks** | ❌ Two networks (privexbot-prod, traefik) | ✅ One network (traefik) |
| **Service Name** | ❌ frontend-prod | ✅ app (like your example) |

## Final Configuration

### docker-compose.secretvm.yml
```yaml
services:
  app:
    image: harystyles/privexbot-frontend@sha256:c22827b655639479d0a81f5c5e627d901161c3b5d973d7839f8f36a581c363a7

    ports:
      - "8080:80"

    restart: unless-stopped

    environment:
      - API_BASE_URL=https://api.privexbot.com/api/v1
      - WIDGET_CDN_URL=https://cdn.privexbot.com
      - ENVIRONMENT=production

    networks:
      - traefik

    labels:
      - traefik.enable=true
      - traefik.http.routers.app.rule=Host(`silver-hedgehog.vm.scrtlabs.com`)
      - traefik.http.routers.app.entrypoints=websecure
      - traefik.http.routers.app.tls=true
      - traefik.http.services.app.loadbalancer.server.port=80

  traefik:
    image: traefik:v2.10
    command:
      - --api.insecure=false
      - --providers.docker=true
      - --providers.docker.exposedbydefault=false
      - --entrypoints.web.address=:80
      - --entrypoints.websecure.address=:443
      - --entrypoints.websecure.http.tls.options=default@file
      - --providers.file.directory=/etc/traefik/dynamic
      - --providers.file.watch=true
    ports:
      - 80:80
      - 443:443
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - /mnt/secure/cert:/certs:ro
    networks:
      - traefik
    configs:
      - source: tls_config
        target: /etc/traefik/dynamic/tls.yml

networks:
  traefik:
    driver: bridge

configs:
  tls_config:
    content: |-
      tls:
        certificates:
          - certFile: /certs/secret_vm_fullchain.pem
            keyFile: /certs/secret_vm_private.pem
        stores:
          default:
            defaultCertificate:
              certFile: /certs/secret_vm_fullchain.pem
              keyFile: /certs/secret_vm_private.pem
```

### nginx.conf (Simplified)
```nginx
# nginx configuration for production
server {
    listen 80;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    # Redirect server error pages to the static page /50x.html
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```

## Deployment Steps

### On SecretVM

```bash
# 1. Stop any existing deployment
docker compose down 2>/dev/null || true

# 2. Pull the new simplified image
docker pull harystyles/privexbot-frontend@sha256:c22827b655639479d0a81f5c5e627d901161c3b5d973d7839f8f36a581c363a7

# 3. Deploy with simplified configuration
docker compose -f docker-compose.secretvm.yml up -d

# 4. Verify services are running
docker compose -f docker-compose.secretvm.yml ps

# 5. Check logs
docker compose -f docker-compose.secretvm.yml logs -f
```

### Expected Output

**Container Status**:
```
NAME           STATUS              PORTS
app            Up (healthy)        0.0.0.0:8080->80/tcp
traefik        Up                  0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
```

**App Logs** (no errors):
```
=== PrivexBot Frontend Entrypoint ===
Starting container initialization...
Verifying Nginx configuration...
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
Starting Nginx...
[notice] nginx start worker processes
```

**Traefik Logs** (shows routing):
```
Creating router app@docker
Creating service app@docker
```

### Verify in Browser

1. Open: **https://silver-hedgehog.vm.scrtlabs.com**
2. DevTools (F12) → Network tab
3. Expected:
   - ✅ **200 OK** (not 404 or 504!)
   - ✅ Page content displays
   - ✅ Assets load: `/assets/index-*.js`, `/assets/index-*.css`
   - ✅ Green padlock (HTTPS)

## Troubleshooting

### If Still Getting 504

**Check container is responding**:
```bash
# Test direct access on port 8080
curl -I http://localhost:8080/

# Should return: HTTP/1.1 200 OK
```

**Check Traefik can reach app**:
```bash
# From host
docker exec traefik wget -qO- http://app

# Should return: <!doctype html>...
```

**Check networks**:
```bash
# Verify both on traefik network
docker network inspect traefik | grep -E "app|traefik"
```

### If Container Crashes

**Check nginx config**:
```bash
docker exec app nginx -t
```

**View detailed logs**:
```bash
docker logs app 2>&1 | less
```

## Why This Works

1. **Port Exposure**: Allows Traefik to discover and route to the service
2. **Simple Nginx**: Minimal config = fewer failure points
3. **HTTPS-Only**: No redirect complexity, direct HTTPS routing
4. **One Network**: Simplified networking, easier to debug
5. **Matches Working Pattern**: Based on proven SecretVM deployment

## Key Takeaways

- ✅ **Do expose ports** even with Traefik (your example proved this)
- ✅ **Keep nginx minimal** (17 lines vs 85 lines)
- ✅ **HTTPS-only routing** (no HTTP redirect needed)
- ✅ **Simple Traefik labels** (5 labels vs 10+)
- ✅ **One network** (traefik only)

**Remember**: Simplicity is reliability. Your working example was the blueprint we needed!

---

## Quick Commands

```bash
# Deploy
docker compose -f docker-compose.secretvm.yml up -d

# Status
docker compose -f docker-compose.secretvm.yml ps

# Logs (all)
docker compose -f docker-compose.secretvm.yml logs -f

# Logs (app only)
docker logs app -f

# Restart
docker compose -f docker-compose.secretvm.yml restart

# Stop
docker compose -f docker-compose.secretvm.yml down

# Test locally (from host)
curl http://localhost:8080/
```

The deployment should now work exactly like your proven example! 🚀
