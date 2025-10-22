# 🏗️ Frontend Multi-Tenancy Implementation Guide

**Version**: 1.0
**Target**: React 19 + TypeScript + Vite Frontend
**Backend**: FastAPI Multi-tenant API (tested & verified)
**Architecture**: Organization → Workspace → Resources

---

## 📋 Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [API Integration Layer](#2-api-integration-layer)
3. [Context Management](#3-context-management)
4. [Components Structure](#4-components-structure)
5. [Routing & Navigation](#5-routing--navigation)
6. [Dashboard Implementation](#6-dashboard-implementation)
7. [Security & Permissions](#7-security--permissions)
8. [State Management](#8-state-management)
9. [Implementation Steps](#9-implementation-steps)

---

## 1. Architecture Overview

### 1.1 Multi-Tenancy Hierarchy
```
User
├── OrganizationMember (role: owner/admin/member)
│   └── Organization
│       └── Workspace
│           ├── Chatbot (form-based, simple)
│           ├── Chatflow (visual workflow, complex)
│           └── KnowledgeBase (RAG documents)
```

### 1.2 Frontend Context Stack
```typescript
// Context layering from outer to inner
<ThemeProvider>
  <AuthProvider>      // JWT token, user profile, auth state
    <TenantProvider>   // org_id, workspace_id, permissions
      <App />          // Routes and components
    </TenantProvider>
  </AuthProvider>
</ThemeProvider>
```

### 1.3 Backend API Alignment
The backend provides these **verified and tested** endpoints:

- **Auth**: `/api/v1/auth/email/{signup,login}`, `/api/v1/auth/me`
- **Organizations**: `/api/v1/orgs/` (CRUD + member management)
- **Workspaces**: `/api/v1/orgs/{org_id}/workspaces/` (CRUD + member management)
- **Context**: `/api/v1/switch/{organization,workspace}`, `/api/v1/switch/current`

---

## 2. API Integration Layer

### 2.1 Enhanced API Client

**File**: `src/lib/api-client.ts`

```typescript
import axios, { AxiosInstance, AxiosResponse } from 'axios';

interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

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

    // Request interceptor for auth token
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('token_expires_at');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(url);
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url);
    return response.data;
  }
}

export const apiClient = new ApiClient();
```

### 2.2 Organization API

**File**: `src/api/organization.ts`

```typescript
import { apiClient } from '@/lib/api-client';

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

export const organizationApi = {
  // List user's organizations
  list: async (page = 1, limit = 10): Promise<OrganizationList> => {
    return apiClient.get(`/api/v1/orgs/?page=${page}&limit=${limit}`);
  },

  // Create organization
  create: async (data: OrganizationCreate): Promise<Organization> => {
    return apiClient.post('/api/v1/orgs/', data);
  },

  // Get organization details
  get: async (orgId: string): Promise<OrganizationDetailed> => {
    return apiClient.get(`/api/v1/orgs/${orgId}`);
  },

  // Update organization
  update: async (orgId: string, data: OrganizationUpdate): Promise<Organization> => {
    return apiClient.put(`/api/v1/orgs/${orgId}`, data);
  },

  // Delete organization
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
```

### 2.3 Workspace API

**File**: `src/api/workspace.ts`

```typescript
import { apiClient } from '@/lib/api-client';

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

export const workspaceApi = {
  // List organization workspaces
  list: async (orgId: string, page = 1, limit = 10): Promise<WorkspaceList> => {
    return apiClient.get(`/api/v1/orgs/${orgId}/workspaces?page=${page}&limit=${limit}`);
  },

  // Create workspace
  create: async (orgId: string, data: WorkspaceCreate): Promise<Workspace> => {
    return apiClient.post(`/api/v1/orgs/${orgId}/workspaces`, data);
  },

  // Get workspace details
  get: async (orgId: string, workspaceId: string): Promise<WorkspaceDetailed> => {
    return apiClient.get(`/api/v1/orgs/${orgId}/workspaces/${workspaceId}`);
  },

  // Update workspace
  update: async (orgId: string, workspaceId: string, data: WorkspaceUpdate): Promise<Workspace> => {
    return apiClient.put(`/api/v1/orgs/${orgId}/workspaces/${workspaceId}`, data);
  },

  // Delete workspace
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
```

### 2.4 Context Switching API

**File**: `src/api/context.ts`

```typescript
import { apiClient } from '@/lib/api-client';

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

export const contextApi = {
  // Get current context
  getCurrent: async (): Promise<CurrentContextResponse> => {
    return apiClient.get('/api/v1/switch/current');
  },

  // Switch organization context
  switchOrganization: async (data: ContextSwitchRequest): Promise<ContextSwitchResponse> => {
    return apiClient.post('/api/v1/switch/organization', data);
  },

  // Switch workspace context
  switchWorkspace: async (workspaceId: string): Promise<ContextSwitchResponse> => {
    return apiClient.post(`/api/v1/switch/workspace?workspace_id=${workspaceId}`);
  },
};
```

---

## 3. Context Management

### 3.1 Enhanced Tenant Context

**File**: `src/contexts/TenantContext.tsx`

```typescript
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { contextApi, type ContextSwitchResponse, type CurrentContextResponse } from '@/api/context';
import { useAuth } from './AuthContext';

interface TenantContextType {
  // Current context
  organizationId: string | null;
  organizationName: string | null;
  workspaceId: string | null;
  workspaceName: string | null;
  permissions: Record<string, boolean>;

  // Loading states
  isLoading: boolean;
  isContextLoading: boolean;

  // Actions
  switchOrganization: (orgId: string, workspaceId?: string) => Promise<void>;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  refreshContext: () => Promise<void>;

  // Utilities
  hasPermission: (permission: string) => boolean;
  isOrgAdmin: () => boolean;
  isWorkspaceAdmin: () => boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Context state
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isContextLoading, setIsContextLoading] = useState(false);

  /**
   * Update context state from API response
   */
  const updateContext = useCallback((context: CurrentContextResponse | ContextSwitchResponse) => {
    setOrganizationId(context.organization_id);
    setOrganizationName(context.organization_name);
    setWorkspaceId(context.workspace_id);
    setWorkspaceName(context.workspace_name);
    setPermissions(context.permissions);
  }, []);

  /**
   * Handle context switch response (includes new JWT token)
   */
  const handleContextSwitch = useCallback((response: ContextSwitchResponse) => {
    // Update localStorage with new token
    localStorage.setItem('access_token', response.access_token);

    // Calculate and store expiration (assuming 24 hour expiry)
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem('token_expires_at', expiresAt.toString());

    // Update context state
    updateContext(response);
  }, [updateContext]);

  /**
   * Switch organization context
   */
  const switchOrganization = useCallback(async (orgId: string, wsId?: string) => {
    try {
      setIsContextLoading(true);
      const response = await contextApi.switchOrganization({
        organization_id: orgId,
        workspace_id: wsId,
      });
      handleContextSwitch(response);
    } catch (error) {
      console.error('Failed to switch organization:', error);
      throw error;
    } finally {
      setIsContextLoading(false);
    }
  }, [handleContextSwitch]);

  /**
   * Switch workspace context
   */
  const switchWorkspace = useCallback(async (wsId: string) => {
    try {
      setIsContextLoading(true);
      const response = await contextApi.switchWorkspace(wsId);
      handleContextSwitch(response);
    } catch (error) {
      console.error('Failed to switch workspace:', error);
      throw error;
    } finally {
      setIsContextLoading(false);
    }
  }, [handleContextSwitch]);

  /**
   * Refresh current context
   */
  const refreshContext = useCallback(async () => {
    try {
      setIsLoading(true);
      const context = await contextApi.getCurrent();
      updateContext(context);
    } catch (error) {
      console.error('Failed to refresh context:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [updateContext]);

  /**
   * Check if user has specific permission
   */
  const hasPermission = useCallback((permission: string): boolean => {
    return permissions[permission] === true;
  }, [permissions]);

  /**
   * Check if user is organization admin/owner
   */
  const isOrgAdmin = useCallback((): boolean => {
    return hasPermission('org:write') || hasPermission('org:delete');
  }, [hasPermission]);

  /**
   * Check if user is workspace admin
   */
  const isWorkspaceAdmin = useCallback((): boolean => {
    return hasPermission('workspace:manage_members');
  }, [hasPermission]);

  /**
   * Load initial context when user authenticates
   */
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      refreshContext();
    } else if (!isAuthenticated) {
      // Clear context when user logs out
      setOrganizationId(null);
      setOrganizationName(null);
      setWorkspaceId(null);
      setWorkspaceName(null);
      setPermissions({});
      setIsLoading(false);
    }
  }, [isAuthenticated, authLoading, refreshContext]);

  const value: TenantContextType = {
    organizationId,
    organizationName,
    workspaceId,
    workspaceName,
    permissions,
    isLoading,
    isContextLoading,
    switchOrganization,
    switchWorkspace,
    refreshContext,
    hasPermission,
    isOrgAdmin,
    isWorkspaceAdmin,
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

/**
 * Hook to use tenant context
 */
export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
}
```

### 3.2 Updated App Component

**File**: `src/components/App/App.tsx`

```typescript
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/LoginPage";
import { SignupPage } from "@/pages/SignupPage";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Dashboard } from "@/pages/Dashboard";
import { Chatbots } from "@/pages/Chatbots";
import { Chatflows } from "@/pages/Chatflows";
import { Analytics } from "@/pages/Analytics";
import { Organizations } from "@/pages/Organizations";
import { Settings } from "@/pages/Settings";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TenantProvider>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

              {/* Protected Routes with Dashboard Layout */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Dashboard />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chatbots"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Chatbots />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chatflows"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Chatflows />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Analytics />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/organizations"
                element={
                  <ProtectedRoute requiredPermission="org:read">
                    <DashboardLayout>
                      <Organizations />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Settings />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Router>
        </TenantProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
```

---

## 4. Components Structure

### 4.1 Dashboard Layout

**File**: `src/components/layout/DashboardLayout.tsx`

```typescript
import React from 'react';
import { Sidebar } from './Sidebar';
import { TopNavigation } from './TopNavigation';
import { useTenant } from '@/contexts/TenantContext';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isLoading } = useTenant();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - Fixed width, full height */}
      <div className="w-64 bg-white shadow-sm border-r border-gray-200">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation - Only above main content */}
        <TopNavigation />

        {/* Page Content - Scrollable */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### 4.2 Sidebar Component

**File**: `src/components/layout/Sidebar.tsx`

```typescript
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { OrganizationSwitcher } from './OrganizationSwitcher';
import { UserProfile } from './UserProfile';
import {
  HomeIcon,
  ChatBubbleLeftRightIcon,
  CogIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Chatbots', href: '/chatbots', icon: ChatBubbleLeftRightIcon },
  { name: 'Chatflows', href: '/chatflows', icon: CogIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
];

const adminItems = [
  { name: 'Organizations', href: '/organizations', icon: BuildingOfficeIcon, permission: 'org:read' },
];

const otherItems = [
  { name: 'Documentation', href: '/docs', icon: DocumentTextIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
];

export function Sidebar() {
  const location = useLocation();
  const { hasPermission } = useTenant();
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);

  const isCurrentPage = (href: string) => location.pathname === href;

  return (
    <div className="flex flex-col h-full">
      {/* Workspace Area */}
      <div className="p-4 border-b border-gray-200">
        <OrganizationSwitcher />
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Workspaces</span>
            <button
              onClick={() => setShowCreateWorkspace(true)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              title="Create workspace"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
          </div>
          <WorkspaceSwitcher />
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 py-4">
        <div className="space-y-1">
          {navigationItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isCurrentPage(item.href)
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          ))}
        </div>

        {/* Admin Section */}
        <div className="mt-6">
          <div className="space-y-1">
            {adminItems.map((item) => {
              if (item.permission && !hasPermission(item.permission)) {
                return null;
              }

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isCurrentPage(item.href)
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Others Section */}
      <div className="px-4 py-4 border-t border-gray-200">
        <div className="space-y-1">
          {otherItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Profile Area */}
      <div className="p-4 border-t border-gray-200">
        <UserProfile />
      </div>

      {/* Create Workspace Modal */}
      {showCreateWorkspace && (
        <CreateWorkspaceModal onClose={() => setShowCreateWorkspace(false)} />
      )}
    </div>
  );
}
```

### 4.3 Organization Switcher

**File**: `src/components/layout/OrganizationSwitcher.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { organizationApi, type Organization } from '@/api/organization';
import { ChevronDownIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export function OrganizationSwitcher() {
  const { organizationName, organizationId, switchOrganization, isContextLoading } = useTenant();
  const [isOpen, setIsOpen] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load organizations when dropdown opens
  useEffect(() => {
    if (isOpen && organizations.length === 0) {
      loadOrganizations();
    }
  }, [isOpen]);

  const loadOrganizations = async () => {
    try {
      setIsLoading(true);
      const response = await organizationApi.list(1, 50); // Load first 50 orgs
      setOrganizations(response.organizations);
    } catch (error) {
      console.error('Failed to load organizations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrgSwitch = async (orgId: string) => {
    try {
      await switchOrganization(orgId);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to switch organization:', error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isContextLoading}
        className="w-full flex items-center justify-between p-2 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
      >
        <div className="flex items-center">
          <BuildingOfficeIcon className="w-5 h-5 text-gray-500 mr-2" />
          <span className="font-medium text-gray-900 truncate">
            {organizationName || 'Loading...'}
          </span>
        </div>
        {isContextLoading ? (
          <LoadingSpinner size="sm" />
        ) : (
          <ChevronDownIcon className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="py-1">
            {isLoading ? (
              <div className="px-3 py-2 text-center">
                <LoadingSpinner size="sm" />
              </div>
            ) : (
              <>
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => handleOrgSwitch(org.id)}
                    className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                      org.id === organizationId ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                    }`}
                  >
                    <div className="font-medium">{org.name}</div>
                    <div className="text-sm text-gray-500">
                      {org.workspace_count} workspaces • {org.member_count} members
                    </div>
                  </button>
                ))}
                <div className="border-t border-gray-200 mt-1 pt-1">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      // TODO: Open create organization modal
                    }}
                    className="w-full px-3 py-2 text-left text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    + Create New Organization
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

### 4.4 Workspace Switcher

**File**: `src/components/layout/WorkspaceSwitcher.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { workspaceApi, type Workspace } from '@/api/workspace';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export function WorkspaceSwitcher() {
  const {
    organizationId,
    workspaceId,
    switchWorkspace,
    isContextLoading
  } = useTenant();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load workspaces when organization changes
  useEffect(() => {
    if (organizationId) {
      loadWorkspaces();
    }
  }, [organizationId]);

  const loadWorkspaces = async () => {
    if (!organizationId) return;

    try {
      setIsLoading(true);
      const response = await workspaceApi.list(organizationId, 1, 20);
      setWorkspaces(response.workspaces);
    } catch (error) {
      console.error('Failed to load workspaces:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkspaceSwitch = async (wsId: string) => {
    if (wsId === workspaceId) return;

    try {
      await switchWorkspace(wsId);
    } catch (error) {
      console.error('Failed to switch workspace:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-2">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {workspaces.map((workspace) => (
        <button
          key={workspace.id}
          onClick={() => handleWorkspaceSwitch(workspace.id)}
          disabled={isContextLoading}
          className={`w-full flex items-center p-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 ${
            workspace.id === workspaceId
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
          title={workspace.description || workspace.name}
        >
          <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold mr-2 ${
            workspace.id === workspaceId
              ? 'bg-blue-700 text-white'
              : 'bg-gray-200 text-gray-600'
          }`}>
            {workspace.name.charAt(0).toUpperCase()}
          </div>
          <span className="truncate">{workspace.name}</span>
          {workspace.is_default && (
            <span className="ml-auto text-xs opacity-75">Default</span>
          )}
        </button>
      ))}
    </div>
  );
}
```

---

**[Continue to Part 2 for Dashboard Implementation, Security, and Implementation Steps...]**