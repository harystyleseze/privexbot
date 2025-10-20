# Docker Networking Configuration

## Overview

This document explains how the frontend and backend communicate in Docker development mode.

## Network Architecture

```
┌─────────────────────────────────────────────────────┐
│  Docker Network: backend_privexbot-dev              │
│                                                      │
│  ┌────────────────┐         ┌────────────────────┐ │
│  │ backend-dev    │         │  frontend-dev      │ │
│  │ (FastAPI)      │ ◄─────  │  (Vite + React)    │ │
│  │ Port: 8000     │         │  Port: 5173        │ │
│  └────────────────┘         └────────────────────┘ │
│         │                            │              │
│         │                            │              │
└─────────┼────────────────────────────┼──────────────┘
          │ (port mapping)             │
          │                            │
          ▼                            ▼
   localhost:8000              localhost:5173
   (Backend API)               (Frontend UI)
```

## How It Works

### 1. Network Creation

The **backend** creates the shared Docker network when started:

```bash
cd backend
./scripts/docker/dev.sh up
```

This creates a network named: `backend_privexbot-dev`

### 2. Frontend Connection

The **frontend** connects to this existing network:

```bash
cd frontend
./scripts/docker/dev.sh up
```

The frontend's `docker-compose.dev.yml` references the external network:

```yaml
networks:
  backend_privexbot-dev:
    external: true
```

### 3. Container Communication

**Inside Docker Network:**
- Frontend container → Backend container: `http://backend-dev:8000/api/v1`
- Uses Docker's internal DNS resolution
- No need for port mapping between containers

**From Host Browser:**
- Browser → Frontend: `http://localhost:5173`
- Browser → Backend: `http://localhost:8000`
- Uses port mappings defined in docker-compose files

## Key Configuration Files

### Backend: `docker-compose.dev.yml`

```yaml
services:
  backend-dev:
    container_name: privexbot-backend-dev
    ports:
      - "8000:8000"
    networks:
      - privexbot-dev

networks:
  privexbot-dev:
    driver: bridge  # Creates the network
```

### Frontend: `docker-compose.dev.yml`

```yaml
services:
  frontend-dev:
    container_name: privexbot-frontend-dev
    environment:
      - VITE_API_BASE_URL=http://backend-dev:8000/api/v1  # Container-to-container
    ports:
      - "5173:5173"
    networks:
      - backend_privexbot-dev  # Connects to backend's network

networks:
  backend_privexbot-dev:
    external: true  # Uses existing network created by backend
```

## Environment-Specific API URLs

### Docker Development

**Frontend Environment:**
```bash
VITE_API_BASE_URL=http://backend-dev:8000/api/v1
```

**How it works:**
1. Vite dev server runs inside `frontend-dev` container
2. Frontend code makes API calls to `http://backend-dev:8000/api/v1`
3. Docker DNS resolves `backend-dev` to the backend container's IP
4. Request goes directly to backend container on port 8000

### Local npm Development

**Frontend Environment (.env.dev):**
```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

**How it works:**
1. Vite dev server runs on host (not in Docker)
2. Frontend code makes API calls to `http://localhost:8000/api/v1`
3. Request goes to host's localhost:8000
4. Backend container's port mapping forwards to container

### Production

**Frontend Environment (.env):**
```bash
VITE_API_BASE_URL=https://api.privexbot.com/api/v1
# or
VITE_API_BASE_URL=https://api.harystyles.store/api/v1
```

**How it works:**
1. Frontend is built and served statically
2. Browser makes API calls to production backend domain
3. DNS resolves to actual server IP
4. HTTPS/SSL terminates at load balancer or reverse proxy

## CORS Configuration

The backend must allow the frontend's origin for CORS:

**Backend Config (`src/app/core/config.py`):**
```python
BACKEND_CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"
```

**Why localhost:5173?**
- Even in Docker mode, the browser accesses frontend at `localhost:5173`
- The browser's Origin header will be `http://localhost:5173`
- Container-to-container requests (server-side) don't need CORS

## Troubleshooting

### Error: "network backend_privexbot-dev declared as external, but could not be found"

