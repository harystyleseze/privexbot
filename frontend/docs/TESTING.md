# Authentication Testing Guide

## ✅ Fixes Applied

All authentication configuration issues have been resolved. The system now correctly uses `localhost:8000` for API calls in development.

### Key Changes Made:

1. **docker-compose.dev.yml** - Changed `VITE_API_BASE_URL` from `http://backend-dev:8000/api/v1` to `http://localhost:8000/api/v1`
   - **Why**: React runs client-side in the browser, which cannot resolve Docker service names
   - **Impact**: Browser can now reach the backend via localhost

2. **AuthContext.tsx** - Enhanced error handling
   - Network errors now show: "Cannot connect to server. Please ensure the backend is running."
   - FastAPI validation errors are properly parsed and displayed
   - Array validation errors are joined into readable messages

3. **SETUP.md** - Updated documentation
   - Clarified client-side vs server-side architecture
   - Removed incorrect Docker networking explanations
   - Added clear diagrams showing how browser communicates with backend

4. **scripts/docker/dev.sh** - Improved startup script
   - Now checks if backend is accessible via HTTP (not just Docker network)
   - Provides clearer error messages

---

## 🧪 Testing Instructions

### Prerequisites

1. **Backend must be running:**
   ```bash
   cd ../backend
   ./scripts/docker/dev.sh up
   ```

2. **Frontend should be running:**
   ```bash
   cd frontend
   docker compose -f docker-compose.dev.yml up
   # OR
   npm run dev
   ```

3. **Open browser to:** http://localhost:5173

---

## Test Cases

### 1. Email Signup (Success)

**URL:** http://localhost:5173/signup

**Steps:**
1. Fill in form:
   - Username: `testuser1`
   - Email: `test1@example.com`
   - Password: `TestPass123!`
   - Confirm Password: `TestPass123!`

2. Click "Sign up with Email"

**Expected Result:**
- Loading spinner appears
- No errors displayed
- Redirect to `/dashboard`
- Console shows: `[AuthAPI] Configuration: { API_BASE_URL: 'http://localhost:8000/api/v1', ... }`

**Backend Request:**
```bash
POST http://localhost:8000/api/v1/auth/email/signup
Content-Type: application/json

{
  "username": "testuser1",
  "email": "test1@example.com",
  "password": "TestPass123!"
}
```

---

### 2. Email Signup (Validation Errors)

**Test weak password:**
- Password: `weak` (< 8 chars)

**Expected Error:**
- "String should have at least 8 characters"

**Test password without special character:**
- Password: `TestPass123`

**Expected Error:**
- "Password must contain at least one special character (!@#$%^&*(),.?\":{}|<>)"

**Test mismatched passwords:**
- Password: `TestPass123!`
- Confirm: `TestPass456!`

**Expected Error:**
- "Passwords do not match"

---

### 3. Email Login (Success)

**URL:** http://localhost:5173/login

**Steps:**
1. Use credentials from signup test
2. Fill in:
   - Email: `test1@example.com`
   - Password: `TestPass123!`
3. Click "Sign in with Email"

**Expected Result:**
- Loading spinner appears
- No errors displayed
- Redirect to `/dashboard`

**Backend Request:**
```bash
POST http://localhost:8000/api/v1/auth/email/login
Content-Type: application/json

{
  "email": "test1@example.com",
  "password": "TestPass123!"
}
```

---

### 4. Email Login (Invalid Credentials)

**Steps:**
1. Enter wrong password: `WrongPass123!`
2. Click "Sign in with Email"

**Expected Error:**
- "Invalid email or password" (or similar message from backend)

---

### 5. Network Error (Backend Down)

**Steps:**
1. Stop backend:
   ```bash
   cd ../backend
   ./scripts/docker/dev.sh down
   ```
2. Try to login or signup

**Expected Error:**
- Alert banner appears with: "Cannot connect to server. Please ensure the backend is running."
- Browser console shows: `[AuthAPI] Network error - Backend not reachable`

---

### 6. MetaMask Wallet Login (If MetaMask installed)

**Steps:**
1. Click "MetaMask (EVM)" button
2. MetaMask popup appears
3. Select account and click "Connect"
4. Sign the challenge message
5. MetaMask popup for signature appears
6. Click "Sign"

