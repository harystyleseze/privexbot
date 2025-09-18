# 🐳 Docker Deployment Guide

This project supports both **development** and **production** Docker deployments with different optimizations for each environment.

## 📋 Quick Start

### Local Development
```bash
# Start with live reload and volume mounts
docker-compose -f docker-compose.dev.yml up

# Stop services
docker-compose -f docker-compose.dev.yml down
```

### Production Deployment
```bash
# Build and start production services
docker-compose up -d

# Stop services
docker-compose down
```

## 🏗️ Architecture Overview

```
├── docker-compose.yml           # 🚀 Production deployment
├── docker-compose.dev.yml       # 🛠️  Development with live reload
├── apps/
│   ├── web-frontend/
│   │   ├── Dockerfile           # 📦 Production build (multi-stage)
│   │   └── Dockerfile.dev       # 🔄 Development with volume mounts
│   ├── admin-frontend/
│   │   ├── Dockerfile           # 📦 Production build (multi-stage)
│   │   └── Dockerfile.dev       # 🔄 Development with volume mounts
│   └── backend/
│       ├── Dockerfile           # 📦 Production build (optimized)
│       └── Dockerfile.dev       # 🔄 Development with hot reload
```

## 🛠️ Development Environment

### Features:
- **Live Reload**: Code changes trigger automatic rebuilds
- **Volume Mounts**: Source code mounted for instant updates
- **Development Tools**: Extra debugging and development packages
- **Hot Module Replacement**: Frontend updates without full page refresh
- **Debug Ports**: Direct access to application ports

### Services:
- **Web Frontend**: `http://localhost:3000` (Vite dev server)
- **Admin Frontend**: `http://localhost:3001` (Vite dev server)  
- **Backend**: `http://localhost:8000` (uvicorn with --reload)

### Volume Mounts:
```yaml
# Web Frontend volumes for live editing
- ./apps/web-frontend/src:/app/apps/web-frontend/src
- ./apps/web-frontend/public:/app/apps/web-frontend/public
- ./libs:/app/libs

# Admin Frontend volumes for live editing
- ./apps/admin-frontend/src:/app/apps/admin-frontend/src
- ./apps/admin-frontend/public:/app/apps/admin-frontend/public
- ./libs:/app/libs

# Backend volumes for live editing
- ./apps/backend/backend:/app/backend
- ./apps/backend/pyproject.toml:/app/pyproject.toml
```

## 🚀 Production Environment

### Features:
- **Multi-stage builds**: Optimized image sizes
- **Health checks**: Container health monitoring
- **Restart policies**: Automatic recovery from failures
- **Security**: Non-root users, minimal attack surface
- **SSL/TLS ready**: HTTPS configuration support
- **Internal networking**: Backend not exposed directly

### Services:
- **Web Frontend**: `http://localhost:80` (nginx serving static files)
- **Admin Frontend**: `http://localhost:81` (nginx serving static files)
- **Backend**: Internal only (proxied through frontends)

### Production Optimizations:
- Minified and compressed assets
- Production nginx configuration
- Security headers and SSL termination
- Resource limits and health checks
- Secrets management for sensitive data

## 🔧 Commands Reference

### Development Commands
```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up

# Rebuild specific service
docker-compose -f docker-compose.dev.yml build web-frontend
docker-compose -f docker-compose.dev.yml build admin-frontend
docker-compose -f docker-compose.dev.yml build backend

# View logs
docker-compose -f docker-compose.dev.yml logs -f web-frontend
docker-compose -f docker-compose.dev.yml logs -f admin-frontend
docker-compose -f docker-compose.dev.yml logs -f backend

# Execute commands in running container
docker-compose -f docker-compose.dev.yml exec web-frontend sh
docker-compose -f docker-compose.dev.yml exec admin-frontend sh
docker-compose -f docker-compose.dev.yml exec backend bash
```

### Production Commands
```bash
# Deploy to production
docker-compose up -d

# Update and restart services
docker-compose up -d --build

# Scale services
docker-compose up -d --scale backend=3

# Monitor health
docker-compose ps
docker-compose logs --tail=100 -f

# Check specific service logs
docker-compose logs web-frontend
docker-compose logs admin-frontend  
docker-compose logs backend
```

## 🔍 Troubleshooting

### Development Issues:
```bash
# Clear volumes and rebuild
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.dev.yml up

# Check volume mounts
docker-compose -f docker-compose.dev.yml exec web-frontend ls -la /app/apps/web-frontend/src
docker-compose -f docker-compose.dev.yml exec admin-frontend ls -la /app/apps/admin-frontend/src
```

### Production Issues:
```bash
# Check health status
docker-compose ps
docker-compose exec web-frontend curl -f http://localhost/health
docker-compose exec admin-frontend curl -f http://localhost/health

# View container logs
docker-compose logs web-frontend
docker-compose logs admin-frontend
docker-compose logs backend
```

## 🌐 Environment Variables

### Development (.env.dev)
```env
NODE_ENV=development
VITE_API_URL=http://localhost:8000
PYTHONPATH=/app
```

### Production (.env.prod)
```env
NODE_ENV=production
API_URL=https://api.yourdomain.com
ENVIRONMENT=production
```

## 📊 Performance Considerations

### Development:
- **Pros**: Fast iteration, live reload, easy debugging
- **Cons**: Larger images, slower startup, development dependencies

### Production:
- **Pros**: Small images, fast startup, optimized performance
- **Cons**: Requires rebuild for changes, harder to debug

## 🔒 Security Best Practices

### Development:
- Use volume mounts instead of copying sensitive files
- Keep development containers isolated from production networks
- Use development-specific environment variables

### Production:
- Multi-stage builds to exclude development dependencies
- Non-root users in containers
- Secrets management for sensitive data
- Health checks for service monitoring
- Resource limits to prevent abuse

## 🚀 Deployment Strategies

### Local Development:
```bash
docker-compose -f docker-compose.dev.yml up
```

### Staging/Testing:
```bash
docker-compose -f docker-compose.yml up
```

### Production:
```bash
# With environment file
docker-compose --env-file .env.prod up -d

# With orchestration (Docker Swarm/Kubernetes)
docker stack deploy -c docker-compose.yml privexbot
```

## 📋 Best Practices Summary

1. **Use separate configs** for development and production
2. **Volume mount source code** in development for live reload
3. **Multi-stage builds** for production to minimize image size
4. **Health checks** for production reliability
5. **Environment variables** for configuration management
6. **Secrets management** for sensitive data
7. **Resource limits** for production stability