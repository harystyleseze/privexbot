# Frontend Authentication Documentation

**Status**: ✅ **COMPLETE**
**Date**: 2025-10-16
**Version**: 1.0.0

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Authentication Flow](#authentication-flow)
4. [File Structure](#file-structure)
5. [Components](#components)
6. [API Integration](#api-integration)
7. [Usage Examples](#usage-examples)
8. [Testing](#testing)
9. [Security Considerations](#security-considerations)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The PrivexBot frontend implements a comprehensive authentication system supporting multiple authentication methods:

- **Email/Password**: Traditional credential-based authentication
- **MetaMask (EVM)**: Ethereum wallet authentication via signature verification
- **Phantom (Solana)**: Solana wallet authentication via signature verification
- **Keplr (Cosmos)**: Cosmos/Secret Network wallet authentication via signature verification

### Key Features

- JWT-based session management
- Automatic token refresh on mount
- Protected routes with authentication checks
- Multi-provider wallet support
- Type-safe API integration with TypeScript
- Centralized authentication state with React Context
- Persistent sessions via localStorage

---

## Architecture

### Authentication Flow Diagram

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│  Login/Signup Page                          │
│  - Email/Password Form                      │
│  - Wallet Connect Buttons                   │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│  AuthContext (useAuth hook)                 │
│  - emailLogin()                             │
│  - emailSignup()                            │
│  - walletLogin()                            │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│  API Client (authApi)                       │
│  - POST /auth/email/login                   │
│  - POST /auth/email/signup                  │
│  - POST /auth/{provider}/challenge          │
│  - POST /auth/{provider}/verify             │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│  Backend API (FastAPI)                      │
│  - Validates credentials                    │
│  - Verifies wallet signatures               │
│  - Returns JWT token                        │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│  AuthContext stores token                   │
│  - localStorage.setItem("access_token")     │
│  - Fetches user profile                     │
│  - Updates user state                       │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│  Protected Route                            │
│  - Checks isAuthenticated                   │
│  - Redirects to /login if not authenticated │
│  - Renders protected page if authenticated  │
└─────────────────────────────────────────────┘
```

---

## Authentication Flow

### Email/Password Authentication

**Signup Flow:**
1. User fills signup form (username, email, password)
2. Frontend validates password strength and confirmation
3. Calls `authApi.emailSignup({ username, email, password })`
4. Backend creates User and AuthIdentity records
5. Backend returns JWT token
6. Frontend stores token in localStorage
7. Frontend fetches user profile
8. User redirected to dashboard

**Login Flow:**
1. User fills login form (email, password)
2. Calls `authApi.emailLogin({ email, password })`
3. Backend verifies password hash
4. Backend returns JWT token
5. Frontend stores token in localStorage
6. Frontend fetches user profile
7. User redirected to dashboard

### Wallet Authentication (All Providers)

**Challenge-Response Pattern:**

1. **Request Challenge:**
   - User clicks wallet button (MetaMask/Phantom/Keplr)
   - Frontend connects to wallet extension
   - Gets wallet address from extension
   - Calls `authApi.requestWalletChallenge(provider, { address })`
   - Backend generates cryptographically secure nonce
   - Backend stores nonce in Redis (5 min expiration)
   - Backend returns challenge message with nonce

2. **Sign Message:**
   - Frontend prompts wallet to sign challenge message
   - User approves signature in wallet extension
   - Frontend receives signature from wallet

3. **Verify Signature:**
   - Frontend calls `authApi.verifyWalletSignature(provider, { address, signed_message, signature })`
   - Backend retrieves nonce from Redis (single-use)
   - Backend verifies signature cryptographically:
     - **EVM**: Recovers signer from ECDSA signature, verifies matches address
     - **Solana**: Verifies Ed25519 signature with public key (address)
     - **Cosmos**: Verifies secp256k1 signature with provided public key, checks address derivation
   - Backend finds or creates user
   - Backend returns JWT token
   - Frontend stores token and fetches profile
   - User redirected to dashboard

---

## File Structure

```
frontend/src/
├── api/
│   └── auth.ts                      # Authentication API client
├── components/
│   ├── auth/
│   │   └── ProtectedRoute.tsx       # Protected route wrapper
│   └── ui/
│       ├── alert.tsx                # Alert component (errors/success)
│       ├── button.tsx               # Button component
│       ├── card.tsx                 # Card component
│       ├── input.tsx                # Input component
│       └── label.tsx                # Label component
├── contexts/
│   └── AuthContext.tsx              # Authentication state management
├── pages/
│   ├── DashboardPage.tsx            # Protected dashboard page
│   ├── LoginPage.tsx                # Login page (email + wallets)
│   └── SignupPage.tsx               # Signup page (email + wallets)
├── types/
│   └── auth.ts                      # TypeScript types for auth
└── components/App/
    └── App.tsx                      # Main app with routing
```

---

## Components

### 1. AuthContext (`/contexts/AuthContext.tsx`)

**Purpose**: Centralized authentication state management

**Exports**:
- `AuthProvider`: Context provider component
- `useAuth()`: Hook to access authentication context

**State**:
```typescript
{
  user: UserProfile | null;           // Current user data
  isAuthenticated: boolean;           // Auth status
  isLoading: boolean;                 // Loading state
  error: string | null;               // Error message
}
```

**Methods**:
```typescript
{
  emailSignup: (data: EmailSignupRequest) => Promise<void>;
  emailLogin: (data: EmailLoginRequest) => Promise<void>;
  walletLogin: (provider, data) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}
```

**Features**:
- Automatic token restore on mount
- Token expiration checking
- User profile fetching
- Error handling
- localStorage integration

**Usage**:
```tsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, emailLogin, logout } = useAuth();

  return (
    <div>
      {isAuthenticated ? (
        <>
          <p>Welcome, {user?.username}!</p>
          <button onClick={logout}>Sign Out</button>
        </>
      ) : (
        <button onClick={() => emailLogin({ email, password })}>
          Sign In
        </button>
      )}
    </div>
  );
}
```

---

### 2. ProtectedRoute (`/components/auth/ProtectedRoute.tsx`)

**Purpose**: Restrict access to authenticated-only pages

**Features**:
- Shows loading spinner while checking authentication
- Redirects to `/login` if not authenticated
- Renders protected content if authenticated

**Usage**:
```tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  }
/>
```

---

### 3. LoginPage (`/pages/LoginPage.tsx`)

**Purpose**: User login interface

**Features**:
- Email/password form with validation
- MetaMask (EVM) wallet login button
- Phantom (Solana) wallet login button
- Keplr (Cosmos) wallet login button
- Error display (Alert component)
- Loading states
- Link to signup page

**Wallet Login Handlers**:
- `handleMetaMaskLogin()`: Connects to MetaMask, requests challenge, signs, verifies
- `handlePhantomLogin()`: Connects to Phantom, requests challenge, signs, verifies
- `handleKeplrLogin()`: Connects to Keplr, requests challenge, signs, verifies

---

### 4. SignupPage (`/pages/SignupPage.tsx`)

**Purpose**: New user registration interface

**Features**:
- Email/password signup form with username
- Password strength indicator (Weak/Medium/Strong)
- Password confirmation with visual feedback
- Wallet signup buttons (same providers as login)
- Error display
- Loading states
- Link to login page
- Terms of Service notice

**Validation**:
- Username: 3-50 characters
- Email: Valid email format
- Password: Minimum 8 characters
- Password confirmation: Must match password

---

### 5. DashboardPage (`/pages/DashboardPage.tsx`)

**Purpose**: Protected dashboard for authenticated users

**Features**:
- Header with logo, username, sign out button
- Quick action cards (Chatbots, Chatflows, Knowledge Bases)
- Account information display:
  - User ID
  - Username
  - Account status
  - Authentication methods count
  - Member since date

---

## API Integration

### Authentication API Client (`/api/auth.ts`)

**Class**: `AuthApiClient`

**Configuration**:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
```

**Automatic Token Injection**:
```typescript
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**Methods**:

#### Email Authentication
```typescript
async emailSignup(data: EmailSignupRequest): Promise<Token>
async emailLogin(data: EmailLoginRequest): Promise<Token>
async changePassword(oldPassword: string, newPassword: string): Promise<void>
```

#### Wallet Authentication
```typescript
async requestWalletChallenge(provider: WalletProvider, data: WalletChallengeRequest): Promise<WalletChallengeResponse>
async verifyWalletSignature(provider: WalletProvider, data: WalletVerifyRequest | CosmosWalletVerifyRequest): Promise<Token>
async linkWallet(provider: WalletProvider, data: WalletVerifyRequest | CosmosWalletVerifyRequest): Promise<void>
```

#### User Profile
```typescript
async getCurrentUser(): Promise<UserProfile>
```

**Export**:
```typescript
export const authApi = new AuthApiClient();
```

---

## Usage Examples

### 1. Email Login

```tsx
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

function LoginForm() {
  const { emailLogin, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await emailLogin({ email, password });
      // User will be redirected by the login handler
    } catch (err) {
      // Error is handled by AuthContext
      console.error('Login failed:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}
```

### 2. MetaMask Wallet Login

```tsx
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/api/auth';

function WalletLogin() {
  const { walletLogin } = useAuth();

  const handleMetaMaskLogin = async () => {
    if (!window.ethereum) {
      alert('MetaMask not installed');
      return;
    }

    try {
      // Connect to MetaMask
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      const address = accounts[0];

      // Request challenge
      const challenge = await authApi.requestWalletChallenge('evm', { address });

      // Sign message
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [challenge.message, address],
      });

      // Verify signature
      await walletLogin('evm', {
        address,
        signed_message: challenge.message,
        signature,
      });

      // User logged in successfully
    } catch (err) {
      console.error('MetaMask login failed:', err);
    }
  };

  return (
    <button onClick={handleMetaMaskLogin}>
      Connect MetaMask
    </button>
  );
}
```

### 3. Protected Page

```tsx
import { useAuth } from '@/contexts/AuthContext';

function ProtectedPage() {
  const { user, logout } = useAuth();

  return (
    <div>
      <h1>Welcome, {user?.username}!</h1>
      <p>User ID: {user?.id}</p>
      <button onClick={logout}>Sign Out</button>
    </div>
  );
}

// In App.tsx
<Route
  path="/protected"
  element={
    <ProtectedRoute>
      <ProtectedPage />
    </ProtectedRoute>
  }
/>
```

### 4. Conditional Rendering Based on Auth

```tsx
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

function Header() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header>
      <nav>
        <Link to="/">Home</Link>
        {isAuthenticated ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <span>Hello, {user?.username}</span>
            <button onClick={logout}>Sign Out</button>
          </>
        ) : (
          <>
            <Link to="/login">Sign In</Link>
            <Link to="/signup">Sign Up</Link>
          </>
        )}
      </nav>
    </header>
  );
}
```

---

## Testing

### Development Environment Setup

1. **Backend Running**: Ensure backend is running at `http://localhost:8000`
2. **Environment Variables**: Check `.env.dev` file:
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api/v1
   ```

### Manual Testing Checklist

#### Email Authentication
- [ ] Sign up with new email/password
- [ ] Verify redirect to dashboard after signup
- [ ] Sign out
- [ ] Sign in with same credentials
- [ ] Verify session persists after page refresh
- [ ] Test with invalid credentials (should show error)
- [ ] Test with weak password (should show error)

#### MetaMask (EVM) Authentication
- [ ] Install MetaMask extension
- [ ] Click MetaMask login button
- [ ] Approve connection request
- [ ] Sign challenge message
- [ ] Verify redirect to dashboard
- [ ] Sign out and repeat (should work for existing account)
- [ ] Reject signature (should show error)

#### Phantom (Solana) Authentication
- [ ] Install Phantom extension
- [ ] Click Phantom login button
- [ ] Approve connection request
- [ ] Sign challenge message
- [ ] Verify redirect to dashboard
- [ ] Sign out and repeat
- [ ] Reject signature (should show error)

#### Keplr (Cosmos) Authentication
- [ ] Install Keplr extension
- [ ] Click Keplr login button
- [ ] Approve connection request
- [ ] Sign challenge message
- [ ] Verify redirect to dashboard
- [ ] Sign out and repeat
- [ ] Reject signature (should show error)

#### Protected Routes
- [ ] Try accessing `/dashboard` while logged out (should redirect to `/login`)
- [ ] Sign in and verify access to `/dashboard`
- [ ] Refresh page while on dashboard (should remain authenticated)
- [ ] Sign out from dashboard (should redirect to `/login`)

#### Error Handling
- [ ] Test with backend offline (should show connection error)
- [ ] Test with invalid credentials (should show authentication error)
- [ ] Test wallet login without extension installed (should show installation error)

---

## Security Considerations

### Token Storage

**Current Implementation**: localStorage
**Considerations**:
- ✅ Survives page refresh
- ✅ Simple implementation
- ⚠️ Vulnerable to XSS attacks
- ⚠️ Accessible via JavaScript

**Future Enhancement**: Consider httpOnly cookies for production

### Token Expiration

**Current**: Tokens expire based on backend configuration (default 30 minutes)
**Handling**:
- Checked on mount via `token_expires_at` timestamp
- Expired tokens cleared automatically
- User redirected to login on next protected route access

**Future Enhancement**: Implement refresh token flow

### Password Security

**Client-side**:
- Minimum 8 characters enforced
- Strength indicator (Weak/Medium/Strong)
- Confirmation required on signup

**Server-side**:
- Bcrypt hashing with salt (backend handles this)
- Password validation on backend

### Wallet Signature Security

**Challenge-Response Pattern**:
- Nonce is cryptographically random
- Nonce expires in 5 minutes
- Nonce is single-use (deleted after verification)
- Message includes domain to prevent phishing

**EIP-4361 Compliance** (EVM):
- Standard "Sign-In with Ethereum" format
- Includes domain, address, chain ID, nonce

### CORS Configuration

**Development**:
```env
BACKEND_CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

**Production**: Update backend CORS to include production frontend domain

---

## Troubleshooting

### Common Issues

#### 1. "Cannot connect to backend"

**Symptoms**: Login/signup fails with network error

**Causes**:
- Backend not running
- Wrong API base URL
- CORS misconfiguration

**Solutions**:
1. Verify backend is running:
   ```bash
   cd backend
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
2. Check `.env.dev` has correct `VITE_API_BASE_URL`
3. Verify backend CORS includes frontend URL

#### 2. "MetaMask not installed"

**Symptoms**: Error when clicking MetaMask button

**Cause**: MetaMask extension not installed

**Solution**: Install MetaMask from https://metamask.io

#### 3. "Token expired" / Session lost

**Symptoms**: User logged out unexpectedly

**Causes**:
- Token expired (default 30 min)
- localStorage cleared
- Backend changed JWT secret

**Solutions**:
1. Sign in again
2. Increase `ACCESS_TOKEN_EXPIRE_MINUTES` in backend config
3. Implement refresh token flow (future enhancement)

#### 4. Protected route shows login page briefly then dashboard

**Symptoms**: Flash of login page before dashboard loads

**Cause**: Initial loading state while checking authentication

**Solution**: This is expected behavior. The `ProtectedRoute` component shows a loading spinner during this check.

#### 5. Wallet signature rejected

**Symptoms**: Wallet login fails after rejecting signature

**Cause**: User clicked "Reject" in wallet popup

**Solution**: This is expected. User can try again. Error message guides user to retry.

---

## Next Steps

### Immediate Enhancements
1. **Refresh Token Flow**: Implement refresh tokens to avoid re-login
2. **Remember Me**: Optional persistent sessions (7-day tokens)
3. **Email Verification**: Send verification email on signup
4. **Password Reset**: Forgot password flow
5. **2FA Support**: Time-based one-time passwords (TOTP)

### Future Features
1. **Social Login**: Google, GitHub OAuth
2. **Multi-Account Linking**: Link multiple wallets/emails to one account
3. **Session Management**: View active sessions, revoke tokens
4. **Account Settings**: Change password, update profile
5. **Activity Log**: View authentication history

---

## Build Verification

```bash
npm run build
```

**Expected Output**:
```
✓ 1776 modules transformed.
dist/index.html                   0.58 kB │ gzip:   0.35 kB
dist/assets/index-BQu1DYr-.css   58.07 kB │ gzip:  10.16 kB
dist/assets/index-ScubDSfz.js   351.67 kB │ gzip: 110.92 kB
✓ built in 4.06s
```

**Status**: ✅ **BUILD SUCCESSFUL**

---

## Summary

The PrivexBot frontend authentication system is fully implemented with:

✅ **Email/Password Authentication** (Signup, Login, Change Password)
✅ **Multi-Wallet Support** (MetaMask, Phantom, Keplr)
✅ **JWT Session Management** (Token storage, expiration, refresh on mount)
✅ **Protected Routes** (Authentication checks, automatic redirects)
✅ **Type-Safe API Integration** (TypeScript types, Axios client)
✅ **Error Handling** (User-friendly error messages)
✅ **Loading States** (Spinners, disabled buttons)
✅ **Responsive Design** (Mobile-friendly forms)

**Ready for Production Testing** with backend integration.

---

**Questions or Issues?**
Refer to backend documentation at `/backend/docs/auth/` for API details.
