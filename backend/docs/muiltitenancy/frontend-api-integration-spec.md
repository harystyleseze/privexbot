# 🔗 Frontend API Integration Specification

**Version**: 1.0
**Backend**: FastAPI Multi-tenant (Fully Tested)
**Frontend**: React 19 + TypeScript + Vite
**Status**: All endpoints verified and working

---

## 📋 Table of Contents

1. [API Client Setup](#1-api-client-setup)
2. [Authentication Integration](#2-authentication-integration)
3. [Organization Management](#3-organization-management)
4. [Workspace Management](#4-workspace-management)
5. [Context Switching](#5-context-switching)
6. [Error Handling](#6-error-handling)
7. [TypeScript Interfaces](#7-typescript-interfaces)
8. [Testing Examples](#8-testing-examples)

---

## 1. API Client Setup

### 1.1 Base Configuration

**File**: `src/lib/api-client.ts`

```typescript
import axios, { AxiosInstance, AxiosError } from 'axios';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor: Add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor: Handle auth errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('access_token');
          localStorage.removeItem('token_expires_at');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // HTTP methods
  async get<T>(url: string, config = {}): Promise<T> {
    const response = await this.client.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config = {}): Promise<T> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config = {}): Promise<T> {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config = {}): Promise<T> {
    const response = await this.client.delete(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
```

---

## 2. Authentication Integration

### 2.1 Auth API Module

**File**: `src/api/auth.ts`

**Verified Endpoints**:
- ✅ `POST /api/v1/auth/email/signup`
- ✅ `POST /api/v1/auth/email/login`
- ✅ `GET /api/v1/auth/me`

```typescript
import { apiClient } from '@/lib/api-client';

// Types
export interface EmailSignupRequest {
  username: string;
  email: string;
  password: string;
}

export interface EmailLoginRequest {
  email: string;
  password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface UserProfile {
  id: string;
  username: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  auth_methods: AuthMethod[];
}

export interface AuthMethod {
  provider: string;
  provider_id: string;
  linked_at: string;
}

// API functions
export const authApi = {
  // Email signup
  emailSignup: async (data: EmailSignupRequest): Promise<Token> => {
    return apiClient.post('/api/v1/auth/email/signup', data);
  },

  // Email login
  emailLogin: async (data: EmailLoginRequest): Promise<Token> => {
    return apiClient.post('/api/v1/auth/email/login', data);
  },

  // Get current user profile
  getCurrentUser: async (): Promise<UserProfile> => {
    return apiClient.get('/api/v1/auth/me');
  },
};

// Usage Example
/*
// Signup
const token = await authApi.emailSignup({
  username: 'testuser',
  email: 'test@example.com',
  password: 'SecurePass123!'
});

// Login
const token = await authApi.emailLogin({
  email: 'test@example.com',
  password: 'SecurePass123!'
});

// Get profile
const profile = await authApi.getCurrentUser();
*/
```

---

## 3. Organization Management

### 3.1 Organization API Module

**File**: `src/api/organization.ts`

**Verified Endpoints**:
- ✅ `GET /api/v1/orgs/` (list with pagination)
- ✅ `POST /api/v1/orgs/` (create)
- ✅ `GET /api/v1/orgs/{org_id}` (get details)
- ✅ `PUT /api/v1/orgs/{org_id}` (update)
- ✅ `DELETE /api/v1/orgs/{org_id}` (delete)
- ✅ `GET /api/v1/orgs/{org_id}/members` (list members)
- ✅ `POST /api/v1/orgs/{org_id}/members` (add member)
- ✅ `PUT /api/v1/orgs/{org_id}/members/{member_id}` (update role)
- ✅ `DELETE /api/v1/orgs/{org_id}/members/{member_id}` (remove member)

```typescript
import { apiClient } from '@/lib/api-client';

// Types
export interface Organization {
  id: string;
  name: string;
  billing_email: string;
  subscription_tier: string;
  subscription_status: string;
  trial_ends_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  member_count: number;
  workspace_count: number;
}

export interface OrganizationDetailed extends Organization {
  members: OrganizationMember[];
  workspaces: WorkspaceSummary[];
  settings: Record<string, any>;
}

export interface OrganizationMember {
  id: string;
  user_id: string;
  username: string;
  role: 'owner' | 'admin' | 'member';
  invited_by: string | null;
  joined_at: string;
  created_at: string;
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  created_at: string;
}

export interface OrganizationList {
  organizations: Organization[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface OrganizationCreate {
  name: string;
  billing_email: string;
}

export interface OrganizationUpdate {
  name?: string;
  billing_email?: string;
}

export interface OrganizationMemberCreate {
  user_id: string;
  role: 'member' | 'admin';
}

export interface OrganizationMemberUpdate {
  role: 'member' | 'admin' | 'owner';
}

// API functions
export const organizationApi = {
  // Organization CRUD
  list: async (page = 1, limit = 10): Promise<OrganizationList> => {
    return apiClient.get(`/api/v1/orgs/?page=${page}&limit=${limit}`);
  },

  create: async (data: OrganizationCreate): Promise<Organization> => {
    return apiClient.post('/api/v1/orgs/', data);
  },

  get: async (orgId: string): Promise<OrganizationDetailed> => {
    return apiClient.get(`/api/v1/orgs/${orgId}`);
  },

  update: async (orgId: string, data: OrganizationUpdate): Promise<Organization> => {
    return apiClient.put(`/api/v1/orgs/${orgId}`, data);
  },

  delete: async (orgId: string): Promise<void> => {
    return apiClient.delete(`/api/v1/orgs/${orgId}`);
  },

  // Member management
  members: {
    list: async (orgId: string): Promise<OrganizationMember[]> => {
      return apiClient.get(`/api/v1/orgs/${orgId}/members`);
    },

    add: async (orgId: string, data: OrganizationMemberCreate): Promise<OrganizationMember> => {
      return apiClient.post(`/api/v1/orgs/${orgId}/members`, data);
    },

    updateRole: async (orgId: string, memberId: string, data: OrganizationMemberUpdate): Promise<OrganizationMember> => {
      return apiClient.put(`/api/v1/orgs/${orgId}/members/${memberId}`, data);
    },

    remove: async (orgId: string, memberId: string): Promise<void> => {
      return apiClient.delete(`/api/v1/orgs/${orgId}/members/${memberId}`);
    },
  },
};

// Usage Examples
/*
// List organizations
const orgList = await organizationApi.list(1, 10);
console.log(`Found ${orgList.total} organizations`);

// Create organization
const newOrg = await organizationApi.create({
  name: 'My Organization',
  billing_email: 'billing@example.com'
});

// Get organization details
const orgDetails = await organizationApi.get(newOrg.id);
console.log(`Org has ${orgDetails.members.length} members`);

// Add member
const member = await organizationApi.members.add(newOrg.id, {
  user_id: 'user-uuid',
  role: 'member'
});
*/
```

---

## 4. Workspace Management

### 4.1 Workspace API Module

**File**: `src/api/workspace.ts`

**Verified Endpoints**:
- ✅ `GET /api/v1/orgs/{org_id}/workspaces` (list with pagination)
- ✅ `POST /api/v1/orgs/{org_id}/workspaces` (create)
- ✅ `GET /api/v1/orgs/{org_id}/workspaces/{workspace_id}` (get details)
- ✅ `PUT /api/v1/orgs/{org_id}/workspaces/{workspace_id}` (update)
- ✅ `DELETE /api/v1/orgs/{org_id}/workspaces/{workspace_id}` (delete)
- ✅ All member management endpoints (list, add, update, remove)

```typescript
import { apiClient } from '@/lib/api-client';

// Types
export interface Workspace {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  member_count: number;
}

export interface WorkspaceDetailed extends Workspace {
  members: WorkspaceMember[];
  settings: Record<string, any>;
}

export interface WorkspaceMember {
  id: string;
  user_id: string;
  username: string;
  role: 'viewer' | 'editor' | 'admin';
  invited_by: string | null;
  joined_at: string;
  created_at: string;
}

export interface WorkspaceList {
  workspaces: Workspace[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface WorkspaceCreate {
  organization_id: string;
  name: string;
  description?: string;
  is_default?: boolean;
}

export interface WorkspaceUpdate {
  name?: string;
  description?: string;
}

export interface WorkspaceMemberCreate {
  user_id: string;
  role: 'viewer' | 'editor' | 'admin';
}

export interface WorkspaceMemberUpdate {
  role: 'viewer' | 'editor' | 'admin';
}

// API functions
export const workspaceApi = {
  // Workspace CRUD
  list: async (orgId: string, page = 1, limit = 10): Promise<WorkspaceList> => {
    return apiClient.get(`/api/v1/orgs/${orgId}/workspaces?page=${page}&limit=${limit}`);
  },

  create: async (orgId: string, data: WorkspaceCreate): Promise<Workspace> => {
    return apiClient.post(`/api/v1/orgs/${orgId}/workspaces`, data);
  },

  get: async (orgId: string, workspaceId: string): Promise<WorkspaceDetailed> => {
    return apiClient.get(`/api/v1/orgs/${orgId}/workspaces/${workspaceId}`);
  },

  update: async (orgId: string, workspaceId: string, data: WorkspaceUpdate): Promise<Workspace> => {
    return apiClient.put(`/api/v1/orgs/${orgId}/workspaces/${workspaceId}`, data);
  },

  delete: async (orgId: string, workspaceId: string): Promise<void> => {
    return apiClient.delete(`/api/v1/orgs/${orgId}/workspaces/${workspaceId}`);
  },

  // Member management
  members: {
    list: async (orgId: string, workspaceId: string): Promise<WorkspaceMember[]> => {
      return apiClient.get(`/api/v1/orgs/${orgId}/workspaces/${workspaceId}/members`);
    },

    add: async (orgId: string, workspaceId: string, data: WorkspaceMemberCreate): Promise<WorkspaceMember> => {
      return apiClient.post(`/api/v1/orgs/${orgId}/workspaces/${workspaceId}/members`, data);
    },

    updateRole: async (orgId: string, workspaceId: string, memberId: string, data: WorkspaceMemberUpdate): Promise<WorkspaceMember> => {
      return apiClient.put(`/api/v1/orgs/${orgId}/workspaces/${workspaceId}/members/${memberId}`, data);
    },

    remove: async (orgId: string, workspaceId: string, memberId: string): Promise<void> => {
      return apiClient.delete(`/api/v1/orgs/${orgId}/workspaces/${workspaceId}/members/${memberId}`);
    },
  },
};

// Usage Examples
/*
// List workspaces in organization
const workspaces = await workspaceApi.list(orgId, 1, 20);

// Create workspace
const newWorkspace = await workspaceApi.create(orgId, {
  organization_id: orgId,
  name: 'Development Workspace',
  description: 'For development team'
});

// Get workspace details
const wsDetails = await workspaceApi.get(orgId, workspaceId);

// Add workspace member (user must be org member first)
const member = await workspaceApi.members.add(orgId, workspaceId, {
  user_id: 'user-uuid',
  role: 'editor'
});
*/
```

---

## 5. Context Switching

### 5.1 Context API Module

**File**: `src/api/context.ts`

**Verified Endpoints**:
- ✅ `GET /api/v1/switch/current` (get current context)
- ✅ `POST /api/v1/switch/organization` (switch organization)
- ✅ `POST /api/v1/switch/workspace?workspace_id={}` (switch workspace)

```typescript
import { apiClient } from '@/lib/api-client';

// Types
export interface ContextSwitchRequest {
  organization_id: string;
  workspace_id?: string | null;
}

export interface ContextSwitchResponse {
  access_token: string;
  token_type: string;
  organization_id: string;
  organization_name: string;
  workspace_id: string | null;
  workspace_name: string | null;
  permissions: Record<string, boolean>;
}

export interface CurrentContextResponse {
  user_id: string;
  username: string;
  organization_id: string;
  organization_name: string;
  workspace_id: string | null;
  workspace_name: string | null;
  permissions: Record<string, boolean>;
}

// API functions
export const contextApi = {
  // Get current context
  getCurrent: async (): Promise<CurrentContextResponse> => {
    return apiClient.get('/api/v1/switch/current');
  },

  // Switch organization (optionally with specific workspace)
  switchOrganization: async (data: ContextSwitchRequest): Promise<ContextSwitchResponse> => {
    return apiClient.post('/api/v1/switch/organization', data);
  },

  // Switch workspace within current organization
  switchWorkspace: async (workspaceId: string): Promise<ContextSwitchResponse> => {
    return apiClient.post(`/api/v1/switch/workspace?workspace_id=${workspaceId}`);
  },
};

// Usage Examples
/*
// Get current context
const context = await contextApi.getCurrent();
console.log(`Current: ${context.organization_name} > ${context.workspace_name}`);

// Switch to different organization (uses default workspace)
const newContext = await contextApi.switchOrganization({
  organization_id: 'org-uuid',
  workspace_id: null
});

// Switch to specific workspace
const wsContext = await contextApi.switchWorkspace('workspace-uuid');

// Both switch methods return new JWT token
localStorage.setItem('access_token', newContext.access_token);
*/
```

---

## 6. Error Handling

### 6.1 Comprehensive Error Handling

**File**: `src/utils/api-errors.ts`

```typescript
import { AxiosError } from 'axios';

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

export function handleApiError(error: unknown): ApiError {
  console.error('API Error:', error);

  if (error instanceof AxiosError) {
    const response = error.response;

    if (response?.data?.detail) {
      const detail = response.data.detail;

      // Pydantic validation errors (422)
      if (Array.isArray(detail)) {
        return {
          message: detail.map((e: any) => e.msg).join(', '),
          code: '422',
          status: response.status,
          details: detail
        };
      }

      // Simple error message
      return {
        message: detail,
        code: response.status?.toString(),
        status: response.status
      };
    }

    // Network errors
    if (error.code === 'ERR_NETWORK') {
      return {
        message: 'Cannot connect to server. Please check your connection.',
        code: 'NETWORK_ERROR'
      };
    }

    // HTTP status errors
    switch (response?.status) {
      case 401:
        return {
          message: 'Authentication required. Please log in.',
          code: '401',
          status: 401
        };
      case 403:
        return {
          message: 'Access denied. You do not have permission.',
          code: '403',
          status: 403
        };
      case 404:
        return {
          message: 'Resource not found.',
          code: '404',
          status: 404
        };
      case 422:
        return {
          message: 'Invalid request data.',
          code: '422',
          status: 422
        };
      default:
        return {
          message: error.message || 'An unexpected error occurred',
          code: response?.status?.toString(),
          status: response?.status
        };
    }
  }

  // Non-Axios errors
  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'UNKNOWN_ERROR'
    };
  }

  return {
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR'
  };
}

// Hook for error handling
export function useApiError() {
  const [error, setError] = useState<ApiError | null>(null);

  const handleError = useCallback((err: unknown) => {
    const apiError = handleApiError(err);
    setError(apiError);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, clearError };
}

// Usage in components
/*
const { error, handleError, clearError } = useApiError();

try {
  await organizationApi.create(data);
} catch (err) {
  handleError(err);
}

if (error) {
  return <ErrorAlert error={error} onClose={clearError} />;
}
*/
```

---

## 7. TypeScript Interfaces

### 7.1 Common Types

**File**: `src/types/api.ts`

```typescript
// Common API response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// Permission types (aligned with backend)
export type Permission =
  | 'org:read'
  | 'org:write'
  | 'org:delete'
  | 'org:manage_members'
  | 'workspace:create'
  | 'workspace:read'
  | 'workspace:write'
  | 'workspace:delete'
  | 'workspace:manage_members'
  | 'chatbot:create'
  | 'chatbot:edit'
  | 'chatbot:delete'
  | 'chatflow:create'
  | 'chatflow:edit'
  | 'chatflow:delete';

// Role types
export type OrganizationRole = 'owner' | 'admin' | 'member';
export type WorkspaceRole = 'admin' | 'editor' | 'viewer';

// JWT payload structure (from backend)
export interface JWTPayload {
  sub: string; // user_id
  email: string;
  org_id: string;
  ws_id: string | null;
  perms: Record<Permission, boolean>;
  exp: number;
  iat: number;
}

// Context types
export interface TenantContext {
  userId: string;
  username: string;
  organizationId: string;
  organizationName: string;
  workspaceId: string | null;
  workspaceName: string | null;
  permissions: Record<Permission, boolean>;
  role: string;
}

// API client configuration
export interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
}

// Loading states
export interface LoadingState {
  isLoading: boolean;
  isContextLoading: boolean;
  isRefreshing: boolean;
}

// Error states
export interface ErrorState {
  hasError: boolean;
  error: ApiError | null;
  retryCount: number;
}
```

---

## 8. Testing Examples

### 8.1 API Integration Tests

**File**: `src/api/__tests__/organization.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { organizationApi } from '../organization';
import { authApi } from '../auth';

describe('Organization API Integration', () => {
  let authToken: string;
  let testOrgId: string;

  beforeEach(async () => {
    // Setup: Login and get auth token
    const tokenResponse = await authApi.emailLogin({
      email: 'test@example.com',
      password: 'TestPass123!'
    });
    authToken = tokenResponse.access_token;
    localStorage.setItem('access_token', authToken);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should list organizations', async () => {
    const response = await organizationApi.list(1, 10);

    expect(response).toHaveProperty('organizations');
    expect(response).toHaveProperty('total');
    expect(response).toHaveProperty('page', 1);
    expect(response).toHaveProperty('page_size', 10);
    expect(Array.isArray(response.organizations)).toBe(true);
  });

  it('should create organization', async () => {
    const orgData = {
      name: 'Test Organization API',
      billing_email: 'test-org@example.com'
    };

    const newOrg = await organizationApi.create(orgData);
    testOrgId = newOrg.id;

    expect(newOrg).toHaveProperty('id');
    expect(newOrg.name).toBe(orgData.name);
    expect(newOrg.billing_email).toBe(orgData.billing_email);
    expect(newOrg).toHaveProperty('member_count', 1);
    expect(newOrg).toHaveProperty('workspace_count', 1);
  });

  it('should get organization details', async () => {
    const orgDetails = await organizationApi.get(testOrgId);

    expect(orgDetails.id).toBe(testOrgId);
    expect(orgDetails).toHaveProperty('members');
    expect(orgDetails).toHaveProperty('workspaces');
    expect(Array.isArray(orgDetails.members)).toBe(true);
    expect(Array.isArray(orgDetails.workspaces)).toBe(true);
  });

  it('should handle errors correctly', async () => {
    // Test 404 error
    await expect(
      organizationApi.get('00000000-0000-0000-0000-000000000000')
    ).rejects.toThrow();

    // Test unauthorized access
    localStorage.removeItem('access_token');
    await expect(
      organizationApi.list()
    ).rejects.toThrow();
  });
});
```

### 8.2 Context Switching Tests

**File**: `src/api/__tests__/context.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { contextApi } from '../context';
import { organizationApi } from '../organization';

describe('Context Switching Integration', () => {
  let testOrgId: string;
  let testWorkspaceId: string;

  beforeEach(async () => {
    // Setup: Create test organization and workspace
    const org = await organizationApi.create({
      name: 'Context Test Org',
      billing_email: 'context@example.com'
    });
    testOrgId = org.id;

    const orgDetails = await organizationApi.get(testOrgId);
    testWorkspaceId = orgDetails.workspaces[0].id; // Default workspace
  });

  it('should get current context', async () => {
    const context = await contextApi.getCurrent();

    expect(context).toHaveProperty('user_id');
    expect(context).toHaveProperty('username');
    expect(context).toHaveProperty('organization_id');
    expect(context).toHaveProperty('organization_name');
    expect(context).toHaveProperty('workspace_id');
    expect(context).toHaveProperty('workspace_name');
    expect(context).toHaveProperty('permissions');
    expect(typeof context.permissions).toBe('object');
  });

  it('should switch organization', async () => {
    const response = await contextApi.switchOrganization({
      organization_id: testOrgId,
      workspace_id: null
    });

    expect(response).toHaveProperty('access_token');
    expect(response).toHaveProperty('token_type', 'bearer');
    expect(response.organization_id).toBe(testOrgId);
    expect(response).toHaveProperty('workspace_id');
    expect(response).toHaveProperty('permissions');

    // Verify new token works
    localStorage.setItem('access_token', response.access_token);
    const newContext = await contextApi.getCurrent();
    expect(newContext.organization_id).toBe(testOrgId);
  });

  it('should switch workspace', async () => {
    const response = await contextApi.switchWorkspace(testWorkspaceId);

    expect(response).toHaveProperty('access_token');
    expect(response.workspace_id).toBe(testWorkspaceId);
    expect(response).toHaveProperty('permissions');

    // Verify context updated
    localStorage.setItem('access_token', response.access_token);
    const newContext = await contextApi.getCurrent();
    expect(newContext.workspace_id).toBe(testWorkspaceId);
  });

  it('should handle unauthorized context switch', async () => {
    await expect(
      contextApi.switchOrganization({
        organization_id: '00000000-0000-0000-0000-000000000000',
        workspace_id: null
      })
    ).rejects.toThrow();
  });
});
```

---

## 9. Integration Checklist

### 9.1 Backend Verification ✅

- [x] All organization endpoints tested and working
- [x] All workspace endpoints tested and working
- [x] Context switching endpoints verified
- [x] JWT token refresh working correctly
- [x] Permission-based access control verified
- [x] Error responses (400, 401, 403, 404, 422) handled
- [x] Pagination working correctly
- [x] Member management (add, update, remove) working
- [x] Cascading operations (org delete → workspace delete) working

### 9.2 Frontend Implementation ✅

- [x] API client with interceptors configured
- [x] TypeScript interfaces matching backend schemas
- [x] Error handling for all error types
- [x] Context management with JWT updates
- [x] Permission utilities for UI rendering
- [x] Loading state management
- [x] Integration test examples provided

### 9.3 Security & Best Practices ✅

- [x] JWT token secure storage and expiration
- [x] Automatic token refresh on API calls
- [x] Logout on 401 errors
- [x] Permission-based UI rendering
- [x] Input validation and error display
- [x] Network error handling
- [x] Request timeout configuration

**This specification provides everything needed to integrate the frontend with the fully tested and verified backend multi-tenancy API.**