## Dashboard Page — Complete Design & Implementation Guide

This document describes the complete dashboard page design for `/dashboard`. It covers layout, behavior, component responsibilities, stats definitions, data contracts, responsive / permission-aware behavior, accessibility, and example React/Tailwind skeletons. Use this as the single source of truth when implementing the Dashboard UI.

## Contract (Inputs / Outputs / Success Criteria)

- Inputs:
  - `currentOrganization` (id, name, role)
  - `currentWorkspace` (id, name, role)
  - `user` (id, name, avatar, roles)
  - API responses for stats, recent items, activities, audits
  - `permissions` object for current context (map of permission keys -> boolean)
- Outputs:
  - Rendered dashboard UI (cards, lists, charts)
  - Navigation actions (view item, open analytics, create flows)
  - Events for telemetry (create-clicks, view-analytics, search)
- Success Criteria:
  - Dashboard loads critical stats within 1s (from cache or fast endpoint)
  - Page gracefully shows placeholders then data
  - Create actions open correct modals and pre-fill context
  - Elements hidden/disabled based on permissions and default workspace rules

## High Level Layout

- Top header (persistent): left: breadcrumbs/logo, center: greeting + quick search, right: notifications, create button, profile avatar
- Primary content: 12-column grid with responsive breakpoints
  - Left Column (Main / 8 cols on desktop / full width on mobile):
    - Greeting + quick actions row
    - Search + filters
    - Stats summary grid (multi-row, compact cards)
    - Recent lists (chatbots, chatflows, knowledge bases)
    - Recent activities / team feed
  - Right Column (Sidebar / 4 cols on desktop / after main on mobile):
    - Quick create card (Create Chatbot/Flow/KB)
    - View analytics CTA
    - Team snapshot & active members
    - Uptime & health widgets

## Header & Greeting

- Header contains:
  - Logo (left) — clickable to `/dashboard`
  - Breadcrumb or current org/workspace title
  - Greeting ("Good morning, <FirstName> ✨") — dynamic based on time
  - Search input (center) — global search across chatbots, flows, KB, users
  - Right-side actions: Notifications bell (unread badge), Quick Create primary button, user avatar + dropdown

Behavior notes:

- If user is in Personal org & default workspace: show "Profile" shortcut in the avatar menu.
- If the org is an Organization with team members: show "Team" and "Members" links in avatar dropdown.
- Search should debounce 300ms and show immediate skeleton results while searching.

## Quick Search & Filters

- Global search: results grouped by type (Chatbots, Chatflows, KB, Users)
- Filters (inline chips) for the main page: status (Active, Draft, Archived), team filters (Mine, Team), tags, created date
- When no filters applied, show "All" summary
- When in Personal workspace, team filter is hidden or auto-set to "Mine"

## Stats Summary (Primary cards)

Design principles: show a compact set of actionable, meaningful stats to aid decisions. Each stat card should show: value, delta (7d or month), small sparkline, tooltip with definition and data freshness.

Recommended primary stats (prioritized):

- Total chatbots (team or personal scope depending on context)
- Active chatbots (last 7 days)
- Total chatflows
- Total knowledge bases (KB)
- Active users (MAU or DAU depending on scope)
- Conversations (last 24h / 7d)
- Leads captured (last 7d)
- API calls (24h) / Rate usage
- Uptime / Availability (service health)
- Team members (active members in workspace)
- New members (last 7d)
- Lead Growth % (7d change)

Card layout: 3-up on large screens, 2-up on medium, single column on mobile. Cards must be keyboard-focusable and have ARIA labels describing metric.

## Secondary & Contextual Stats (in Right Sidebar)

- Average response time (ms) for chatbots
- Top 3 active chatbots (by conversations)
- Billing usage (if billing enabled) — current period usage
- Alerts (any failing integrations)
- Scheduled jobs count

## Cards & CTAs

Primary CTAs (buttons with permission checks):

- Create Chatbot (permission: `chatbot:create`)
- Create Chatflow (permission: `chatflow:create`)
- Create Knowledge Base (permission: `kb:create`)
- View Analytics (permission: `analytics:view`) — opens analytics page with prefiltered context
- Invite Team / Manage Team (permission: `org:invite`) — visible for org admins/owners

UI notes:

- The Quick Create card shows three big buttons side-by-side on desktop and stacked on mobile.
- Buttons are primary/secondary visual styles and have tooltips.
- If permission missing, button is shown disabled with tooltip explaining which role can perform this action.

## Recent Sections

1. Recent Chatbots

   - List 6 latest chatbots in this workspace/org
   - Each row: avatar, name, status badge, conversations (7d), last activity, actions (open, analytics, duplicate)
   - If in org with team, show "owner/team" badge

2. Recent Chatflows

   - Similar to chatbots: name, parent chatbot, last executed, executions (7d), status

3. Recent Knowledge Bases

   - List KBs with document count, last updated, connectors (S3, Google Drive) icons

