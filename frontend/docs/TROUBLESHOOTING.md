# Troubleshooting Guide

Comprehensive troubleshooting guide for PrivexBot Frontend Docker deployments.

## Table of Contents

1. [Diagnostic Tools](#diagnostic-tools)
2. [Development Issues](#development-issues)
3. [Production Issues](#production-issues)
4. [SecretVM Issues](#secretvm-issues)
5. [Build Issues](#build-issues)
6. [Network Issues](#network-issues)
7. [Performance Issues](#performance-issues)

---

## Diagnostic Tools

### Built-in Diagnostic Script

Located at `scripts/docker/diagnose.sh`:

```bash
# Run diagnostics on SecretVM deployment
./scripts/docker/diagnose.sh https://your-domain.vm.scrtlabs.com

# Run on localhost
./scripts/docker/diagnose.sh http://localhost
```

### Manual Diagnostics

```bash
# Check container status
docker compose ps

# View all logs
docker compose logs

# Follow logs in real-time
docker compose logs -f

# Check specific service logs
docker compose logs frontend
docker compose logs traefik

# Inspect container
docker inspect <container_name>

# Execute commands in container
docker exec -it <container_name> sh

# Check container resource usage
docker stats <container_name>

# View Docker events
docker events --since 30m
```

---

## Development Issues

### Issue: Hot Reload Not Working

**Symptoms**:
- File changes don't reflect in browser
- Need to manually refresh

**Causes & Solutions**:

1. **Volume mount issue**:
   ```bash
   # Verify volume is mounted
   docker compose -f docker-compose.dev.yml exec dev ls -la /app/src

   # Restart with fresh volumes
   docker compose -f docker-compose.dev.yml down -v
   docker compose -f docker-compose.dev.yml up
   ```

2. **File watcher limit (Linux)**:
   ```bash
   # Increase file watch limit
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

3. **Wrong host binding**:
   ```bash
   # Verify Vite is bound to 0.0.0.0
   docker compose -f docker-compose.dev.yml logs dev | grep "0.0.0.0"
   ```

### Issue: Development Server Won't Start

**Symptoms**:
- Container exits immediately
- Error in logs about port already in use

**Solutions**:

1. **Port conflict**:
   ```bash
   # Check what's using port 5173
   lsof -i :5173
   # Or on Linux
   netstat -tlnp | grep :5173

   # Kill the process or change port in docker-compose.dev.yml
   ```

2. **Dependency issues**:
   ```bash
   # Rebuild with no cache
   docker compose -f docker-compose.dev.yml build --no-cache dev
   docker compose -f docker-compose.dev.yml up
   ```

3. **Node modules volume issue**:
   ```bash
   # Remove volume and recreate
   docker volume rm frontend_node_modules
   docker compose -f docker-compose.dev.yml up
   ```

### Issue: Module Not Found Errors

**Symptoms**:
- Import errors in console
- Missing dependency errors

**Solutions**:

1. **Reinstall dependencies**:
   ```bash
   # Access container
   docker compose -f docker-compose.dev.yml exec dev sh

   # Inside container
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Check .npmrc**:
   ```bash
   # Verify .npmrc is copied
   docker compose -f docker-compose.dev.yml exec dev cat /app/.npmrc
   # Should show: legacy-peer-deps=true
   ```

---

## Production Issues

### Issue: Nginx Won't Start

**Symptoms**:
- Container exits with code 1
- Nginx configuration error in logs

**Solutions**:

1. **Test nginx config**:
   ```bash
   # If container is running
   docker exec <container> nginx -t

   # If container exits immediately
   docker run --rm -it harystyles/privexbot-frontend:latest nginx -t
   ```

2. **Check nginx.conf syntax**:
   ```nginx
   # Common issues:
   # - Missing semicolons
   # - Wrong file paths
   # - Duplicate MIME types
   ```

3. **Verify nginx.conf is copied**:
   ```bash
   docker run --rm harystyles/privexbot-frontend:latest cat /etc/nginx/conf.d/default.conf
   ```

### Issue: 404 Not Found for All Routes

**Symptoms**:
- Homepage loads but other routes return 404
- Direct navigation to routes fails

**Cause**: Missing SPA fallback configuration

**Solution**:

Verify nginx.conf has `try_files`:
```nginx
location / {
    root /usr/share/nginx/html;
    index index.html;
    try_files $uri $uri/ /index.html;  # ← This line is critical
}
```

### Issue: Assets Return 404

**Symptoms**:
- Page loads but is blank
- JS/CSS files return 404 in network tab

**Solutions**:

1. **Verify build files exist**:
   ```bash
   docker exec <container> ls -la /usr/share/nginx/html/assets/
   # Should show index-*.js and index-*.css files
   ```

2. **Check build output**:
   ```bash
   # Rebuild and check dist folder
   npm run build
   ls -la dist/assets/
   ```

3. **Verify Dockerfile copies dist**:
   ```dockerfile
   # Should have this line
   COPY --from=build /app/dist /usr/share/nginx/html
   ```

### Issue: Page Loads But Is Blank

**Symptoms**:
- 200 OK for index.html
- Assets load (200 OK)
- But page displays nothing

**Causes & Solutions**:

1. **Check browser console for errors**:
   - JavaScript runtime errors
   - API connection failures
   - Module loading errors

2. **Verify API connectivity**:
   ```javascript
   // In browser console
   fetch(window.ENV_CONFIG?.API_BASE_URL || 'http://localhost:8000/api/v1')
     .then(r => console.log('API reachable'))
     .catch(e => console.error('API error:', e))
   ```

3. **Check root element exists**:
   ```bash
   # Verify index.html has root div
   docker exec <container> grep 'id="root"' /usr/share/nginx/html/index.html
   ```

---

## SecretVM Issues

### Issue: 504 Gateway Timeout

**Symptoms**:
- Page loads for 30 seconds then shows 504
- Traefik timeout error

**Root Cause**: Traefik cannot reach the frontend container

**Diagnostic Steps**:

1. **Check Traefik logs**:
   ```bash
   docker logs docker_wd-traefik-1
   ```

   **What to look for**:
   ```
   ✅ MUST SEE: "Starting provider *docker.Provider"
   ✅ MUST SEE: "Creating router app@docker"
   ✅ MUST SEE: "Creating service app@docker"

   ❌ BAD: Only "Configuration loaded from flags."
   ```

2. **If Docker provider NOT starting**:

   **Cause**: Traefik can't access Docker socket or TLS config failed

   **Fix**:
   ```bash
   # Check Docker socket permissions
   docker exec docker_wd-traefik-1 ls -la /var/run/docker.sock
   # Should be readable

   # Check TLS config exists
   docker exec docker_wd-traefik-1 ls -la /etc/traefik/dynamic/
   # Should show: tls.yml

   # Verify TLS config content
   docker exec docker_wd-traefik-1 cat /etc/traefik/dynamic/tls.yml
   ```

3. **If router NOT created**:

   **Cause**: Container labels incorrect or network issue

   **Fix**:
   ```bash
   # Verify labels on container
   docker inspect docker_wd-app-1 | grep -A 10 Labels
   # Should show traefik.* labels

   # Verify both containers on traefik network
   docker network inspect traefik | grep -E "app|traefik"
   ```

4. **Test direct connectivity**:
   ```bash
   # From Traefik to app
   docker exec docker_wd-traefik-1 wget -qO- http://app
   # Should return HTML

   # From host to app
   curl http://localhost:8080/
   # Should return HTML
   ```

**Solutions**:

**Solution 1: Restart Traefik**:
```bash
docker compose restart traefik
docker logs docker_wd-traefik-1 --tail 50
```

**Solution 2: Restart all services**:
```bash
docker compose down
docker compose up -d
```

**Solution 3: Check TLS certificates**:
```bash
# Verify certs exist
ls -la /mnt/secure/cert/
# Should show: secret_vm_fullchain.pem, secret_vm_private.pem

# Check cert validity
openssl x509 -in /mnt/secure/cert/secret_vm_fullchain.pem -text -noout | grep -A 2 Validity
```

### Issue: Traefik Shows "Creating router" But Still 504

**Cause**: Router created but can't reach container

**Solutions**:

1. **Verify port in label matches container**:
   ```yaml
   # In docker-compose.secretvm.yml
   labels:
     - traefik.http.services.app.loadbalancer.server.port=80  # ← Must match container port
   ```

2. **Test container responds on that port**:
   ```bash
   docker exec docker_wd-app-1 wget -qO- http://localhost:80
   # Should return HTML
   ```

3. **Check Traefik can resolve container name**:
   ```bash
   docker exec docker_wd-traefik-1 ping -c 1 app
   # Should resolve
   ```

### Issue: Orphan Containers Warning

**Symptoms**:
- Warning: "Found orphan containers [old-container-name]"
- Old containers still running

**Solution**:
```bash
# Remove orphan containers
docker compose down --remove-orphans

# Verify clean state
docker ps -a
# Should only show desired containers

# If specific orphan won't stop
docker rm -f <container_name>
```

### Issue: TLS Certificate Errors

**Symptoms**:
- Browser shows certificate error
- "NET::ERR_CERT_AUTHORITY_INVALID"

**Solutions**:

1. **Verify certificate files**:
   ```bash
   # Check files exist
   ls -la /mnt/secure/cert/

   # Check certificate is valid
   openssl x509 -in /mnt/secure/cert/secret_vm_fullchain.pem -text -noout
   ```

2. **Verify Traefik TLS config**:
   ```bash
   docker exec docker_wd-traefik-1 cat /etc/traefik/dynamic/tls.yml
   ```

3. **Check certificate domain matches**:
   ```bash
   openssl x509 -in /mnt/secure/cert/secret_vm_fullchain.pem -text -noout | grep "Subject:"
   # Should match your domain
   ```

### Issue: Container Keeps Restarting

**Symptoms**:
- Container status shows "Restarting"
- Logs show repeated startup messages

**Solutions**:

1. **Check logs for crash reason**:
   ```bash
   docker logs docker_wd-app-1 --tail 100
   ```

2. **Disable restart to see error**:
   ```yaml
   # Temporarily in docker-compose.yml
   services:
     app:
       restart: "no"  # ← Change from unless-stopped
   ```

3. **Check resource limits**:
   ```bash
   # View resource usage
   docker stats docker_wd-app-1

   # Check VM resources
   df -h
   free -m
   ```

---

## Build Issues

### Issue: Build Fails - Dependency Errors

**Symptoms**:
- `npm ci` fails during build
- Peer dependency conflicts

**Solutions**:

1. **Verify .npmrc is copied**:
   ```dockerfile
   # Dockerfile should have
   COPY .npmrc ./
   # Before RUN npm ci
   ```

2. **Check .npmrc content**:
   ```bash
   cat .npmrc
   # Should contain: legacy-peer-deps=true
   ```

3. **Clean build**:
   ```bash
   # Build with no cache
   docker build --no-cache -t test .
   ```

### Issue: Build Fails - TypeScript Errors

**Symptoms**:
- `tsc -b` fails
- Type errors in build output

**Solutions**:

1. **Check tsconfig.json**:
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "noUnusedLocals": false,  // ← Relaxed for MVP
       "noUnusedParameters": false,
       "verbatimModuleSyntax": false
     }
   }
   ```

2. **Fix missing type definitions**:
   ```bash
   npm install --save-dev @types/node @types/react
   ```

3. **Test build locally first**:
   ```bash
   npm run build
   # Fix errors before Docker build
   ```

### Issue: Build Succeeds But Image Size Too Large

**Symptoms**:
- Image over 500MB
- Slow push/pull times

**Solutions**:

1. **Verify multi-stage build**:
   ```dockerfile
   # Must have two stages
   FROM node:20-alpine as build
   # ... build stage

   FROM nginx:stable-alpine
   # ... production stage (no node_modules!)
   ```

2. **Check .dockerignore**:
   ```bash
   cat .dockerignore
   # Should exclude: node_modules, dist, .git, etc.
   ```

3. **Analyze image layers**:
   ```bash
   docker history harystyles/privexbot-frontend:latest
   # Check for large layers
   ```

---

## Network Issues

### Issue: Cannot Access Container on localhost

**Symptoms**:
- `curl http://localhost` fails
- Connection refused

**Solutions**:

1. **Check port mapping**:
   ```bash
   docker compose ps
   # Verify port mapping shows: 0.0.0.0:80->80/tcp
   ```

2. **Check container is listening**:
   ```bash
   docker exec <container> netstat -tlnp
   # Should show nginx on :80
   ```

3. **Test from inside container**:
   ```bash
   docker exec <container> wget -qO- http://localhost
   # Should work
   ```

4. **Check firewall**:
   ```bash
   # Linux
   sudo ufw status
   sudo iptables -L

   # macOS
   sudo pfctl -s rules
   ```

### Issue: Containers Can't Communicate

**Symptoms**:
- Traefik can't reach frontend
- Service discovery fails

**Solutions**:

1. **Verify same network**:
   ```bash
   docker network inspect <network_name> | grep -E "Container1|Container2"
   ```

2. **Test ping**:
   ```bash
   docker exec <container1> ping <container2>
   ```

3. **Check network driver**:
   ```yaml
   networks:
     traefik:
       driver: bridge  # ← Should be bridge
   ```

### Issue: DNS Resolution Fails

**Symptoms**:
- Container can't resolve hostnames
- "Could not resolve host" errors

**Solutions**:

1. **Check DNS config**:
   ```bash
   docker exec <container> cat /etc/resolv.conf
   ```

2. **Set custom DNS**:
   ```yaml
   services:
     app:
       dns:
         - 8.8.8.8
         - 8.8.4.4
   ```

3. **Test resolution**:
   ```bash
   docker exec <container> nslookup google.com
   ```

---

## Performance Issues

### Issue: Slow Initial Page Load

**Symptoms**:
- First page load takes > 3 seconds
- Subsequent loads are fast

**Solutions**:

1. **Enable gzip** (already in nginx.conf):
   ```nginx
   gzip on;
   gzip_types text/css application/javascript;
   ```

2. **Check bundle size**:
   ```bash
   npm run build
   # Check output sizes
   # Large bundles? Consider code splitting
   ```

3. **Verify caching headers**:
   ```bash
   curl -I http://localhost/assets/index-*.js | grep -i cache
   # Should show long cache time
   ```

### Issue: High Memory Usage

**Symptoms**:
- Container uses excessive memory
- OOM (Out of Memory) kills

**Solutions**:

1. **Check actual usage**:
   ```bash
   docker stats <container>
   ```

2. **Set memory limits**:
   ```yaml
   services:
     app:
       deploy:
         resources:
           limits:
             memory: 512M
   ```

3. **Optimize nginx**:
   ```nginx
   worker_processes 1;  # Reduce workers for small VMs
   ```

### Issue: High CPU Usage

**Symptoms**:
- Container consuming high CPU
- Server unresponsive

**Solutions**:

1. **Check processes**:
   ```bash
   docker exec <container> ps aux
   ```

2. **Review nginx workers**:
   ```nginx
   worker_processes auto;  # Or specific number: 2
   ```

3. **Check for errors causing restarts**:
   ```bash
   docker logs <container> | grep -i error
   ```

---

## Quick Reference

### Diagnostic Checklist

Use this checklist for any issue:

- [ ] Check container status: `docker compose ps`
- [ ] View logs: `docker compose logs -f`
- [ ] Test direct access: `curl http://localhost`
- [ ] Verify config: `docker exec <container> nginx -t`
- [ ] Check network: `docker network inspect <network>`
- [ ] Verify files: `docker exec <container> ls -la /path`
- [ ] Review resources: `docker stats <container>`

### Common Commands

```bash
# Restart everything
docker compose down && docker compose up -d

# View real-time logs
docker compose logs -f

# Access container shell
docker exec -it <container> sh

# Test nginx config
docker exec <container> nginx -t

# Check what's using a port
lsof -i :<port>

# Clean up everything
docker system prune -a --volumes

# Remove specific container
docker rm -f <container>

# Remove specific network
docker network rm <network>
```

---

## Getting Help

If issues persist:

1. **Gather diagnostics**:
   ```bash
   # Run diagnostic script
   ./scripts/docker/diagnose.sh > diagnostics.txt

   # Collect logs
   docker compose logs > logs.txt

   # System info
   docker version > docker-info.txt
   docker compose version >> docker-info.txt
   ```

2. **Check documentation**:
   - [DOCKER.md](./DOCKER.md)
   - [QUICK-START.md](./QUICK-START.md)
   - [TESTING.md](./TESTING.md)

3. **Review configuration**:
   - Verify docker-compose.yml syntax
   - Check Dockerfile for errors
   - Validate nginx.conf

4. **Search for similar issues**:
   - Check project issues/discussions
   - Search Docker forums
   - Review Traefik documentation