**Expected Result:**
- Loading spinner during process
- Redirect to `/dashboard` on success
- User authenticated via wallet

**Backend Requests:**
```bash
# 1. Request challenge
POST http://localhost:8000/api/v1/auth/evm/challenge
Content-Type: application/json
{"address": "0x..."}

# 2. Verify signature
POST http://localhost:8000/api/v1/auth/evm/verify
Content-Type: application/json
{
  "address": "0x...",
  "signed_message": "...",
  "signature": "0x..."
}
```

**Expected Errors:**
- No MetaMask: "MetaMask not installed. Please install MetaMask extension."
- User rejects: "MetaMask signature request was rejected"

---

### 7. Phantom Wallet (Solana) - If Installed

**Steps:**
1. Click "Phantom (Solana)" button
2. Follow Phantom wallet prompts

**Expected Result:**
- Similar flow to MetaMask
- Challenge → Sign → Verify → Dashboard

**Endpoints:**
- `POST /auth/solana/challenge`
- `POST /auth/solana/verify`

---

### 8. Keplr Wallet (Cosmos) - If Installed

**Steps:**
1. Click "Keplr (Cosmos)" button
2. Follow Keplr wallet prompts

**Expected Result:**
- Similar flow to MetaMask
- Includes public key in verification

**Endpoints:**
- `POST /auth/cosmos/challenge`
- `POST /auth/cosmos/verify`

---

## 🔍 Debugging

### Check API Configuration

Open browser console and look for:
```
[AuthAPI] Configuration: {
  API_BASE_URL: 'http://localhost:8000/api/v1',
  environment: 'development',
  mode: 'development'
}
```

**If you see `http://backend-dev:8000`:**
- Frontend container needs to be rebuilt
- Run: `docker compose -f docker-compose.dev.yml up --build`

---

### Check CORS

If you see CORS errors in browser console:

1. **Verify backend CORS settings:**
   ```bash
   cd ../backend
   docker logs privexbot-backend-dev | grep CORS
   ```

2. **Check backend config:**
   ```python
   # backend/src/app/core/config.py
   BACKEND_CORS_ORIGINS = "http://localhost:5173,http://localhost:3000"
   ```

3. **Restart backend:**
   ```bash
   cd ../backend
   ./scripts/docker/dev.sh restart
   ```

---

### Check Backend Health

```bash
# Simple test
curl http://localhost:8000/api/v1/auth/email/login

# Should return 422 (validation error) not connection refused
```

---

## 🎯 Success Criteria

All tests pass when:

- ✅ No `ERR_NAME_NOT_RESOLVED` errors
- ✅ No `ERR_NETWORK` errors (when backend is running)
- ✅ Error messages are user-friendly
- ✅ Validation errors display correctly
- ✅ Successful login redirects to dashboard
- ✅ Wallet authentication flows work (if wallets installed)
- ✅ Browser console shows correct API URL

---

## 📝 Environment Variables

**Current configuration (development):**

| File | Variable | Value |
|------|----------|-------|
| `docker-compose.dev.yml` | `VITE_API_BASE_URL` | `http://localhost:8000/api/v1` |
| `.env.dev` (for npm) | `VITE_API_BASE_URL` | `http://localhost:8000/api/v1` |

**Why localhost in both?**
- React is client-side - runs in your browser
- Browser cannot resolve Docker service names like `backend-dev`
- Browser uses localhost to reach ports mapped from Docker
- This is true whether Vite runs in Docker or via npm

---

## 🚀 Quick Test

**One-command test:**
```bash
# Test backend is accessible
curl -X POST http://localhost:8000/api/v1/auth/email/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"TestPass123!"}'

# Expected: {"detail": "..."} (validation error is OK - means it's working)
# Bad: Connection refused or timeout
```

**Open browser test:**
1. Go to: http://localhost:5173/login
2. Open browser DevTools (F12)
3. Go to Console tab
4. Enter any email/password and click "Sign in"
5. Check console for `[AuthAPI] Configuration:` log
6. Verify API URL is `http://localhost:8000/api/v1`
