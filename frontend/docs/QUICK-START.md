# Quick Start Guide

Get the PrivexBot Frontend up and running in minutes.

## Table of Contents

1. [Development Environment](#development-environment)
2. [Standalone Production](#standalone-production)
3. [SecretVM Deployment](#secretvm-deployment)
4. [Common Commands](#common-commands)

---

## Development Environment

For local development with hot reload.

### Prerequisites

- Docker and Docker Compose installed
- Port 5173 available

### Start Development Server

```bash
# Clone and navigate to frontend
cd /path/to/privexbot/frontend

# Start development environment
docker compose -f docker-compose.dev.yml up
```

### Access

- **Frontend**: http://localhost:5173
- **Hot Reload**: ✅ Changes reflect instantly

### Stop

```bash
# Stop services
docker compose -f docker-compose.dev.yml down
```

---

## Standalone Production

For simple production deployment without reverse proxy.

### Prerequisites

- Docker and Docker Compose installed
- Port 80 available

### Deploy

```bash
# Navigate to frontend
cd /path/to/privexbot/frontend

# Start production service
docker compose up -d

# View logs
docker compose logs -f frontend
```

### Access

- **Frontend**: http://localhost

### Update

```bash
# Pull latest image and restart
docker compose pull
docker compose up -d
```

### Stop

```bash
docker compose down
```

---

## SecretVM Deployment

For secure production deployment with TLS.

### Prerequisites

- [ ] SecretVM provisioned and accessible
- [ ] SSH access configured
- [ ] TLS certificates in `/mnt/secure/cert/`
- [ ] Domain DNS pointing to SecretVM IP

### Quick Deploy

#### 1. SSH into SecretVM

```bash
ssh user@silver-hedgehog.vm.scrtlabs.com
```

#### 2. Navigate to Docker Directory

```bash
cd /mnt/secure/docker_wd/
```

#### 3. Upload docker-compose.yml

From your local machine:

```bash
scp docker-compose.secretvm.yml user@silver-hedgehog.vm.scrtlabs.com:/mnt/secure/docker_wd/docker-compose.yml
```

#### 4. Deploy

On SecretVM:

```bash
# Stop any existing deployment
docker compose down --remove-orphans

# Pull the image (digest-pinned)
docker pull harystyles/privexbot-frontend@sha256:ae948e76c518f6c9e55e75056284cbab835d68f036c637f70554b2a4d1d69fb5

# Start services
docker compose up -d

# Verify
docker compose ps
```

#### 5. Verify

```bash
# Check Traefik discovered the container
docker logs docker_wd-traefik-1 | grep "Creating router"
# Expected: "Creating router app@docker"

# Test direct access
curl http://localhost:8080/
# Expected: HTML content

# Test via browser
# Visit: https://silver-hedgehog.vm.scrtlabs.com
```

### Access

- **HTTPS**: https://silver-hedgehog.vm.scrtlabs.com
- **Direct**: http://localhost:8080 (from SecretVM)

### Troubleshooting

If you get **504 Gateway Timeout**:

```bash
# 1. Check Traefik logs
docker logs docker_wd-traefik-1

# Must see:
# ✅ "Starting provider *docker.Provider"
# ✅ "Creating router app@docker"

# 2. If Docker provider NOT starting, restart Traefik
docker compose restart traefik

# 3. If still not working, restart all services
docker compose down
docker compose up -d
```

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for more issues.

---

## Common Commands

### Development

```bash
# Start
docker compose -f docker-compose.dev.yml up

# Start in background
docker compose -f docker-compose.dev.yml up -d

# View logs
docker compose -f docker-compose.dev.yml logs -f

# Stop
docker compose -f docker-compose.dev.yml down

# Rebuild
docker compose -f docker-compose.dev.yml up --build

# Clean rebuild
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up --build
```

### Standalone Production

```bash
# Start
docker compose up -d

# View logs
docker compose logs -f frontend

# Restart
docker compose restart frontend

# Update image
docker compose pull
docker compose up -d

# Stop
docker compose down
```

### SecretVM

```bash
# SSH into VM
ssh user@silver-hedgehog.vm.scrtlabs.com

# Navigate to directory
cd /mnt/secure/docker_wd/

# Start
docker compose up -d

# View logs
docker compose logs -f

# Check status
docker compose ps

# Restart specific service
docker compose restart app
docker compose restart traefik

# Stop
docker compose down

# Clean restart
docker compose down --remove-orphans
docker compose up -d
```

### Building Images

```bash
# Build and push to Docker Hub
./scripts/docker/build-push.sh 0.0.1

# Build locally for testing
docker build -t privexbot-frontend-test .

# Run test build
docker run -d -p 8080:80 privexbot-frontend-test

# Get image digest
docker inspect harystyles/privexbot-frontend:0.0.1 | grep -i digest
```

### Diagnostics

```bash
# Run diagnostic script
./scripts/docker/diagnose.sh http://localhost:8080

# Check container status
docker compose ps

# View container logs
docker compose logs -f

# Test nginx config
docker exec <container> nginx -t

# Access container shell
docker exec -it <container> sh

# Check container resource usage
docker stats <container>
```

---

## Environment Variables

### Development (.env.dev)

```bash
NODE_ENV=development
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_WIDGET_CDN_URL=http://localhost:8080
```

### Production (.env)

```bash
NODE_ENV=production
API_BASE_URL=https://api.privexbot.com/api/v1
WIDGET_CDN_URL=https://cdn.privexbot.com
ENVIRONMENT=production
```

---

## File Structure

```
frontend/
├── Dockerfile                          # Standalone production
├── Dockerfile.dev                      # Development
├── Dockerfile.secretvm                 # SecretVM deployment
├── docker-compose.yml                  # Standalone production
├── docker-compose.dev.yml              # Development
├── docker-compose.secretvm.yml         # SecretVM deployment
├── nginx.conf                          # Nginx configuration
├── .npmrc                              # npm configuration
├── .env                                # Production env (git-ignored)
├── .env.dev                            # Development env (git-ignored)
├── .env.example                        # Production env template
├── .env.dev.example                    # Development env template
├── scripts/
│   └── docker/
│       ├── build-push.sh               # Build and push images
│       ├── dev.sh                      # Development helper
│       ├── check.sh                    # Prerequisites check
│       └── diagnose.sh                 # Diagnostics
├── docs/
│   ├── DOCKER.md                       # Complete Docker guide
│   ├── TROUBLESHOOTING.md              # Troubleshooting guide
│   ├── TESTING.md                      # Testing guide
│   └── QUICK-START.md                  # This file
└── src/                                # Application source code
```

---

## Next Steps

### Development

1. ✅ Start development environment
2. ✅ Verify hot reload works
3. ✅ Make changes to code
4. ✅ See changes reflect instantly

### Production

1. ✅ Build production image
2. ✅ Test locally
3. ✅ Push to Docker Hub
4. ✅ Deploy to server

### SecretVM

1. ✅ Build and push image to Docker Hub
2. ✅ Get image digest
3. ✅ Update docker-compose.secretvm.yml with digest
4. ✅ Upload to SecretVM
5. ✅ Deploy and verify

---

## Getting Help

### Documentation

- **Complete Docker Guide**: [DOCKER.md](./DOCKER.md)
- **Troubleshooting**: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **Testing Guide**: [TESTING.md](./TESTING.md)
- **Main README**: [../README.md](../README.md)

### Common Issues

- **504 Gateway Timeout**: See [TROUBLESHOOTING.md - SecretVM Issues](./TROUBLESHOOTING.md#issue-504-gateway-timeout)
- **Hot Reload Not Working**: See [TROUBLESHOOTING.md - Development Issues](./TROUBLESHOOTING.md#issue-hot-reload-not-working)
- **Container Won't Start**: See [TROUBLESHOOTING.md - Production Issues](./TROUBLESHOOTING.md#issue-nginx-wont-start)

### Support

1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Review container logs: `docker compose logs`
3. Run diagnostics: `./scripts/docker/diagnose.sh`
4. Verify configuration files

---

## Quick Reference

### One-Line Commands

```bash
# Start dev
docker compose -f docker-compose.dev.yml up

# Start production
docker compose up -d

# Build and push
./scripts/docker/build-push.sh 0.0.1

# Run diagnostics
./scripts/docker/diagnose.sh http://localhost
```

### Health Checks

```bash
# Check if service is running
curl -I http://localhost:8080

# Check Traefik discovered container (SecretVM)
docker logs docker_wd-traefik-1 | grep "Creating router"

# Test HTTPS (SecretVM)
curl https://silver-hedgehog.vm.scrtlabs.com
```

### Emergency Commands

```bash
# Force restart everything
docker compose down && docker compose up -d

# Clean restart (removes volumes)
docker compose down -v && docker compose up -d

# View last 100 log lines
docker compose logs --tail 100

# Follow logs in real-time
docker compose logs -f
```
