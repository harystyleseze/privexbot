# PrivexBot Dashboard - Complete Design & Implementation Guide

> **Version**: 1.0  
> **Last Updated**: October 27, 2025  
> **Status**: Production-Ready Reference Documentation

This is the authoritative design system documentation for PrivexBot Dashboard. Every design decision, pattern, and implementation detail documented here has been battle-tested and represents the current production state of the application.

## Table of Contents

### Foundation

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Architecture](#project-architecture)

### Design System Core

4. [Color System & Theming](#color-system--theming)
5. [Typography System](#typography-system)
6. [Spacing & Sizing](#spacing--sizing)
7. [Iconography](#iconography)

### Layout & Structure

8. [Layout Architecture](#layout-architecture)
9. [Grid System](#grid-system)
10. [Z-Index Scale](#z-index-scale)

### Component Patterns

11. [Component Design Patterns](#component-design-patterns)
12. [Sidebar Navigation](#sidebar-navigation)
13. [Dashboard Pages](#dashboard-pages)
14. [Form Components](#form-components)

### Theming & Accessibility

15. [Dark/Light Mode Implementation](#darklight-mode-implementation)
16. [Accessibility Standards](#accessibility-standards)
17. [Color Contrast Guidelines](#color-contrast-guidelines)

### Responsive Design

18. [Responsive Design Strategy](#responsive-design-strategy)
19. [Breakpoint System](#breakpoint-system)
20. [Mobile Patterns](#mobile-patterns)

### Advanced Topics

21. [State Management](#state-management)
22. [Performance Optimization](#performance-optimization)
23. [Animation & Transitions](#animation--transitions)
24. [Error & Loading States](#error--loading-states)

### Development Guidelines

25. [Code Organization](#code-organization)
26. [Naming Conventions](#naming-conventions)
27. [Import Patterns](#import-patterns)
28. [Testing Strategy](#testing-strategy)

### Reference

29. [Key Lessons Learned](#key-lessons-learned)
30. [Common Pitfalls & Solutions](#common-pitfalls--solutions)
31. [Best Practices](#best-practices)
32. [Quick Reference](#quick-reference)

---

## Project Overview

### Product Description

**PrivexBot Dashboard** is a multi-tenant SaaS platform for building, deploying, and managing AI-powered chatbots. The platform provides two distinct creation modes:

1. **Simple Chatbots**: Form-based interface for quick FAQ bots and simple Q&A assistants
2. **Advanced Chatflows**: Visual drag-and-drop workflow builder (Studio) for complex, multi-step conversational AI

### Platform Capabilities

- 📚 **RAG-Powered Knowledge Bases**: Integration with files, websites, Notion, Google Docs
- 🌍 **Multi-Channel Deployment**: Website widgets, Discord, Telegram, WhatsApp, API
- 📊 **Lead Capture & Analytics**: Comprehensive user data collection and insights
- 👥 **Multi-Tenancy**: Organizations → Workspaces → Resources hierarchy
- 🎨 **Full Customization**: White-label ready with extensive branding options
- 🔐 **Role-Based Access Control**: Granular permissions at organization and workspace levels

### Design Philosophy

The dashboard follows a **Discord-inspired interface** with the following principles:

1. **Dark Sidebar on Both Modes**: The sidebar remains dark even in light mode, providing visual consistency and reducing cognitive load during theme switches
2. **Clear Hierarchical Navigation**: Three-column layout (Workspace Switcher | Sidebar | Content) with obvious visual hierarchy
3. **Content Adapts to Theme**: While the sidebar stays dark, content pages properly adapt between light and dark modes
4. **Mobile-First Responsive**: Every component is designed mobile-first and scales gracefully to desktop
5. **Accessibility First**: WCAG AA compliance is a requirement, not an afterthought
6. **Performance Optimized**: Lazy loading, code splitting, and optimized re-renders throughout

### User Experience Goals

- **Zero Learning Curve**: Familiar patterns from Discord, Slack, and modern SaaS apps
- **Fast Navigation**: Quick workspace/organization switching without page reloads
- **Consistent Experience**: Same patterns across all pages and features
- **Responsive Performance**: Instant feedback, smooth transitions, no janky animations
- **Clear Visual Feedback**: Obvious loading, error, and success states

---

## Technology Stack

### Core Technologies

```json
{
  "runtime": "React 19.1.1",
  "language": "TypeScript 5.x",
  "bundler": "Vite 7.1.12",
  "styling": "Tailwind CSS 3.4.1",
  "router": "React Router v6",
  "stateManagement": {
    "server": "@tanstack/react-query 5.17.19",
    "global": "React Context API",
    "local": "React useState/useReducer"
  },
  "forms": "react-hook-form 7.49.3 + zod 3.22.4",
  "icons": "lucide-react 0.544.0",
  "uiComponents": "shadcn/ui patterns with Radix UI primitives"
}
```

### Why These Choices?

#### React 19.1.1

- **Latest features**: Concurrent rendering, automatic batching
- **Performance**: Better re-render optimization
- **Ecosystem**: Largest component library and community support

#### TypeScript

- **Type Safety**: Catch errors at compile-time
- **IntelliSense**: Better DX with autocomplete
- **Refactoring**: Safe refactoring across large codebase
- **Documentation**: Types serve as documentation

#### Vite

- **Lightning Fast HMR**: Updates in milliseconds
- **Modern Build**: ESM-native, optimized bundling
- **Plugin Ecosystem**: Rich plugin support
- **Dev Experience**: Instant server start, fast builds

#### Tailwind CSS

- **Utility-First**: Rapid development without context switching
- **Theme Support**: Built-in dark mode and custom theming
- **PurgeCSS**: Only ships used CSS
- **Consistency**: Design tokens enforce consistency
- **No CSS Conflicts**: Scoped by design

#### React Query

- **Server State**: Automatic caching, background refetching
- **Optimistic Updates**: Instant UI feedback
- **Error Handling**: Built-in retry logic
- **DevTools**: Excellent debugging experience

#### React Hook Form + Zod

- **Performance**: Uncontrolled components, fewer re-renders
- **Validation**: Schema-based validation with TypeScript types
- **DX**: Simple API, great error messages

#### Lucide React

- **Consistent Icons**: Coherent design language
- **Tree-Shakeable**: Only bundle used icons
- **Customizable**: Easy to style with className
- **Active Maintenance**: Regular updates

#### shadcn/ui + Radix UI

- **Accessibility**: WCAG compliant out of the box
- **Headless**: Full styling control
- **Composable**: Build complex UIs from primitives
- **Type-Safe**: Full TypeScript support
- **No Bundle Bloat**: Copy components you need

### Dependency Management

```json
{
  "dependencies": {
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "react-router-dom": "^6.20.0",
    "@tanstack/react-query": "^5.17.19",
    "react-hook-form": "^7.49.3",
    "zod": "^3.22.4",
    "lucide-react": "^0.544.0",
    "@radix-ui/react-alert-dialog": "^1.0.5",
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-progress": "^1.0.3",
    "@radix-ui/react-scroll-area": "^1.0.5",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-switch": "^1.0.3",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "tailwindcss": "^3.4.1",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.3.1"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^7.1.12",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32"
  }
}
```

---

## Project Architecture

### Folder Structure

```
privexbot-dashboard/
├── public/                    # Static assets
│   ├── privexbot-logo.png    # Brand assets
│   └── videos/               # Hero animations
├── src/
│   ├── api/                  # API client and endpoints
│   │   └── index.ts         # Centralized API exports
│   ├── assets/              # Processed assets (images, fonts)
│   ├── components/          # React components
│   │   ├── ui/             # Base UI components (shadcn/ui)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   └── ...
│   │   ├── layout/         # Layout components
│   │   │   ├── Layouts.tsx          # Root layout wrapper
│   │   │   ├── Sidebar.tsx          # Main navigation
│   │   │   ├── WorkspaceSwitcher.tsx # Workspace icons
│   │   │   ├── OrganizationSwitcher.tsx
│   │   │   └── UserProfile.tsx
│   │   ├── dashboard/      # Dashboard-specific
│   │   │   ├── StatsCards.tsx
│   │   │   ├── RecentActivity.tsx
│   │   │   └── ChatbotList.tsx
│   │   └── shared/         # Reusable business components
│   ├── contexts/           # React Context providers
│   │   ├── AppContext.tsx          # User, org, workspace state
│   │   └── ThemeContext.tsx        # Theme management
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── usePermissions.ts
│   │   └── useAutoSave.ts
│   ├── lib/                # Utilities and helpers
│   │   ├── api-client.ts          # HTTP client
│   │   └── utils.ts               # Helper functions
│   ├── pages/              # Route components
│   │   ├── Dashboard.tsx
│   │   ├── Studio.tsx
│   │   ├── Chatbots.tsx
│   │   ├── Organizations.tsx
│   │   ├── KnowledgeBase.tsx
│   │   ├── Analytics.tsx
│   │   ├── Leads.tsx
│   │   ├── Marketplace.tsx
│   │   ├── Referrals.tsx
│   │   ├── Profile.tsx
│   │   ├── Documentation.tsx
│   │   ├── Settings.tsx
│   │   ├── Billing.tsx
│   │   └── Team.tsx
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/              # Pure utility functions
│   │   └── utils.ts
│   ├── App.tsx             # Root application component
│   ├── main.tsx            # Application entry point
│   └── index.css           # Global styles and Tailwind imports
├── index.html              # HTML template
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── tsconfig.app.json       # App-specific TS config
├── tsconfig.node.json      # Node-specific TS config
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind configuration
├── postcss.config.js       # PostCSS configuration
└── README.md               # Project documentation
```

### Architecture Patterns

#### Feature-Based Organization

```
components/
├── ui/              # Atomic components (buttons, inputs, cards)
├── [feature]/       # Feature-specific composites (dashboard, chatbots)
├── layout/          # Layout components (sidebar, header)
└── shared/          # Cross-feature reusables (loading, error states)
```

#### Separation of Concerns

- **Pages**: Route handlers, data fetching, layout composition
- **Components**: Presentational logic only
- **Hooks**: Reusable stateful logic
- **Contexts**: Global state management
- **API**: All server communication
- **Utils**: Pure functions, no side effects

---

## Complete Color System

### Brand Colors (Primary, Secondary, Accent)

```typescript
// tailwind.config.js
const brandColors = {
  // Primary - Blue (Main brand color)
  primary: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6", // DEFAULT primary
    600: "#2563eb", // Primary hover
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
    950: "#172554",
  },

  // Secondary - Purple
  secondary: {
    50: "#f5f3ff",
    100: "#ede9fe",
    200: "#ddd6fe",
    300: "#c4b5fd",
    400: "#a78bfa",
    500: "#8b5cf6", // DEFAULT secondary
    600: "#7c3aed", // Secondary hover
    700: "#6d28d9",
    800: "#5b21b6",
    900: "#4c1d95",
    950: "#2e1065",
  },

  // Accent - Cyan
  accent: {
    50: "#ecfeff",
    100: "#cffafe",
    200: "#a5f3fc",
    300: "#67e8f9",
    400: "#22d3ee",
    500: "#06b6d4", // DEFAULT accent
    600: "#0891b2", // Accent hover
    700: "#0e7490",
    800: "#155e75",
    900: "#164e63",
    950: "#083344",
  },
};
```

### Semantic Colors (Success, Error, Warning, Info)

```typescript
const semanticColors = {
  // Success - Green
  success: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e", // DEFAULT success
    600: "#16a34a",
    700: "#15803d",
    800: "#166534",
    900: "#14532d",
    950: "#052e16",
  },

  // Error/Danger - Red
  error: {
    50: "#fef2f2",
    100: "#fee2e2",
    200: "#fecaca",
    300: "#fca5a5",
    400: "#f87171",
    500: "#ef4444", // DEFAULT error
    600: "#dc2626",
    700: "#b91c1c",
    800: "#991b1b",
    900: "#7f1d1d",
    950: "#450a0a",
  },

  // Warning - Amber/Yellow
  warning: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b", // DEFAULT warning
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
    950: "#451a03",
  },

  // Info - Blue (uses primary)
  info: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6", // DEFAULT info
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
    950: "#172554",
  },
};
```

### Neutral Palette (Gray Scale)

```typescript
const neutralColors = {
  // Gray (Tailwind default)
  gray: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
    950: "#030712",
  },

  // True Gray (neutral tone)
  neutral: {
    50: "#fafafa",
    100: "#f5f5f5",
    200: "#e5e5e5",
    300: "#d4d4d4",
    400: "#a3a3a3",
    500: "#737373",
    600: "#525252",
    700: "#404040",
    800: "#262626",
    900: "#171717",
    950: "#0a0a0a",
  },

  // Slate (cool tone)
  slate: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
    950: "#020617",
  },
};
```

### Sidebar Colors (Dark on Both Modes)

```typescript
// Custom colors for Discord-like sidebar
const sidebarColors = {
  light: {
    background: "#2B2D31",
    hover: "#36373D",
    active: "#404249",
    border: "#3a3a3a",
    text: "#FFFFFF",
    textMuted: "#B5BAC1",
  },
  dark: {
    background: "#1E1F22",
    hover: "#2B2D31",
    active: "#313338",
    border: "#26272B",
    text: "#FFFFFF",
    textMuted: "#B5BAC1",
  },
};
```

### Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Brand colors
        primary: {
          DEFAULT: "#3b82f6",
          foreground: "#ffffff",
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        secondary: {
          DEFAULT: "#8b5cf6",
          foreground: "#ffffff",
          // ... (full scale)
        },
        accent: {
          DEFAULT: "#06b6d4",
          foreground: "#ffffff",
          // ... (full scale)
        },

        // Semantic colors
        success: {
          DEFAULT: "#22c55e",
          foreground: "#ffffff",
          // ... (full scale)
        },
        error: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
          // ... (full scale)
        },
        warning: {
          DEFAULT: "#f59e0b",
          foreground: "#ffffff",
          // ... (full scale)
        },
        info: {
          DEFAULT: "#3b82f6",
          foreground: "#ffffff",
          // ... (full scale)
        },

        // Sidebar custom colors
        sidebar: {
          light: {
            DEFAULT: "#2B2D31",
            foreground: "#FFFFFF",
            muted: "#B5BAC1",
            hover: "#36373D",
            border: "#3a3a3a",
          },
          dark: {
            DEFAULT: "#1E1F22",
            foreground: "#FFFFFF",
            muted: "#B5BAC1",
            hover: "#2B2D31",
            border: "#26272B",
          },
        },
      },
    },
  },
};
```

### Color Usage Examples

```tsx
// Primary actions
<button className="bg-primary-600 hover:bg-primary-700 text-white">
  Create Chatbot
</button>

// Secondary actions
<button className="bg-secondary-600 hover:bg-secondary-700 text-white">
  Advanced Settings
</button>

// Accent highlights
<span className="text-accent-500 font-medium">
  New Feature
</span>

// Success state
<div className="bg-success-50 dark:bg-success-500/10 text-success-800 dark:text-success-300 border border-success-200 dark:border-success-500/20 rounded-lg p-4">
  Chatbot deployed successfully!
</div>

// Error state
<div className="bg-error-50 dark:bg-error-500/10 text-error-800 dark:text-error-300 border border-error-200 dark:border-error-500/20 rounded-lg p-4">
  Failed to save changes
</div>

// Warning state
<div className="bg-warning-50 dark:bg-warning-500/10 text-warning-800 dark:text-warning-300 border border-warning-200 dark:border-warning-500/20 rounded-lg p-4">
  API key expires soon
</div>

// Info state
<div className="bg-info-50 dark:bg-info-500/10 text-info-800 dark:text-info-300 border border-info-200 dark:border-info-500/20 rounded-lg p-4">
  New version available
</div>
```

---

## Typography System (Tailwind Convention)

### Font Families

```css
/* src/index.css */
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap");

:root {
  --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto",
    "Oxygen", "Ubuntu", "Cantarell", "Helvetica Neue", sans-serif;
  --font-mono: "Fira Code", "JetBrains Mono", "SF Mono", "Monaco",
    "Inconsolata", "Roboto Mono", "Courier New", monospace;
}

body {
  font-family: var(--font-sans);
}

code,
pre {
  font-family: var(--font-mono);
}
```

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["Fira Code", "ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
};
```

### Type Scale (Following Tailwind Convention)

```typescript
// Tailwind's default type scale (rem-based)
const typeScale = {
  xs: "0.75rem", // 12px
  sm: "0.875rem", // 14px
  base: "1rem", // 16px (default)
  lg: "1.125rem", // 18px
  xl: "1.25rem", // 20px
  "2xl": "1.5rem", // 24px
  "3xl": "1.875rem", // 30px
  "4xl": "2.25rem", // 36px
  "5xl": "3rem", // 48px
  "6xl": "3.75rem", // 60px
  "7xl": "4.5rem", // 72px
  "8xl": "6rem", // 96px
  "9xl": "8rem", // 128px
};

// Semantic usage
const semanticType = {
  caption: "text-xs", // 12px - Tiny text, captions
  "body-sm": "text-sm", // 14px - Secondary text
  body: "text-base", // 16px - Default body (recommended)
  "body-lg": "text-lg", // 18px - Large body, intro text
  h6: "text-lg", // 18px - Tiny heading
  h5: "text-xl", // 20px - Small heading
  h4: "text-2xl", // 24px - Subsection
  h3: "text-3xl", // 30px - Section
  h2: "text-4xl", // 36px - Page title
  h1: "text-5xl", // 48px - Main title
  "display-sm": "text-6xl", // 60px - Small display
  display: "text-7xl", // 72px - Display/Hero
  "display-lg": "text-8xl", // 96px - Large display
  "display-xl": "text-9xl", // 128px - Massive (rare)
};
```

### Font Weights (Tailwind Convention)

```typescript
const fontWeights = {
  thin: 100, // font-thin
  extralight: 200, // font-extralight
  light: 300, // font-light
  normal: 400, // font-normal (default)
  medium: 500, // font-medium (emphasized text, labels)
  semibold: 600, // font-semibold (headings)
  bold: 700, // font-bold (strong emphasis)
  extrabold: 800, // font-extrabold (display text)
  black: 900, // font-black (maximum emphasis)
};
```

### Line Heights (Tailwind Convention)

```typescript
const lineHeights = {
  // Relative
  none: 1, // leading-none
  tight: 1.25, // leading-tight (headings)
  snug: 1.375, // leading-snug
  normal: 1.5, // leading-normal (body text)
  relaxed: 1.625, // leading-relaxed (long-form)
  loose: 2, // leading-loose

  // Absolute (rem-based)
  "3": "0.75rem", // leading-3
  "4": "1rem", // leading-4
  "5": "1.25rem", // leading-5
  "6": "1.5rem", // leading-6
  "7": "1.75rem", // leading-7
  "8": "2rem", // leading-8
  "9": "2.25rem", // leading-9
  "10": "2.5rem", // leading-10
};
```

### Letter Spacing (Tailwind Convention)

```typescript
const letterSpacing = {
  tighter: "-0.05em", // tracking-tighter
  tight: "-0.025em", // tracking-tight
  normal: "0em", // tracking-normal (default)
  wide: "0.025em", // tracking-wide
  wider: "0.05em", // tracking-wider (uppercase labels)
  widest: "0.1em", // tracking-widest
};
```

### Typography Usage Examples

```tsx
// Headings
<h1 className="text-5xl font-semibold tracking-tight text-gray-900 dark:text-white">
  Main Page Title
</h1>

<h2 className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">
  Section Heading
</h2>

<h3 className="text-3xl font-semibold text-gray-900 dark:text-white">
  Subsection
</h3>

// Body text
<p className="text-base leading-normal text-gray-600 dark:text-gray-400">
  Default body text (16px, line-height 1.5)
</p>

<p className="text-lg leading-relaxed text-gray-600 dark:text-gray-400">
  Large body text for introductions
</p>

<p className="text-sm text-gray-500 dark:text-gray-500">
  Secondary text
</p>

// Labels and captions
<span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
  Label
</span>

<span className="text-xs text-gray-500 dark:text-gray-500">
  Caption or helper text
</span>

// Code
<code className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-sm font-mono text-gray-900 dark:text-gray-100">
  npm install
</code>

// Responsive typography
<h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-semibold">
  Responsive headline
</h1>
```

---

## Spacing System (Tailwind Convention)

### Spacing Scale (4px Base)

```typescript
// Tailwind's spacing scale (all in rem)
const spacing = {
  "0": "0px", // 0
  px: "1px", // 1px
  "0.5": "0.125rem", // 2px
  "1": "0.25rem", // 4px
  "1.5": "0.375rem", // 6px
  "2": "0.5rem", // 8px
  "2.5": "0.625rem", // 10px
  "3": "0.75rem", // 12px
  "3.5": "0.875rem", // 14px
  "4": "1rem", // 16px ← Default unit
  "5": "1.25rem", // 20px
  "6": "1.5rem", // 24px ← Section spacing
  "7": "1.75rem", // 28px
  "8": "2rem", // 32px ← Major sections
  "9": "2.25rem", // 36px
  "10": "2.5rem", // 40px
  "11": "2.75rem", // 44px
  "12": "3rem", // 48px
  "14": "3.5rem", // 56px
  "16": "4rem", // 64px
  "20": "5rem", // 80px ← Workspace switcher width
  "24": "6rem", // 96px
  "28": "7rem", // 112px
  "32": "8rem", // 128px
  "36": "9rem", // 144px
  "40": "10rem", // 160px
  "44": "11rem", // 176px
  "48": "12rem", // 192px
  "52": "13rem", // 208px
  "56": "14rem", // 224px
  "60": "15rem", // 240px ← Sidebar width
  "64": "16rem", // 256px
  "72": "18rem", // 288px
  "80": "20rem", // 320px
  "96": "24rem", // 384px
};
```

### Semantic Spacing Usage

```typescript
const semanticSpacing = {
  tight: "8px", // space-y-2 - Tightly related items
  default: "16px", // space-y-4 - Default content spacing
  section: "24px", // space-y-6 - Section spacing
  major: "32px", // space-y-8 - Major section spacing
  loose: "48px", // space-y-12 - Very loose spacing
};
```

### Padding Usage

```tsx
// Buttons
<button className="px-4 py-2">        // Default: 16px × 8px
<button className="px-6 py-3">        // Large: 24px × 12px
<button className="px-3 py-1.5">      // Small: 12px × 6px

// Cards
<div className="p-4">                 // Compact: 16px
<div className="p-6">                 // Default: 24px
<div className="p-8">                 // Spacious: 32px

// Inputs
<input className="px-3 py-2" />       // Default: 12px × 8px
<input className="px-4 py-2.5" />     // Large: 16px × 10px

// Page containers
<div className="p-4 sm:p-6 lg:p-8">   // Responsive padding
```

### Margin & Gap Usage

```tsx
// Vertical stacking
<div className="space-y-2">           // Tight: 8px
<div className="space-y-4">           // Default: 16px
<div className="space-y-6">           // Section: 24px
<div className="space-y-8">           // Major: 32px

// Horizontal spacing
<div className="space-x-2">           // Button groups: 8px
<div className="space-x-4">           // Navigation: 16px

// Grid gaps
<div className="gap-4">               // Default: 16px
<div className="gap-6">               // Spacious: 24px
<div className="gap-x-6 gap-y-4">     // Different axes

// Margins
<section className="mb-8">            // Major section: 32px
<div className="mt-6">                // Section: 24px
<div className="mx-auto">             // Center horizontally
```

### Border Radius (Tailwind Convention)

```typescript
const borderRadius = {
  none: "0px", // rounded-none
  sm: "0.125rem", // rounded-sm (2px)
  DEFAULT: "0.25rem", // rounded (4px)
  md: "0.375rem", // rounded-md (6px)
  lg: "0.5rem", // rounded-lg (8px) ← Most used
  xl: "0.75rem", // rounded-xl (12px)
  "2xl": "1rem", // rounded-2xl (16px)
  "3xl": "1.5rem", // rounded-3xl (24px)
  full: "9999px", // rounded-full (pills, circles)
};
```

---

## Color System & Theming

### Design Philosophy

```typescript
// Light Mode Sidebar
const SIDEBAR_LIGHT_MODE = {
  background: "#2B2D31", // Main sidebar background
  mainContent: "#313338", // Main content area adjacent to sidebar
  hover: "#36373D", // Hover states
  border: "#3a3a3a", // Borders and dividers
  text: "#FFFFFF", // Primary text
  textMuted: "#B5BAC1", // Secondary text
  workspaceAvatar: "#36373D", // Workspace avatar backgrounds
};

// Dark Mode Sidebar
const SIDEBAR_DARK_MODE = {
  background: "#1E1F22", // Main sidebar background
  mainContent: "#1E1F22", // Main content area
  hover: "#2B2D31", // Hover states
  border: "#26272B", // Borders and dividers
  text: "#FFFFFF", // Primary text
  textMuted: "#B5BAC1", // Secondary text
  workspaceAvatar: "#2B2D31", // Workspace avatar backgrounds
};
```

#### Content Page Colors (Theme-Adaptive)

```typescript
// Light Mode Content
const CONTENT_LIGHT_MODE = {
  pageBackground: "#F5F5F7", // bg-gray-50 - Page background
  cardBackground: "#FFFFFF", // bg-white - Card backgrounds
  border: "#E5E7EB", // border-gray-200
  text: "#111827", // text-gray-900 - Headings
  textMuted: "#6B7280", // text-gray-600 - Body text
  hover: "#F9FAFB", // hover:bg-gray-50
  input: "#FFFFFF", // bg-white - Input fields
  iconContainer: {
    blue: "#DBEAFE", // bg-blue-100
    purple: "#E9D5FF", // bg-purple-100
    green: "#D1FAE5", // bg-green-100
  },
};

// Dark Mode Content
const CONTENT_DARK_MODE = {
  pageBackground: "#111827", // bg-gray-900 - Page background
  cardBackground: "#1F2937", // bg-gray-800 - Card backgrounds
  border: "#374151", // border-gray-700
  text: "#FFFFFF", // text-white - Headings
  textMuted: "#9CA3AF", // text-gray-400 - Body text
  hover: "#374151", // hover:bg-gray-700
  input: "#111827", // bg-gray-900 - Input fields
  iconContainer: {
    blue: "rgba(59, 130, 246, 0.1)", // bg-blue-500/10
    purple: "rgba(168, 85, 247, 0.1)", // bg-purple-500/10
    green: "rgba(34, 197, 94, 0.1)", // bg-green-500/10
  },
};
```

### CSS Variables Setup

**Critical**: Use CSS custom properties for consistent theming:

```css
/* src/index.css */
@layer base {
  :root {
    /* Light mode variables */
    --background: 0 0% 100%; /* Pure white */
    --foreground: 222.2 84% 4.9%; /* Dark text */
    --card: 0 0% 100%; /* White cards */
    --card-foreground: 222.2 84% 4.9%; /* Dark text on cards */
    --popover: 0 0% 100%; /* White popovers */
    --border: 214.3 31.8% 91.4%; /* Light gray borders */
    /* ... other variables */
  }

  .dark {
    /* Dark mode variables */
    --background: 222.2 84% 4.9%; /* Very dark background */
    --foreground: 210 40% 98%; /* Light text */
    --card: 222.2 84% 4.9%; /* Dark cards */
    --card-foreground: 210 40% 98%; /* Light text on cards */
    --popover: 222.2 84% 4.9%; /* Dark popovers */
    --border: 217.2 32.6% 17.5%; /* Dark borders */
    /* ... other variables */
  }
}
```

### Tailwind Color Classes Pattern

**Consistent pattern across all components**:

```typescript
// Cards
className =
  "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700";

// Page backgrounds
className = "min-h-full bg-gray-50 dark:bg-gray-900";

// Text - Headings
className = "text-gray-900 dark:text-white";

// Text - Body
className = "text-gray-600 dark:text-gray-400";

// Hover states
className = "hover:bg-gray-50 dark:hover:bg-gray-700";

// Input fields
className =
  "bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600";

// Icon containers
className = "bg-blue-100 dark:bg-blue-500/10";
```

---

## Layout Architecture

### Three-Column Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  [Workspace Switcher]  │  [Sidebar Nav]  │  [Main Content]  │
│       80px width       │    240px width  │    Flex-grow     │
│                        │                 │                  │
│   - Workspace icons    │  - Dashboard    │  - Page header   │
│   - Organization list  │  - Studio       │  - Page content  │
│   - User avatar        │  - Chatbots     │  - Cards/Tables  │
│   - Theme toggle       │  - Analytics    │                  │
│                        │  - Settings     │                  │
│                        │  - etc.         │                  │
└─────────────────────────────────────────────────────────────┘
```

### Layout Component Structure

```typescript
// src/components/layout/Layouts.tsx
export const Layout: React.FC = () => {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Workspace Switcher - Fixed 80px */}
      <div className="w-20 flex-shrink-0 bg-[#2B2D31] dark:bg-[#1E1F22]">
        <WorkspaceSwitcher />
      </div>

      {/* Sidebar Navigation - Fixed 240px */}
      <div className="w-60 flex-shrink-0 bg-[#2B2D31] dark:bg-[#1E1F22]">
        <Sidebar />
      </div>

      {/* Main Content - Flexible */}
      <div className="flex-1 overflow-auto bg-[#313338] dark:bg-[#1E1F22]">
        <Outlet /> {/* React Router renders pages here */}
      </div>
    </div>
  );
};
```

### Key Layout Principles

1. **Fixed Sidebar Width**: Never use percentage widths for sidebars - use fixed pixel values (80px, 240px) for consistency
2. **Flex-grow for Content**: Main content area uses `flex-1` to take remaining space
3. **Overflow Management**: Parent has `overflow-hidden`, children have `overflow-auto` for proper scrolling
4. **Height Control**: Use `h-screen` on root layout to ensure full viewport height
5. **No Nested Scrollbars**: Each scrollable area is clearly defined

---

## Grid System

### Tailwind Grid Utilities

PrivexBot uses Tailwind's built-in grid system with responsive breakpoints:

```tsx
// Basic grid - 2 columns on mobile, 3 on tablet, 4 on desktop
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>

// Stats cards - 1 col mobile, 2 tablet, 4 desktop
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <StatsCard title="Total Chatbots" value="12" />
  <StatsCard title="Active Users" value="1,234" />
  <StatsCard title="Messages Today" value="5,678" />
  <StatsCard title="Avg Response Time" value="1.2s" />
</div>

// Sidebar + Content layout (two-column)
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2">
    {/* Main content - 2/3 width */}
  </div>
  <div className="lg:col-span-1">
    {/* Sidebar content - 1/3 width */}
  </div>
</div>
```

### Common Grid Patterns

```tsx
// Equal columns with responsive breakpoints
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// Auto-fit grid (cards wrap automatically)
<div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">

// Dashboard stats (4 columns on desktop)
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

// Form layout (label + input)
<div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">

// Asymmetric layout (main + sidebar)
<div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
```

### Grid vs Flex

**Use Grid when:**

- Creating card layouts with multiple rows
- Building dashboard stats sections
- Creating form layouts with labels and inputs
- Needing precise column control

**Use Flex when:**

- Creating navigation bars
- Aligning items in a single row/column
- Building button groups
- Centering content

```tsx
// Flex for navigation
<nav className="flex items-center gap-4">
  <Logo />
  <div className="flex-1" /> {/* Spacer */}
  <Button>Login</Button>
</nav>

// Grid for cards
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <Card />
  <Card />
  <Card />
</div>
```

---

## Z-Index Scale

### Defined Layers

PrivexBot uses a **10-unit z-index scale** for predictable layering:

```typescript
const zIndex = {
  base: 0, // Default layer
  dropdown: 10, // Dropdown menus, tooltips
  sticky: 20, // Sticky headers, floating action buttons
  sidebar: 30, // Sidebar overlay (mobile)
  overlay: 40, // Modal backdrop, drawer overlay
  modal: 50, // Modals, dialogs
  popover: 60, // Popovers, context menus
  toast: 70, // Toast notifications
  tooltip: 80, // Tooltips (highest priority)
};
```

### Z-Index Usage

```tsx
// Dropdown menu
<div className="absolute z-10 mt-2 rounded-lg shadow-lg">
  {/* Menu items */}
</div>

// Mobile sidebar overlay
<div className="fixed inset-0 z-30 bg-black/50 lg:hidden">
  <Sidebar />
</div>

// Modal backdrop
<div className="fixed inset-0 z-40 bg-black/50">
  {/* Modal container */}
</div>

// Modal content
<div className="fixed inset-0 z-50 flex items-center justify-center">
  <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
    {/* Modal content */}
  </div>
</div>

// Toast notification
<div className="fixed top-4 right-4 z-70">
  <Toast message="Success!" />
</div>
```

### Custom Z-Index in Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      zIndex: {
        10: "10",
        20: "20",
        30: "30",
        40: "40",
        50: "50",
        60: "60",
        70: "70",
        80: "80",
      },
    },
  },
};
```

### Z-Index Best Practices

1. **Use the scale**: Don't use arbitrary values like `z-[999]`
2. **Context matters**: Dropdowns (z-10) are relative to their container
3. **Modals are global**: Always use z-40+ for full-screen overlays
4. **Stacking contexts**: Be aware of `position: relative` creating new stacking contexts
5. **Debug with DevTools**: Use browser DevTools to visualize z-index layers

### Common Z-Index Issues

```tsx
// ❌ Problem: Dropdown hidden behind modal
<div className="relative z-10">
  {" "}
  {/* This creates a new stacking context */}
  <Dropdown /> {/* Can't escape parent's z-index */}
</div>;

// ✅ Solution: Use portals for modals/dropdowns
import { createPortal } from "react-dom";

const Dropdown = () => {
  return createPortal(
    <div className="absolute z-10">{/* Dropdown content */}</div>,
    document.body
  );
};
```

---

## Component Design Patterns

### Page Wrapper Pattern

**Every page should follow this structure**:

```tsx
// Correct Pattern
export const MyPage: React.FC = () => {
  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-900">
      <div className="p-4 sm:p-6 lg:p-8">{/* Page content */}</div>
    </div>
  );
};
```

**Why `min-h-full` instead of `h-full`?**

- `h-full` (height: 100%) only works if parent has explicit height
- `min-h-full` (min-height: 100%) ensures background extends to at least full viewport
- Allows content to grow beyond viewport without breaking layout

### Card Component Pattern

```tsx
// Standard Card
<Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
  <CardHeader>
    <CardTitle className="text-gray-900 dark:text-white">Title</CardTitle>
    <CardDescription className="text-gray-600 dark:text-gray-400">
      Description
    </CardDescription>
  </CardHeader>
  <CardContent>{/* Card content */}</CardContent>
</Card>
```

### Icon Container Pattern

```tsx
// Icon with colored background
<div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center">
  <IconName className="w-6 h-6 text-blue-600 dark:text-blue-400" />
</div>
```

### Button Patterns

```tsx
// Primary Button
<button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
  Primary Action
</button>

// Outline Button
<button className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white">
  Secondary Action
</button>

// Ghost Button
<button className="hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400">
  Tertiary Action
</button>
```

### Input Field Pattern

```tsx
<input
  type="text"
  placeholder="Search..."
  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
/>
```

---

## Typography System

### Font Families

```css
/* Primary Font - Interface */
font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen",
  "Ubuntu", "Cantarell", sans-serif;

/* Monospace Font - Code, Technical */
font-family: "Fira Code", "JetBrains Mono", "Courier New", monospace;
```

#### Why Inter?

- **Excellent Readability**: Optimized for screens at all sizes
- **Variable Font Support**: One file, all weights (100-900)
- **Modern & Professional**: Clean, neutral appearance
- **Open Source**: Free for commercial use
- **Great Metrics**: Balanced x-height, consistent stroke width

### Type Scale

Using a **modular scale** based on 1.25 (Major Third) for harmonious proportions:

```typescript
// Tailwind Typography Scale
const typographyScale = {
  // Display sizes (hero sections, landing pages)
  "display-2xl": "4.5rem", // 72px - Hero headlines
  "display-xl": "3.75rem", // 60px - Section heroes
  "display-lg": "3rem", // 48px - Page titles

  // Heading sizes (page structure)
  "heading-xl": "2.25rem", // 36px - h1, main page headings
  "heading-lg": "1.875rem", // 30px - h2, section headings
  "heading-md": "1.5rem", // 24px - h3, subsection headings
  "heading-sm": "1.25rem", // 20px - h4, card headings
  "heading-xs": "1.125rem", // 18px - h5, small headings

  // Body sizes (content)
  "body-lg": "1.125rem", // 18px - Large body text
  "body-md": "1rem", // 16px - Default body text
  "body-sm": "0.875rem", // 14px - Secondary text
  "body-xs": "0.75rem", // 12px - Captions, labels
};
```

### Tailwind Mapping

```tsx
// In your JSX components
<h1 className="text-4xl">        // 36px - heading-xl
<h2 className="text-3xl">        // 30px - heading-lg
<h3 className="text-2xl">        // 24px - heading-md
<h4 className="text-xl">         // 20px - heading-sm
<h5 className="text-lg">         // 18px - heading-xs / body-lg
<p className="text-base">        // 16px - body-md (default)
<p className="text-sm">          // 14px - body-sm
<span className="text-xs">       // 12px - body-xs
```

### Font Weights

```typescript
const fontWeights = {
  thin: 100, // Rarely used
  light: 300, // Large headings, elegant text
  normal: 400, // Default body text
  medium: 500, // Emphasized body text, button labels
  semibold: 600, // Headings, important labels
  bold: 700, // Strong emphasis, primary headings
  extrabold: 800, // Display text, hero headlines
};
```

#### Weight Usage Guide

| Use Case        | Weight          | Tailwind Class   | Example                         |
| --------------- | --------------- | ---------------- | ------------------------------- |
| Body text       | 400 (Normal)    | `font-normal`    | Paragraph content               |
| Emphasized text | 500 (Medium)    | `font-medium`    | Button labels, highlighted text |
| Headings        | 600 (Semibold)  | `font-semibold`  | h1-h5 elements                  |
| Strong headings | 700 (Bold)      | `font-bold`      | Primary CTAs, important titles  |
| Display text    | 800 (Extrabold) | `font-extrabold` | Hero headlines                  |

### Line Heights

```typescript
const lineHeights = {
  none: 1, // Icon alignment, single-line text
  tight: 1.25, // Headings, display text
  snug: 1.375, // Short paragraphs, card titles
  normal: 1.5, // Default body text (optimal readability)
  relaxed: 1.625, // Long-form content
  loose: 2, // Spacious layouts, landing pages
};
```

### Letter Spacing (Tracking)

```typescript
const letterSpacing = {
  tighter: "-0.05em", // Tight headlines
  tight: "-0.025em", // Display text
  normal: "0em", // Default
  wide: "0.025em", // Slightly open
  wider: "0.05em", // Open, uppercase labels
  widest: "0.1em", // Very open, overlines
};
```

### Typography Components

#### Heading Pattern

```tsx
<h1 className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">
  Main Page Heading
</h1>

<h2 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
  Section Heading
</h2>

<h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
  Subsection Heading
</h3>
```

#### Body Text Pattern

```tsx
// Standard body text
<p className="text-base leading-normal text-gray-600 dark:text-gray-400">
  Content here
</p>

// Emphasized body text
<p className="text-base font-medium leading-normal text-gray-900 dark:text-white">
  Important content
</p>

// Secondary text
<p className="text-sm leading-snug text-gray-500 dark:text-gray-500">
  Supporting information
</p>
```

#### Caption/Label Pattern

```tsx
// Uppercase label
<span className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
  Label
</span>

// Caption
<span className="text-xs leading-snug text-gray-500 dark:text-gray-500">
  Helper text or description
</span>
```

### Responsive Typography

```tsx
// Mobile-first responsive headings
<h1 className="text-2xl sm:text-3xl lg:text-4xl">
  Scales from 24px → 30px → 36px
</h1>

// Responsive body text
<p className="text-sm sm:text-base lg:text-lg">
  Scales from 14px → 16px → 18px
</p>
```

---

## Spacing & Sizing

### Base Unit System

PrivexBot uses a **4px base unit** system for all spacing:

```typescript
// Tailwind's spacing scale (4px-based)
const spacing = {
  0: "0px", // 0
  1: "0.25rem", // 4px
  2: "0.5rem", // 8px
  3: "0.75rem", // 12px
  4: "1rem", // 16px  ← Default
  5: "1.25rem", // 20px
  6: "1.5rem", // 24px  ← Section spacing
  8: "2rem", // 32px  ← Major sections
  10: "2.5rem", // 40px
  12: "3rem", // 48px
  16: "4rem", // 64px
  20: "5rem", // 80px  ← Fixed sidebar width
  60: "15rem", // 240px ← Fixed sidebar width
};
```

### Spacing Scale Usage

#### Component Internal Spacing (Padding)

```tsx
// Buttons
<button className="px-4 py-2">      // 16px × 8px - Default button
<button className="px-6 py-3">      // 24px × 12px - Large button
<button className="px-3 py-1.5">    // 12px × 6px - Small button

// Cards
<div className="p-4">               // 16px all sides - Compact card
<div className="p-6">               // 24px all sides - Default card
<div className="p-8">               // 32px all sides - Spacious card

// Input fields
<input className="px-3 py-2" />     // 12px × 8px - Default input
```

#### Component External Spacing (Margin/Gap)

```tsx
// Stack (vertical spacing)
<div className="space-y-4">         // 16px gap - Default stack
<div className="space-y-6">         // 24px gap - Spacious stack
<div className="space-y-2">         // 8px gap - Tight stack

// Grid gaps
<div className="gap-4">             // 16px gap - Default grid
<div className="gap-6">             // 24px gap - Spacious grid

// Section spacing
<section className="mb-8">          // 32px bottom margin
<section className="mb-12">         // 48px bottom margin
```

### Responsive Spacing

```tsx
// Mobile-first responsive padding
<div className="p-4 sm:p-6 lg:p-8">
  // 16px → 24px → 32px
</div>

// Responsive gaps
<div className="gap-4 sm:gap-6 lg:gap-8">
  // 16px → 24px → 32px
</div>
```

### Fixed Layout Widths

```typescript
// From Layouts.tsx
const layoutWidths = {
  workspaceSwitcher: "80px", // w-20
  sidebar: "240px", // w-60
};
```

### Spacing Patterns

#### Page Layout Pattern

```tsx
<div className="min-h-full bg-gray-50 dark:bg-gray-900">
  <div className="p-4 sm:p-6 lg:p-8">
    {/* Mobile: 16px, Tablet: 24px, Desktop: 32px */}
    <div className="space-y-6">{/* 24px vertical rhythm */}</div>
  </div>
</div>
```

#### Card Pattern

```tsx
<div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
  <div className="p-6">
    {/* 24px internal padding */}
    <div className="space-y-4">{/* 16px content rhythm */}</div>
  </div>
</div>
```

---

## Iconography

### Icon System

**Library**: Lucide React - Consistent, customizable, tree-shakeable icons

```tsx
import { Home, Settings, Users, Mail } from "lucide-react";
```

### Icon Sizes

```typescript
const iconSizes = {
  xs: "h-4 w-4", // 16px - Small buttons, inline text
  sm: "h-5 w-5", // 20px - Sidebar navigation
  md: "h-6 w-6", // 24px - Default, icon containers
  lg: "h-8 w-8", // 32px - Large buttons, feature cards
  xl: "h-10 w-10", // 40px - Page headers, hero sections
};
```

### Icon Usage Patterns

```tsx
// Navigation icons
<LayoutDashboard className="w-5 h-5" />

// Button icons
<button className="flex items-center gap-2">
  <Plus className="w-4 h-4" />
  <span>Create New</span>
</button>

// Icon-only button
<button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
  <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
</button>

// Icon with colored background
<div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center">
  <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
</div>
```

### Icon Color Patterns

```tsx
// Default text color
<Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />

// Active/Selected state
<Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />

// Muted/Disabled
<Icon className="w-5 h-5 text-gray-400 dark:text-gray-600" />

// Success
<Icon className="w-5 h-5 text-green-600 dark:text-green-400" />

// Error
<Icon className="w-5 h-5 text-red-600 dark:text-red-400" />

// Warning
<Icon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
```

---

## Sidebar Navigation

### Workspace Switcher Design

**Purpose**: Quick navigation between workspaces and organizations

```tsx
// src/components/layout/WorkspaceSwitcher.tsx
export const WorkspaceSwitcher: React.FC = () => {
  return (
    <div className="h-full bg-[#2B2D31] dark:bg-[#1E1F22] flex flex-col items-center py-4 gap-2">
      {/* Workspace Avatars */}
      {workspaces.map((workspace) => (
        <button
          key={workspace.id}
          className="w-12 h-12 rounded-full bg-[#36373D] dark:bg-[#2B2D31] hover:bg-[#3a3a3a] dark:hover:bg-[#313338] transition-colors flex items-center justify-center"
        >
          <span className="text-white font-semibold text-sm">
            {getInitials(workspace.name)}
          </span>
        </button>
      ))}

      {/* Add Workspace Button */}
      <button className="w-12 h-12 rounded-full border-2 border-dashed border-[#3a3a3a] dark:border-[#26272B] hover:border-gray-400 dark:hover:border-gray-500">
        <Plus className="w-5 h-5 text-[#B5BAC1]" />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User Avatar at Bottom */}
      <UserProfile />

      {/* Theme Toggle */}
      <ThemeToggle />
    </div>
  );
};
```

### Main Sidebar Navigation

**Key Features**:

- Hierarchical menu items
- Active state indicators
- Hover effects
- Icon + text layout
- Collapsible sections (optional)

```tsx
// src/components/layout/Sidebar.tsx
const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Workflow, label: "Studio", path: "/studio" },
  { icon: Bot, label: "Chatbots", path: "/chatbots" },
  { icon: Database, label: "Knowledge Base", path: "/knowledge-base" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: Mail, label: "Leads", path: "/leads" },
  { icon: Store, label: "Marketplace", path: "/marketplace" },
  { icon: Gift, label: "Referrals", path: "/referrals" },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="h-full flex flex-col bg-[#2B2D31] dark:bg-[#1E1F22] border-r border-[#3a3a3a] dark:border-[#26272B] overflow-y-auto scrollbar-hide">
      {/* Organization Header */}
      <div className="p-4 border-b border-[#3a3a3a] dark:border-[#26272B]">
        <OrganizationSwitcher />
      </div>

      {/* Menu Items */}
      <div className="flex-1 p-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#36373D] dark:bg-[#2B2D31] text-white"
                  : "text-[#B5BAC1] hover:bg-[#36373D] dark:hover:bg-[#2B2D31] hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Footer Section */}
      <div className="p-4 border-t border-[#3a3a3a] dark:border-[#26272B] space-y-1">
        <Link
          to="/settings"
          className="flex items-center gap-3 px-3 py-2.5 text-[#B5BAC1] hover:bg-[#36373D] dark:hover:bg-[#2B2D31] hover:text-white"
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </Link>
        <Link
          to="/documentation"
          className="flex items-center gap-3 px-3 py-2.5 text-[#B5BAC1] hover:bg-[#36373D] dark:hover:bg-[#2B2D31] hover:text-white"
        >
          <HelpCircle className="w-5 h-5" />
          <span>Help</span>
        </Link>
      </div>
    </nav>
  );
};
```

### Organization Switcher

**Dropdown component in sidebar header**:

```tsx
export const OrganizationSwitcher: React.FC = () => {
  const { currentOrganization, organizations, switchOrganization } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Current Organization Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#36373D] dark:hover:bg-[#2B2D31] transition-colors"
      >
        <div className="w-8 h-8 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <span className="text-white font-bold text-sm">
            {getInitials(currentOrganization.name)}
          </span>
        </div>
        <div className="flex-1 text-left">
          <p className="text-white font-semibold text-sm truncate">
            {currentOrganization.name}
          </p>
          <p className="text-[#B5BAC1] text-xs">
            {currentOrganization.subscription_tier}
          </p>
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-[#B5BAC1] transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#1E1F22] rounded-lg shadow-lg border border-[#26272B] z-50">
          {organizations.map((org) => (
            <button
              key={org.id}
              onClick={() => {
                switchOrganization(org.id);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#2B2D31] transition-colors first:rounded-t-lg last:rounded-b-lg"
            >
              <div className="w-8 h-8 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {getInitials(org.name)}
                </span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-white text-sm font-medium">{org.name}</p>
                <p className="text-[#B5BAC1] text-xs">
                  {org.member_count} members
                </p>
              </div>
              {org.id === currentOrganization.id && (
                <Check className="w-4 h-4 text-green-500" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
```

---

## Dashboard Pages

### Dashboard Page Structure

**Key sections**:

1. Header with user greeting and actions
2. Stats cards (KPI metrics)
3. Two-column layout (Recent Activity + Chatbot List)
4. Action cards (Create, Analytics, Templates)

```tsx
export const Dashboard: React.FC = () => {
  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-900">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex items-center justify-between">
            {/* User Greeting */}
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {getInitials(user.username)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Hey {user.username}!
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Welcome back! Here's what's happening with your chatbots.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                <Plus className="w-4 h-4 mr-2" />
                Create New Bot
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Stats Cards Grid */}
        <StatsCards stats={stats} />

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentActivity activities={activities} />
          <ChatbotList chatbots={chatbots} />
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Create, Analytics, Templates cards */}
        </div>
      </div>
    </div>
  );
};
```

### Stats Cards Component

```tsx
export const StatsCards: React.FC<{ stats: DashboardStats }> = ({ stats }) => {
  const statsData = [
    {
      label: "Total Chatbots",
      value: stats.totalChatbots,
      change: "+1 from last month",
      icon: Bot,
      color: "blue",
    },
    // ... other stats
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsData.map((stat) => (
        <Card
          key={stat.label}
          className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div
                className={`p-2 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-500/10`}
              >
                <stat.icon
                  className={`h-5 w-5 text-${stat.color}-600 dark:text-${stat.color}-400`}
                />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {stat.label}
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </p>
              <span className="text-xs text-green-600 dark:text-green-400">
                {stat.change}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
```

### Other Page Patterns

**All pages follow similar structure**:

```tsx
// Settings Page
export const Settings: React.FC = () => {
  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-900">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure your workspace preferences
          </p>
        </div>

        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          {/* Settings content */}
        </Card>
      </div>
    </div>
  );
};

// Organizations Page
export const Organizations: React.FC = () => {
  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6">{/* Organizations grid */}</div>
    </div>
  );
};
```

---

## Dark/Light Mode Implementation

### Theme Context Setup

```tsx
// src/contexts/ThemeContext.tsx
type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  effectiveTheme: "light" | "dark";
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Load from localStorage
    return (localStorage.getItem("theme") as Theme) || "system";
  });

  const effectiveTheme = useMemo(() => {
    if (theme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return theme;
  }, [theme]);

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(effectiveTheme);

    // Save to localStorage
    localStorage.setItem("theme", theme);
  }, [theme, effectiveTheme]);

  // Listen to system theme changes
  useEffect(() => {
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => {
        const newTheme = mediaQuery.matches ? "dark" : "light";
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(newTheme);
      };
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, effectiveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

### Theme Toggle Component

```tsx
export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    const themes: Theme[] = ["light", "dark", "system"];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return (
    <button
      onClick={cycleTheme}
      className="w-12 h-12 rounded-full hover:bg-[#36373D] dark:hover:bg-[#2B2D31] flex items-center justify-center transition-colors"
      title={`Current: ${theme}`}
    >
      {theme === "light" && <Sun className="w-5 h-5 text-yellow-500" />}
      {theme === "dark" && <Moon className="w-5 h-5 text-blue-400" />}
      {theme === "system" && <Monitor className="w-5 h-5 text-gray-400" />}
    </button>
  );
};
```

### Theme Testing Checklist

Test every component in both modes:

- [ ] Text is readable (proper contrast)
- [ ] Borders are visible
- [ ] Hover states work
- [ ] Icons have proper colors
- [ ] Inputs are styled correctly
- [ ] Buttons have proper variants
- [ ] Cards have proper backgrounds
- [ ] No white text on white backgrounds
- [ ] No dark text on dark backgrounds

---

## Accessibility Standards

### WCAG AA Compliance

PrivexBot targets **WCAG 2.1 Level AA** compliance:

#### Color Contrast Requirements

```typescript
const contrastRatios = {
  normalText: 4.5, // Text < 18px or < 14px bold
  largeText: 3.0, // Text ≥ 18px or ≥ 14px bold
  uiComponents: 3.0, // Buttons, form controls, focus indicators
  graphicalObjects: 3.0, // Icons, charts, infographics
};
```

#### Tested Color Combinations

```tsx
// ✅ Passes WCAG AA (4.5:1+)
// Light mode
text-gray-900 on bg-white           // 21:1
text-gray-600 on bg-white           // 7.23:1
text-blue-600 on bg-white           // 5.74:1

// Dark mode
text-white on bg-gray-900           // 18.6:1
text-gray-400 on bg-gray-900        // 6.46:1
text-blue-400 on bg-gray-900        // 8.59:1

// ❌ Fails WCAG AA (< 4.5:1)
text-gray-400 on bg-white           // 2.85:1 - Too low!
text-gray-600 on bg-gray-900        // 2.17:1 - Too low!
```

### Semantic HTML

```tsx
// ✅ Use semantic elements
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/">Dashboard</a></li>
  </ul>
</nav>

<main aria-label="Main content">
  <h1>Dashboard</h1>
  <section aria-labelledby="stats-heading">
    <h2 id="stats-heading">Statistics</h2>
  </section>
</main>

<footer>
  <p>&copy; 2025 PrivexBot</p>
</footer>

// ❌ Avoid div soup
<div class="nav">
  <div class="link">Dashboard</div>
</div>
```

### ARIA Labels

```tsx
// Icon buttons need labels
<button aria-label="Close modal">
  <X className="w-4 h-4" />
</button>

<button aria-label="Toggle theme">
  <Sun className="w-5 h-5" />
</button>

// Loading states
<button disabled aria-busy="true">
  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
  <span>Loading...</span>
</button>

// Navigation landmarks
<nav aria-label="Sidebar navigation">
  {/* Navigation items */}
</nav>

// Form labels
<label htmlFor="email">Email Address</label>
<input id="email" type="email" name="email" />
```

### Keyboard Navigation

```tsx
// All interactive elements must be keyboard accessible

// Tab order
<button tabIndex={0}>First</button>
<button tabIndex={0}>Second</button>
<button tabIndex={-1}>Removed from tab order</button>

// Enter/Space for buttons
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }}
>
  Custom Button
</div>

// Escape to close modals
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeModal()
    }
  }
  document.addEventListener('keydown', handleEscape)
  return () => document.removeEventListener('keydown', handleEscape)
}, [])

// Focus management
const firstInputRef = useRef<HTMLInputElement>(null)

useEffect(() => {
  firstInputRef.current?.focus()
}, [])
```

### Focus Indicators

```tsx
// Always provide visible focus indicators

// Default focus ring
<button className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
  Click Me
</button>

// Custom focus style
<a
  href="/dashboard"
  className="focus:outline-none focus:underline focus:text-blue-600"
>
  Dashboard
</a>

// Input focus
<input
  type="text"
  className="focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300"
/>
```

### Screen Reader Support

```tsx
// Hide decorative icons from screen readers
<div aria-hidden="true">
  <DecorativeIcon className="w-6 h-6" />
</div>

// Provide text alternatives
<img src="logo.png" alt="PrivexBot - AI Chatbot Platform" />

// Live regions for dynamic content
<div aria-live="polite" aria-atomic="true">
  {notification && <p>{notification.message}</p>}
</div>

// Status messages
<div role="status" aria-live="polite">
  {loading ? 'Loading...' : 'Content loaded'}
</div>

// Alert messages
<div role="alert" aria-live="assertive">
  Error: Failed to save changes
</div>
```

### Skip Links

```tsx
// Allow users to skip navigation
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded"
>
  Skip to main content
</a>

<main id="main-content">
  {/* Page content */}
</main>
```

### Accessibility Testing Checklist

- [ ] **Keyboard Navigation**: All interactive elements reachable via Tab
- [ ] **Focus Indicators**: Visible focus states on all interactive elements
- [ ] **Color Contrast**: All text meets WCAG AA (4.5:1 for normal, 3:1 for large)
- [ ] **Screen Reader**: Test with NVDA (Windows) or VoiceOver (Mac)
- [ ] **Semantic HTML**: Use proper heading hierarchy (h1 → h2 → h3)
- [ ] **ARIA Labels**: All icon buttons have `aria-label`
- [ ] **Form Labels**: All inputs have associated `<label>` or `aria-label`
- [ ] **Alternative Text**: All images have meaningful `alt` text
- [ ] **Error Messages**: Form errors are announced to screen readers
- [ ] **Loading States**: Use `aria-busy` and `aria-live` for dynamic content

---

## Color Contrast Guidelines

### Contrast Ratio Requirements

```typescript
// WCAG 2.1 Level AA
const wcagAA = {
  normalText: 4.5, // < 18px or < 14px bold
  largeText: 3.0, // ≥ 18px or ≥ 14px bold
  uiComponents: 3.0, // Buttons, inputs, etc.
};

// WCAG 2.1 Level AAA (Enhanced)
const wcagAAA = {
  normalText: 7.0,
  largeText: 4.5,
};
```

### Testing Contrast

Use browser DevTools or online tools:

- **Chrome DevTools**: Elements → Accessibility → Contrast
- **WebAIM Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Figma Plugin**: Stark, Color Blind, A11y

### Approved Color Combinations

```tsx
// Light Mode - WCAG AA Compliant
const lightModeColors = {
  // Headings (21:1 - AAA)
  heading: "text-gray-900", // #111827 on #FFFFFF

  // Body text (7.23:1 - AAA)
  body: "text-gray-600", // #4B5563 on #FFFFFF

  // Links (5.74:1 - AA)
  link: "text-blue-600", // #2563EB on #FFFFFF

  // Muted text (4.54:1 - AA)
  muted: "text-gray-500", // #6B7280 on #FFFFFF
};

// Dark Mode - WCAG AA Compliant
const darkModeColors = {
  // Headings (18.6:1 - AAA)
  heading: "text-white", // #FFFFFF on #111827

  // Body text (6.46:1 - AA)
  body: "text-gray-400", // #9CA3AF on #111827

  // Links (8.59:1 - AAA)
  link: "text-blue-400", // #60A5FA on #111827

  // Muted text (4.88:1 - AA)
  muted: "text-gray-500", // #6B7280 on #111827
};
```

### Common Contrast Mistakes

```tsx
// ❌ Fails WCAG AA
<p className="text-gray-400 bg-white">      // 2.85:1 - Too low!
<p className="text-gray-600 bg-gray-900">   // 2.17:1 - Too low!
<p className="text-yellow-400 bg-white">    // 1.78:1 - Way too low!

// ✅ Passes WCAG AA
<p className="text-gray-600 bg-white">      // 7.23:1 ✓
<p className="text-gray-400 bg-gray-900">   // 6.46:1 ✓
<p className="text-yellow-600 bg-white">    // 4.95:1 ✓
```

### Interactive Element Contrast

```tsx
// Buttons must have 3:1 contrast ratio
<button className="bg-blue-600 text-white">        // ✅ High contrast
<button className="bg-blue-200 text-blue-600">    // ✅ 3.37:1
<button className="bg-gray-100 text-gray-400">    // ❌ Too low

// Focus indicators must have 3:1 contrast
<button className="focus:ring-2 focus:ring-blue-500">  // ✅
<button className="focus:ring-2 focus:ring-gray-300">  // ❌ Against white bg

// Border contrast for inputs
<input className="border-2 border-gray-300">  // ✅ 3.06:1
<input className="border border-gray-200">    // ❌ 1.19:1 - Too subtle
```

---

## Responsive Design Strategy

### Breakpoint System

```typescript
// Tailwind breakpoints
const BREAKPOINTS = {
  sm: "640px", // Mobile landscape, small tablets
  md: "768px", // Tablets
  lg: "1024px", // Small laptops
  xl: "1280px", // Desktops
  "2xl": "1536px", // Large desktops
};
```

### Mobile-First Approach

**Always write mobile styles first, then add larger breakpoints**:

```tsx
// ❌ Wrong - Desktop first
<div className="lg:text-base text-sm">

// ✅ Correct - Mobile first
<div className="text-sm lg:text-base">

// ❌ Wrong
<div className="hidden lg:block">

// ✅ Correct
<div className="hidden lg:block">  // This is fine for progressive enhancement
```

### Responsive Patterns

#### Grid Layouts

```tsx
// Stats cards - 1 col mobile, 2 tablet, 4 desktop
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

// Two-column layout - 1 col mobile, 2 desktop
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

// Three-column - 1 mobile, 2 tablet, 3 desktop
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
```

#### Sidebar Behavior

```tsx
// Desktop: Always visible
// Mobile: Hidden by default, show with hamburger menu

const [sidebarOpen, setSidebarOpen] = useState(false);

// Mobile overlay
{
  sidebarOpen && (
    <div
      className="fixed inset-0 bg-black/50 lg:hidden z-40"
      onClick={() => setSidebarOpen(false)}
    />
  );
}

// Sidebar
<aside
  className={cn(
    "fixed lg:static inset-y-0 left-0 transform transition-transform lg:translate-x-0 z-50",
    sidebarOpen ? "translate-x-0" : "-translate-x-full"
  )}
>
  <Sidebar />
</aside>;
```

#### Responsive Typography

```tsx
// Headings
<h1 className="text-lg sm:text-xl lg:text-2xl font-bold">

// Body text
<p className="text-sm sm:text-base">

// Labels
<label className="text-xs sm:text-sm">
```

#### Responsive Spacing

```tsx
// Padding
<div className="p-4 sm:p-6 lg:p-8">

// Gaps
<div className="space-y-4 sm:space-y-6">
<div className="gap-4 sm:gap-6">

// Margins
<div className="mb-6 sm:mb-8">
```

#### Hide/Show Elements

```tsx
// Show only on mobile
<div className="block lg:hidden">

// Show only on desktop
<div className="hidden lg:block">

// Show different content
<span className="inline sm:hidden">Mobile</span>
<span className="hidden sm:inline">Desktop</span>
```

---

## State Management

### State Architecture

PrivexBot uses a **hybrid state management** approach:

1. **Server State** → React Query (TanStack Query)
2. **Global Client State** → React Context
3. **Local Component State** → useState/useReducer
4. **Form State** → React Hook Form + Zod
5. **URL State** → React Router (search params, path params)

### React Query for Server State

```tsx
// src/hooks/useChatbots.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Fetch chatbots
export const useChatbots = (workspaceId: string) => {
  return useQuery({
    queryKey: ["chatbots", workspaceId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/chatbots`),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
};

// Create chatbot with optimistic update
export const useCreateChatbot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateChatbotInput) => api.post("/chatbots", data),
    onMutate: async (newChatbot) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["chatbots", newChatbot.workspaceId],
      });

      // Snapshot previous value
      const previousChatbots = queryClient.getQueryData([
        "chatbots",
        newChatbot.workspaceId,
      ]);

      // Optimistically update
      queryClient.setQueryData(
        ["chatbots", newChatbot.workspaceId],
        (old: Chatbot[] = []) => [...old, { ...newChatbot, id: "temp-id" }]
      );

      return { previousChatbots };
    },
    onError: (err, newChatbot, context) => {
      // Rollback on error
      queryClient.setQueryData(
        ["chatbots", newChatbot.workspaceId],
        context?.previousChatbots
      );
      toast.error("Failed to create chatbot");
    },
    onSuccess: (data, variables) => {
      toast.success("Chatbot created successfully!");
    },
    onSettled: (data, error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({
        queryKey: ["chatbots", variables.workspaceId],
      });
    },
  });
};
```

### React Context for Global State

```tsx
// src/contexts/AppContext.tsx
interface AppState {
  user: User | null;
  currentOrganization: Organization | null;
  currentWorkspace: Workspace | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [currentOrganization, setCurrentOrganization] =
    useState<Organization | null>(null);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(
    null
  );

  // Load from localStorage on mount
  useEffect(() => {
    const lastOrgId = localStorage.getItem("lastOrgId");
    const lastWorkspaceId = localStorage.getItem("lastWorkspaceId");

    if (user && lastOrgId) {
      const org = user.organizations.find((o) => o.id === lastOrgId);
      if (org) {
        setCurrentOrganization(org);

        if (lastWorkspaceId) {
          const workspace = org.workspaces.find(
            (w) => w.id === lastWorkspaceId
          );
          if (workspace) setCurrentWorkspace(workspace);
        }
      }
    }
  }, [user]);

  const switchOrganization = (orgId: string) => {
    const org = user?.organizations.find((o) => o.id === orgId);
    if (org) {
      setCurrentOrganization(org);
      setCurrentWorkspace(null);
      localStorage.setItem("lastOrgId", orgId);
      localStorage.removeItem("lastWorkspaceId");
    }
  };

  const switchWorkspace = (workspaceId: string) => {
    const workspace = currentOrganization?.workspaces.find(
      (w) => w.id === workspaceId
    );
    if (workspace) {
      setCurrentWorkspace(workspace);
      localStorage.setItem("lastWorkspaceId", workspaceId);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        currentOrganization,
        currentWorkspace,
        setUser,
        switchOrganization,
        switchWorkspace,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
};
```

### State Management Best Practices

```tsx
// ✅ Server state → React Query
const { data: chatbots, isLoading } = useChatbots(workspaceId);

// ✅ Global client state → Context
const { currentOrganization, switchOrganization } = useApp();

// ✅ Local UI state → useState
const [isModalOpen, setIsModalOpen] = useState(false);

// ✅ Form state → React Hook Form
const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm();

// ✅ URL state → React Router
const [searchParams] = useSearchParams();
const activeTab = searchParams.get("tab") || "overview";

// ❌ Don't put server data in Context or useState
const [chatbots, setChatbots] = useState([]); // Use React Query instead!
```

---

## Performance Optimization

### Code Splitting & Lazy Loading

```tsx
// Lazy load route components
import { lazy, Suspense } from 'react'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Studio = lazy(() => import('./pages/Studio'))
const Chatbots = lazy(() => import('./pages/Chatbots'))

// In router
<Routes>
  <Route
    path="/"
    element={
      <Suspense fallback={<PageLoader />}>
        <Dashboard />
      </Suspense>
    }
  />
</Routes>
```

### React.memo for Expensive Components

```tsx
export const ChatbotCard = React.memo<ChatbotCardProps>(
  ({ chatbot, onDelete, onEdit }) => {
    return (
      <div className="border rounded-lg p-6">
        <h3>{chatbot.name}</h3>
        <p>{chatbot.description}</p>
        <button onClick={() => onDelete(chatbot.id)}>Delete</button>
      </div>
    );
  },
  // Custom comparison - only re-render if chatbot.id or chatbot.updatedAt changed
  (prevProps, nextProps) => {
    return (
      prevProps.chatbot.id === nextProps.chatbot.id &&
      prevProps.chatbot.updatedAt === nextProps.chatbot.updatedAt
    );
  }
);
```

### useMemo & useCallback

```tsx
// Memoize expensive calculations
const sortedAndFilteredChatbots = useMemo(() => {
  return chatbots
    .filter(bot => bot.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}, [chatbots, search])

// Memoize callbacks
const handleDelete = useCallback((id: string) => {
  deleteChatbot(id)
}, [deleteChatbot])

// Pass memoized callback to child
<ChatbotList chatbots={sortedAndFilteredChatbots} onDelete={handleDelete} />
```

### Image Optimization

```tsx
// Lazy loading
<img src="/hero.jpg" alt="Hero" loading="lazy" />

// Responsive images
<picture>
  <source media="(min-width: 1024px)" srcSet="/hero-desktop.webp" type="image/webp" />
  <source media="(min-width: 640px)" srcSet="/hero-tablet.webp" type="image/webp" />
  <img src="/hero-mobile.jpg" alt="Hero" loading="lazy" />
</picture>
```

### Bundle Analysis

```bash
# Build and analyze bundle
npm run build
npx vite-bundle-visualizer
```

---

## Animation & Transitions

### Transition Timing

```typescript
const transitions = {
  fast: "150ms", // Micro-interactions (hover, focus)
  base: "200ms", // Standard (dropdowns, tooltips)
  slow: "300ms", // Modals, drawers
  slower: "500ms", // Page transitions
};
```

### Common Patterns

```tsx
// Hover effect
<button className="transition-colors duration-200 hover:bg-blue-700">
  Hover Me
</button>

// Scale animation
<div className="transition-transform duration-200 hover:scale-105">
  Card
</div>

// Fade in/out
<div className={cn(
  "transition-opacity duration-300",
  isVisible ? "opacity-100" : "opacity-0"
)}>
  Content
</div>

// Slide in sidebar
<div className={cn(
  "transition-transform duration-300",
  isOpen ? "translate-x-0" : "-translate-x-full"
)}>
  Sidebar
</div>

// Loading spinner
<Loader2 className="w-6 h-6 animate-spin text-blue-600" />
```

### Respect Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Error & Loading States

### Button Loading

```tsx
<button
  disabled={isLoading}
  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
>
  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
  {isLoading ? "Saving..." : "Save Changes"}
</button>
```

### Page Loading

```tsx
export const PageLoader = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  );
};
```

### Skeleton Loading

```tsx
export const ChatbotCardSkeleton = () => {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>
      </div>
    </div>
  );
};
```

### Error Handling

```tsx
export const ErrorAlert = ({ error }: { error: Error }) => {
  return (
    <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
        <div>
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
            Error
          </h3>
          <p className="text-sm text-red-700 dark:text-red-300 mt-1">
            {error.message}
          </p>
        </div>
      </div>
    </div>
  );
};
```

### Empty States

```tsx
export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) => {
  return (
    <div className="text-center py-12">
      <Icon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
```

---

## Key Lessons Learned

### 1. Background Color Consistency

**Problem**: Pages showing dark backgrounds in light mode.

**Root Cause**:

- Using `h-full` instead of `min-h-full` on page wrappers
- CSS variable `--background` applying to body element
- Missing explicit background classes on page components

**Solution**:

```tsx
// ❌ Wrong - Background won't extend to bottom
<div className="h-full bg-gray-50 dark:bg-gray-900">

// ✅ Correct - Background extends to at least full viewport
<div className="min-h-full bg-gray-50 dark:bg-gray-900">
```

**Lesson**: Always use `min-h-full` for page wrappers to ensure backgrounds extend properly, regardless of content height.

### 2. Sidebar Dark Mode on Both Themes

**Problem**: Sidebar turning light in light mode when we wanted Discord-like dark sidebar.

**Challenge**: Tailwind's `dark:` prefix assumes light in light mode, dark in dark mode.

**Solution**: Use explicit hex colors instead of Tailwind classes for sidebar:

```tsx
// Sidebar stays dark in both modes
<div className="bg-[#2B2D31] dark:bg-[#1E1F22]">

// Content adapts to theme
<div className="bg-white dark:bg-gray-800">
```

**Lesson**: Don't be afraid to use explicit colors when Tailwind's utility classes don't match your design requirements.

### 3. Overflow and Scrolling Management

**Problem**: Multiple nested scrollbars, content cut off, or entire page scrolling instead of content area.

**Root Cause**: Improper overflow management in flex layouts.

**Solution**:

```tsx
// Layout container
<div className="flex h-screen overflow-hidden">

  {/* Fixed sidebars - no overflow */}
  <aside className="w-60 flex-shrink-0 overflow-y-auto">

  {/* Content - scrollable */}
  <main className="flex-1 overflow-auto">
```

**Lesson**:

- Root layout: `overflow-hidden`
- Fixed elements: `flex-shrink-0`, `overflow-y-auto` if needed
- Main content: `flex-1`, `overflow-auto`

### 4. CSS Variables vs Tailwind Classes

**Problem**: Inconsistent theming when mixing CSS variables with Tailwind classes.

**Challenge**: Components using `bg-card` showing unexpected colors.

**Solution**: Be explicit in components:

```tsx
// ❌ Unpredictable
<Card className="bg-card">

// ✅ Predictable
<Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
```

**Lesson**: While CSS variables are great for consistency, being explicit in components gives you more control and makes the code more maintainable.

### 5. Icon Colors in Dark Mode

**Problem**: Icon backgrounds too dark or too light in dark mode.

**Solution**: Use opacity-based backgrounds:

```tsx
// Light mode: solid colors
// Dark mode: transparent overlays
<div className="bg-blue-100 dark:bg-blue-500/10">
  <IconName className="text-blue-600 dark:text-blue-400" />
</div>
```

**Lesson**: Using `/10` (10% opacity) for dark mode icon backgrounds creates subtle, professional-looking containers.

### 6. Responsive Design Testing

**Problem**: Components looking perfect on desktop but broken on mobile.

**Solution**: Test at every breakpoint during development:

```bash
# Chrome DevTools responsive mode
# Test at: 375px, 768px, 1024px, 1440px
```

**Lesson**: Use Chrome DevTools' device toolbar constantly. Don't wait until the end to test responsive designs.

### 7. TypeScript Integration

**Problem**: Props drilling, unclear data types.

**Solution**: Define clear interfaces:

```tsx
interface DashboardProps {
  stats: DashboardStats;
  activities: Activity[];
  chatbots: Chatbot[];
}

interface DashboardStats {
  totalChatbots: number;
  conversations: number;
  activeUsers: number;
  revenue: number;
}
```

**Lesson**: Spend time upfront defining your types. It saves debugging time later and makes refactoring safer.

### 8. Component Composition

**Problem**: Massive components with 500+ lines.

**Solution**: Break into smaller, focused components:

```tsx
// ❌ Wrong - Everything in one component
export const Dashboard = () => {
  // 500 lines of code
};

// ✅ Right - Composed of smaller components
export const Dashboard = () => {
  return (
    <>
      <DashboardHeader />
      <StatsCards stats={stats} />
      <ActivitySection activities={activities} />
      <ActionCards />
    </>
  );
};
```

**Lesson**: Keep components under 200 lines. If longer, extract sub-components.

### 9. State Management

**Problem**: Prop drilling through 5+ levels.

**Solution**: Use Context for global state:

```tsx
// AppContext for: user, organization, workspace
// ThemeContext for: theme state
// Page-level state: useState/useQuery for local data
```

**Lesson**:

- Global state (user, org, theme) → Context
- Server state (chatbots, leads) → React Query
- Local state (modals, forms) → useState

### 10. Loading and Error States

**Problem**: Blank pages while loading, no error feedback.

**Solution**: Always handle loading and error states:

```tsx
if (isLoading) {
  return <LoadingSkeleton />;
}

if (error) {
  return (
    <ErrorMessage
      title="Failed to load data"
      message={error.message}
      retry={refetch}
    />
  );
}

return <Content data={data} />;
```

**Lesson**: Loading and error states are features, not afterthoughts. Design them from the start.

---

## Common Pitfalls & Solutions

### Pitfall 1: Inconsistent Spacing

**Problem**: Some buttons have `px-4 py-2`, others have `p-3`, causing misalignment.

**Solution**: Define spacing constants:

```tsx
const SPACING = {
  button: "px-4 py-2",
  card: "p-6",
  page: "p-4 sm:p-6 lg:p-8",
  section: "space-y-6",
};
```

### Pitfall 2: Color Class Typos

**Problem**: `bg-gray-00` or `text-grey-900` (typo) causing styles to not apply.

**Solution**:

- Use TypeScript for class names where possible
- Use `cn()` utility from clsx
- Test components visually immediately after creation

### Pitfall 3: Z-Index Wars

**Problem**: Modal behind dropdown, dropdown behind sidebar.

**Solution**: Define z-index scale:

```css
/* z-index scale */
.z-sidebar {
  z-index: 10;
}
.z-header {
  z-index: 20;
}
.z-dropdown {
  z-index: 30;
}
.z-modal {
  z-index: 40;
}
.z-toast {
  z-index: 50;
}
```

### Pitfall 4: Not Using Flex-shrink-0

**Problem**: Icons or avatars squishing in flex containers.

**Solution**: Always add `flex-shrink-0` to fixed-width items:

```tsx
<div className="flex items-center gap-3">
  <Icon className="w-5 h-5 flex-shrink-0" />
  <span className="truncate">{longText}</span>
</div>
```

### Pitfall 5: Forgetting Transitions

**Problem**: Abrupt state changes feeling jarring.

**Solution**: Add transitions to interactive elements:

```tsx
className = "transition-colors duration-200";
className = "transition-transform hover:scale-110";
className = "transition-all duration-300";
```

### Pitfall 6: Hardcoded Colors

**Problem**: Using `#2B2D31` everywhere, making theme changes difficult.

**Solution**: Use CSS variables or Tailwind config:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        sidebar: {
          light: "#2B2D31",
          dark: "#1E1F22",
        },
      },
    },
  },
};
```

### Pitfall 7: Missing Hover States

**Problem**: Buttons and links not showing interactivity.

**Solution**: Always add hover states:

```tsx
// Buttons
className = "hover:bg-blue-700 transition-colors";

// Cards
className = "hover:shadow-lg transition-shadow";

// Links
className = "hover:text-blue-600 transition-colors";
```

---

## Best Practices

### Code Organization

```
src/
├── components/
│   ├── ui/              # Reusable UI primitives
│   ├── layout/          # Layout components
│   ├── dashboard/       # Dashboard-specific
│   └── [feature]/       # Feature-specific
├── pages/               # Route components
├── contexts/            # React contexts
├── hooks/               # Custom hooks
├── lib/                 # Utilities
├── types/               # TypeScript types
└── api/                 # API client
```

### Naming Conventions

```tsx
// Components: PascalCase
export const UserProfile: React.FC = () => {};

// Props interfaces: ComponentNameProps
interface UserProfileProps {
  user: User;
  onUpdate: () => void;
}

// Hooks: use + Verb
export const useAuth = () => {};
export const useFetchChatbots = () => {};

// Constants: UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 5_000_000;
const SIDEBAR_WIDTH = 240;

// Utilities: camelCase
export const formatDate = () => {};
export const calculatePercentage = () => {};
```

### Import Organization

```tsx
// 1. React and third-party
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

// 2. Icons
import { Plus, Settings, User } from "lucide-react";

// 3. Internal components
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// 4. Contexts and hooks
import { useApp } from "@/contexts/AppContext";
import { useTheme } from "@/contexts/ThemeContext";

// 5. Utils and types
import { cn } from "@/lib/utils";
import type { User, Organization } from "@/types";
```

### Component Structure

```tsx
// 1. Types and interfaces
interface ComponentProps {
  data: Data[]
  onAction: () => void
}

// 2. Constants
const DEFAULT_PAGE_SIZE = 10

// 3. Component
export const Component: React.FC<ComponentProps> = ({ data, onAction }) => {
  // 4. Hooks (in order)
  const { user } = useApp()
  const [state, setState] = useState()
  const query = useQuery(...)

  // 5. Computed values
  const filteredData = useMemo(() => {
    return data.filter(...)
  }, [data])

  // 6. Effects
  useEffect(() => {
    // Side effects
  }, [])

  // 7. Event handlers
  const handleClick = () => {
    // Handler logic
  }

  // 8. Render helpers
  const renderItem = (item) => {
    return <div>{item.name}</div>
  }

  // 9. Early returns
  if (loading) return <Spinner />
  if (error) return <Error />

  // 10. Main render
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

### Performance Optimization

```tsx
// 1. Memoize expensive computations
const sortedData = useMemo(() => {
  return data.sort((a, b) => a.name.localeCompare(b.name));
}, [data]);

// 2. Memoize callbacks passed to children
const handleUpdate = useCallback(
  (id: string) => {
    updateItem(id);
  },
  [updateItem]
);

// 3. Lazy load heavy components
const StudioEditor = lazy(() => import("./StudioEditor"));

// 4. Use React Query for caching
const { data } = useQuery({
  queryKey: ["chatbots", orgId],
  queryFn: () => fetchChatbots(orgId),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

### Accessibility

```tsx
// 1. Semantic HTML
<nav aria-label="Main navigation">
<main aria-label="Main content">

// 2. ARIA labels
<button aria-label="Close modal">
  <X className="w-4 h-4" />
</button>

// 3. Keyboard navigation
<button
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick()
    }
  }}
>

// 4. Focus management
const inputRef = useRef<HTMLInputElement>(null)
useEffect(() => {
  inputRef.current?.focus()
}, [])

// 5. Color contrast
// Ensure text meets WCAG AA standards (4.5:1 for normal text)
```

### Testing Strategy

```typescript
// 1. Component tests
describe("Dashboard", () => {
  it("renders stats cards", () => {
    render(<Dashboard />);
    expect(screen.getByText("Total Chatbots")).toBeInTheDocument();
  });

  it("handles theme toggle", () => {
    render(<Dashboard />);
    const toggle = screen.getByRole("button", { name: /theme/i });
    fireEvent.click(toggle);
    expect(document.documentElement).toHaveClass("dark");
  });
});

// 2. Hook tests
describe("useAuth", () => {
  it("returns current user", () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeDefined();
  });
});

// 3. Integration tests
describe("User Flow", () => {
  it("allows user to create chatbot", async () => {
    render(<App />);
    const createBtn = screen.getByText("Create New Bot");
    fireEvent.click(createBtn);
    // ... more steps
  });
});
```

---

## Conclusion

Building PrivexBot Dashboard taught us that **consistency is key**:

1. **Consistent Color System**: Define it once, use it everywhere
2. **Consistent Component Patterns**: Every page follows the same structure
3. **Consistent Spacing**: Use the same spacing scale throughout
4. **Consistent Naming**: Makes code predictable and maintainable
5. **Consistent Testing**: Every breakpoint, every theme, every state

The most important lesson: **Start with the layout and theme system first**. Everything else builds on top of that foundation.

When in doubt, refer back to this guide. It's the product of countless hours debugging why backgrounds weren't extending, why themes weren't switching, and why layouts were breaking on mobile.

---

## Component Library Reference

This section provides **complete, copy-paste ready components** that you can use to replicate the entire project.

### Button Components

```tsx
// src/components/ui/button.tsx
import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const variants = {
      primary: "bg-primary-600 hover:bg-primary-700 text-white",
      secondary: "bg-secondary-600 hover:bg-secondary-700 text-white",
      outline:
        "border-2 border-gray-300 dark:border-gray-600 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white",
      ghost:
        "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300",
      danger: "bg-red-600 hover:bg-red-700 text-white",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
```

### Card Components

```tsx
// src/components/ui/card.tsx
import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border bg-white dark:bg-gray-800",
        "border-gray-200 dark:border-gray-700",
        "shadow-sm",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

export const CardHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      "text-gray-900 dark:text-white",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-600 dark:text-gray-400", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

export const CardContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

export const CardFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";
```

### Input Components

```tsx
// src/components/ui/input.tsx
import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border px-3 py-2 text-sm",
          "bg-white dark:bg-gray-900",
          "border-gray-300 dark:border-gray-600",
          "text-gray-900 dark:text-white",
          "placeholder:text-gray-500 dark:placeholder:text-gray-400",
          "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-red-500 focus:ring-red-500",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export const Label = forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-sm font-medium leading-none text-gray-700 dark:text-gray-300",
      "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className
    )}
    {...props}
  />
));
Label.displayName = "Label";
```

### Badge Components

```tsx
// src/components/ui/badge.tsx
import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "error" | "warning" | "info";
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variants = {
      default:
        "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
      success:
        "bg-green-100 dark:bg-green-500/10 text-green-800 dark:text-green-300 border-green-200 dark:border-green-500/20",
      error:
        "bg-red-100 dark:bg-red-500/10 text-red-800 dark:text-red-300 border-red-200 dark:border-red-500/20",
      warning:
        "bg-yellow-100 dark:bg-yellow-500/10 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-500/20",
      info: "bg-blue-100 dark:bg-blue-500/10 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-500/20",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";
```

### Alert Components

```tsx
// src/components/ui/alert.tsx
import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "success" | "error" | "warning" | "info";
  title?: string;
  description?: string;
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  (
    { className, variant = "info", title, description, children, ...props },
    ref
  ) => {
    const variants = {
      success: {
        container:
          "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800",
        icon: (
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
        ),
        title: "text-green-800 dark:text-green-200",
        description: "text-green-700 dark:text-green-300",
      },
      error: {
        container:
          "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800",
        icon: (
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
        ),
        title: "text-red-800 dark:text-red-200",
        description: "text-red-700 dark:text-red-300",
      },
      warning: {
        container:
          "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800",
        icon: (
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
        ),
        title: "text-yellow-800 dark:text-yellow-200",
        description: "text-yellow-700 dark:text-yellow-300",
      },
      info: {
        container:
          "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800",
        icon: <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
        title: "text-blue-800 dark:text-blue-200",
        description: "text-blue-700 dark:text-blue-300",
      },
    };

    const config = variants[variant];

    return (
      <div
        ref={ref}
        className={cn(
          "relative w-full rounded-lg border p-4",
          config.container,
          className
        )}
        {...props}
      >
        <div className="flex items-start gap-3">
          {config.icon}
          <div className="flex-1">
            {title && (
              <h5 className={cn("mb-1 text-sm font-medium", config.title)}>
                {title}
              </h5>
            )}
            {description && (
              <p className={cn("text-sm", config.description)}>{description}</p>
            )}
            {children}
          </div>
        </div>
      </div>
    );
  }
);
Alert.displayName = "Alert";
```

### Stats Card Component

```tsx
// src/components/dashboard/StatsCard.tsx
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "increase" | "decrease" | "neutral";
  icon: LucideIcon;
  iconColor?: "blue" | "purple" | "green" | "red" | "yellow";
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "blue",
}) => {
  const iconColors = {
    blue: "bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
    purple:
      "bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400",
    green:
      "bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400",
    red: "bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400",
    yellow:
      "bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  };

  const changeColors = {
    increase: "text-green-600 dark:text-green-400",
    decrease: "text-red-600 dark:text-red-400",
    neutral: "text-gray-600 dark:text-gray-400",
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {value}
            </p>
            {change && (
              <p className={cn("text-sm mt-2", changeColors[changeType])}>
                {change}
              </p>
            )}
          </div>
          <div
            className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center",
              iconColors[iconColor]
            )}
          >
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

### Empty State Component

```tsx
// src/components/shared/EmptyState.tsx
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400 dark:text-gray-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-sm">
        {description}
      </p>
      {action && <Button onClick={action.onClick}>{action.label}</Button>}
    </div>
  );
};
```

### Loading Components

```tsx
// src/components/shared/LoadingSpinner.tsx
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  className,
}) => {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <Loader2
      className={cn("animate-spin text-primary-600", sizes[size], className)}
    />
  );
};

// Page Loader
export const PageLoader: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  );
};

// Skeleton Loader
export const Skeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn(
        "animate-pulse bg-gray-200 dark:bg-gray-700 rounded",
        className
      )}
    />
  );
};
```

### Page Template

```tsx
// src/components/shared/PageTemplate.tsx
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageTemplateProps {
  children: ReactNode;
  className?: string;
}

export const PageTemplate: React.FC<PageTemplateProps> = ({
  children,
  className,
}) => {
  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-900">
      <div className={cn("p-4 sm:p-6 lg:p-8", className)}>{children}</div>
    </div>
  );
};

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
}) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
};
```

### Utility Function (cn)

```typescript
// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

// Format number
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

// Truncate text
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

// Get initials
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
```

---

## Complete Page Examples

### Dashboard Page

```tsx
// src/pages/Dashboard.tsx
import { Bot, MessageSquare, Users, TrendingUp } from "lucide-react";
import { PageTemplate, PageHeader } from "@/components/shared/PageTemplate";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const Dashboard: React.FC = () => {
  const stats = [
    {
      title: "Total Chatbots",
      value: "12",
      change: "+2 from last month",
      changeType: "increase" as const,
      icon: Bot,
      iconColor: "blue" as const,
    },
    {
      title: "Conversations",
      value: "3,456",
      change: "+12% from last week",
      changeType: "increase" as const,
      icon: MessageSquare,
      iconColor: "purple" as const,
    },
    {
      title: "Active Users",
      value: "892",
      change: "+5% from yesterday",
      changeType: "increase" as const,
      icon: Users,
      iconColor: "green" as const,
    },
    {
      title: "Avg Response Time",
      value: "1.2s",
      change: "-0.3s improvement",
      changeType: "increase" as const,
      icon: TrendingUp,
      iconColor: "yellow" as const,
    },
  ];

  return (
    <PageTemplate>
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here's what's happening with your chatbots."
        actions={<Button>Create New Chatbot</Button>}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Activity list here */}
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Recent activity will appear here
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Bot className="w-4 h-4 mr-2" />
                Create Chatbot
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                Manage Team
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTemplate>
  );
};
```

### Form Example (Settings Page)

```tsx
// src/pages/Settings.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PageTemplate, PageHeader } from "@/components/shared/PageTemplate";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

const settingsSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  website: z.string().url("Invalid website URL").optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export const Settings: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
  });

  const onSubmit = async (data: SettingsFormData) => {
    console.log(data);
    // Save settings
  };

  return (
    <PageTemplate>
      <PageHeader
        title="Settings"
        description="Manage your organization settings and preferences"
      />

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Organization Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Company Name */}
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  {...register("companyName")}
                  error={errors.companyName?.message}
                />
                {errors.companyName && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.companyName.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  error={errors.email?.message}
                />
                {errors.email && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Website */}
              <div className="space-y-2">
                <Label htmlFor="website">Website (optional)</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://example.com"
                  {...register("website")}
                  error={errors.website?.message}
                />
                {errors.website && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.website.message}
                  </p>
                )}
              </div>

              {/* Submit */}
              <div className="flex items-center gap-3">
                <Button type="submit" isLoading={isSubmitting}>
                  Save Changes
                </Button>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageTemplate>
  );
};
```

---

## Quick Reference Cheat Sheet

### Common Patterns

```tsx
// 1. Page Structure
<PageTemplate>
  <PageHeader title="Page Title" description="Description" actions={<Button>Action</Button>} />
  {/* Page content */}
</PageTemplate>

// 2. Stats Grid (Dashboard)
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <StatsCard {...stat} />
</div>

// 3. Two-Column Layout
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2">{/* Main content */}</div>
  <div>{/* Sidebar */}</div>
</div>

// 4. Form Field
<div className="space-y-2">
  <Label htmlFor="field">Field Label</Label>
  <Input id="field" {...register('field')} />
  {errors.field && <p className="text-sm text-red-600">{errors.field.message}</p>}
</div>

// 5. Loading State
{isLoading && <LoadingSpinner />}
{isLoading ? <Skeleton className="h-20 w-full" /> : <Content />}

// 6. Empty State
{items.length === 0 && (
  <EmptyState
    icon={Icon}
    title="No items yet"
    description="Get started by creating your first item"
    action={{ label: "Create Item", onClick: handleCreate }}
  />
)}

// 7. Error State
{error && (
  <Alert variant="error" title="Error" description={error.message} />
)}

// 8. Success State
{success && (
  <Alert variant="success" title="Success" description="Changes saved successfully" />
)}
```

### Color Class Reference

```tsx
// Primary Actions
className = "bg-primary-600 hover:bg-primary-700 text-white";

// Secondary Actions
className = "bg-secondary-600 hover:bg-secondary-700 text-white";

// Danger/Delete
className = "bg-red-600 hover:bg-red-700 text-white";

// Outline
className = "border-2 border-gray-300 dark:border-gray-600 bg-transparent";

// Card
className =
  "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700";

// Page Background
className = "bg-gray-50 dark:bg-gray-900";

// Text - Heading
className = "text-gray-900 dark:text-white";

// Text - Body
className = "text-gray-600 dark:text-gray-400";

// Text - Muted
className = "text-gray-500 dark:text-gray-500";
```

### Spacing Reference

```tsx
// Padding
className = "p-4"; // 16px - Compact
className = "p-6"; // 24px - Default
className = "p-8"; // 32px - Spacious

// Responsive Padding
className = "p-4 sm:p-6 lg:p-8"; // 16px → 24px → 32px

// Vertical Spacing
className = "space-y-2"; // 8px - Tight
className = "space-y-4"; // 16px - Default
className = "space-y-6"; // 24px - Section
className = "space-y-8"; // 32px - Major

// Margins
className = "mb-6"; // 24px bottom
className = "mt-8"; // 32px top
```

---

## Environment Setup Checklist

### Required Files

```bash
# 1. package.json dependencies
{
  "dependencies": {
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "react-router-dom": "^6.20.0",
    "@tanstack/react-query": "^5.17.19",
    "react-hook-form": "^7.49.3",
    "zod": "^3.22.4",
    "lucide-react": "^0.544.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.3.1"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^7.1.12",
    "tailwindcss": "^3.4.1",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32"
  }
}

# 2. tailwind.config.js
# (Use the complete config from "Complete Color System" section)

# 3. src/index.css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-family: 'Inter', sans-serif;
  }
}

# 4. vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

# 5. tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

## Replication Checklist

To replicate this project from scratch, follow this order:

### Phase 1: Setup

- [ ] Create Vite React TypeScript project if starting from scratch or continue with the existing codebase
- [ ] Install all dependencies from package.json
- [ ] Set up Tailwind CSS with config
- [ ] Configure path aliases (@/_ = ./src/_)
- [ ] Create folder structure (components, pages, hooks, etc.)

### Phase 2: Foundation

- [ ] Create src/lib/utils.ts with cn() function
- [ ] Set up dark mode in tailwind.config.js
- [ ] Create theme context and provider
- [ ] Set up React Router
- [ ] Create root layout component

### Phase 3: UI Components

- [ ] Button component
- [ ] Card components (Card, CardHeader, CardTitle, CardContent)
- [ ] Input and Label components
- [ ] Badge component
- [ ] Alert component
- [ ] Loading components (Spinner, PageLoader, Skeleton)
- [ ] Empty state component

### Phase 4: Layout Components

- [ ] Sidebar component
- [ ] Workspace switcher component
- [ ] Page template components
- [ ] Three-column layout wrapper

### Phase 5: Feature Components

- [ ] Stats card component
- [ ] Dashboard-specific components
- [ ] Form components
- [ ] Table components (if needed)

### Phase 6: Pages

- [ ] Dashboard page
- [ ] Settings page
- [ ] Other pages following same pattern

### Phase 7: State & API

- [ ] Set up React Query
- [ ] Create API hooks
- [ ] Set up context providers
- [ ] Configure routes

---

## Complete Layout & Navigation System

This section provides **every component** needed to replicate the three-column layout, sidebar navigation, workspace switcher, and responsive behavior.

### Three-Column Layout Architecture

```tsx
// src/components/layout/Layout.tsx
import { Outlet } from "react-router-dom";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { Sidebar } from "./Sidebar";
import { useState } from "react";
import { Menu } from "lucide-react";

export const Layout: React.FC = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Workspace Switcher - Fixed 80px width */}
      <div className="hidden lg:block w-20 flex-shrink-0 bg-[#2B2D31] dark:bg-[#1E1F22] border-r border-[#3a3a3a] dark:border-[#26272B]">
        <WorkspaceSwitcher />
      </div>

      {/* Main Sidebar - Fixed 240px width */}
      <div className="hidden lg:block w-60 flex-shrink-0 bg-[#2B2D31] dark:bg-[#1E1F22] border-r border-[#3a3a3a] dark:border-[#26272B]">
        <Sidebar onClose={() => setIsMobileSidebarOpen(false)} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />

          {/* Mobile Sidebar */}
          <div className="fixed inset-y-0 left-0 w-72 bg-[#2B2D31] dark:bg-[#1E1F22] z-50 lg:hidden transform transition-transform duration-300">
            <Sidebar onClose={() => setIsMobileSidebarOpen(false)} />
          </div>
        </>
      )}

      {/* Main Content Area - Flexible */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#313338] dark:bg-[#1E1F22]">
        {/* Mobile Header with Menu Button */}
        <div className="lg:hidden bg-[#2B2D31] dark:bg-[#1E1F22] border-b border-[#3a3a3a] dark:border-[#26272B] p-4">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-[#36373D] dark:hover:bg-[#2B2D31] text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Main Content - Scrollable */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
```

### Workspace Switcher Component

```tsx
// src/components/layout/WorkspaceSwitcher.tsx
import { Plus, Settings } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";

interface Workspace {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

export const WorkspaceSwitcher: React.FC = () => {
  const { workspaces, currentWorkspace, switchWorkspace } = useApp();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="h-full flex flex-col items-center py-4 gap-2 overflow-y-auto scrollbar-hide">
      {/* Workspace Icons */}
      <div className="flex flex-col items-center gap-2">
        {workspaces.map((workspace) => (
          <button
            key={workspace.id}
            onClick={() => switchWorkspace(workspace.id)}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              "transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-[#2B2D31]",
              currentWorkspace?.id === workspace.id
                ? "bg-primary-600 text-white scale-110"
                : "bg-[#36373D] dark:bg-[#2B2D31] hover:bg-[#3a3a3a] dark:hover:bg-[#313338] text-white"
            )}
            title={workspace.name}
          >
            {workspace.icon ? (
              <img
                src={workspace.icon}
                alt={workspace.name}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <span className="text-sm font-semibold">
                {getInitials(workspace.name)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="w-8 h-px bg-[#3a3a3a] dark:bg-[#26272B] my-2" />

      {/* Add Workspace Button */}
      <button
        className={cn(
          "w-12 h-12 rounded-full border-2 border-dashed",
          "border-[#3a3a3a] dark:border-[#26272B]",
          "hover:border-gray-400 dark:hover:border-gray-500",
          "flex items-center justify-center",
          "transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-primary-500"
        )}
        title="Add Workspace"
      >
        <Plus className="w-5 h-5 text-[#B5BAC1]" />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom Section */}
      <div className="flex flex-col items-center gap-2">
        {/* User Avatar */}
        <button
          className={cn(
            "w-12 h-12 rounded-full",
            "bg-gradient-to-br from-blue-500 to-purple-600",
            "flex items-center justify-center",
            "hover:scale-105 transition-transform",
            "focus:outline-none focus:ring-2 focus:ring-primary-500"
          )}
          title="User Profile"
        >
          <span className="text-white font-semibold text-sm">JD</span>
        </button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Settings */}
        <button
          className={cn(
            "w-12 h-12 rounded-full",
            "hover:bg-[#36373D] dark:hover:bg-[#2B2D31]",
            "flex items-center justify-center",
            "transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-primary-500"
          )}
          title="Settings"
        >
          <Settings className="w-5 h-5 text-[#B5BAC1]" />
        </button>
      </div>
    </div>
  );
};
```

### Theme Toggle Component

```tsx
// src/components/layout/ThemeToggle.tsx
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    const themes = ["light", "dark", "system"] as const;
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const getIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="w-5 h-5 text-yellow-500" />;
      case "dark":
        return <Moon className="w-5 h-5 text-blue-400" />;
      case "system":
        return <Monitor className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <button
      onClick={cycleTheme}
      className={cn(
        "w-12 h-12 rounded-full",
        "hover:bg-[#36373D] dark:hover:bg-[#2B2D31]",
        "flex items-center justify-center",
        "transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-primary-500"
      )}
      title={`Current theme: ${theme}`}
      aria-label={`Switch to next theme (current: ${theme})`}
    >
      {getIcon()}
    </button>
  );
};
```

### Main Sidebar Component

```tsx
// src/components/layout/Sidebar.tsx
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Workflow,
  Bot,
  Database,
  BarChart3,
  Mail,
  Store,
  Gift,
  FileText,
  Settings,
  Users,
  CreditCard,
  X,
} from "lucide-react";
import { OrganizationSwitcher } from "./OrganizationSwitcher";
import { cn } from "@/lib/utils";

interface SidebarProps {
  onClose?: () => void;
}

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: string;
  badgeVariant?: "default" | "success" | "warning";
  permission?: Permission; // Required permission to view this menu item
  requiresDefaultWorkspace?: boolean; // Only show in default/personal workspace
}

const mainMenuItems: MenuItem[] = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/dashboad",
    // Always visible - no permission required
  },
  {
    icon: Bot,
    label: "Chatbots",
    path: "/chatbots",
    permission: "chatbot:view", // Only visible if user has chatbot:view permission
  },
  {
    icon: Workflow,
    label: "Studio",
    path: "/studio",
    badge: "New",
    permission: "chatflow:view", // Only visible if user has chatflow:view permission
  },
  {
    icon: Database,
    label: "Knowledge Base",
    path: "/knowledge-base",
    permission: "kb:view", // Only visible if user has kb:view permission
  },
  {
    icon: Mail,
    label: "Leads",
    path: "/leads",
    permission: "lead:view", // Only visible if user has lead:view permission
  },
  {
    icon: BarChart3,
    label: "Analytics",
    path: "/analytics",
    // Always visible - no permission required
  },
  {
    icon: User,
    label: "Profile",
    path: "/profile",
    requiresDefaultWorkspace: true, // ONLY shows in Personal org + default workspace
  },
  {
    icon: Building2,
    label: "Organizations",
    path: "/organizations",
    // Always visible - no permission required
  },
  {
    icon: Store,
    label: "Marketplace",
    path: "/marketplace",
    // Always visible - no permission required
  },
  {
    icon: Gift,
    label: "Referrals",
    path: "/referrals",
    // Always visible - no permission required
  },
];

const secondaryMenuItems: MenuItem[] = [
  {
    icon: FileText,
    label: "Documentation",
    path: "/documentation",
    // Always visible - no permission required
  },
];

const bottomMenuItems: MenuItem[] = [
  {
    icon: Users,
    label: "Team",
    path: "/team",
    // Always visible - no permission required
  },
  {
    icon: CreditCard,
    label: "Billing",
    path: "/billing",
    // Always visible - no permission required
  },
  {
    icon: Settings,
    label: "Settings",
    path: "/settings",
    // Always visible - no permission required
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const location = useLocation();
  const {
    hasPermission,
    currentOrganization,
    currentWorkspace,
    organizations,
    workspaces,
  } = useApp();

  // Determine if user is in their Personal organization's default workspace
  const isDefaultOrganization =
    organizations?.[0]?.id === currentOrganization?.id;
  const isDefaultWorkspace =
    currentWorkspace?.name === currentOrganization?.name ||
    currentWorkspace?.name.includes("Default") ||
    workspaces?.[0]?.id === currentWorkspace?.id;
  const isInDefaultContext = isDefaultOrganization && isDefaultWorkspace;

  // Filter menu items based on permissions and context
  const filteredMainMenuItems = mainMenuItems.filter((item) => {
    // Check permission if required
    if (item.permission && !hasPermission(item.permission)) {
      return false; // Hide if user lacks required permission
    }

    // Check if item requires default workspace context
    if (item.requiresDefaultWorkspace && !isInDefaultContext) {
      return false; // Hide Profile page if not in Personal org + default workspace
    }

    return true; // Show item
  });

  const NavItem: React.FC<MenuItem & { onClick?: () => void }> = ({
    icon: Icon,
    label,
    path,
    badge,
    badgeVariant = "default",
    onClick,
  }) => {
    const isActive = location.pathname === path;

    return (
      <Link
        to={path}
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium",
          "transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-[#2B2D31]",
          isActive
            ? "bg-[#404249] dark:bg-[#313338] text-white"
            : "text-[#B5BAC1] hover:bg-[#36373D] dark:hover:bg-[#2B2D31] hover:text-white"
        )}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="flex-1">{label}</span>
        {badge && (
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-xs font-semibold",
              badgeVariant === "success" && "bg-green-500/20 text-green-400",
              badgeVariant === "warning" && "bg-yellow-500/20 text-yellow-400",
              badgeVariant === "default" && "bg-primary-500/20 text-primary-400"
            )}
          >
            {badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <nav className="h-full flex flex-col bg-[#2B2D31] dark:bg-[#1E1F22] overflow-y-auto scrollbar-hide">
      {/* Header with Organization Switcher */}
      <div className="p-4 border-b border-[#3a3a3a] dark:border-[#26272B]">
        <div className="flex items-center justify-between mb-4 lg:mb-0">
          <h2 className="text-white font-semibold text-lg lg:hidden">Menu</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded hover:bg-[#36373D] text-[#B5BAC1]"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <OrganizationSwitcher />
      </div>

      {/* Main Navigation */}
      <div className="flex-1 p-3 space-y-1">
        {/* Main Menu Items - Filtered by permissions and context */}
        {filteredMainMenuItems.map((item) => (
          <NavItem key={item.path} {...item} onClick={onClose} />
        ))}

        {/* Divider */}
        <div className="h-px bg-[#3a3a3a] dark:bg-[#26272B] my-3" />

        {/* Secondary Menu Items - Always visible (Documentation) */}
        {secondaryMenuItems.map((item) => (
          <NavItem key={item.path} {...item} onClick={onClose} />
        ))}
      </div>

      {/* Bottom Menu - Always visible (Team, Billing, Settings) */}
      <div className="p-3 border-t border-[#3a3a3a] dark:border-[#26272B] space-y-1">
        {bottomMenuItems.map((item) => (
          <NavItem key={item.path} {...item} onClick={onClose} />
        ))}
      </div>
    </nav>
  );
};
```

### Organization Switcher Component

```tsx
// src/components/layout/OrganizationSwitcher.tsx
import { useState } from "react";
import { ChevronDown, Check, Plus } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";

export const OrganizationSwitcher: React.FC = () => {
  const { organizations, currentOrganization, switchOrganization } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!currentOrganization) return null;

  return (
    <div className="relative">
      {/* Current Organization Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-md",
          "hover:bg-[#36373D] dark:hover:bg-[#2B2D31]",
          "transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-primary-500"
        )}
      >
        <div className="w-8 h-8 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">
            {getInitials(currentOrganization.name)}
          </span>
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-white font-semibold text-sm truncate">
            {currentOrganization.name}
          </p>
          <p className="text-[#B5BAC1] text-xs truncate">
            {currentOrganization.subscription_tier || "Free Plan"}
          </p>
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-[#B5BAC1] transition-transform flex-shrink-0",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#1E1F22] rounded-lg shadow-lg border border-[#26272B] z-50 max-h-80 overflow-y-auto">
            {/* Organization List */}
            {organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => {
                  switchOrganization(org.id);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2",
                  "hover:bg-[#2B2D31] transition-colors",
                  "first:rounded-t-lg last:rounded-b-lg",
                  "focus:outline-none focus:bg-[#2B2D31]"
                )}
              >
                <div className="w-8 h-8 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">
                    {getInitials(org.name)}
                  </span>
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {org.name}
                  </p>
                  <p className="text-[#B5BAC1] text-xs truncate">
                    {org.member_count} members
                  </p>
                </div>
                {org.id === currentOrganization.id && (
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                )}
              </button>
            ))}

            {/* Divider */}
            <div className="h-px bg-[#26272B] my-1" />

            {/* Create Organization */}
            <button
              onClick={() => {
                // Handle create organization
                setIsOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2",
                "hover:bg-[#2B2D31] transition-colors",
                "text-primary-400 text-sm font-medium",
                "rounded-b-lg",
                "focus:outline-none focus:bg-[#2B2D31]"
              )}
            >
              <div className="w-8 h-8 rounded-md border-2 border-dashed border-[#3a3a3a] flex items-center justify-center flex-shrink-0">
                <Plus className="w-4 h-4" />
              </div>
              <span>Create Organization</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
```

### App Context Provider

```tsx
// src/contexts/AppContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
}

interface Organization {
  id: string;
  name: string;
  subscription_tier: string;
  member_count: number;
}

interface Workspace {
  id: string;
  name: string;
  organization_id: string;
  icon?: string;
}

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  organizations: Organization[];
  currentOrganization: Organization | null;
  switchOrganization: (orgId: string) => void;
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  switchWorkspace: (workspaceId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganization] =
    useState<Organization | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(
    null
  );

  // Load from localStorage on mount
  useEffect(() => {
    const savedOrgId = localStorage.getItem("lastOrgId");
    const savedWorkspaceId = localStorage.getItem("lastWorkspaceId");

    // Mock data - replace with actual API calls
    const mockOrganizations: Organization[] = [
      {
        id: "1",
        name: "Acme Corp",
        subscription_tier: "Pro",
        member_count: 12,
      },
      {
        id: "2",
        name: "Tech Startup",
        subscription_tier: "Free",
        member_count: 3,
      },
    ];

    const mockWorkspaces: Workspace[] = [
      { id: "1", name: "Production", organization_id: "1" },
      { id: "2", name: "Staging", organization_id: "1" },
      { id: "3", name: "Development", organization_id: "1" },
    ];

    setOrganizations(mockOrganizations);
    setWorkspaces(mockWorkspaces);

    // Restore last organization
    if (savedOrgId) {
      const org = mockOrganizations.find((o) => o.id === savedOrgId);
      if (org) {
        setCurrentOrganization(org);

        // Restore last workspace
        if (savedWorkspaceId) {
          const workspace = mockWorkspaces.find(
            (w) => w.id === savedWorkspaceId
          );
          if (workspace) setCurrentWorkspace(workspace);
        }
      }
    } else if (mockOrganizations.length > 0) {
      setCurrentOrganization(mockOrganizations[0]);
    }
  }, []);

  const switchOrganization = (orgId: string) => {
    const org = organizations.find((o) => o.id === orgId);
    if (org) {
      setCurrentOrganization(org);
      setCurrentWorkspace(null); // Reset workspace when switching org
      localStorage.setItem("lastOrgId", orgId);
      localStorage.removeItem("lastWorkspaceId");
    }
  };

  const switchWorkspace = (workspaceId: string) => {
    const workspace = workspaces.find((w) => w.id === workspaceId);
    if (workspace) {
      setCurrentWorkspace(workspace);
      localStorage.setItem("lastWorkspaceId", workspaceId);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        organizations,
        currentOrganization,
        switchOrganization,
        workspaces,
        currentWorkspace,
        switchWorkspace,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
};
```

### Theme Context Provider

```tsx
// src/contexts/ThemeContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: "light" | "dark"; // The actual applied theme
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("theme") as Theme;
    return saved || "system";
  });

  const [actualTheme, setActualTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const root = window.document.documentElement;

    // Remove existing theme classes
    root.classList.remove("light", "dark");

    // Determine actual theme
    let applied: "light" | "dark" = "light";

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      applied = systemTheme;
    } else {
      applied = theme;
    }

    // Apply theme
    root.classList.add(applied);
    setActualTheme(applied);

    // Save to localStorage
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      if (theme === "system") {
        const applied = mediaQuery.matches ? "dark" : "light";
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(applied);
        setActualTheme(applied);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, actualTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
```

### App Root Setup

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProvider } from "./contexts/AppContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Layout } from "./components/layout/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Studio } from "./pages/Studio";
import { Chatbots } from "./pages/Chatbots";
import { KnowledgeBase } from "./pages/KnowledgeBase";
import { Analytics } from "./pages/Analytics";
import { Leads } from "./pages/Leads";
import { Marketplace } from "./pages/Marketplace";
import { Referrals } from "./pages/Referrals";
import { Documentation } from "./pages/Documentation";
import { Team } from "./pages/Team";
import { Billing } from "./pages/Billing";
import { Settings } from "./pages/Settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="studio" element={<Studio />} />
                <Route path="chatbots" element={<Chatbots />} />
                <Route path="knowledge-base" element={<KnowledgeBase />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="leads" element={<Leads />} />
                <Route path="marketplace" element={<Marketplace />} />
                <Route path="referrals" element={<Referrals />} />
                <Route path="documentation" element={<Documentation />} />
                <Route path="team" element={<Team />} />
                <Route path="billing" element={<Billing />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AppProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
```

### Scrollbar Hiding CSS

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
    font-family: "Inter", sans-serif;
  }

  /* Hide scrollbar but keep functionality */
  .scrollbar-hide {
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }

  .scrollbar-hide::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }

  /* Custom scrollbar for main content */
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #4b5563;
    border-radius: 4px;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #6b7280;
  }

  .dark .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #374151;
  }

  .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #4b5563;
  }
}
```

### Responsive Breakpoints

```typescript
// src/lib/breakpoints.ts
import { useState, useEffect } from "react";

