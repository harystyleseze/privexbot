Define the structure, layout zones, interaction logic, and visual hierarchy:

- Sidebar (split into **workspace**, **main menu**, **others**, and **profile**)
- Top navigation (positioned only above the main content, **not the sidebar**)
- Dashboard main content structure (KPI, activities, bots, quick actions)
- Layout logic tied to multi-tenancy context: organization and workspace

---

# 📊 **Dashboard Page Specification (Production-Ready)**

**Page**: Dashboard
**Route**: `/dashboard`
**Context**: Scoped to the currently selected `organization_id` and `workspace_id`
**Access**: All roles (Viewer, Editor, Admin)

---

## 🧱 1. Page-Level Layout Overview

This layout reflects the **precise screen structure** seen in your design.

```plaintext
┌──────────────────────────────────────────────────────────────┐
│                        Top Navigation Bar                    │ ◄── Applies to main content ONLY
├───────────────────┬──────────────────────────────────────────┤
│    Sidebar         │     Main Dashboard Content              │
│ ┌───────────────┐ │                                          │
│ │ Workspace Area │ │  - KPI Cards                            │
│ └───────────────┘ │  - Recent Activities                     │
│ ┌───────────────┐ │  - Recent Chatbots                       │
│ │ Main Menu     │ │  - Quick Actions                         │
│ └───────────────┘ │                                          │
│ ┌───────────────┐ │                                          │
│ │ Others        │ │                                          │
│ └───────────────┘ │                                          │
│ ┌───────────────┐ │                                          │
│ │ Profile Area  │ │                                          │
│ └───────────────┘ │                                          │
└───────────────────┴──────────────────────────────────────────┘
```

---

## 🔷 2. Sidebar (Persistent Vertical Navigation)

The sidebar is vertically fixed and divided into **4 clearly separated sections**:

---

### **2.1 Workspace Area (Top of Sidebar)**

**Purpose**: Allow switching and creating workspaces within the current organization

| Element                           | Description                                              |
| --------------------------------- | -------------------------------------------------------- |
| 🏢 **Current Organization Label** | Shows current org name (e.g., "Privexbot") — clickable   |
| 🔻 **Click to Open Org Switcher** | Dropdown/modal shows list of orgs, current highlighted   |
| 🧩 **Workspace Icons List**       | Vertically stacked; initials or logo shown per workspace |
| ➕ **“+” Add Workspace**          | Opens modal to create a new workspace inside current org |
| 🟦 **Active Workspace Highlight** | Blue background, white text, bold icon — matches brand   |

✅ **Slack-style UX**
✅ Immediate context switch
✅ Tooltip on hover: full workspace name
✅ Clicking a workspace: reloads content with new `workspace_id` context

---

### **2.2 Main Menu Area**

Main navigation section for all **workspace-scoped pages**.

| Menu Item          | Route            | Description                                           |
| ------------------ | ---------------- | ----------------------------------------------------- |
| Dashboard          | `/dashboard`     | Overview page (this spec)                             |
| Chatbots           | `/chatbots`      | Bot management                                        |
| Studio / Chatflows | `/chatflows`     | Visual builder for advanced flows                     |
| Analytics          | `/analytics`     | Metrics and insights                                  |
| Marketplace        | `/marketplace`   | Templates & integrations                              |
| Referrals          | `/referrals`     | Rewards and sharing                                   |
| Organizations      | `/organizations` | Org settings, members, roles _(only if Admin/Member)_ |
| Billing            | `/billing`       | Subscription, quotas _(only if Admin)_                |

> 🔐 Role-aware rendering — only show pages user can access based on role and workspace/org

---

### **2.3 Others Area (Below Main Menu)**

| Menu Item     | Function                                                    |
| ------------- | ----------------------------------------------------------- |
| Documentation | Links to help/docs portal                                   |
| Settings      | Global or advanced settings (account-level or app-specific) |

This section is separated visually by a divider or spacing.

---

### **2.4 Profile Area (Bottom of Sidebar)**

| Element              | Description                                   |
| -------------------- | --------------------------------------------- |
| 👤 Avatar            | Shows user's profile picture or initials      |
| ⚙️ Dropdown on Click | - My Profile<br>- Change Password<br>- Logout |

Persistent at the bottom of sidebar.

---

## 🧭 3. Top Navigation Bar (Above Main Content Only)

> 📌 This top navbar **does not span the full width** — it sits **only above the main content**, NOT over the sidebar.