4. Recent Activities / Team Feed
   - Chronological feed showing user actions (created bot, updated KB, invited member)
   - Each item: actor avatar, action text, timestamp, target link
   - Filter by activity type and actor

UX notes:

- Empty states must surface next actions (e.g., "Create your first chatbot") with a prominent CTA.
- If personal workspace with no team members: Recent Team Activities should show a helpful message like "No team activity yet — invite a teammate to collaborate" with an invite CTA.

## Team Snapshot

- Small card showing top 6 active members (avatars) and a count
- Show how many members are online/active in the last 24h
- If workspace is personal (no members): show friendly text "You're currently solo here — this is your personal workspace"

## Data & API Contracts (Recommended Endpoints)

Note: API paths are illustrative; adapt to your existing `src/api`.

- GET /api/v1/dashboard/summary?org_id=&workspace_id=

  - Returns the main stat block and sparkline data
  - Response shape:
    {
    "total_chatbots": number,
    "active_chatbots": number,
    "total_chatflows": number,
    "total_kb": number,
    "active_users": number,
    "conversations_24h": number,
    "conversations_7d": number,
    "leads_7d": number,
    "leads_growth_pct_7d": number,
    "api_calls_24h": number,
    "uptime_pct_30d": number,
    "team_members": number,
    "new_members_7d": number,
    "sparklines": { "conversations": [/* points */], "api_calls": [/* points */] }
    }

- GET /api/v1/dashboard/recent?type=chatbots|flows|kb&limit=6&org_id=&workspace_id=

  - Returns array of items with minimal fields for list

- GET /api/v1/dashboard/activities?limit=20&org_id=&workspace_id=

  - Returns activity feed items

- Permissions:
  - Endpoints honor JWT-embedded context and return only resources the user can view.
  - If user lacks permission to see a stat, return `null` or `restricted: true` for that field.

Caching & freshness:

- Summary endpoint should be cacheable for 30–60s. Provide `last_updated` timestamp.
- Use stale-while-revalidate patterns on frontend: show cached quickly then refresh in background.

## Frontend Data Shape (example TypeScript interfaces)

interface DashboardSummary {
total_chatbots: number | null
active_chatbots: number | null
total_chatflows: number | null
total_kb: number | null
active_users: number | null
conversations_24h: number | null
conversations_7d: number | null
leads_7d: number | null
leads_growth_pct_7d: number | null
api_calls_24h: number | null
uptime_pct_30d: number | null
team_members: number | null
new_members_7d: number | null
sparklines?: Record<string, number[]>
last_updated: string
}

interface RecentItem {
id: string
name: string
type: 'chatbot'|'flow'|'kb'
owner?: { id: string, name: string }
conversation_count?: number
doc_count?: number
last_activity_at?: string
}

interface ActivityItem {
id: string
actor: { id:string, name:string, avatar?:string }
action: string
target?: { id:string, type:string, name:string }
timestamp: string
}

## React/Tailwind Skeleton (JSX/TSX Layout)

This is a structural skeleton to guide implementation. Keep presentational components separate (StatCard, ItemRow, ActivityFeed).

- Top-level component: `DashboardPage`
  - Fetches `summary`, `recent`, `activities` (parallel) using React Query
  - Computes local permission checks via AppContext.hasPermission
  - Renders layout grid and passes props to presentational components

Example structure (high level):

<main className="p-6 lg:p-10">
  <header className="flex items-center justify-between mb-6">
    <div className="flex items-center gap-4">
      <h1 className="text-2xl font-semibold">Good {timeOfDay}, {user.firstName}</h1>
      <p className="text-sm text-muted">Overview of {currentWorkspace.name}</p>
    </div>
    <div className="flex items-center gap-3">
      <SearchBox />
      <NotificationsMenu />
      <QuickCreateMenu />
      <AvatarMenu />
    </div>
  </header>

  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
    <section className="lg:col-span-8 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total chatbots" value={summary.total_chatbots} delta={delta.chatbots} sparkline={summary.sparklines?.chatbots} />
        <StatCard title="Conversations (24h)" value={summary.conversations_24h} />
        <StatCard title="Active users" value={summary.active_users} />
        <!-- more stat cards -->
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RecentList type="chatbots" items={recent.chatbots} />
        <RecentList type="flows" items={recent.flows} />
      </div>

      <ActivityFeed items={activities} />
    </section>

    <aside className="lg:col-span-4 space-y-6">
      <QuickCreateCard permissions={permissions} />
      <AnalyticsCTA />
      <TeamSnapshot members={team.members} />
      <HealthWidget uptime={summary.uptime_pct_30d} />
    </aside>

  </div>
</main>

Component responsibilities:

- `StatCard` — small summary metric with aria-label, sparkline and tooltip
- `RecentList` — typed list (chatbots / flows / kb) with actions per item
- `QuickCreateCard` — shows create buttons; checks permissions and disables if missing
- `ActivityFeed` — real-time or polled feed for team activity

