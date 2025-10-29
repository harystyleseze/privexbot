# Design System Consistency - Quick Reference Guide

## TL;DR - Critical Issues

### ❌ **What's Wrong**
1. **Colors don't match** - Using #4361EE instead of #3b82f6 for primary
2. **No color scales** - Can't use `bg-primary-100` or `text-error-500`
3. **No sidebar layout** - Missing Discord-style three-column design
4. **Wrong secondary color** - Using cyan instead of purple
5. **Missing semantic colors** - No success/error/warning/info with full scales
6. **Inconsistent typography** - Not following documented scale

### ✅ **What to Do**
1. **Replace `tailwind.config.js`** with full color definitions
2. **Create layout components** (WorkspaceSwitcher, Sidebar, Layouts)
3. **Use typography components** instead of arbitrary classes
4. **Follow design tokens** for all colors and spacing

---

## Copy-Paste Solutions

### 1. Fix Colors Immediately

**Replace entire `tailwind.config.js` with this:**

<details>
<summary>Click to expand tailwind.config.js</summary>

\`\`\`javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        // Design Guide: Brand Colors
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
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
          950: "#2e1065",
        },
        accent: {
          DEFAULT: "#06b6d4",
          foreground: "#ffffff",
          50: "#ecfeff",
          100: "#cffafe",
          200: "#a5f3fc",
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
          700: "#0e7490",
          800: "#155e75",
          900: "#164e63",
          950: "#083344",
        },
        success: {
          DEFAULT: "#22c55e",
          foreground: "#ffffff",
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
          950: "#052e16",
        },
        error: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
          950: "#450a0a",
        },
        warning: {
          DEFAULT: "#f59e0b",
          foreground: "#ffffff",
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
          950: "#451a03",
        },
        info: {
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

        // Keep shadcn compatibility
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["Fira Code", "ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
\`\`\`

</details>

### 2. Typography Cheat Sheet

**Don't do this:**
```tsx
❌ <h1 className="text-3xl font-bold mb-2">Title</h1>
❌ <p className="text-muted-foreground">Body text</p>
```

**Do this instead:**
```tsx
✅ <h1 className="text-5xl font-semibold tracking-tight text-gray-900 dark:text-white">Title</h1>
✅ <p className="text-base leading-normal text-gray-600 dark:text-gray-400">Body text</p>
```

**Or better, use semantic components:**
```tsx
import { H1, H2, H3, Body } from "@/components/ui/typography";

<H1>Main Page Title</H1>
<H2>Section Heading</H2>
<Body>Body text content</Body>
```

### 3. Color Usage Patterns

**Buttons:**
```tsx
// Primary action
<Button className="bg-primary-600 hover:bg-primary-700 text-white">
  Create
</Button>

// Secondary action
<Button className="bg-secondary-600 hover:bg-secondary-700 text-white">
  Advanced
</Button>

// Destructive action
<Button className="bg-error-600 hover:bg-error-700 text-white">
  Delete
</Button>
```

**Status States:**
```tsx
// Success message
<div className="bg-success-50 dark:bg-success-500/10 text-success-800 dark:text-success-300 border border-success-200 dark:border-success-500/20 rounded-lg p-4">
  ✓ Success!
</div>

// Error message
<div className="bg-error-50 dark:bg-error-500/10 text-error-800 dark:text-error-300 border border-error-200 dark:border-error-500/20 rounded-lg p-4">
  ✗ Error!
</div>

// Warning message
<div className="bg-warning-50 dark:bg-warning-500/10 text-warning-800 dark:text-warning-300 border border-warning-200 dark:border-warning-500/20 rounded-lg p-4">
  ⚠ Warning!
</div>
```

### 4. Spacing Patterns

**Use these standard spacings:**
```tsx
✅ <div className="space-y-2">   // Tight: 8px (related items)
✅ <div className="space-y-4">   // Default: 16px (content)
✅ <div className="space-y-6">   // Section: 24px (sections)
✅ <div className="space-y-8">   // Major: 32px (major sections)

✅ <Card className="p-6">        // Default card padding: 24px
✅ <Card className="p-8">        // Spacious card: 32px

✅ <Button className="px-4 py-2">  // Default button: 16px × 8px
✅ <Button className="px-6 py-3">  // Large button: 24px × 12px
```

---

## Component Creation Checklist

When creating any new component, ensure:

- [ ] **Colors**: Use `primary-{50-950}`, `success-{50-950}`, etc.
- [ ] **Typography**: Use `text-{size}` with proper font weights
- [ ] **Dark Mode**: Include `dark:` variants for all colors
- [ ] **Spacing**: Use semantic spacing (space-y-4, p-6, gap-6)
- [ ] **Contrast**: Ensure WCAG AA compliance for text colors
- [ ] **Icons**: Use lucide-react icons at `h-4 w-4` or `h-5 w-5`

---

## Page Creation Template

Use this template for all new dashboard pages:

```tsx
/**
 * [Page Name]
 *
 * WHY: [Purpose of this page]
 * HOW: [High-level implementation approach]
 */