export const breakpoints = {
  sm: 640, // Mobile landscape, small tablets
  md: 768, // Tablets
  lg: 1024, // Desktop (sidebar becomes visible)
  xl: 1280, // Large desktop
  "2xl": 1536, // Extra large desktop
};

// Usage in components
export const useBreakpoint = (breakpoint: keyof typeof breakpoints) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const query = `(min-width: ${breakpoints[breakpoint]}px)`;
    const media = window.matchMedia(query);

    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener("change", listener);

    return () => media.removeEventListener("change", listener);
  }, [breakpoint]);

  return matches;
};
```

---

## Layout Behavior Reference

### Desktop (≥1024px)

- **Three columns visible**: Workspace Switcher (80px) + Sidebar (240px) + Content (flex)
- **Fixed sidebars**: No scrolling on sidebar containers
- **Content scrolls**: Only main content area scrolls
- **No overlay**: Mobile menu hidden

### Tablet (768px - 1023px)

- **Two columns**: Sidebar hidden, Workspace Switcher hidden
- **Mobile menu button**: Shows in header
- **Overlay sidebar**: Slides in from left (288px width)
- **Backdrop**: Dark overlay with click-to-close

### Mobile (<768px)

- **Single column**: Full-width content
- **Mobile menu button**: Visible in header
- **Full-screen sidebar**: Slides in from left
- **Touch-friendly**: Larger touch targets (48px minimum)

### Keyboard Navigation

- **Tab order**: Workspace Switcher → Sidebar → Content
- **Escape key**: Closes mobile sidebar
- **Focus indicators**: Visible on all interactive elements
- **Skip links**: "Skip to main content" for accessibility

---

## 100% Replication Checklist

Now you can replicate **EVERY** layout component:

### Layout Components ✅

- [x] Three-column layout wrapper
- [x] Workspace switcher (80px column)
- [x] Main sidebar (240px column)
- [x] Mobile sidebar with overlay
- [x] Responsive behavior (<768px, 768-1023px, ≥1024px)

### Navigation Components ✅

- [x] Organization switcher dropdown
- [x] Main menu items with active states
- [x] Secondary menu items
- [x] Bottom menu (Team, Billing, Settings)
- [x] Menu dividers
- [x] Badge support (New, Pro, etc.)

### User Interface ✅

- [x] User avatar in workspace switcher
- [x] Theme toggle (light/dark/system)
- [x] Settings button
- [x] Add workspace button
- [x] Create organization button

### State Management ✅

- [x] AppContext for global state
- [x] ThemeContext for theme management
- [x] LocalStorage persistence
- [x] Organization/workspace switching

### Responsive Design ✅

- [x] Mobile menu button
- [x] Sidebar overlay/backdrop
- [x] Touch-friendly sizing (48px targets)
- [x] Breakpoint-aware rendering

### Accessibility ✅

- [x] ARIA labels
- [x] Keyboard navigation
- [x] Focus indicators
- [x] Screen reader support
- [x] Skip links

### Styling ✅

- [x] Discord-like dark sidebar
- [x] Hover states
- [x] Active states
- [x] Transition animations
- [x] Custom scrollbars
- [x] Scrollbar hiding

Every component, every interaction, every responsive behavior is documented with complete source code. Just copy-paste and customize for your needs! Always customize for your needs as this is just a template.

---

th

---

## Organization & Workspace Switching System

This section provides a **complete end-to-end explanation** of how the organization and workspace switching system works, from user authentication to context switching.

### System Overview

The application uses a **multi-tenant architecture** where:

- Each **User** can belong to multiple **Organizations**
- Each **Organization** contains multiple **Workspaces**
- Users have **roles** at both Organization and Workspace levels
- The current **Organization + Workspace** context determines what data users can see and what actions they can perform
- Context is persisted in **localStorage** and synchronized with **backend via JWT tokens**

### Authentication & Initial Setup Flow

#### 1. New User Sign-Up Flow

```typescript
// POST /api/v1/auth/signup
{
  "email": "user@example.com",
  "password": "secure_password",
  "username": "john_doe"
}

// Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "username": "john_doe"
  },
  "default_organization": {
    "id": "org_xyz789",
    "name": "Personal",  // Auto-created default organization
    "user_role": "owner",
    "is_default": true
  },
  "default_workspace": {
    "id": "ws_def456",
    "name": "Personal",  // Auto-created default workspace
    "organization_id": "org_xyz789",
    "user_role": "admin",
    "is_default": true
  }
}
```

**Backend Behavior:**

1. Creates user account
2. Automatically creates a **"Personal" organization** with user as owner
3. Automatically creates a **"Personal" workspace** within that organization
4. Issues JWT token with embedded context:
   ```json
   {
     "user_id": "usr_abc123",
     "organization_id": "org_xyz789",
     "workspace_id": "ws_def456"
   }
   ```

**Frontend Behavior:**

1. Store JWT token in memory/localStorage
2. Parse response and set initial context
3. Navigate to `/dashboard` (Dashboard page)
4. AppContext loads with default org + workspace

#### 2. Existing User Sign-In Flow

```typescript
// POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "secure_password"
}

// Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "username": "john_doe"
  },
  "last_context": {
    "organization_id": "org_xyz789",  // Last active org
    "workspace_id": "ws_def456"       // Last active workspace
  }
}
```

**Frontend Behavior After Login:**

```typescript
// 1. Store JWT token
apiClient.setAuthToken(response.access_token);

