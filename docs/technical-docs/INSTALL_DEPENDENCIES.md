# Frontend Dependencies Installation

## Required Packages

Install all required dependencies for the production-ready frontend:

```bash
# Core routing and state management
npm install react-router-dom @tanstack/react-query zustand

# Form handling and validation
npm install react-hook-form @hookform/resolvers zod

# Visual flow editor (for ChatflowBuilder)
npm install reactflow

# Map visualization (for LeadsDashboard)
npm install react-leaflet leaflet
npm install -D @types/leaflet

# HTTP client
npm install axios

# Date handling
npm install date-fns

# Rich text editor (for prompts)
npm install @tiptap/react @tiptap/starter-kit

# Additional UI components
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-toast @radix-ui/react-switch @radix-ui/react-label @radix-ui/react-checkbox @radix-ui/react-progress

# Drag and drop (for file uploads and reordering)
npm install @dnd-kit/core @dnd-kit/sortable

# Code editor (for ChatflowBuilder code node)
npm install @monaco-editor/react

# Icons
npm install lucide-react

# Utilities
npm install clsx tailwind-merge class-variance-authority
```

## All-in-One Command

```bash
npm install react-router-dom @tanstack/react-query zustand react-hook-form @hookform/resolvers zod reactflow react-leaflet leaflet axios date-fns @tiptap/react @tiptap/starter-kit @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-toast @radix-ui/react-switch @radix-ui/react-label @radix-ui/react-checkbox @radix-ui/react-progress @dnd-kit/core @dnd-kit/sortable @monaco-editor/react
```

```bash
npm install -D @types/leaflet
```

## Architecture Notes

### State Management
- **Zustand** - Global state (user, workspace, drafts)
- **React Query** - Server state, caching, mutations
- **React Hook Form** - Form state

### Routing
- **React Router v6** - Client-side routing
- Protected routes for authenticated pages
- Nested routes for workspace context

### API Integration
- **Axios** - HTTP client with interceptors
- Automatic token refresh
- Request/response transformers
- Error handling

### Draft Auto-Save
- Debounced saves (500ms delay)
- Optimistic updates
- Conflict resolution
- TTL extension on activity

### Visual Editor
- **ReactFlow** - Node-based workflow editor
- Custom node types (LLM, KB, Condition, HTTP, etc.)
- Edge validation
- Auto-layout
- Minimap and controls
