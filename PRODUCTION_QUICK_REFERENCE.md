# Production Quick Reference Guide

Quick command reference for PrivexBot production deployment.

## 🚀 Initial Setup

```bash
# 1. Copy environment template
cp .env.prod.example .env.prod

# 2. Edit production variables
nano .env.prod

# Required: VERSION, VITE_API_BASE_URL, VITE_WIDGET_CDN_URL
```

## 📦 Build & Deploy

### Using Scripts (Recommended)

```bash
# Build production image
./scripts/build-prod.sh

# Test locally
./scripts/test-prod.sh

# Deploy to production
./scripts/deploy-prod.sh
```

### Manual Commands

```bash
# Build
docker compose -f docker-compose.prod.yml build

# Start services
docker compose -f docker-compose.prod.yml up -d

# Stop services
docker compose -f docker-compose.prod.yml down

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build
```

## 🔍 Monitoring

```bash
# View logs (follow)
docker compose -f docker-compose.prod.yml logs -f frontend

# View last 100 lines
docker compose -f docker-compose.prod.yml logs --tail=100 frontend

# Check container status
docker compose -f docker-compose.prod.yml ps

# Check health
curl http://localhost:3000/health

# Container stats
docker stats privexbot-frontend-prod

# Inspect health status
docker inspect --format='{{.State.Health.Status}}' privexbot-frontend-prod
```

## 🧹 Maintenance

```bash
# Restart service
docker compose -f docker-compose.prod.yml restart frontend

# Remove stopped containers
docker compose -f docker-compose.prod.yml down

# Remove with volumes (clean slate)
docker compose -f docker-compose.prod.yml down -v

# Prune old images
docker image prune -f

# Prune system (careful!)
docker system prune -a
```

## 🐛 Debugging

```bash
# Access container shell
docker compose -f docker-compose.prod.yml exec frontend sh

# Test nginx config
docker compose -f docker-compose.prod.yml exec frontend nginx -t

# Check nginx processes
docker compose -f docker-compose.prod.yml exec frontend ps aux

# View nginx config
docker compose -f docker-compose.prod.yml exec frontend cat /etc/nginx/nginx.conf

# Check file permissions
docker compose -f docker-compose.prod.yml exec frontend ls -la /usr/share/nginx/html
```

## 📊 Performance

```bash
# Load test (Apache Bench)
ab -n 10000 -c 100 http://localhost:3000/

# Response time
time curl -I http://localhost:3000

# Check compression
curl -H "Accept-Encoding: gzip" -I http://localhost:3000/

# Network inspect
docker network inspect privexbot_privexbot-prod-network
```

## 🔄 Version Management

```bash
# Build specific version
VERSION=1.2.3 docker compose -f docker-compose.prod.yml build

# Tag image
docker tag privexbot/frontend:latest privexbot/frontend:1.2.3

# List images
docker images privexbot/frontend

# Remove old versions
docker rmi privexbot/frontend:old-version
```

## 🔐 Security

```bash
# Check user in container
docker compose -f docker-compose.prod.yml exec frontend whoami
# Should return: nginx-app

# Scan for vulnerabilities
docker scan privexbot/frontend:latest

# Check security headers
curl -I http://localhost:3000/ | grep -E "X-Frame|X-Content|X-XSS|CSP"
```

## 📈 Scaling

```bash
# Scale to 3 replicas
docker compose -f docker-compose.prod.yml up -d --scale frontend=3

# Scale down to 1
docker compose -f docker-compose.prod.yml up -d --scale frontend=1

# View all instances
docker ps | grep privexbot-frontend
```

## 🔧 Environment Variables

```bash
# View container env vars
docker compose -f docker-compose.prod.yml exec frontend env

# Update .env.prod and restart
nano .env.prod
docker compose -f docker-compose.prod.yml up -d --force-recreate
```

## 📦 Backup & Restore

```bash
# Export image
docker save privexbot/frontend:latest | gzip > privexbot-frontend-latest.tar.gz

# Import image
docker load < privexbot-frontend-latest.tar.gz

# Backup volumes (if any)
docker run --rm -v privexbot_data:/data -v $(pwd):/backup alpine tar czf /backup/data-backup.tar.gz -C /data .
```

## 🔄 Rollback

```bash
# Stop current
docker compose -f docker-compose.prod.yml down

# Deploy previous version
VERSION=1.0.0 docker compose -f docker-compose.prod.yml up -d

# Or use specific image
docker tag privexbot/frontend:1.0.0 privexbot/frontend:latest
docker compose -f docker-compose.prod.yml up -d
```

## 🌐 Network

```bash
# List networks
docker network ls | grep privexbot

# Inspect network
docker network inspect privexbot_privexbot-prod-network

# Test connectivity (when backend ready)
docker compose -f docker-compose.prod.yml exec frontend ping backend
```

## 📝 Logging

```bash
# Export logs
docker compose -f docker-compose.prod.yml logs frontend > frontend-logs.txt

# Filter by timestamp
docker compose -f docker-compose.prod.yml logs --since 1h frontend

# Follow with grep
docker compose -f docker-compose.prod.yml logs -f frontend | grep ERROR

# Clear logs (recreate container)
docker compose -f docker-compose.prod.yml up -d --force-recreate
```

## ⚡ Quick Fixes

### Port Already in Use
```bash
# Find process
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change port in .env.prod
FRONTEND_PORT=3001
```

### Container Won't Start
```bash
# Check logs
docker compose -f docker-compose.prod.yml logs frontend

# Rebuild from scratch
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
```

### Health Check Failing
```bash
# Manual health check
docker compose -f docker-compose.prod.yml exec frontend curl -f http://localhost:80/health

# Increase timeout in docker-compose.prod.yml
# start_period: 60s
```

### Permission Errors
```bash
# Check ownership
docker compose -f docker-compose.prod.yml exec frontend ls -la /usr/share/nginx/html

# Should be: nginx-app:nginx-app
```

## 📚 Documentation Links

- **Detailed Guide**: [DOCKER_PRODUCTION.md](./DOCKER_PRODUCTION.md)
- **Development**: [DOCKER_SETUP.md](./DOCKER_SETUP.md)
- **Summary**: [DOCKER_PRODUCTION_SETUP_SUMMARY.md](./DOCKER_PRODUCTION_SETUP_SUMMARY.md)
- **Main README**: [README.md](./README.md)

## 🆘 Emergency Contacts

- **GitHub Issues**: https://github.com/privexbot/issues
- **Email Support**: support@privexbot.com
- **Documentation**: https://docs.privexbot.com

---

**Tip**: Bookmark this page for quick access during production operations!