**Cause:** Backend is not running or network wasn't created

**Solution:**
1. Start backend first:
   ```bash
   cd backend && ./scripts/docker/dev.sh up
   ```

2. Verify network exists:
   ```bash
   docker network ls | grep backend_privexbot-dev
   ```

3. Then start frontend:
   ```bash
   cd frontend && ./scripts/docker/dev.sh up
   ```

### Error: "Network Error" or "ERR_NETWORK" in browser console

**Cause:** Frontend can't reach backend

**Check:**
1. Backend container is running:
   ```bash
   docker ps | grep privexbot-backend-dev
   ```

2. Backend is accessible from host:
   ```bash
   curl http://localhost:8000/api/v1/health
   ```

3. Frontend is using correct API URL:
   ```bash
   docker exec privexbot-frontend-dev env | grep VITE_API_BASE_URL
   ```

4. Containers are on same network:
   ```bash
   docker network inspect backend_privexbot-dev
   ```

### Error: "CORS error" in browser

**Cause:** Backend doesn't allow frontend's origin

**Solution:**
1. Check backend CORS config:
   ```bash
   curl http://localhost:8000/api/v1/health | jq '.cors_origins'
   ```

2. Should include `http://localhost:5173`

3. If not, update backend's `.env.dev`:
   ```bash
   BACKEND_CORS_ORIGINS=http://localhost:5173,http://localhost:3000
   ```

4. Restart backend:
   ```bash
   cd backend && ./scripts/docker/dev.sh restart
   ```

## Network Name Explanation

Docker Compose automatically prefixes network names with the project name:

| Project | Network Config | Actual Network Name |
|---------|----------------|---------------------|
| backend | `privexbot-dev` | `backend_privexbot-dev` |
| frontend | `backend_privexbot-dev` (external) | `backend_privexbot-dev` |

This is why the frontend must reference `backend_privexbot-dev` (with prefix) as external.

## Startup Order

**Always start backend first!**

```bash
# ✅ Correct order
cd backend && ./scripts/docker/dev.sh up
cd frontend && ./scripts/docker/dev.sh up

# ❌ Wrong order (frontend will fail)
cd frontend && ./scripts/docker/dev.sh up  # Error: network not found
cd backend && ./scripts/docker/dev.sh up
```

The frontend startup script (`scripts/docker/dev.sh`) checks for the network and warns if backend isn't running.

## Vite Development Server Configuration

The Vite config is optimized for Docker:

```typescript
export default defineConfig({
  server: {
    host: '0.0.0.0',        // Listen on all interfaces
    port: 5173,
    watch: {
      usePolling: true,      // Required for Docker volume watching
      interval: 1000,
    },
    hmr: {
      clientPort: 5173,      // HMR port for host access
    },
  },
})
```

**Why these settings?**
- `host: '0.0.0.0'` - Allows connections from outside container (host browser)
- `usePolling: true` - Docker volumes don't support native file watching
- `clientPort: 5173` - Browser connects to localhost:5173 for HMR

## Commands Quick Reference

```bash
# Start backend (creates network)
cd backend && ./scripts/docker/dev.sh up

# Start frontend (connects to backend network)
cd frontend && ./scripts/docker/dev.sh up

# View frontend logs
cd frontend && ./scripts/docker/dev.sh logs

# Restart frontend (after code changes)
cd frontend && ./scripts/docker/dev.sh restart

# Stop everything
cd frontend && ./scripts/docker/dev.sh down
cd backend && ./scripts/docker/dev.sh down

# Clean up (removes volumes and images)
cd frontend && ./scripts/docker/dev.sh clean
cd backend && ./scripts/docker/dev.sh clean
```

## Production Deployment

In production, you should:

1. **Use a reverse proxy** (Nginx, Traefik) to handle routing
2. **Use proper domain names** for API and frontend
3. **Enable SSL/TLS** for all connections
4. **Use Docker Compose profiles** or orchestration (Kubernetes, Docker Swarm)

Example production setup:
```
Internet → Load Balancer (SSL) → Reverse Proxy
                                      ├─→ frontend (privexbot.com)
                                      └─→ backend (api.privexbot.com)
```