| Element           | Description                                         |
| ----------------- | --------------------------------------------------- |
| 👋 Greeting       | “Hey [Dennis], Welcome Back!”                       |
| 🔍 Search Icon    | Opens global search for bots, flows, leads          |
| 📅 Date Filter    | Defaults to “Last 24 Hours”, can open full calendar |
| 🗓️ Current Date   | Displays selected range (e.g. Jul 14, 2025)         |
| ➕ Create New Bot | Blue CTA button to launch new bot creation          |

### Layout:

- **Left-aligned**: Greeting
- **Right-aligned**: Search, Date Filter, Create Button

✅ **Sticky behavior** (remains visible while scrolling dashboard content)

---

## 📦 4. Main Dashboard Content

All dashboard content is scoped to the **selected workspace**. Switching workspace dynamically reloads these sections.

---

### **4.1 KPI Summary Cards (Top Section)**

| Card            | Description                      | Example  |
| --------------- | -------------------------------- | -------- |
| Total Chatbots  | Number of bots in this workspace | `3`      |
| Conversations   | User messages handled            | `1,247`  |
| Active Users    | Unique users reached             | `89`     |
| Monthly Revenue | Revenue from bots                | `$2,840` |

- 🔼 Trend indicators (e.g. +15%) based on previous period
- 🟢 Green for increase, 🔴 red for decrease
- Each card uses an icon and color-coded badge

✅ Clickable → leads to relevant detail page (e.g., `/chatbots`, `/analytics`)

---

### **4.2 Recent Activities (Left Column)**

| Element            | Description                                                     |
| ------------------ | --------------------------------------------------------------- |
| Live activity feed | Shows latest events (e.g., "Bot deployed", "User started chat") |
| Timestamp          | “2 minutes ago”, “Yesterday”, etc.                              |
| Grouped by time    | Optional grouping by Today, Yesterday, Last Week                |
| “View All” Link    | Opens full audit or activity log                                |

✅ Filtered by `workspace_id`

---

### **4.3 Recent bots (Right Column)**

| Field         | Description                            |
| ------------- | -------------------------------------- |
| Name          | Chatbot title                          |
| Type          | Chatbots or Chatflows                  |
| Status Badge  | Active, Draft (color coded)            |
| Conversations | Count shown (e.g. "450 conversations") |
| Last Updated  | Human-readable timestamp               |
| Actions       | `⋮` menu (Edit, Duplicate, Delete)     |
| “View All”    | Button or link to `/chatbots` page     |

✅ Sorted by last updated
✅ Visually distinct cards or list items

---

### **4.4 Quick Actions (Bottom Section)**

Three large CTA panels:

| Action              | Description                | CTA Button              |
| ------------------- | -------------------------- | ----------------------- |
| Create New Bot      | Create chatbot or chatflow | `Chatbot` or `Chatflow` |
| View Analytics      | Go to analytics dashboard  | `View Report`           |
| View Knowledge base | Browse pre-made bots       | `Browse Templates`      |

- Icon, short description, large button
- Can use illustrations or branding colors

---

## 🔐 5. Role-Based Access

| Role   | Access on Dashboard                                |
| ------ | -------------------------------------------------- |
| Viewer | Read-only metrics and bots                         |
| Editor | Full dashboard, can create/edit bots               |
| Admin  | Full dashboard + access to org management, billing |

---

## 🧠 6. Context Switching Logic

| Action               | Result                                                      |
| -------------------- | ----------------------------------------------------------- |
| Click Workspace Icon | `workspace_id` updated → content reloads                    |
| Click Org Name       | Org switcher modal → selecting another org resets workspace |
| Click “+”            | Opens Create Workspace modal under current org              |
| Switch Org           | Loads first available workspace or prompts selection        |

### JWT / Context Payload:

```json
{
  "user_id": "user_123",
  "organization_id": "org_abc",
  "workspace_id": "ws_xyz",
  "role": "admin"
}
```

---

## 🧪 7. Interaction Examples

### 🔁 Switching Workspace:

1. Click on workspace icon in sidebar
2. Highlight changes to blue
3. Dashboard reloads with new stats

### 🏢 Switching Organization:

1. Click on current org name
2. Modal opens: lists orgs, “Create New Organization”
3. Select another → updates org/workspace context

---

## 🧩 8. Visual Notes & Best Practices

| Element          | Visual Treatment                         |
| ---------------- | ---------------------------------------- |
| Sidebar          | Dark/light theme, logo top-left          |
| Active Workspace | Blue highlight with white icon text      |
| KPI Cards        | White background, shadows, minimal icons |
| Activity Feed    | List style, icons per event type         |
| Chatbot List     | Cards or rows with color badges          |
| Quick Actions    | Brand-colored CTAs, large icons          |
