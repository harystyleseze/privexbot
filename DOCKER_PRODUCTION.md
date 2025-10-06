# Docker Production Setup Guide for PrivexBot

This guide covers production deployment of PrivexBot using Docker with security best practices, performance optimizations, and production-grade configurations.

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Production Setup](#production-setup)
- [Security Best Practices](#security-best-practices)
- [Monitoring & Logging](#monitoring--logging)
- [Scaling & Performance](#scaling--performance)
- [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Multi-Stage Build Strategy

The production setup uses multi-stage Docker builds to:

1. **Build Stage**: Compile and bundle frontend assets with Node.js
2. **Production Stage**: Serve static files with lightweight Nginx

**Benefits**:
- 🔒 **Security**: Only production artifacts in final image
- 📦 **Size**: Final image ~50MB vs 1GB+ with build tools
- ⚡ **Performance**: Nginx optimized for static file serving
- 🛡️ **Attack Surface**: Minimal dependencies in production

### Container Architecture

```
┌─────────────────────────────────────────┐
│         Frontend Container              │
│  ┌───────────────────────────────────┐  │
│  │   Nginx (Port 80)                 │  │
│  │   - Serves React SPA              │  │
│  │   - Gzip/Brotli compression       │  │
│  │   - Security headers              │  │
│  │   - Rate limiting                 │  │
│  │   - Health checks                 │  │
│  └───────────────────────────────────┘  │
│                                          │
│  Runtime: Alpine Linux + Nginx          │
│  Size: ~50MB                             │
│  User: nginx-app (non-root)             │
└─────────────────────────────────────────┘
```

---

## Prerequisites

### System Requirements

- **Docker Engine**: 24.0+ or Docker Desktop
- **Docker Compose**: V2 (comes with Docker Desktop)
- **RAM**: Minimum 2GB, Recommended 4GB
- **Disk**: 10GB free space
- **OS**: Linux, macOS, Windows (WSL2)

### Required Files

Before deploying, ensure you have:

```bash
.env.prod                    # Production environment variables
frontend/Dockerfile.prod     # Production Dockerfile
frontend/nginx.conf          # Nginx main config
frontend/nginx.default.conf  # Nginx server config
docker-compose.prod.yml      # Production compose file
```

---

## Quick Start

### 1. Setup Environment

```bash
# Copy environment template
cp .env.prod.example .env.prod

# Edit with your production values
nano .env.prod
```

**Minimum Required Variables**:
```env
VERSION=1.0.0
FRONTEND_PORT=3000
VITE_API_BASE_URL=https://api.privexbot.com/api/v1
VITE_WIDGET_CDN_URL=https://cdn.privexbot.com
```

### 2. Build Production Image

```bash
# Using helper script (recommended)
./scripts/build-prod.sh

# Or manually
docker compose -f docker-compose.prod.yml build
```

### 3. Test Locally

```bash
# Using helper script
./scripts/test-prod.sh

# Or manually
docker compose -f docker-compose.prod.yml up -d
curl http://localhost:3000/health
```

### 4. Deploy to Production

```bash
# Using helper script (with confirmation)
./scripts/deploy-prod.sh

# Or manually
docker compose -f docker-compose.prod.yml up -d
```

---

## Production Setup

### Environment Configuration

#### Frontend Environment Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `VERSION` | Image version tag | `1.0.0` | ✅ |
| `FRONTEND_PORT` | Host port mapping | `3000` | ✅ |
| `VITE_API_BASE_URL` | Backend API endpoint | `https://api.privexbot.com/api/v1` | ✅ |
| `VITE_WIDGET_CDN_URL` | Widget CDN URL | `https://cdn.privexbot.com` | ✅ |
| `VITE_ENV` | Environment name | `production` | ✅ |

#### Build Arguments

Build arguments are passed during image build:

```bash
docker compose -f docker-compose.prod.yml build \
  --build-arg VITE_API_BASE_URL=https://api.privexbot.com/api/v1 \
  --build-arg VITE_WIDGET_CDN_URL=https://cdn.privexbot.com
```

### Nginx Configuration

#### Main Configuration (`nginx.conf`)

**Performance Features**:
- Worker processes: Auto-scaled to CPU cores
- Worker connections: 4096 per worker
- Sendfile: Enabled for efficient file serving
- TCP optimizations: `tcp_nopush`, `tcp_nodelay`
- Keepalive timeout: 65 seconds

**Compression**:
- Gzip: Enabled with level 6
- Minimum size: 256 bytes
- Supported types: HTML, CSS, JS, JSON, XML, SVG

**Rate Limiting**:
- API requests: 10 req/s with 20 burst
- General requests: 30 req/s with 50 burst

#### Server Configuration (`nginx.default.conf`)

**Security Headers**:
```nginx
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: [configured]
```

**Caching Strategy**:
- Static assets (images, fonts): 1 year
- JS/CSS bundles: 1 year with immutable
- HTML files: No cache
- Index.html: No store, must revalidate

**SPA Routing**:
- All routes fallback to `/index.html`
- Proper handling of client-side routing

### Resource Limits

Production containers have resource constraints:

```yaml
deploy:
  resources:
    limits:
      cpus: '0.5'      # Max 50% of one CPU
      memory: 512M     # Max 512MB RAM
    reservations:
      cpus: '0.25'     # Reserved 25% CPU
      memory: 256M     # Reserved 256MB RAM
```

### Health Checks

Automated health monitoring:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:80/health"]
  interval: 30s      # Check every 30 seconds
  timeout: 10s       # Timeout after 10 seconds
  retries: 3         # Mark unhealthy after 3 failures
  start_period: 40s  # Grace period on startup
```

Access health endpoint:
```bash
curl http://localhost:3000/health
# Response: OK
```

---

## Security Best Practices

### 1. Non-Root User

The production container runs as `nginx-app` user (UID 101):

```dockerfile
RUN adduser -S -D -H -u 101 -h /var/cache/nginx \
    -s /sbin/nologin -G nginx-app -g nginx-app nginx-app

USER nginx-app
```

**Benefits**:
- Limits damage if container is compromised
- Prevents privilege escalation
- Follows principle of least privilege

### 2. Minimal Image

Based on `nginx:alpine` (≈40MB):
- No build tools in production
- No source code in final image
- Only compiled assets and Nginx

### 3. Security Headers

All responses include security headers:

```nginx
X-Frame-Options: SAMEORIGIN          # Prevent clickjacking
X-Content-Type-Options: nosniff      # Prevent MIME sniffing
X-XSS-Protection: 1; mode=block      # XSS protection
Content-Security-Policy: ...         # CSP policy
```

### 4. Rate Limiting

Protects against abuse and DDoS:

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req zone=api_limit burst=20 nodelay;
```

### 5. No Server Tokens

Nginx version hidden from responses:

```nginx
server_tokens off;
```

### 6. SSL/TLS (When using Nginx reverse proxy)

For production deployments with SSL:

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers HIGH:!aNULL:!MD5;
ssl_prefer_server_ciphers on;
```

---

## Monitoring & Logging

### Log Configuration

Logs are managed with rotation:

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"    # Max 10MB per file
    max-file: "3"      # Keep 3 files (30MB total)
```

### View Logs

```bash
# Follow logs in real-time
docker compose -f docker-compose.prod.yml logs -f frontend

# Last 100 lines
docker compose -f docker-compose.prod.yml logs --tail=100 frontend

# Logs since specific time
docker compose -f docker-compose.prod.yml logs --since 30m frontend
```

### Log Format

Access logs include detailed metrics:

```
$remote_addr - $remote_user [$time_local] "$request"
$status $body_bytes_sent "$http_referer" "$http_user_agent"
rt=$request_time uct="$upstream_connect_time"
```

### Health Monitoring

Monitor container health:

```bash
# Check health status
docker inspect --format='{{.State.Health.Status}}' privexbot-frontend-prod

# Health check logs
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' privexbot-frontend-prod
```

### Metrics Collection

For production monitoring, integrate with:

- **Prometheus**: Nginx exporter for metrics
- **Grafana**: Visualization dashboards
- **Sentry**: Error tracking and reporting
- **DataDog/New Relic**: APM solutions

---

## Scaling & Performance

### Horizontal Scaling

Scale frontend replicas:

```bash
# Scale to 3 instances
docker compose -f docker-compose.prod.yml up -d --scale frontend=3

# Add load balancer
docker compose -f docker-compose.prod.yml up -d nginx
```

### Performance Optimizations

#### 1. Asset Optimization

Build process includes:
- Tree shaking (remove unused code)
- Code splitting (lazy loading)
- Minification (reduce file size)
- Source maps (optional, for debugging)

#### 2. Nginx Tuning

**Worker Processes**:
```nginx
worker_processes auto;  # One per CPU core
worker_rlimit_nofile 65535;  # Max open files
```

**Connection Handling**:
```nginx
worker_connections 4096;  # Connections per worker
multi_accept on;          # Accept multiple connections
```

**File Serving**:
```nginx
sendfile on;       # Zero-copy file transmission
tcp_nopush on;     # Send headers in one packet
tcp_nodelay on;    # Don't buffer data
```

#### 3. Compression

**Gzip Compression**:
- Level 6 balance (speed vs ratio)
- Min size 256 bytes
- All text-based formats

#### 4. Caching

**Browser Caching**:
- Assets: 1 year with immutable
- HTML: No cache
- Service workers: Controlled invalidation

### CDN Integration

For global distribution:

```nginx
# Add CDN headers
add_header X-Cache-Status $upstream_cache_status;
add_header Cache-Control "public, max-age=31536000, immutable";
```

Integrate with:
- Cloudflare
- AWS CloudFront
- Fastly
- Akamai

---

## Troubleshooting

### Common Issues

#### 1. Container Won't Start

**Symptoms**: Container exits immediately

**Diagnosis**:
```bash
# Check container logs
docker compose -f docker-compose.prod.yml logs frontend

# Check container status
docker compose -f docker-compose.prod.yml ps
```

**Solutions**:
- Verify environment variables in `.env.prod`
- Check nginx config syntax: `docker compose -f docker-compose.prod.yml exec frontend nginx -t`
- Ensure port 3000 is not in use: `lsof -i :3000`

#### 2. Health Check Failing

**Symptoms**: Container marked as unhealthy

**Diagnosis**:
```bash
# Check health status
docker inspect privexbot-frontend-prod | grep -A 10 Health

# Test health endpoint manually
docker compose -f docker-compose.prod.yml exec frontend curl -f http://localhost:80/health
```

**Solutions**:
- Increase `start_period` for slow startups
- Check nginx is running: `docker compose -f docker-compose.prod.yml exec frontend ps aux`
- Verify health endpoint returns 200

#### 3. Build Failures

**Symptoms**: Build fails during `npm run build`

**Diagnosis**:
```bash
# Build with verbose output
docker compose -f docker-compose.prod.yml build --no-cache --progress=plain frontend
```

**Solutions**:
- Check Node.js version compatibility
- Verify package.json and dependencies
- Ensure build args are passed correctly
- Check disk space: `df -h`

#### 4. Permission Errors

**Symptoms**: 403 errors or file access denied

**Diagnosis**:
```bash
# Check file permissions
docker compose -f docker-compose.prod.yml exec frontend ls -la /usr/share/nginx/html
```

**Solutions**:
- Verify nginx-app user has read permissions
- Check Dockerfile permission settings
- Rebuild with: `docker compose -f docker-compose.prod.yml build --no-cache`

#### 5. High Memory Usage

**Symptoms**: Container using too much memory

**Diagnosis**:
```bash
# Check memory usage
docker stats privexbot-frontend-prod --no-stream

# Check resource limits
docker inspect privexbot-frontend-prod | grep -A 10 Resources
```

**Solutions**:
- Reduce worker_connections in nginx.conf
- Decrease worker_processes
- Increase memory limit in docker-compose.prod.yml
- Check for memory leaks in application

#### 6. Slow Response Times

**Symptoms**: High request latency

**Diagnosis**:
```bash
# Check nginx logs with timings
docker compose -f docker-compose.prod.yml logs frontend | grep "rt="

# Test response time
time curl -I http://localhost:3000
```

**Solutions**:
- Enable gzip compression (verify it's working)
- Check worker_connections and worker_processes
- Monitor CPU usage: `docker stats`
- Add caching headers for static assets
- Consider using a CDN

### Debug Mode

For troubleshooting, run with debug output:

```bash
# Start with debug logging
docker compose -f docker-compose.prod.yml up frontend

# Or enable debug in nginx
docker compose -f docker-compose.prod.yml exec frontend sed -i 's/warn/debug/' /etc/nginx/nginx.conf
docker compose -f docker-compose.prod.yml restart frontend
```

### Rollback Procedure

If deployment fails:

```bash
# Stop current deployment
docker compose -f docker-compose.prod.yml down

# Rollback to previous version
VERSION=1.0.0-previous ./scripts/deploy-prod.sh

# Or use specific image
docker tag privexbot/frontend:1.0.0-previous privexbot/frontend:latest
docker compose -f docker-compose.prod.yml up -d
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Deploy Production

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Build production image
        run: |
          export VERSION=${GITHUB_REF#refs/tags/v}
          docker compose -f docker-compose.prod.yml build

      - name: Test production build
        run: ./scripts/test-prod.sh

      - name: Push to registry
        run: |
          docker login -u ${{ secrets.DOCKER_USERNAME }} -p ${{ secrets.DOCKER_PASSWORD }}
          docker push privexbot/frontend:latest
```

---

## Deployment Checklist

Before deploying to production:

### Pre-Deployment

- [ ] Review `.env.prod` configuration
- [ ] Update VERSION in `.env.prod`
- [ ] Test build locally: `./scripts/build-prod.sh`
- [ ] Test containers locally: `./scripts/test-prod.sh`
- [ ] Verify health checks pass
- [ ] Check resource limits are appropriate
- [ ] Review nginx configuration
- [ ] Verify security headers
- [ ] Test SSL/TLS certificates (if applicable)

### Deployment

- [ ] Backup current deployment (if exists)
- [ ] Run deployment script: `./scripts/deploy-prod.sh`
- [ ] Verify health checks pass
- [ ] Test all critical user flows
- [ ] Monitor logs for errors
- [ ] Check response times
- [ ] Verify metrics/monitoring

### Post-Deployment

- [ ] Monitor error rates
- [ ] Check CPU/memory usage
- [ ] Verify logging is working
- [ ] Test rollback procedure
- [ ] Update documentation
- [ ] Notify team of deployment

---

## Additional Resources

- [Docker Security Best Practices](https://docs.docker.com/develop/security-best-practices/)
- [Nginx Performance Tuning](https://www.nginx.com/blog/tuning-nginx/)
- [Docker Compose Production](https://docs.docker.com/compose/production/)
- [Alpine Linux Hardening](https://wiki.alpinelinux.org/wiki/Production_PHP_setup)

---

## Support

For production issues:

1. Check [Troubleshooting](#troubleshooting) section
2. Review logs: `docker compose -f docker-compose.prod.yml logs`
3. Check GitHub issues: https://github.com/privexbot/issues
4. Contact support: support@privexbot.com

---

**Last Updated**: 2025-10-03
**Version**: 1.0.0
