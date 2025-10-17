# PrivexBot Frontend Setup Guide

## Environment Configuration

The frontend supports multiple deployment modes with automatic API URL configuration based on the environment.

### Development Environments

#### Option 1: Docker Development (Recommended)
**When to use:** Full-stack development with backend, database, and Redis

**Backend setup:**
```bash
cd backend
./scripts/docker/dev.sh up
```

**Frontend setup:**
```bash
cd frontend
docker compose -f docker-compose.dev.yml up
```

**Configuration:**
- Frontend accessible at: `http://localhost:5173`
- Backend accessible at: `http://localhost:8000`
- API calls use: `http://localhost:8000/api/v1` (browser makes API calls)
- Environment variables are set in `docker-compose.dev.yml`

**Important:** React is a client-side framework - JavaScript runs in YOUR BROWSER. API calls come from your browser using `localhost`, not from the container.

---

#### Option 2: Local Development (npm)
**When to use:** Frontend-only development, faster iteration

**Backend setup (required):**
```bash
cd backend
./scripts/docker/dev.sh up
```

**Frontend setup:**
```bash
cd frontend
cp .env.dev.example .env.dev  # If not already created
npm install
npm run dev
```

**Configuration:**
- Frontend accessible at: `http://localhost:5173`
- Backend accessible at: `http://localhost:8000`
- API calls use: `http://localhost:8000/api/v1` (from `.env.dev`)
- Uses `.env.dev` file for environment variables

---

### Production Environment

**Configuration:**
- Uses `.env` file with production URLs
- API URL: `https://api.privexbot.com/api/v1` or `https://api.harystyles.shop/api/v1`
- Build command: `npm run build`
- Serves from `dist/` directory

---

## Environment Variable Priority

Vite loads environment variables in this order (highest priority first):

1. **Environment variables** in `docker-compose.*.yml` (when using Docker)
2. **`.env.development.local`** (local overrides, git-ignored)
3. **`.env.development`** (development-specific)
4. **`.env.local`** (local overrides, git-ignored)
5. **`.env`** (default/production)

---

## File Purposes

| File | Purpose | When Used | Git Tracked |
|------|---------|-----------|-------------|
| `.env` | Production configuration | Production builds | ✅ Yes |
| `.env.dev` | Development configuration | Local npm dev | ❌ No (git-ignored) |
| `.env.dev.example` | Development template | Copy to create `.env.dev` | ✅ Yes |
| `.env.example` | Production template | Reference for production setup | ✅ Yes |
| `docker-compose.dev.yml` | Docker development config | Docker development | ✅ Yes |

---

## Authentication Configuration

All authentication endpoints (email, wallet) use the base URL from `VITE_API_BASE_URL`:

### Email Authentication
- **Signup:** `POST {VITE_API_BASE_URL}/auth/email/signup`
- **Login:** `POST {VITE_API_BASE_URL}/auth/email/login`
- **Change Password:** `POST {VITE_API_BASE_URL}/auth/email/change-password`

### Wallet Authentication (EVM, Solana, Cosmos)
- **Challenge:** `POST {VITE_API_BASE_URL}/auth/{provider}/challenge`
- **Verify:** `POST {VITE_API_BASE_URL}/auth/{provider}/verify`
- **Link:** `POST {VITE_API_BASE_URL}/auth/{provider}/link`

Where `{provider}` is:
- `evm` - MetaMask and other EVM wallets
- `solana` - Phantom wallet
- `cosmos` - Keplr wallet

---

## Troubleshooting

### Error: Network Error / ERR_NAME_NOT_RESOLVED

**Cause:** Frontend is trying to reach a non-existent domain or Docker service name

**Solution:**
1. **Always use `localhost` for development** - React runs in the browser, not in containers:
   - **Docker:** `docker-compose.dev.yml` should have `VITE_API_BASE_URL=http://localhost:8000/api/v1`
   - **npm dev:** `.env.dev` should have `VITE_API_BASE_URL=http://localhost:8000/api/v1`

2. Verify backend is running:
   ```bash
   curl http://localhost:8000/api/v1/auth/email/login
   ```

3. Check browser console - you should see `[AuthAPI] Configuration:` log showing the URL being used

### Error: Connection Refused (ECONNREFUSED)

**Cause:** Backend is not running or not accessible

**Solution:**
1. Start the backend:
   ```bash
   cd backend
   ./scripts/docker/dev.sh up
   ```

2. Check backend logs:
   ```bash
   cd backend
   ./scripts/docker/dev.sh logs
   ```

### Frontend loads but API calls fail

**Cause:** Wrong `.env` file being loaded

**Solution:**
1. Check which file Vite is loading:
   ```bash
   npm run dev -- --debug
   ```

2. Ensure `.env.dev` exists and has correct URL:
   ```bash
   cat .env.dev
   ```

3. Clear Vite cache:
   ```bash
   rm -rf node_modules/.vite
   npm run dev
   ```

---

## Client-Side Architecture (Important!)

React is a **client-side** framework. Understanding this is critical:

```
┌─────────────────────────────────────────────┐
│             Your Computer                   │
│                                             │
│  ┌──────────────┐          ┌────────────┐  │
│  │   Browser    │          │  Backend   │  │
│  │  (React App) │─────────→│  :8000     │  │
│  │              │  API     │            │  │
│  └──────────────┘  Calls   └────────────┘  │
│         │         (localhost:8000)          │
│         │                                   │
│         │ Loads React from                  │
│         ↓                                   │
│  ┌──────────────┐                           │
│  │  Vite Server │                           │
│  │  :5173       │                           │
│  └──────────────┘                           │
│    (can be in Docker or npm)                │
└─────────────────────────────────────────────┘
```

**Key Points:**
- React runs in YOUR BROWSER, not in containers
- Browser downloads JavaScript from Vite server (port 5173)
- Browser executes React code locally
- **API calls come from browser → backend** using `localhost:8000`
- This is true whether Vite runs in Docker or via npm
- Docker networks are only for server-to-server communication (e.g., SSR)

---

## Quick Start Commands

### Full Stack (Docker)
```bash
# Terminal 1: Start backend (creates shared network)
cd backend && ./scripts/docker/dev.sh up

# Terminal 2: Start frontend (connects to backend network)
cd frontend && ./scripts/docker/dev.sh up
```

### Frontend Only (npm)
```bash
# Ensure backend is running
cd backend && ./scripts/docker/dev.sh up

# In another terminal
cd frontend
npm install
npm run dev
```

### Production Build
```bash
cd frontend
npm run build
npm run preview  # Test production build locally
```

---

## Environment Variables Reference

### `VITE_API_BASE_URL`
- **Required:** Yes
- **Purpose:** Backend API base URL
- **Development:** `http://localhost:8000/api/v1` (same for Docker and npm)
- **Production:** `https://api.privexbot.com/api/v1` or `https://api.harystyles.shop/api/v1`
- **Important:** Always use `localhost` in development because React runs client-side in the browser

### `VITE_WIDGET_CDN_URL`
- **Required:** No
- **Purpose:** Widget embeddable script URL
- **Development:** `http://localhost:8080`
- **Production:** `https://cdn.privexbot.com` or `https://cdn.harystyles.shop`

### `VITE_ENV`
- **Required:** No
- **Purpose:** Environment identifier for debugging
- **Values:** `development`, `staging`, `production`