// 2. AppContext initialization (useEffect on mount)
const refreshData = async () => {
  // Step 1: Get current user details
  const userData = await authApi.getCurrentUser();
  // GET /api/v1/auth/me

  // Step 2: Get all organizations user belongs to
  const orgsResponse = await organizationsApi.list();
  // GET /api/v1/orgs/
  // Returns: { organizations: Organization[], total: number }

  // Step 3: Restore last context from localStorage
  const savedOrgId = localStorage.getItem("privexbot_current_org_id");
  const savedWorkspaceId = localStorage.getItem(
    "privexbot_current_workspace_id"
  );

  // Step 4: Determine target organization
  let targetOrg = null;

  if (savedOrgId) {
    // Try to restore last active org
    targetOrg = orgsResponse.organizations.find((o) => o.id === savedOrgId);
  }

  if (!targetOrg) {
    // Fallback: Use default org or first org
    targetOrg =
      orgsResponse.organizations.find((o) => o.name === "Personal") ||
      orgsResponse.organizations[0];
  }

  // Step 5: Get workspaces for selected organization
  const workspacesData = await organizationsApi.getWorkspaces(targetOrg.id);
  // GET /api/v1/orgs/{org_id}/workspaces

  // Step 6: Determine target workspace
  let targetWorkspace = null;

  if (savedWorkspaceId) {
    // Try to restore last active workspace
    targetWorkspace = workspacesData.find((w) => w.id === savedWorkspaceId);
  }

  if (!targetWorkspace) {
    // Fallback: Use default workspace or first workspace
    targetWorkspace =
      workspacesData.find((w) => w.is_default) || workspacesData[0];
  }

  // Step 7: Set context in state
  setCurrentOrganization(targetOrg);
  setCurrentWorkspace(targetWorkspace);
  setOrganizations(orgsResponse.organizations);
  setWorkspaces(workspacesData);

  // Step 8: Persist to localStorage
  localStorage.setItem("privexbot_current_org_id", targetOrg.id);
  localStorage.setItem("privexbot_current_workspace_id", targetWorkspace.id);

  // Step 9: Calculate permissions
  const permissions = calculatePermissions(targetOrg, targetWorkspace);
  setPermissions(permissions);
};
```

**User is now on Dashboard with:**

- Sidebar showing workspaces for current organization
- Organization switcher at bottom showing user avatar, name and email address if avaliable
- All data scoped to current org + workspace

### Organization Switching Flow

When user clicks organization in the bottom dropup menu:

```typescript
const switchOrganization = async (orgId: string) => {
  setIsLoading(true);

  // Step 1: Find organization in state
  const org = organizations.find((o) => o.id === orgId);
  if (!org) throw new Error("Organization not found");

  setCurrentOrganization(org);

  // Step 2: Fetch workspaces for that organization
  const workspacesData = await organizationsApi.getWorkspaces(orgId);
  // GET /api/v1/orgs/{org_id}/workspaces
  setWorkspaces(workspacesData);

  // Step 3: Select default workspace in the org
  const targetWorkspace =
    workspacesData.find((w) => w.is_default) || workspacesData[0];

  setCurrentWorkspace(targetWorkspace);

  // Step 4: Persist to localStorage
  localStorage.setItem("privexbot_current_org_id", orgId);
  localStorage.setItem("privexbot_current_workspace_id", targetWorkspace.id);

  // Step 5: Calculate new permissions
  const permissions = calculatePermissions(org, targetWorkspace);
  setPermissions(permissions);

  // Step 6: Update backend context and get new JWT
  const response = await contextApi.switchOrganization({
    organization_id: orgId,
    workspace_id: targetWorkspace.id,
  });
  // POST /api/v1/switch/organization
  // Body: { "organization_id": "org_xyz", "workspace_id": "ws_abc" }
  // Returns: {
  //   "access_token": "new_jwt_token_with_updated_context",
  //   "organization_id": "org_xyz",
  //   "workspace_id": "ws_abc"
  // }

  // Step 7: Update JWT token in client
  if (response.access_token) {
    apiClient.setAuthToken(response.access_token);
  }

  setIsLoading(false);
};
```

**UI Effects:**

1. Organization dropdown closes
2. Sidebar left column updates with the organization's workspaces
3. Main content reloads with new context (dashboard stats, chatbots, etc.)
4. User avatar still shows at bottom (user doesn't change, context does)

### Workspace Switching Flow

When user clicks workspace avatar in left sidebar column:

```typescript
const switchWorkspace = async (workspaceId: string) => {
  // Step 1: Find workspace in state
  const workspace = workspaces.find((w) => w.id === workspaceId);
  if (!workspace) throw new Error("Workspace not found");

  setCurrentWorkspace(workspace);

  // Step 2: Persist to localStorage
  localStorage.setItem("privexbot_current_workspace_id", workspaceId);

  // Step 3: Calculate new permissions
  const permissions = calculatePermissions(currentOrganization, workspace);
  setPermissions(permissions);

  // Step 4: Update backend context and get new JWT
  const response = await contextApi.switchWorkspace(workspaceId);
  // POST /api/v1/switch/workspace
  // Body: { "workspace_id": "ws_abc" }
  // Returns: {
  //   "access_token": "new_jwt_token_with_updated_context",
  //   "organization_id": "org_xyz",  // Same org
  //   "workspace_id": "ws_abc"       // New workspace
  // }

  // Step 5: Update JWT token in client
  if (response.access_token) {
    apiClient.setAuthToken(response.access_token);
  }
};
```

**UI Effects:**

1. Avatar in sidebar changes from circle to rounded square
2. White border appears on active workspace
3. Blue vertical bar appears on right edge of active workspace
4. Workspace name text becomes white (was gray)
5. Main content reloads with new workspace context
6. Organization stays the same (only workspace changed)

### Creating New Workspace

When user clicks the "+" (Add) button in sidebar:

```typescript
const createWorkspace = async (name: string, description?: string) => {
  if (!currentOrganization) return;

  // Check permission
  if (!hasPermission("workspace:create")) {
    throw new Error("You do not have permission to create workspaces");
  }

  // Call API
  const newWorkspace = await workspacesApi.create(currentOrganization.id, {
    name,
    description,
  });
  // POST /api/v1/orgs/{org_id}/workspaces
  // Body: { "name": "New Workspace", "description": "Optional description" }
  // Returns: {
  //   "id": "ws_new123",
  //   "name": "New Workspace",
  //   "organization_id": "org_xyz",
  //   "user_role": "admin",  // Creator becomes admin
  //   "is_default": false,
  //   "created_at": "2025-10-28T10:30:00Z"
  // }

  // Add to workspaces list
  setWorkspaces([...workspaces, newWorkspace]);

  // Optionally switch to new workspace
  await switchWorkspace(newWorkspace.id);
};
```

**UI Flow:**

1. User clicks "+" button (dashed circle with green hover)
2. Modal/dialog appears with form:
   - Workspace name (required)
   - Description (optional)
3. User submits form
4. New workspace appears in sidebar
5. Automatically switches to new workspace
6. User can now create chatbots, knowledge bases, etc. in this workspace from the main menu section (right column)

### Creating New Organization

When user clicks "Create Organization" in Organizations page:

```typescript
const createOrganization = async (name: string, billingEmail: string) => {
  // Call API
  const newOrg = await organizationsApi.create({
    name,
    billing_email: billingEmail,
  });
  // POST /api/v1/orgs/
  // Body: { "name": "New Company", "billing_email": "billing@company.com" }
  // Returns: {
  //   "id": "org_new789",
  //   "name": "New Company",
  //   "user_role": "owner",  // Creator becomes owner
  //   "subscription_tier": "free",
  //   "member_count": 1,
  //   "billing_email": "billing@company.com",
  //   "default_workspace": {
  //     "id": "ws_default123",
  //     "name": "New Company",  // Default workspace with same name
  //     "is_default": true
  //   }
  // }

  // Add to organizations list
  setOrganizations([...organizations, newOrg]);

  // Switch to new organization (with its default workspace)
  await switchOrganization(newOrg.id, newOrg.default_workspace.id);
};
```

**Backend automatically creates:**

1. New organization with user as owner
2. Default workspace within that organization
3. User gets full permissions (owner role)

### Organizations Page Flow

The `/organizations` page shows:

```typescript
// GET /api/v1/orgs/
// Returns all organizations user belongs to

