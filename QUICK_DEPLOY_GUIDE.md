# Quick Deployment Guide

## Your Image is Now on Docker Hub! 🎉

**Image URL:** `harystyles/privexbot-frontend`

**Available Tags:**
- `dev` - Development version (frequently updated during MVP)
- `latest` - Latest stable version

---

## Deploy on Any Virtual Machine

### Prerequisites
- VM with Docker installed
- Internet connection
- Ports 80 or 443 available

### Step 1: SSH into Your VM
```bash
ssh user@your-vm-ip
```

### Step 2: Create docker-compose.yml
```bash
mkdir privexbot && cd privexbot
```

Create `docker-compose.yml`:
```yaml
services:
  frontend:
    image: harystyles/privexbot-frontend:dev
    container_name: privexbot-frontend
    ports:
      - "80:80"
    environment:
      - API_BASE_URL=https://api.yourdomain.com/api/v1
      - WIDGET_CDN_URL=https://cdn.yourdomain.com
      - ENVIRONMENT=production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Step 3: Run
```bash
docker compose up -d
```

### Step 4: Access
- Via IP: `http://your-vm-ip`
- Via Domain: `https://yourdomain.com`

---

## Update to Latest Version

When you push new changes to Docker Hub:

```bash
# On your VM
docker compose pull    # Pull latest image from Docker Hub
docker compose up -d   # Restart with new image
```

---

## Local Development Workflow

### When You Make Code Changes:

```bash
# 1. Build new production image
./scripts/build-prod.sh

# 2. Test locally
FRONTEND_PORT=3001 docker compose -f docker-compose.prod.yml up -d frontend
curl http://localhost:3001/health  # Should return "OK"

# 3. If tests pass, push to Docker Hub
docker tag privexbot/frontend:latest harystyles/privexbot-frontend:dev
docker push harystyles/privexbot-frontend:dev

# 4. Update on your VM (see "Update to Latest Version" above)
```

---

## Important URLs

- **Docker Hub Repository:** https://hub.docker.com/r/harystyles/privexbot-frontend
- **Pull Command:** `docker pull harystyles/privexbot-frontend:dev`
- **Tags:** https://hub.docker.com/r/harystyles/privexbot-frontend/tags

---

## Version Strategy

**Current (MVP Development):**
- `dev` - Active development, gets updated frequently
- `latest` - Points to newest version

**When MVP is Complete:**
```bash
# Release v1.0.0
docker tag privexbot/frontend:latest harystyles/privexbot-frontend:v1.0.0
docker push harystyles/privexbot-frontend:v1.0.0

# Update latest tag
docker tag privexbot/frontend:latest harystyles/privexbot-frontend:latest
docker push harystyles/privexbot-frontend:latest

# Update docker-compose.yml on production VM to use v1.0.0
```

**Future Updates:**
- `v1.0.1` - Bug fixes
- `v1.1.0` - New features
- `v2.0.0` - Breaking changes

---

## Troubleshooting

### Image not found
```bash
# Verify image exists
docker search harystyles/privexbot-frontend

# Pull manually
docker pull harystyles/privexbot-frontend:dev
```

### Container not starting
```bash
# Check logs
docker logs privexbot-frontend

# Check health
docker inspect privexbot-frontend --format='{{.State.Health.Status}}'
```

### Old version still running
```bash
# Force pull and restart
docker compose down
docker compose pull --no-cache
docker compose up -d
```

---

## Security Notes

✅ **What's Secure:**
- No secrets baked into image
- Running as non-root user (nginx)
- Multi-stage build (minimal attack surface)
- 49MB image size (only production files)

⚠️ **What to Configure:**
- Set proper `API_BASE_URL` for your backend
- Use HTTPS in production
- Set up proper CORS on backend
- Use environment variables for sensitive data

---

## Next Steps

1. **Test locally** - Make sure everything works: http://localhost:3001
2. **Deploy to VM** - Follow steps above
3. **Setup domain** - Point DNS to your VM IP
4. **Enable HTTPS** - Use Let's Encrypt/Certbot
5. **Setup backend** - Deploy backend service
6. **Configure CORS** - Allow frontend domain on backend

For detailed guides, see:
- `DOCKER_HUB_GUIDE.md` - Complete Docker Hub documentation
- `DEPLOYMENT_GUIDE.md` - Full production deployment guide