## Permission & Context Behavior

- All endpoints respect JWT context. The frontend should call with org_id & workspace_id.
- UI filtering:
  - If `permissions.chatbot:create` false, disable Create Chatbot CTA and show tooltip linking to docs or role request flow.
  - If `requiresDefaultWorkspace` logic applies (for Profile): Profile link in top nav only shows in default personal workspace.

Context-specific UX examples:

- Personal workspace (no team members):

  - Team Snapshot shows "You're solo" message, no team feed items
  - Stats focus on personal resources: "Your chatbots", "Your chatflows"
  - Create CTAs are available (owner is always allowed to create)

- Organization workspace with team:
  - Team Snapshot shows active members, invites CTA (for admins), and "active members" count
  - Recent Activities show actions by teammates (created, updated)
  - Stats represent workspace scope (team chatbots, team conversations)

## Visual & Interaction Details

- Cards and lists should use subtle elevation and 8–12px rounded corners.
- Use color-coded badges: success (green) for active, warning (amber) for degraded, muted (gray) for draft.
- Sparklines are 24–36px tall, low-contrast stroke in the card.
- Make sure all actions have accessible labels and keyboard focus styles.

## Empty / Low-data States

- If there are 0 chatbots, show an empty-state card: "No chatbots yet — create your first chatbot" with primary CTA.
- If there is low activity (no recent activity), show a friendly message and suggest actions (create, import KB, invite teammates).
- If user lacks permission to view analytics, hide the analytics CTA and show an inline note: "Contact your admin to enable analytics access."

## Performance & UX

- Use optimistic caching: show cached `summary` immediately while fetching fresh.
- Lazy-load charts and heavy lists (only fetch full lists when user expands or clicks "Load more").
- Poll only lightweight endpoints (activities) at a reasonable interval (e.g., 30s) and back off on errors.

## Edge Cases

- API returns `restricted: true` for a stat: show a lock icon instead of the number and a tooltip: "Restricted — contact admin"
- Partial permissions: show only metrics user can view; keep layout stable (placeholders or locked cards)
- Slow network: show skeleton loaders; keep first paint under 1s using cached data
- Timezone handling: All timestamps normalized to user's timezone; show relative and absolute times on hover

## Accessibility

- All buttons and interactive elements must be keyboard accessible and have descriptive labels.
- Use ARIA live regions for activity feed updates when new items appear, but allow user to opt out of live updates.
- Color contrast should meet WCAG AA for text and icons.

## Mock Data Examples

Summary mock:

{
"total_chatbots": 12,
"active_chatbots": 8,
"total_chatflows": 34,
"total_kb": 6,
"active_users": 54,
"conversations_24h": 412,
"leads_7d": 21,
"leads_growth_pct_7d": 18.5,
"api_calls_24h": 14000,
"uptime_pct_30d": 99.98,
"team_members": 7,
"new_members_7d": 2,
"sparklines": {"conversations": [10,12,8,15,20,40,30]},
"last_updated": "2025-10-28T10:32:00Z"
}

Recent chatbots array example:

[
{ "id":"b1","name":"Support-AI","type":"chatbot","conversation_count":120,"last_activity_at":"2025-10-28T09:18:00Z","owner":{ "id":"u1","name":"Ava" } },
{ "id":"b2","name":"Sales-Gen","conversation_count":34, "last_activity_at":"2025-10-27T17:55:00Z" }
]

## Example UX Flows & Notes

- Creating a Chatbot in Organization with team:

  1. User clicks "Create Chatbot" — QuickCreate modal opens pre-set to current org/workspace
  2. User fills name & template and clicks create
  3. UI immediately adds a placeholder row in Recent Chatbots and navigates to new bot editor
  4. ActivityFeed logs "User created chatbot"

- Viewing analytics:
  - If `analytics:view` permission present, clicking "View analytics" navigates to `/analytics?context=workspaceId`.
  - If missing, show a small modal explaining who can enable it.

## Tests & Validation (suggested)

- Unit tests for each presentational component (StatCard, RecentList, ActivityFeed)
- Integration tests for `DashboardPage` that mock summary endpoint with different permission shapes:
  - Case A: Personal workspace (no team) — expect team snapshot show "You're solo" and Profile shortcut present
  - Case B: Organization with team — expect team members count and recent team activities
  - Case C: Restricted permissions — expect locked stat card(s)
- E2E smoke test for create flow that verifies new chatbot appears in Recent Chatbots after create

## Implementation Checklist

- [ ] Create `DashboardPage` route at `/dashboard`
- [ ] Implement `GET /dashboard/summary` backend endpoint (or adapt existing)
- [ ] Implement `StatCard`, `RecentList`, `ActivityFeed`, `QuickCreateCard` components
- [ ] Add unit & integration tests
- [ ] Wire caching and polling rules
- [ ] Build accessible empty states and tooltips for restricted stats