import { H1, H2, Body } from "@/components/ui/typography";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function PageName() {
  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <H1>Page Title</H1>
        <Body className="text-gray-600 dark:text-gray-400">
          Page description goes here
        </Body>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-primary-100 dark:bg-primary-500/10 rounded-lg">
                {/* Icon */}
              </div>
              <CardTitle>Card Title</CardTitle>
            </div>
            <CardDescription>Card description</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              Action Button
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

---

## Common Mistakes & Fixes

### Mistake 1: Arbitrary Text Colors
```tsx
❌ <p className="text-muted-foreground">
✅ <p className="text-gray-600 dark:text-gray-400">
```

### Mistake 2: Inconsistent Headings
```tsx
❌ <h1 className="text-3xl font-bold">
✅ <h1 className="text-5xl font-semibold tracking-tight text-gray-900 dark:text-white">

❌ <h2 className="text-2xl font-bold">
✅ <h2 className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">
```

### Mistake 3: Missing Dark Mode
```tsx
❌ <div className="bg-white text-gray-900">
✅ <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
```

### Mistake 4: Arbitrary Spacing
```tsx
❌ <div className="mb-5">
✅ <div className="mb-6">  // Use standard 24px

❌ <div className="space-y-3">
✅ <div className="space-y-4">  // Use standard 16px
```

### Mistake 5: Wrong Button Colors
```tsx
❌ <Button className="bg-blue-500">
✅ <Button className="bg-primary-600 hover:bg-primary-700 text-white">
```

---

## Testing Your Components

### Visual Testing Checklist

1. **Light Mode**
   - [ ] Colors match design guide
   - [ ] Text is readable (good contrast)
   - [ ] Hover states work
   - [ ] Focus states visible

2. **Dark Mode**
   - [ ] Dark mode colors applied
   - [ ] Text readable on dark background
   - [ ] Hover states work in dark mode
   - [ ] No white flashes

3. **Responsive**
   - [ ] Mobile (< 640px)
   - [ ] Tablet (640px - 1024px)
   - [ ] Desktop (> 1024px)

4. **Accessibility**
   - [ ] Keyboard navigation works
   - [ ] Focus indicators visible
   - [ ] Color contrast meets WCAG AA
   - [ ] Screen reader friendly

---

## VS Code Snippets (Optional)

Add these to `.vscode/privexbot.code-snippets`:

```json
{
  "Design System Card": {
    "prefix": "pbcard",
    "body": [
      "<Card className=\"p-6\">",
      "  <CardHeader>",
      "    <div className=\"flex items-center gap-2 mb-2\">",
      "      <div className=\"p-2 bg-primary-100 dark:bg-primary-500/10 rounded-lg\">",
      "        {/* Icon */}",
      "      </div>",
      "      <CardTitle>${1:Title}</CardTitle>",
      "    </div>",
      "    <CardDescription>${2:Description}</CardDescription>",
      "  </CardHeader>",
      "  <CardContent>",
      "    ${3:Content}",
      "  </CardContent>",
      "</Card>"
    ]
  },
  "Success Alert": {
    "prefix": "pbsuccess",
    "body": [
      "<div className=\"bg-success-50 dark:bg-success-500/10 text-success-800 dark:text-success-300 border border-success-200 dark:border-success-500/20 rounded-lg p-4\">",
      "  ${1:Success message}",
      "</div>"
    ]
  },
  "Error Alert": {
    "prefix": "pberror",
    "body": [
      "<div className=\"bg-error-50 dark:bg-error-500/10 text-error-800 dark:text-error-300 border border-error-200 dark:border-error-500/20 rounded-lg p-4\">",
      "  ${1:Error message}",
      "</div>"
    ]
  }
}
```

---

## References

- **Full Audit**: See `DESIGN_SYSTEM_CONSISTENCY_AUDIT.md`
- **Design Guide**: See `design-guide.md`
- **Tailwind Docs**: https://tailwindcss.com/docs
- **shadcn/ui**: https://ui.shadcn.com

---

## Need Help?

**Quick checks:**
1. Does the component use design tokens? ✅
2. Is dark mode implemented? ✅
3. Does typography follow the scale? ✅
4. Are semantic colors used correctly? ✅

**If any answer is ❌, refer to this guide or the full audit document.**