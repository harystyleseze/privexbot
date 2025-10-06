# Docker Setup Guide for PrivexBot

This guide explains how to run PrivexBot services using Docker for local development.

## Prerequisites

- Docker Desktop or Docker Engine installed
- Docker Compose V2 (comes with Docker Desktop)
- At least 4GB RAM allocated to Docker

## Quick Start

### 1. Frontend Service Only

```bash
# Start frontend development server
docker compose up frontend

# Or run in detached mode
docker compose up -d frontend
```

The frontend will be available at: **http://localhost:5173**

### 2. Stop Services

```bash
# Stop all services
docker compose down

# Stop and remove volumes (clean slate)
docker compose down -v
```

## Service Details

### Frontend (React + Vite + TypeScript)

- **Port**: 5173
- **Hot Module Replacement**: Enabled
- **Volume Mounts**: Source code is mounted for live reload
- **Dependencies**: Installed in named volume `frontend_node_modules`

**Configuration**:
- Environment variables are defined in `docker-compose.yml`
- Default API base URL: `http://localhost:8000/api/v1`
- Widget CDN URL: `http://localhost:8080`

**Development Workflow**:
1. Edit files in `./frontend/src/`
2. Changes auto-reload in browser
3. TypeScript errors visible in terminal

### Upcoming Services

The following services are planned and will be added to `docker-compose.yml`:

#### Backend (FastAPI + Python)
- Port: 8000
- Database: PostgreSQL 16
- Cache: Redis 7

#### Widget (Vanilla JS + Webpack)
- Port: 8080
- Build tool: Webpack

#### Nginx Reverse Proxy
- Ports: 80, 443
- Routes traffic to all services

## Docker Commands

### Build Services

```bash
# Build frontend image
docker compose build frontend

# Build all services
docker compose build

# Build without cache (clean build)
docker compose build --no-cache frontend
```

### Run Services

```bash
# Start frontend in foreground (see logs)
docker compose up frontend

# Start frontend in background
docker compose up -d frontend

# Start all services
docker compose up

# Start specific services
docker compose up frontend backend
```

### View Logs

```bash
# View frontend logs
docker compose logs frontend

# Follow logs in real-time
docker compose logs -f frontend

# View last 100 lines
docker compose logs --tail=100 frontend
```

### Manage Containers

```bash
# List running containers
docker compose ps

# Stop services
docker compose stop

# Restart services
docker compose restart frontend

# Remove stopped containers
docker compose rm
```

### Clean Up

```bash
# Stop and remove containers
docker compose down

# Remove containers and volumes
docker compose down -v

# Remove containers, volumes, and images
docker compose down -v --rmi all
```

## Troubleshooting

### Port Already in Use

**Error**: `Bind for 0.0.0.0:5173 failed: port is already allocated`

**Solution**:
```bash
# Find process using port 5173
lsof -i :5173

# Kill the process (replace PID)
kill <PID>

# Or stop conflicting container
docker ps
docker stop <container_name>
```

### File Changes Not Detected

**Issue**: Hot reload not working

**Solution**:
- The Vite config already has `usePolling: true` enabled
- Restart the container: `docker compose restart frontend`
- Check logs: `docker compose logs frontend`

### node_modules Issues

**Issue**: Dependency conflicts or missing modules

**Solution**:
```bash
# Remove volume and rebuild
docker compose down -v
docker compose build --no-cache frontend
docker compose up frontend
```

### Slow Performance on macOS

**Issue**: File watching is slow

**Solution**:
- Ensure Docker Desktop is updated
- Increase resources in Docker Desktop preferences
- Use [Docker Desktop VirtioFS](https://docs.docker.com/desktop/mac/#file-sharing) (enabled by default)

## Network Configuration

All services are connected to the `privexbot-network` bridge network, allowing them to communicate using service names:

- Frontend can access backend at: `http://backend:8000`
- Backend can access Redis at: `redis://redis:6379`
- Backend can access Postgres at: `postgresql://postgres:5432/privexbot`

## Volume Management

### Named Volumes

- `frontend_node_modules`: Node.js dependencies for frontend
- `postgres_data`: (upcoming) PostgreSQL database data
- `redis_data`: (upcoming) Redis cache data

### List Volumes

```bash
docker volume ls | grep privexbot
```

### Inspect Volume

```bash
docker volume inspect privexbot_frontend_node_modules
```

### Remove Volumes

```bash
# Remove all project volumes
docker volume rm privexbot_frontend_node_modules
```

## Development Tips

### 1. Use Docker Logs for Debugging

```bash
# Watch frontend logs in real-time
docker compose logs -f frontend
```

### 2. Execute Commands in Container

```bash
# Open shell in frontend container
docker compose exec frontend sh

# Install new package
docker compose exec frontend npm install <package-name>

# Run linter
docker compose exec frontend npm run lint

# Run build
docker compose exec frontend npm run build
```

### 3. Hot Reload Best Practices

- Save files frequently (auto-save recommended)
- Watch terminal for TypeScript errors
- Use browser DevTools for React debugging

### 4. Environment Variables

Create a `.env` file in frontend directory:

```bash
cp frontend/.env.example frontend/.env
```

Edit values in `.env` (these override docker-compose values):

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_WIDGET_CDN_URL=http://localhost:8080
VITE_ENV=development
```

## Next Steps

### Adding Backend Service

1. Create `backend/Dockerfile`
2. Uncomment backend section in `docker-compose.yml`
3. Add PostgreSQL and Redis services
4. Run: `docker compose up backend postgres redis`

### Adding Nginx Reverse Proxy

1. Create `nginx/nginx.conf`
2. Uncomment nginx section in `docker-compose.yml`
3. Configure routing rules
4. Run: `docker compose up nginx`

### Production Build

For production deployment, separate docker-compose files are recommended:

```bash
# Create production compose file
docker-compose.prod.yml

# Run with production config
docker compose -f docker-compose.prod.yml up -d
```

## Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Vite Documentation](https://vite.dev/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

## Support

For issues or questions:
- Check logs: `docker compose logs frontend`
- Rebuild from scratch: `docker compose down -v && docker compose build --no-cache`
- Report issues in project GitHub repository