// For each organization:
{
  "id": "org_xyz",
  "name": "Company Name",
  "user_role": "owner" | "admin" | "member",
  "subscription_tier": "free" | "pro" | "enterprise",
  "member_count": 5,
  "billing_email": "billing@company.com",
  "created_at": "2025-01-15T10:00:00Z"
}
```

**Page Sections:**

1. **Current Organization Card** (highlighted with blue border)

   - Shows avatar with initials
   - Role badge (Owner/Admin/Member with icon)
   - Subscription tier
   - Member count
   - "Manage" button

2. **Workspaces in Current Organization**

   - Grid of workspace cards
   - Each shows:
     - Workspace name
     - Member count
     - User's role in that workspace
     - "Active" badge if it's current workspace
     - "Switch" button
   - "Create Workspace" button (if has permission)

3. **All Other Organizations**
   - List of other orgs user belongs to
   - Each shows same info as current org
   - "Switch" button to change organization
   - Clicking switch:
     - Calls `switchOrganization(orgId)`
     - Updates sidebar
     - Reloads page content

### Permission System

Permissions are calculated based on roles:

```typescript
interface PermissionMap {
  // Organization-level
  "org:read": boolean; // Can view org details
  "org:write": boolean; // Can update org settings (admin+)
  "org:billing": boolean; // Can manage billing (owner only)
  "org:members": boolean; // Can manage members (admin+)

