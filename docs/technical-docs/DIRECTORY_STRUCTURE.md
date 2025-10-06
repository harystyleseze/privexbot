# Frontend Directory Structure

## Overview

This document explains the purpose of each directory in `/src` and when to use them.

## Directory Purposes

### `/api` - API Service Layer
**What**: Type-safe wrappers around backend REST endpoints
**When**: Creating functions that call backend APIs
**Example**:
```typescript
// api/chatbot.ts
import apiClient from '@/lib/api-client';

export const chatbot = {
  list: async (workspaceId: string) => {
    const response = await apiClient.get(`/chatbots?workspace_id=${workspaceId}`);
    return response.data;
  },

  createDraft: async (data: ChatbotDraftData) => {
    const response = await apiClient.post('/chatbots/drafts', data);
    return response.data;
  },
};
```

### `/lib` - Core Infrastructure
**What**: Low-level, framework-agnostic utilities and clients
**When**: Setting up axios, integrating libraries, pure utility functions
**Contains**:
- `api-client.ts` - Axios instance with interceptors
- `utils.ts` - Generic helpers (cn, clsx)

**Example**:
```typescript
// lib/utils.ts
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US').format(date);
}
```

### `/utils` - Business Utilities
**What**: Domain-specific helper functions
**When**: Reusable business logic that doesn't belong in components
**Examples**:
- `permissions.ts` - Permission checks
- `validation.ts` - Business validation rules
- `formatting.ts` - Domain-specific formatting

```typescript
// utils/permissions.ts
export function canEditChatbot(user: User, chatbot: Chatbot): boolean {
  return user.id === chatbot.created_by || user.role === 'admin';
}
```

### `/store` - Global State Management
**What**: Zustand stores for application-wide state
**When**: State needs to be shared across multiple components
**Contains**:
- `workspace-store.ts` - Current workspace/user
- `draft-store.ts` - Draft state management

**Example**:
```typescript
// store/workspace-store.ts
import { create } from 'zustand';

interface WorkspaceState {
  currentWorkspace: Workspace | null;
  setWorkspace: (workspace: Workspace) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  currentWorkspace: null,
  setWorkspace: (workspace) => set({ currentWorkspace: workspace }),
}));
```

### `/hooks` - Custom React Hooks
**What**: Reusable React hooks
**When**: Logic that needs React lifecycle (useState, useEffect, etc.)
**Examples**:
- `useAutoSave.ts` - Auto-save with debouncing
- `useDraftPreview.ts` - Draft preview logic
- `useDraftValidation.ts` - Draft validation

### `/components` - React Components
**What**: UI components
**Structure**:
```
/components
├── /ui           # shadcn/ui primitives (Button, Input, etc.)
├── /chatbot      # Chatbot-specific components
├── /chatflow     # Chatflow-specific components
├── /kb           # Knowledge base components
├── /deployment   # Deployment components
└── /shared       # Shared across features
```

### `/pages` - Route Pages
**What**: Top-level page components
**When**: Creating a new route/page

## When to Use What

| Need | Use | Example |
|------|-----|---------|
| Call backend API | `/api` | `chatbot.createDraft()` |
| Axios setup, generic utils | `/lib` | `api-client.ts`, `cn()` |
| Business logic helper | `/utils` | `canEditChatbot()` |
| Global state | `/store` | `useWorkspaceStore()` |
| React logic | `/hooks` | `useAutoSave()` |
| UI component | `/components` | `<ChatbotCard />` |
| Page route | `/pages` | `<ChatbotBuilder />` |

## Import Conventions

```typescript
// Infrastructure (always absolute imports)
import apiClient from '@/lib/api-client';
import { cn } from '@/lib/utils';

// API services (absolute imports)
import { chatbot } from '@/api/chatbot';
import { auth } from '@/api/auth';

// Business utilities (absolute imports)
import { canEditChatbot } from '@/utils/permissions';

// Global state (absolute imports)
import { useWorkspaceStore } from '@/store/workspace-store';

// Hooks (absolute imports)
import { useAutoSave } from '@/hooks/useAutoSave';

// Components (absolute imports)
import { Button } from '@/components/ui/button';
import ChatPreview from '@/components/shared/ChatPreview';

// Pages (absolute imports - via routing)
import ChatbotBuilder from '@/pages/ChatbotBuilder';
```

## Anti-Patterns to Avoid

❌ **Don't**: Put API calls directly in components
```typescript
// BAD
function MyChatbot() {
  const response = await apiClient.post('/chatbots/drafts', data);
}
```

✅ **Do**: Use API service layer
```typescript
// GOOD
import { chatbot } from '@/api/chatbot';

function MyChatbot() {
  const draft = await chatbot.createDraft(data);
}
```

---

❌ **Don't**: Put business logic in components
```typescript
// BAD
function ChatbotCard({ chatbot, user }) {
  const canEdit = user.id === chatbot.created_by || user.role === 'admin';
}
```

✅ **Do**: Extract to utils
```typescript
// GOOD
import { canEditChatbot } from '@/utils/permissions';

function ChatbotCard({ chatbot, user }) {
  const canEdit = canEditChatbot(user, chatbot);
}
```

---

❌ **Don't**: Duplicate axios instances
```typescript
// BAD - creating new axios instance
const client = axios.create({ baseURL: '...' });
```

✅ **Do**: Use shared api-client
```typescript
// GOOD
import apiClient from '@/lib/api-client';
```

## Current Issues to Fix

1. **Empty files in `/api`** - Need to implement API service functions
2. **Duplicate `apiClient.ts`** - Should only be in `/lib`, not `/api`
3. **Empty `/utils/permissions.ts`** - Should implement permission helpers
4. **No separation of concerns** - Components currently have inline API calls

## Next Steps

1. Implement API service layer in `/api/*.ts`
2. Remove duplicate `/api/apiClient.ts`
3. Implement business utilities in `/utils`
4. Refactor components to use API services