  // Workspace-level
  "workspace:read": boolean; // Can view workspaces
  "workspace:write": boolean; // Can update workspace settings (admin+)
  "workspace:create": boolean; // Can create workspaces (admin+)
  "workspace:delete": boolean; // Can delete workspaces (admin+)
  "workspace:members": boolean; // Can manage workspace members

  // Chatbot permissions
  "chatbot:view": boolean; // Can view chatbots (viewer+)
  "chatbot:create": boolean; // Can create chatbots (viewer+)
  "chatbot:edit": boolean; // Can edit chatbots (editor+)
  "chatbot:delete": boolean; // Can delete chatbots (admin+)

  // Chatflow permissions (Advanced Studio)
  "chatflow:view": boolean; // Can view chatflows (viewer+)
  "chatflow:create": boolean; // Can create chatflows (editor+)
  "chatflow:edit": boolean; // Can edit chatflows (editor+)
  "chatflow:delete": boolean; // Can delete chatflows (admin+)

  // Knowledge Base permissions
  "kb:view": boolean; // Can view KB (viewer+)
  "kb:create": boolean; // Can create KB entries (editor+)
  "kb:edit": boolean; // Can edit KB (editor+)
  "kb:delete": boolean; // Can delete KB (admin+)

  // Lead permissions
  "lead:view": boolean; // Can view leads (viewer+)
  "lead:export": boolean; // Can export leads (editor+)
  "lead:edit": boolean; // Can edit leads (editor+)
  "lead:delete": boolean; // Can delete leads (admin+)
}

// Permission calculation
const calculatePermissions = (
  org: Organization | null,
  workspace: Workspace | null
): PermissionMap => {
  if (!org) return {} as PermissionMap;

  const orgRole = org.user_role;
  const workspaceRole = workspace?.user_role;

  // Org roles: 'owner' > 'admin' > 'member'
  const isOrgOwner = orgRole === "owner";
  const isOrgAdmin = orgRole === "admin" || isOrgOwner;
  const isOrgMember = orgRole === "member" || isOrgAdmin;

  // Workspace roles: 'admin' > 'editor' > 'viewer'
  const isWorkspaceAdmin = workspaceRole === "admin";
  const isWorkspaceEditor = workspaceRole === "editor" || isWorkspaceAdmin;
  const isWorkspaceViewer = workspaceRole === "viewer" || isWorkspaceEditor;

  return {
    "org:read": isOrgMember,
    "org:write": isOrgAdmin,
    "org:billing": isOrgOwner,
    "org:members": isOrgAdmin,

    "workspace:read": isOrgMember,
    "workspace:write": isOrgAdmin,
    "workspace:create": isOrgAdmin,
    "workspace:delete": isOrgAdmin,
    "workspace:members": isWorkspaceAdmin || isOrgAdmin,

    "chatbot:view": isWorkspaceViewer,
    "chatbot:create": isWorkspaceViewer, // Even viewers can create
    "chatbot:edit": isWorkspaceEditor,
    "chatbot:delete": isWorkspaceAdmin || isOrgAdmin,

    "chatflow:view": isWorkspaceViewer,
    "chatflow:create": isWorkspaceEditor, // Only editor+ for advanced
    "chatflow:edit": isWorkspaceEditor,
    "chatflow:delete": isWorkspaceAdmin || isOrgAdmin,

    "kb:view": isWorkspaceViewer,
    "kb:create": isWorkspaceEditor,
    "kb:edit": isWorkspaceEditor,
    "kb:delete": isWorkspaceAdmin || isOrgAdmin,

    "lead:view": isWorkspaceViewer,
    "lead:export": isWorkspaceEditor,
    "lead:edit": isWorkspaceEditor,
    "lead:delete": isWorkspaceAdmin || isOrgAdmin,
  };
};
```

**Using Permissions in Components:**

```typescript
const { hasPermission } = useApp();

// Conditionally show UI elements
{
  hasPermission("workspace:create") && (
    <Button onClick={openCreateWorkspaceModal}>
      <Plus className="h-4 w-4 mr-2" />
      Create Workspace
    </Button>
  );
}

// Prevent actions
const handleDelete = () => {
  if (!hasPermission("chatbot:delete")) {
    toast.error("You do not have permission to delete chatbots");
    return;
  }
  // Proceed with delete
};
```

### API Endpoints Reference (OpenAPI)

All endpoints referenced in the organization/workspace system:

#### Authentication Endpoints

```yaml
POST /api/v1/auth/signup
  Body:
    - email: string (required)
    - password: string (required)
    - username: string (required)
  Response: 200 OK
    - access_token: string
    - user: User object
    - default_organization: Organization object
    - default_workspace: Workspace object

POST /api/v1/auth/login
  Body:
    - email: string (required)
    - password: string (required)
  Response: 200 OK
    - access_token: string
    - user: User object
    - last_context: { organization_id, workspace_id }

GET /api/v1/auth/me
  Headers:
    - Authorization: Bearer {token}
  Response: 200 OK
    - User object with current context
```

#### Organization Endpoints

```yaml
GET /api/v1/orgs/
  Headers:
    - Authorization: Bearer {token}
  Query Parameters:
    - page: integer (default: 1)
    - page_size: integer (default: 20)
  Response: 200 OK
    - organizations: Organization[]
    - total: integer
    - page: integer
    - page_size: integer

POST /api/v1/orgs/
  Headers:
    - Authorization: Bearer {token}
  Body:
    - name: string (required)
    - billing_email: string (required)
  Response: 201 Created
    - Organization object with default_workspace

GET /api/v1/orgs/{org_id}
  Headers:
    - Authorization: Bearer {token}
  Response: 200 OK
    - Organization object with details

PUT /api/v1/orgs/{org_id}
  Headers:
    - Authorization: Bearer {token}
  Body:
    - name: string (optional)
    - billing_email: string (optional)
  Response: 200 OK
    - Updated Organization object

DELETE /api/v1/orgs/{org_id}
  Headers:
    - Authorization: Bearer {token}
  Response: 204 No Content
```

#### Workspace Endpoints

```yaml
GET /api/v1/orgs/{org_id}/workspaces
  Headers:
    - Authorization: Bearer {token}
  Response: 200 OK
    - Workspace[] (all workspaces in organization)

POST /api/v1/orgs/{org_id}/workspaces
  Headers:
    - Authorization: Bearer {token}
  Body:
    - name: string (required)
    - description: string (optional)
  Response: 201 Created
    - Workspace object (creator becomes admin)

GET /api/v1/workspaces/{workspace_id}
  Headers:
    - Authorization: Bearer {token}
  Response: 200 OK
    - Workspace object with details

PUT /api/v1/workspaces/{workspace_id}
  Headers:
    - Authorization: Bearer {token}
  Body:
    - name: string (optional)
    - description: string (optional)
  Response: 200 OK
    - Updated Workspace object

DELETE /api/v1/workspaces/{workspace_id}
  Headers:
    - Authorization: Bearer {token}
  Response: 204 No Content
```

#### Context Switching Endpoints

```yaml
POST /api/v1/switch/organization
  Headers:
    - Authorization: Bearer {token}
  Body:
    - organization_id: string (required)
    - workspace_id: string (optional, uses default if not provided)
  Response: 200 OK
    - access_token: string (new JWT with updated context)
    - organization_id: string
    - workspace_id: string

POST /api/v1/switch/workspace
  Headers:
    - Authorization: Bearer {token}
  Body:
    - workspace_id: string (required)
  Response: 200 OK
    - access_token: string (new JWT with updated context)
    - organization_id: string (same as before)
    - workspace_id: string (new workspace)

GET /api/v1/switch/current
  Headers:
    - Authorization: Bearer {token}
  Response: 200 OK
    - organization_id: string (from JWT)
    - workspace_id: string (from JWT)
    - user_id: string
```

### Complete User Experience Flow

#### Scenario 1: Brand New User

1. **Sign Up** → Backend creates Personal org + workspace → User lands on Dashboard
2. **Dashboard loads** → Shows stats for Personal workspace (empty state)
3. **Sidebar shows** → Profile, Chatbots, Studio, KB, Leads, Analytics (all visible in default workspace)
4. **User creates first chatbot** → Stays in Personal workspace
5. **User wants to separate work** → Creates new workspace "Production"
6. **Clicks "+" in sidebar** → Modal appears → Creates "Production" workspace
7. **Sidebar updates** → Shows both "Personal" and "Production" workspaces
8. **Clicks "Production" avatar** → Workspace switches → Dashboard reloads with Production data
9. **Profile page disappears** → Only visible in default Personal workspace
10. **User invites team** → Goes to Organizations page → Creates "Company" organization
11. **Organization switcher** → Now shows "Personal" and "Company" at bottom
12. **Switches to Company** → Sidebar shows Company's workspaces → Can create more workspaces
13. **Menu changes** → Shows only pages user has permission for in Company org

#### Scenario 2: Returning User

1. **Logs in** → Backend returns last active context
2. **AppContext loads** → Restores last org + workspace from localStorage
3. **Dashboard appears** → Immediately shows correct context (no flash)
4. **Menu adapts** → Shows only pages based on current workspace permissions
5. **If localStorage cleared** → Falls back to default/first org → First/default workspace
6. **User can switch** → Using sidebar (workspaces) or bottom dropdown (organizations)

#### Scenario 3: Team Member (Limited Permissions)

1. **Receives invitation** → Email with signup link
2. **Signs up** → Personal org created automatically
3. **In Personal workspace** → Sees all menu items including Profile
4. **Accepts invitation** → Added to company org with "member" role (viewer in workspace)
5. **Organization switcher** → Shows both Personal and Company orgs
6. **Switches to Company** → Sees workspaces based on permissions
7. **Menu updates dynamically:**
   - ❌ Profile page hidden (not in default workspace)
   - ✅ Dashboard visible (always visible)
   - ✅ Chatbots visible (has chatbot:view permission)
   - ✅ Studio visible (has chatflow:view permission)
   - ✅ Knowledge Base visible (has kb:view permission)
   - ✅ Leads visible (has lead:view permission)
   - ✅ Analytics visible (always visible)
   - ✅ Organizations, Marketplace, Referrals visible (always visible)
   - ✅ Documentation, Team, Billing, Settings visible (always visible)
8. **Cannot create workspace** → If role is "member" (no workspace:create permission)
9. **Can create chatbots** → Even with viewer role in workspace (chatbot:create allowed)
10. **Cannot delete chatbots** → If role is viewer/editor (need admin for chatbot:delete)
11. **Switches back to Personal org** → Profile page reappears in menu

#### Scenario 4: Workspace Switching & Menu Changes

1. **User in Personal org → Default workspace**
   - Menu shows: Dashboard, Chatbots, Studio, KB, Leads, Analytics, **Profile**, Organizations, Marketplace, Referrals
2. **User creates "Development" workspace in Personal org**
   - Sidebar adds "Development" workspace avatar
3. **User switches to "Development" workspace**
   - Menu shows: Dashboard, Chatbots, Studio, KB, Leads, Analytics, ~~Profile~~, Organizations, Marketplace, Referrals
   - Profile page **hidden** (not in default workspace anymore)
4. **User switches back to "Personal" default workspace**
   - Menu shows: Dashboard, Chatbots, Studio, KB, Leads, Analytics, **Profile**, Organizations, Marketplace, Referrals
   - Profile page **visible again** (back in default workspace)

### Data Scoping

All API requests automatically scope data based on JWT context:

```typescript
// JWT token contains:
{
  "user_id": "usr_abc",
  "organization_id": "org_xyz",
  "workspace_id": "ws_def",
  "exp": 1730102400
}

// When you call:
GET /api/v1/chatbots

// Backend automatically filters:
SELECT * FROM chatbots
WHERE organization_id = 'org_xyz'
  AND workspace_id = 'ws_def'
  AND user_has_access(user_id, workspace_id)

// No need to pass org_id/workspace_id in query params!
// Context comes from JWT
```

### LocalStorage Keys

```typescript
const STORAGE_KEYS = {
  ORG_ID: "privexbot_current_org_id", // Current organization ID
  WORKSPACE_ID: "privexbot_current_workspace_id", // Current workspace ID
  AUTH_TOKEN: "privexbot_auth_token", // JWT token (optional, can use memory)
  THEME: "privexbot_theme", // User theme preference
};
```

### Error Handling

```typescript
// If organization not found
if (!organizations.find((o) => o.id === savedOrgId)) {
  // Clear invalid ID and use first org
  localStorage.removeItem(STORAGE_KEYS.ORG_ID);
  targetOrg = organizations[0];
}

// If workspace not found in organization
if (!workspaces.find((w) => w.id === savedWorkspaceId)) {
  // Clear invalid ID and use first/default workspace
  localStorage.removeItem(STORAGE_KEYS.WORKSPACE_ID);
  targetWorkspace = workspaces.find((w) => w.is_default) || workspaces[0];
}

// If user deleted from organization
// Backend returns 403 Forbidden on API calls
// Frontend detects and removes org from list
// Switches to another org or Personal org
```

### Replication Checklist for Org/Workspace System

To replicate this exact user experience:

- [ ] **Authentication System**

  - [ ] POST /api/v1/auth/signup (creates user + default org + workspace)
  - [ ] POST /api/v1/auth/login (returns last context)
  - [ ] GET /api/v1/auth/me (returns user with context)
  - [ ] JWT tokens with embedded org_id + workspace_id

- [ ] **Organization System**

  - [ ] GET /api/v1/orgs/ (list all user's organizations)
  - [ ] POST /api/v1/orgs/ (create org with default workspace)
  - [ ] Organization roles: owner, admin, member
  - [ ] Personal org created automatically on signup

- [ ] **Workspace System**

  - [ ] GET /api/v1/orgs/{org_id}/workspaces (list workspaces)
  - [ ] POST /api/v1/orgs/{org_id}/workspaces (create workspace)
  - [ ] Workspace roles: admin, editor, viewer
  - [ ] Default workspace per organization
  - [ ] is_default flag on workspaces

- [ ] **Context Switching**

  - [ ] POST /api/v1/switch/organization (returns new JWT)
  - [ ] POST /api/v1/switch/workspace (returns new JWT)
  - [ ] GET /api/v1/switch/current (get current context)
  - [ ] LocalStorage persistence (org_id, workspace_id)
  - [ ] JWT refresh on context change

- [ ] **Permissions System**

  - [ ] Role-based permissions (org-level + workspace-level)
  - [ ] Permission calculation function
  - [ ] hasPermission() hook in components
  - [ ] UI elements gated by permissions
  - [ ] API endpoints validate permissions

- [ ] **AppContext Provider**

  - [ ] Global state: user, organizations, workspaces, currentOrg, currentWorkspace
  - [ ] refreshData() - load all data on mount
  - [ ] switchOrganization() - change org + workspace
  - [ ] switchWorkspace() - change workspace only
  - [ ] Restore from localStorage on load
  - [ ] Calculate permissions on context change

- [ ] **Sidebar Components**

  - [ ] Left column: workspace avatars (60-72px)
  - [ ] Active workspace: rounded square, white border, blue bar
  - [ ] Inactive workspaces: circle, hover to rounded square
  - [ ] Add workspace button (+ icon, dashed border, green hover)
  - [ ] Organization switcher at bottom (dropup)
  - [ ] User avatar with gradient (blue→purple)
  - [ ] Switch organization triggers workspace reload

- [ ] **Organizations Page**

  - [ ] Current org card (highlighted)
  - [ ] Workspaces grid for current org
  - [ ] Other organizations list
  - [ ] Create organization button
  - [ ] Create workspace button (if has permission)
  - [ ] Switch buttons for orgs and workspaces
  - [ ] Role badges with icons

- [ ] **Data Scoping**
  - [ ] All API calls scoped by JWT context
  - [ ] No manual org_id/workspace_id in query params
  - [ ] Backend filters data by context automatically
  - [ ] Frontend shows only relevant data

**Result:** Users can seamlessly switch between organizations and workspaces, with all data, permissions, and UI elements updating automatically. The Discord-like interface makes workspace switching intuitive and fast. 🎯
