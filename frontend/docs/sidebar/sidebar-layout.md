# Sidebar Layout Guide — For Absolute Beginners

This document explains **exactly** how the sidebar looks and works in the PrivexBot dashboard based on the actual implementation. If you're new to web development or UI design, this guide will walk you through every visual element, spacing, color, interaction, and behavior of the sidebar in simple, clear language.

---

## What is the Sidebar?

The sidebar is a **vertical panel** on the **left side** of your screen that stays visible while you navigate through different pages of the dashboard. It uses a **Discord-inspired design** with a unique two-column layout in the middle section.

**Key characteristics:**

- Always visible on desktop (slides in/out on mobile via hamburger menu)
- Has 3 main vertical sections: Top, Middle, Bottom
- The middle section is split into 2 vertical columns side-by-side
- Left column: Discord-like workspace switcher with round avatars
- Right column: Main navigation menu items
- Bottom section: User profile with organization switcher (dropup)

---

## Overall Structure (The Big Picture)

The sidebar is divided into **3 main horizontal sections** stacked vertically:

```
┌─────────────────────────────────┐
│    TOP SECTION                  │ ← Logo only (Privexbot)
│    (Fixed at top)               │
├─────────────────────────────────┤
│ │                  │            │
│ │  WORKSPACE       │  MAIN      │ ← MIDDLE SECTION
│ │  COLUMN          │  MENU      │   (Two columns side-by-side)
│ │  (Discord-like)  │  COLUMN    │   Left: Workspaces
│ │                  │            │   Right: Navigation items
│ │  [●] Personal    │  Dashboard │
│ │  [●] Production  │  Chatbots  │
│ │  [●] Dev         │  Studio    │
│ │  [+] Add         │  ...       │
│ │                  │            │
├─────────────────────────────────┤
│    BOTTOM SECTION               │ ← User Profile + Org Switcher
│    (Fixed at bottom)            │   (Dropup opens upward)
└─────────────────────────────────┘
```

---

## Dimensions & Spacing

### Overall Sidebar Width

- **Desktop:** `260px` total width (lg:w-[260px])
- **Mobile/Tablet:** `280px` on small screens, `300px` on medium screens
- **Mobile behavior:** Slides in from left as an overlay with backdrop

### Overall Sidebar Height

- Takes up **100% of viewport height** (h-full)
- The 3 sections are arranged vertically to fill this height

### Background Color

- **Main background:** Dark gray `#2B2D31` in light mode
- **Dark mode:** Even darker `#1E1F22`
- This gives it that Discord-like dark theme appearance

### Borders

- **Right edge border:** Separates sidebar from main content
  - Color: `#3a3a3a` (light mode), `#26272B` (dark mode)
  - Width: **1px solid**
- **Internal borders:** Between sections
  - Same color as right edge border

---

## Section 1: Top Section (Logo Only)

This section is **fixed at the top** of the sidebar and contains only the Privexbot logo.

### Visual Layout:

```
┌─────────────────────────────┐
│                             │
│  [🤖] Privexbot             │ ← Logo with icon + text
│                             │
└─────────────────────────────┘
```

### Logo Details

**Position:** Top-left area of the sidebar

**What it looks like:**

- **Icon:** Blue rounded square (`bg-blue-600`) with a **Bot icon** inside
- **Text:** The word **"Privexbot"** in bold white text next to the icon
- They are arranged **horizontally** (side-by-side)

**Exact Measurements:**

- Icon size: **28px × 28px** (`w-7 h-7`)
- Icon inside: Bot icon is **16px × 16px** (`h-4 w-4`)
- Text size: **14px** on small screens, **16px** on larger (`text-sm sm:text-base`)
- Font weight: **Bold** (`font-bold`)

**Colors:**

- Icon background: Blue `bg-blue-600`
- Bot icon color: White (`text-white`)
- Text color: White (`text-white`)

**Spacing:**

- Padding around logo area: **12px** (mobile) to **16px** (desktop)
- Space between icon and text: **8px** (`space-x-2`)

**Border:**

- Bottom border separating it from middle section
- Color: `#3a3a3a` (light), `#26272B` (dark)
- Width: **1px**

**Interaction:**

- The logo is **clickable** (though not shown in code, typically links to Dashboard)
- On hover, cursor becomes pointer

---

## Section 2: Middle Section (Two-Column Layout)

This is the **main interactive area** and the most unique part of the sidebar. It's divided into **two vertical columns** that sit side-by-side.

### Overall Layout:

```
┌──────────┬──────────────────────┐
│          │                      │
│ WORKSPACE│  MAIN MENU           │
│ COLUMN   │  COLUMN              │
│ (Left)   │  (Right)             │
│          │                      │
│ 72px     │  ~188px wide         │
│ wide     │                      │
│          │                      │
│ [●] Pers │  📊 Dashboard        │
│ [●] Prod │  💬 Chatbots         │
│ [●] Dev  │  🔧 Studio           │
│ [+] Add  │  📚 Knowledge Base   │
│          │  👥 Leads            │
│          │  📈 Analytics        │
│          │  👤 Profile          │
│          │  🏢 Organizations    │
│          │  🛒 Marketplace      │
│          │  🎁 Referrals        │
│          │  ─────────────────   │
│          │  📖 Documentation    │
│          │  ⚙️ Settings

        │
│          │                      │
└──────────┴──────────────────────┘
```

The two columns are created using Flexbox: `<div className="flex h-full">`

---

### LEFT COLUMN: Workspace Switcher (Discord-Style)

This column has a **vertical list of circular avatars** representing different workspaces, similar to Discord servers.

**Width:**

- **60px** on mobile (`w-[60px]`)
- **70px** on small tablets (`sm:w-[70px]`)
- **72px** on desktop (`lg:w-[72px]`)

**Background:**

- Same as main sidebar (`#2B2D31` / `#1E1F22`)

**Right border:**

- Separates it from the right column
- Color: `#3a3a3a` / `#26272B`
- Width: **1px**

**Scrolling:**

- If there are many workspaces, this column becomes **scrollable vertically**
- Scrollbar is **hidden** (`scrollbar-hide`)
- Padding top: **12px** (`py-3`)

#### "ACCT" Label

At the very top of the workspace column, there's a small label:

**Text:** "ACCT" (short for "Accounts")

- Font size: **8px** on mobile (`text-[8px]`), **9px** on larger screens (`sm:text-[9px]`)
- Color: Light gray `text-gray-400` (dark mode: `text-gray-500`)
- Font weight: **Bold** (`font-bold`)
- Style: **Uppercase** (`uppercase`)
- Letter spacing: **Wider** (`tracking-wider`)
- Padding: **6-8px** on sides
- Margin bottom: **12px** (`mb-3`)

#### Workspace Avatar Buttons

Below the "ACCT" label, each workspace is shown as a **circular button** with an avatar and name underneath.

**Structure of each workspace item:**

```
    [●]        ← Avatar (circular or rounded square)
  Personal     ← Workspace name (tiny text)
```

**Avatar Specifications:**

- Base size: **44px × 44px** (`h-11 w-11`)
- Shape when **NOT active:** Perfect circle (`rounded-full`)
- Shape when **ACTIVE:** Rounded square (`rounded-[14px]` = 14px border radius)
- Shape on **HOVER (not active):** Transitions from circle to rounded square
- Border: **2px** thick
  - Active: White border (`border-white`)
  - Inactive: Transparent, becomes gray on hover (`border-gray-500`)

**Avatar Content:**

- Shows workspace **initials** (first letters of workspace name)
- Font size: **12px** (`text-xs`)
- Font weight: **Bold** (`font-bold`)

**Avatar Colors:**

- **Active workspace:**
  - Background: Blue `bg-blue-600`
  - Text: White `text-white`
  - Border: White
- **Inactive workspace:**
  - Background: Dark gray `bg-[#36373D]` / `bg-[#2B2D31]`
  - Text: Light gray `text-gray-300` / `text-gray-400`
  - Border: Transparent
- **Hover (inactive):**
  - Background: Blue `bg-blue-500`
  - Text: White `text-white`
  - Border: Gray `border-gray-500`

**Active Indicator (Blue Bar):**
When a workspace is active, a **blue vertical bar** appears on the **right side** of the avatar:

- Position: Absolute, `-right-2` (8px to the right of avatar)
- Width: **4px** (`w-1`)
- Height: **32px** (`h-8`)
- Color: Blue `bg-blue-600`
- Shape: Fully rounded ends (`rounded-full`)
- This creates a Discord-like "active server" indicator

**Workspace Name Text:**

- Position: **Below the avatar** (`flex flex-col`)
- Font size: **9px** (`text-[9px]`)
- Font weight: **Medium** (`font-medium`)
- Max width: Full width of column with tiny padding
- Truncation: Text cuts off with ellipsis if too long (`truncate`)
- Color:
  - Active: White `text-white`
  - Inactive: Gray `text-gray-400` / `text-gray-500`
  - Hover: Light gray `text-gray-200`

**Spacing Between Workspace Items:**

- Vertical gap: **8px** (`space-y-2`)

**Animation & Transitions:**

- Shape change (circle ↔ rounded square): **200ms** (`transition-all duration-200`)
- Color changes: Smooth transitions
- Hover effects: Seamless morphing

## Section 1: Top Section (Logo & Workspace Switcher)

This section sits at the very **top** of the sidebar and contains two main elements stacked vertically.

### Visual Layout:

```
┌─────────────────────────┐
│                         │
│    [PRIVEXBOT LOGO]     │ ← Logo with icon + text
│                         │
│  ┌───────────────────┐  │
│  │  [Avatar] Work... │  │ ← Workspace Switcher Button
│  │        [▼]        │  │    (with dropdown arrow)
│  └───────────────────┘  │
│                         │
└─────────────────────────┘
```

### 1.1 PrivexBot Logo

**Position:** Top-left corner of the sidebar

**What it looks like:**

- A small **icon/symbol** (could be a robot icon, chat bubble, or company logo)
- Next to it: The text **"Privexbot"** in a bold font
- Size: Icon is about **24px × 24px**, text is about **18px font size**
- Color:
  - Light mode: Dark text (almost black, `#111827`)
  - Dark mode: White text (`#FFFFFF`)

**Spacing:**

- Padding from top: **16px**
- Padding from left: **16px**
- Padding from right: **16px**
- Space below logo before workspace switcher: **16px**

**Interaction:**

- When you **click** the logo, it takes you back to the Dashboard (home page)
- When you **hover** over it, the cursor changes to a pointer (hand icon) to show it's clickable

---

### 1.2 Workspace Switcher

**Position:** Directly below the logo

**What it looks like:**

- A **rounded rectangular button** that spans almost the full width of the sidebar
- Contains three parts arranged horizontally:
  1. **Avatar (left):** A small circular image or colored circle with the workspace initial
  2. **Workspace name (center):** Text showing the name (e.g., "Personal", "Production")
  3. **Dropdown arrow (right):** A small downward-pointing chevron icon

**Detailed appearance:**

```
┌──────────────────────────────┐
│  [●]  Personal Workspace  ▼  │
└──────────────────────────────┘
    ↑         ↑               ↑
  Avatar    Name         Dropdown
```

**Dimensions:**

- Width: **208px** (sidebar width minus padding on both sides: 240 - 16 - 16 = 208)
- Height: **48px**
- Border radius: **8px** (rounded corners)

**Colors:**

- Background:
  - Light mode: Very light gray (`#F9FAFB`)
  - Dark mode: Slightly lighter than sidebar (`#374151`)
- Text color:
  - Light mode: Dark gray (`#111827`)
  - Dark mode: White (`#FFFFFF`)
- Border: **1px solid** border
  - Light mode: `#E5E7EB`
  - Dark mode: `#4B5563`

**Avatar specifics:**

- Size: **32px × 32px** circle
- Position: **8px from the left edge** of the button
- If workspace has an image: shows that image
- If no image: shows a colored circle with the first letter of workspace name in white
- Background colors rotate through a set palette: blue, purple, green, orange, pink

**Workspace name:**

- Font size: **14px**
- Font weight: **500** (medium)
- Position: **8px to the right** of the avatar
- If name is too long (more than ~15 characters), it gets truncated with ellipsis: "Very Long Worksp..."

**Dropdown arrow:**

- Size: **16px × 16px**
- Position: **8px from the right edge** of the button
- Color: Slightly muted gray (`#6B7280`)

**Interaction:**

- **Hover:** Background becomes slightly darker (showing it's interactive)
- **Click:** Opens a dropdown panel that lists all your workspaces + a "+ New workspace" option
- **Keyboard:** Can be focused with Tab key, activated with Enter or Space

---

### 1.3 Workspace List (Dropdown Panel)

When you click the workspace switcher, a panel appears below it showing all available workspaces.

**What it looks like:**

```
┌──────────────────────────────┐
│  [●]  Personal          ✓    │ ← Currently selected
├──────────────────────────────┤
│  [●]  Production             │
├──────────────────────────────┤
│  [●]  Development            │
├──────────────────────────────┤
│  [+]  New workspace          │ ← Create option
└──────────────────────────────┘
```

**Dimensions:**

- Width: Same as the workspace switcher button (**208px**)
- Height: Expands based on number of workspaces (each item is **44px tall**)
- Max height: If more than 6 workspaces, the list becomes scrollable

**Each workspace item:**

- Shows avatar (32px) + name + checkmark (if selected)
- Padding: **8px** on all sides
- Hover: Slightly darker background
- Click: Switches to that workspace and closes dropdown

**"New workspace" option:**

- Shows a **plus icon** instead of avatar
- Text: "New workspace"
- Click: Opens a modal/dialog to create a new workspace

**Spacing from top section to middle section:**

- **24px gap** between workspace switcher and the first menu item

---

## Section 2: Middle Section (Navigation Menu)

This is the **main navigation area** where all your menu items are listed vertically.

#### "Add Workspace" Button

At the bottom of the workspace list (after all workspace avatars), there's a special button to add new workspaces.

**Only visible if:** User has `workspace:create` permission

**Structure:**

```
    [+]        ← Dashed circle with plus icon
    Add        ← "Add" text
```

**Avatar/Icon:**

- Size: **44px × 44px** (`h-11 w-11`)
- Shape: Perfect circle (`rounded-full`)
- Border: **2px dashed** border (`border-2 border-dashed`)
- Border color: Gray `border-gray-600` / `border-gray-700`
- Background: Transparent (no fill)
- Contains: **Plus icon** inside

**Plus Icon:**

- Size: **20px × 20px** (`h-5 w-5`)
- Color: Gray `text-gray-500` / `text-gray-600`

**"Add" Text:**

- Font size: **9px** (`text-[9px]`)
- Font weight: **Medium** (`font-medium`)
- Color: Gray `text-gray-500` / `text-gray-600`

**Hover Effects:**

- Border color: Changes to green `border-green-500`
- Border shape: Morphs from circle to rounded square (`rounded-[14px]`)
- Plus icon color: Changes to green `text-green-400`
- Text color: Changes to green `text-green-400`
- Transition: **200ms** smooth (`transition-all duration-200`)

**Spacing:**

- Margin top: **4px** (`mt-1`) above the Add button
- Same horizontal alignment as workspace avatars

---

### RIGHT COLUMN: Main Menu & Others

This column contains the actual navigation menu items that link to different pages.

**Width:**

- Takes up remaining space after the 72px workspace column
- Approximately **188px** (260px total - 72px workspace column)

**Background:**

- Same as main sidebar

**Structure:**
This column is further divided into **two sub-sections** stacked vertically:

1. **Main Menu** (top, scrollable)
2. **Others** (bottom, fixed)

---

#### Top Part: "Main Menu" Section

This part is **scrollable** if there are many menu items.

**"MAIN MENU" Label:**

- Position: At the very top of this column
- Text: "Main Menu"
- Font size: **9px** on mobile (`text-[9px]`), **10px** on larger (`sm:text-[10px]`)
- Color: Light gray `text-gray-400` / `text-gray-500`
- Font weight: **Bold** (`font-bold`)
- Style: **Uppercase** (`uppercase`)
- Letter spacing: **Wider** (`tracking-wider`)
- Padding: **8-12px** horizontal
- Margin bottom: **8px**

**Menu Items List:**

Below the label, menu items are stacked vertically.

Each menu item is a **rectangular button** that spans the full width of the right column.

**Structure of one menu item:**

```
┌──────────────────────────────┐
│  [📊]  Dashboard             │
└──────────────────────────────┘
    ↑         ↑
  Icon      Label
```

**Dimensions:**

- Width: Full width of column minus padding
- Height: **32px** on mobile, **36px** on desktop
- Border radius: **8px** (`rounded-lg`)
- Padding horizontal: **8px** on mobile (`px-2`), **12px** on larger (`sm:px-3`)
- Padding vertical: **8px** (`py-2`)

**Spacing:**

- Gap between items: **2px** on mobile (`space-y-0.5`), **4px** on larger (`sm:space-y-1`)
- Icon position: **8-12px** from left edge
- Label position: **8-12px** to the right of icon (`mr-2 sm:mr-3`)

**Icon Details:**

- Size: **16px** on mobile (`h-4 w-4`), **18px** on desktop (`sm:h-[18px] sm:w-[18px]`)
- Stroke width: **1.5px** to **2px**
- Style: Outline/line icons (not filled)

**Label (Text):**

- Font size: **12px** on mobile (`text-xs`), **13px** on larger (`sm:text-[13px]`)
- Font weight: **Medium** (`font-medium`)
- Truncates with ellipsis if too long (`truncate`)

**Colors (Inactive State):**

- Background: Transparent
- Icon color: Gray `text-gray-400` / `text-gray-500`
- Text color: Light gray `text-gray-300` / `text-gray-400`

**Colors (Active State - current page):**

- Background: Blue `bg-blue-600`
- Icon color: White `text-white`
- Text color: White `text-white`
- Shadow: Small shadow (`shadow-sm`)

**Colors (Hover State - not active):**

- Background: Dark gray `bg-[#36373D]` / `bg-[#2B2D31]`
- Icon color: Light gray `text-gray-200`
- Text color: White `text-white`

**Transition:**

- All color/background changes: **200ms** (`transition-all duration-200`)

**Menu Items Included:**

1. Dashboard (LayoutGrid icon)
2. Chatbots (Bot icon) - requires `chatbot:view` permission
3. Studio (Workflow icon) - requires `chatflow:view` permission
4. Knowledge Base (Database icon) - requires `kb:view` permission
5. Leads (Mail icon) - requires `lead:view` permission
6. Analytics (BarChart3 icon)
7. Profile (User icon) - **only shows in default workspace**
8. Organizations (Building2 icon)
9. Marketplace (Briefcase icon)
10. Referrals (Gift icon)

**Permission Filtering:**

- If user lacks a required permission, that menu item is completely removed (not just disabled)
- The list dynamically updates when permissions or workspace changes

**Profile Page Special Logic:**

- Only visible when: `isDefaultOrganization AND isDefaultWorkspace`
- Default organization: typically the first one (personal org)
- Default workspace: one that matches organization name or is the first workspace
- When user switches to a different workspace, Profile item disappears with smooth fade

---

#### Bottom Part: "Others" Section

This section is **pinned to the bottom** of the right column (doesn't scroll).

**Visual separator:**

- Top border: **1px solid** line
- Color: `#3a3a3a` / `#26272B`
- Creates clear visual separation from Main Menu

**"OTHERS" Label:**

- Text: "Others"
- Font size: **9px** / **10px**
- Color: Gray `text-gray-400` / `text-gray-500`
- Font weight: **Bold**
- Style: **Uppercase**, wider tracking
- Margin bottom: **4-8px**

**Menu Items:**

1. Documentation (FileText icon)
2. Settings (Settings icon)

These items have the **same visual style** as Main Menu items:

- Same dimensions, colors, hover effects
- Same active/inactive states
- Same transition timing

**Spacing:**

- Padding around Others section: **8-12px** (`py-2 sm:py-3`)
- Gap between items: **2-4px**

---

## Section 3: Bottom Section (User Profile & Organization Switcher)

This section is **fixed at the very bottom** of the sidebar and doesn't scroll.

### Visual Layout:

```
┌─────────────────────────────┐
│  ─────────────────────────  │ ← Border separator
│                             │
│  [👤] John Doe         [▼]  │ ← User info + dropdown
│       john@email.com        │
│                             │
└─────────────────────────────┘
```

**Width:** Full sidebar width (260px)

**Background:** Same as sidebar (`#2B2D31` / `#1E1F22`)

**Top border:**

- Width: Full width
- Height: **1px**
- Color: `#3a3a3a` / `#26272B`

**Padding:**

- All sides: **8px** on mobile (`p-2`), **12px** on larger (`sm:p-3`)

---

### User Profile Button

This is a **clickable button** that shows user info and opens the organization switcher.

**Structure:**

```
┌──────────────────────────────────┐
│  [●]  John Doe            [▼]   │
│       john@email.com             │
└──────────────────────────────────┘
   ↑       ↑                  ↑
Avatar   Info            Dropdown arrow
```

**Dimensions:**

- Width: Full width (`w-full`)
- Height: Auto-adjusts to content
- Padding: **6-8px** (`p-1.5 sm:p-2`)
- Border radius: **6px** (`rounded-md`)

**Layout:** Horizontal flex with space between avatar+info and arrow

**Avatar:**

- Size: **28px** on mobile (`h-7 w-7`), **32px** on desktop (`sm:h-8 sm:w-8`)
- Shape: Circle (`rounded-full`)
- Background: **Gradient** from blue to purple (`bg-gradient-to-br from-blue-500 to-purple-600`)
- Content: User's initials in white
- Font size: **10px** on mobile (`text-[10px]`), **12px** on larger (`sm:text-xs`)
- Font weight: **Semi-bold** (`font-semibold`)

**User Info (Right of Avatar):**
Two lines of text stacked vertically:

**Line 1 - Username:**

- Font size: **12px** on mobile (`text-xs`), **14px** on larger (`sm:text-sm`)
- Font weight: **Medium** (`font-medium`)
- Color: White (`text-white`)
- Truncates with ellipsis (`truncate`)

**Line 2 - Email:**

- Font size: **10px** on mobile (`text-[10px]`), **12px** on larger (`sm:text-xs`)
- Color: Gray `text-gray-400` / `text-gray-500`
- Truncates with ellipsis (`truncate`)

**Dropdown Chevron (Right Edge):**

- Icon: ChevronDown
- Size: **14px** on mobile (`h-3.5 w-3.5`), **16px** on larger (`sm:h-4 sm:w-4`)
- Color: Gray `text-gray-400` / `text-gray-500`
- Position: Right edge with **4px** margin (`ml-1`)

**Hover Effect:**

- Background: Changes to dark gray `bg-[#36373D]` / `bg-[#2B2D31]`
- Transition: Smooth (`transition-colors`)

**Click Behavior:**

- Toggles the organization dropdown (dropup) panel

**Chevron Animation:**

- When dropdown is open: Rotates 180° (`transform rotate-180`)
- Transition: Smooth rotation

---

### Organization Dropdown (Dropup Panel)

When the user profile button is clicked, a panel appears **above** it (dropup, not dropdown).

**Why dropup?** Because this button is at the bottom of the screen, opening downward would go off-screen.

**Position:**

- Absolute positioning: `bottom-full` (appears above the button)
- Left/Right margins: **8-12px** from edges
- Bottom margin: **8px** gap above the button (`mb-2`)

**Dimensions:**

- Width: Matches button width (stretches between left and right margins)
- Max height: **256px** (`max-h-64`)
- If content exceeds max height, becomes scrollable (hidden scrollbar)

**Styling:**

- Background: Darker gray `bg-[#36373D]` / `bg-[#2B2D31]`
- Border: **1px solid** `border-[#4a4b50]` / `border-[#3a3b40]`
- Border radius: **8px** (`rounded-lg`)
- Shadow: Large shadow (`shadow-xl`)
- Z-index: **50** (appears above other content)

**Structure:**

**Header:**

- Padding: **8px** (`p-2`)
- Bottom border: **1px** `border-[#4a4b50]` / `border-[#3a3b40]`
- Text: "Switch Organization"
- Font size: **10-12px** (`text-[10px] sm:text-xs`)
- Color: Light gray `text-gray-300` / `text-gray-400`
- Font weight: **Medium** (`font-medium`)

**Organization List:**

- Padding: **4px** (`p-1`)
- Each organization is a button

**Each Organization Button:**

Structure:

```
┌────────────────────────────────┐
│  [P]  Personal Org         [>] │
│       Free • owner             │
└────────────────────────────────┘
```

**Dimensions:**

- Width: Full width
- Padding: **6-8px** (`p-1.5 sm:p-2`)
- Border radius: **6px** (`rounded-md`)

**Layout:** Horizontal with avatar, info, and chevron

**Avatar:**

- Size: **20px** on mobile (`h-5 w-5`), **24px** on larger (`sm:h-6 sm:w-6`)
- Shape: Circle
- Background:
  - Active: Darker blue `bg-blue-700`
  - Inactive: Gray `bg-[#4a4b50]` / `bg-[#3a3b40]`
- Content: Organization initials
- Font size: **10-12px**
- Font weight: **Semi-bold**

**Organization Info:**
Two lines of text:

**Line 1 - Name:**

- Font size: **12px** on mobile (`text-xs`), **14px** on larger (`sm:text-sm`)
- Font weight: **Medium**
- Truncates with ellipsis

**Line 2 - Subscription & Role:**

- Font size: **10-12px** (`text-[10px] sm:text-xs`)
- Color: Gray `text-gray-400` / `text-gray-500`
- Format: "subscription_tier • user_role" (e.g., "Free • owner")
- Capitalized
- Truncates with ellipsis

**Chevron (Right Edge):**

- Icon: ChevronRight
- Size: **14-16px**
- Only visible for **currently active** organization

**Colors:**

- **Active organization:**
  - Background: Blue `bg-blue-600`
  - Text: White `text-white`
- **Inactive organization:**
  - Background: Transparent
  - Text: Light gray `text-gray-200` / `text-gray-300`
  - Hover: Dark background `bg-[#2B2D31]` / `bg-[#232427]`

**Click Behavior:**

- Calls `switchOrganization(org.id)`
- Closes the dropdown
- Reloads dashboard with new organization context

---

## Responsive Behavior (Mobile, Tablet, Desktop)

### Mobile (screens < 768px / < lg breakpoint)

**Sidebar is HIDDEN by default:**

- Uses `transform: translateX(-100%)` to move off-screen to the left
- Width: **280px** (`w-[280px]`)

**Hamburger Menu Button:**

- Appears in a top bar above main content
- Position: Fixed at top
- Background: Same dark as sidebar
- Icon: Menu (three horizontal lines)
- Size: **20px** (`h-5 w-5`)
- Color: Light gray
- Padding: **8px** in a button
- Also shows mini logo next to it

**When hamburger is clicked:**

1. **Backdrop appears:**
   - Position: Fixed, covers entire screen
   - Background: Black with 60% opacity (`bg-black/60`)
   - Backdrop blur: Small blur effect (`backdrop-blur-sm`)
   - Z-index: **40**
2. **Sidebar slides in:**

   - Animates from left using transform
   - Duration: **300ms** (`duration-300`)
   - Easing: `ease-out`
   - Position: Fixed with z-index **50** (above backdrop)
   - Shadow: Large shadow (`shadow-2xl`)

3. **Icon changes:**
   - Menu icon → X (close icon)

**Closing sidebar on mobile:**

- Tap the backdrop (anywhere outside sidebar)
- Tap the X icon
- Sidebar slides back out to left (reverse animation)
- Backdrop fades out

---

### Tablet (screens 768px - 1024px)

**Sidebar behavior:**

- Remains visible (not hidden)
- Width: **300px** on small tablets (`sm:w-[300px]`)
- No hamburger menu needed
- Fixed position on left side
- Main content adjusts to account for sidebar width

**Font sizes:**

- Slightly larger than mobile
- Labels: **10px** instead of 9px
- Menu items: **13px** instead of 12px

---

### Desktop (screens ≥ 1024px / lg breakpoint)

**Sidebar behavior:**

- Always visible (no hiding/sliding)
- Width: **260px** (`lg:w-[260px]`)
- Position: Static (part of normal layout flow)
- No hamburger menu
- No backdrop needed

**Two-column layout in middle section:**

- Left workspace column: **72px** (`lg:w-[72px]`)
- Right menu column: Remaining space (~188px)

**Font sizes:**

- Standard desktop sizes
- All responsive classes (sm:, lg:) apply their larger values

---

## Theme Modes (Colors)

## Theme Modes (Colors)

The sidebar uses a **dark theme** by default (Discord-inspired) and adapts to light/dark mode.

### Main Colors Used

| Element                     | Light Mode Color | Dark Mode Color | Description       |
| --------------------------- | ---------------- | --------------- | ----------------- |
| Sidebar background          | `#2B2D31`        | `#1E1F22`       | Main background   |
| Border (right edge)         | `#3a3a3a`        | `#26272B`       | Separators        |
| Workspace column background | `#2B2D31`        | `#1E1F22`       | Same as main      |
| Menu column background      | `#2B2D31`        | `#1E1F22`       | Same as main      |
| Hover background            | `#36373D`        | `#2B2D31`       | Interactive hover |
| Active workspace avatar     | `#2563EB`        | `#2563EB`       | Blue (active)     |
| Inactive workspace avatar   | `#36373D`        | `#2B2D31`       | Dark gray         |
| Active indicator bar        | `#2563EB`        | `#2563EB`       | Blue vertical bar |
| Active menu item background | `#2563EB`        | `#2563EB`       | Blue highlight    |
| Text (primary)              | `#FFFFFF`        | `#FFFFFF`       | White text        |
| Text (secondary)            | `#9CA3AF`        | `#9CA3AF`       | Gray text         |
| Text (muted)                | `#6B7280`        | `#6B7280`       | Darker gray       |
| Labels (ACCT, MAIN MENU)    | `#9CA3AF`        | `#6B7280`       | Uppercase labels  |
| User avatar gradient        | Blue→Purple      | Blue→Purple     | Gradient          |
| Dropdown background         | `#36373D`        | `#2B2D31`       | Dropdown panels   |
| Dropdown border             | `#4a4b50`        | `#3a3b40`       | Panel borders     |

---

## Special Behaviors & Edge Cases

### 1. Profile Menu Item Visibility

The **Profile** menu item has special visibility rules (in the Main Menu section of right column):

**Visible when:**

- User is in their **Personal/default organization** (typically the first one)
- AND user is in the **default workspace** (workspace name matches org name OR is the first workspace)

**Hidden when:**

- User switches to any other organization
- OR user switches to a non-default workspace within their personal org

**Visual transition:**

- When hidden: Item smoothly fades out over **150ms** and other items shift up
- When shown: Item fades in and other items shift down
- Uses React conditional rendering based on `isInDefaultContext` boolean

**Implementation logic:**

```typescript
const isDefaultOrganization =
  organizations?.[0]?.id === currentOrganization?.id;
const isDefaultWorkspace =
  currentWorkspace?.name === currentOrganization?.name ||
  currentWorkspace?.name.includes("Default") ||
  workspaces?.[0]?.id === currentWorkspace?.id;
const isInDefaultContext = isDefaultOrganization && isDefaultWorkspace;

// In menu filter:
if (item.requiresDefaultWorkspace && !isInDefaultContext) {
  return false; // Don't show Profile
}
```

---

### 2. Permission-Based Menu Filtering

Some menu items only appear if user has required permissions:

| Menu Item      | Required Permission | Behavior if Missing          |
| -------------- | ------------------- | ---------------------------- |
| Chatbots       | `chatbot:view`      | Completely removed from list |
| Studio         | `chatflow:view`     | Completely removed from list |
| Knowledge Base | `kb:view`           | Completely removed from list |
| Leads          | `lead:view`         | Completely removed from list |
| Dashboard      | None (always shown) | Always visible               |
| Analytics      | None (always shown) | Always visible               |
| Organizations  | None (always shown) | Always visible               |
| Marketplace    | None (always shown) | Always visible               |
| Referrals      | None (always shown) | Always visible               |
| Documentation  | None (always shown) | Always visible               |
| Settings       | None (always shown) | Always visible               |

**Behavior:**

- Items without permission are **removed entirely** (not just disabled)
- No placeholder or "locked" indicator shown
- Other items shift to close gaps
- Filtering happens reactively when permissions or context changes

**"Add Workspace" Button Visibility:**

- Only visible if user has `workspace:create` permission
- If missing, button is completely removed (no placeholder)

---

### 3. Active Workspace Indicator

The currently selected workspace has multiple visual indicators:

1. **Shape change:** Circle → Rounded square (14px radius)
2. **Border:** White 2px border appears
3. **Background:** Changes to blue `bg-blue-600`
4. **Text:** Changes to white (from gray)
5. **Blue bar:** Vertical bar appears on right edge of avatar
   - Width: 4px
   - Height: 32px
   - Color: Blue `bg-blue-600`
   - Position: 8px to the right of avatar
   - Shape: Fully rounded ends
   - This mimics Discord's "active server" indicator

All these indicators work together to make it crystal clear which workspace is active.

---

### 4. Workspace Shape Morphing

When hovering over an **inactive** workspace avatar:

**Before hover:**

- Shape: Perfect circle (`rounded-full`)
- Border: Transparent
- Background: Dark gray

**During hover:**

- Shape: Morphs to rounded square (`rounded-[14px]`) over 200ms
- Border: Gray border appears (`border-gray-500`)
- Background: Changes to blue (`bg-blue-500`)
- Text: Changes to white

**After hover (mouse leaves):**

- Shape: Morphs back to circle over 200ms
- Colors revert to inactive state

This creates a satisfying morphing animation that mimics Discord's behavior.

---

### 5. Organization Switcher Dropup Animation

When clicking the user profile button at the bottom:

**Opening animation:**

- Dropdown panel fades in (opacity 0 → 1)
- Chevron icon rotates 180° smoothly
- Panel appears with `bottom-full` positioning (above button)

**Closing animation:**

- Panel fades out
- Chevron rotates back to original position
- Closes when clicking outside or selecting an organization

**Click outside to close:**

- Clicking anywhere on backdrop closes it
- Implemented with conditional rendering based on `showOrgDropdown` state

---

### 6. Scrolling Behavior

**Workspace Column (Left):**

- Becomes scrollable if workspaces exceed viewport height
- Scrollbar is **hidden** (invisible but functional)
- Smooth scrolling on touch devices

**Main Menu Section (Right Column Top Part):**

- Becomes scrollable if menu items exceed available space
- Scrollbar is **hidden**
- Top section (logo) and bottom sections (Others, User Profile) stay fixed

**Organization Dropup:**

- Max height of 256px
- Becomes scrollable if organizations exceed max height
- Scrollbar is hidden

**CSS for hidden scrollbar:**

```css
.scrollbar-hide {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}
.scrollbar-hide::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}
```

---

### 7. Loading & Skeleton States

When first loading or switching organization/workspace:

**Workspace avatars:**

- Show skeleton circles with pulsing animation
- Each is a gray circle with breathing effect
- Duration: 1.5s infinite loop

**Menu items:**

- Show gray rectangular bars
- Same pulsing animation
- Preserve layout spacing

**Duration:**

- Skeletons show for maximum **500ms**
- If data loads faster, immediately replace with real content

---

### 8. Empty States

**No Workspaces:**

- If user has no workspaces yet (rare edge case):
- Show only the "Add Workspace" button
- Message: "Create your first workspace"

**No Organizations (Besides Personal):**

- If user only has their personal org:
- Organization dropdown shows only one item
- "Create organization" option is visible (if permitted)

---

## Accessibility Features

### Keyboard Navigation

**Tab Navigation:**

- Logo → Workspace 1 → Workspace 2 → ... → Add button → Menu item 1 → Menu item 2 → ... → User profile button
- Tab order follows visual layout (top to bottom, left to right within sections)

**Arrow Keys:**

- Up/Down arrows navigate through menu items
- Works for both workspace column and menu column
- Focus wraps around (bottom → top, top → bottom)

**Enter/Space:**

- Activates focused element
- Works for workspace avatars, menu items, user profile button

**Escape:**

- Closes organization dropdown if open
- Returns focus to user profile button

---

### Screen Reader Support

**Workspace Avatars:**

- Each has `title` attribute with workspace name
- Announced as "Button, [Workspace Name]"
- Active state announced: "[Workspace Name], currently selected"

**Menu Items:**

- Links are properly labeled
- Icon + text creates semantic button
- Active page announced: "[Page Name], current page"

**User Profile:**

- Button labeled: "User profile, [Username], [Email], Open organization menu"

**Organization Dropdown:**

- Announced when opened: "Organization menu expanded"
- Each org: "[Org Name], [Subscription], [Role]"
- Active org: "[Org Name], currently selected"

---

### Focus Indicators

All interactive elements show clear focus indicators:

**Focus ring:**

- Color: Blue `ring-blue-500`
- Width: 2px (`ring-2`)
- Offset: 2px (space between element and ring)
- Border radius: Matches element shape

**High contrast:**

- Focus indicators meet WCAG AAA standards (7:1 contrast minimum)
- Visible on all backgrounds

---

### Color Contrast

All text meets **WCAG AA standards** (4.5:1 minimum):

**Primary text:** White on dark background = 16:1 ratio ✓
**Secondary text:** Light gray (#9CA3AF) on dark = 7:1 ratio ✓
**Muted text:** Medium gray (#6B7280) on dark = 4.8:1 ratio ✓
**Active elements:** White on blue (#2563EB) = 8:1 ratio ✓

---

## Visual Examples (ASCII Art)

### Complete Sidebar (Full Desktop View)

```
┌──────────┬──────────────────────┬───────────────────┐
│          │                      │                   │
│          │  [🤖] Privexbot      │                   │ ← Top Section
│          │                      │                   │
├──────────┴──────────────────────┴───────────────────┤
│          │                      │                   │
│ 72px     │  ~188px wide         │                   │
│ Workspace│  Menu Column         │                   │
│ Column   │                      │                   │
│          │                      │                   │
│ ACCT     │  MAIN MENU           │                   │
│          │                      │                   │
│ [●]━━    │  📊 Dashboard   ←Active (blue bg)        │
│ Personal │  💬 Chatbots         │                   │
│          │  🔧 Studio           │                   │
│ [●]      │  📚 Knowledge Base   │                   │ ← Middle Section
│ Product. │  👥 Leads            │                   │   (Two columns)
│          │  📈 Analytics        │                   │
│ [●]      │  👤 Profile          │                   │
│ Dev      │  🏢 Organizations    │                   │
│          │  🛒 Marketplace      │                   │
│ [⊕]      │  🎁 Referrals        │                   │
│ Add      │  ─────────────────   │ ← Border          │
│          │  OTHERS              │                   │
│          │  📖 Documentation    │                   │
│          │  ⚙️  Settings        │                   │
│          │                      │                   │
├──────────┴──────────────────────┴───────────────────┤
│                                                      │
│  ───────────────────────────────────────────────    │ ← Border
│                                                      │
│  [●] John Doe              [▼]                      │ ← Bottom Section
│     john@email.com                                  │   (User Profile)
│                                                      │
└──────────────────────────────────────────────────────┘

Total width: 260px
Total height: 100vh
```

### Workspace Avatar States

**Inactive (Default):**

```
    [●]        ← Circle, gray background, gray text
  Personal
```

**Inactive (Hover):**

```
    [▢]        ← Rounded square, blue background, white text
  Personal     ← White text
```

**Active:**

```
  ━ [▢]        ← Rounded square, blue bg, white border, blue bar on right
    Personal   ← White text
```

### Organization Dropup Panel

```
┌────────────────────────────────┐
│ Switch Organization            │ ← Header
├────────────────────────────────┤
│ [P] Personal Org          [>]  │ ← Active (blue)
│     Free • owner               │
├────────────────────────────────┤
│ [A] Acme Corp                  │ ← Inactive (hover: darker)
│     Premium • admin            │
├────────────────────────────────┤
│ [T] Tech Startup               │
│     Free • member              │
├────────────────────────────────┤
│ [+] Create organization        │ ← Create option
└────────────────────────────────┘
     ↑
  Opens upward (dropup) from user profile button
```

---

## Interaction Examples

### Example 1: Switching Workspaces

**User action:** Click "Production" workspace avatar

1. User hovers over Production avatar
   - Shape morphs from circle to rounded square (200ms)
   - Background changes to blue
   - Border appears (gray)
2. User clicks
   - `switchWorkspace('production-id')` called
   - Dashboard immediately shows loading state
3. Visual updates:
   - Personal avatar returns to inactive state (circle, gray)
   - Production avatar becomes active:
     - Stays as rounded square
     - Background: blue
     - Border: white
     - Blue bar appears on right edge
     - Text becomes white
4. Menu updates:
   - If "Production" is not default workspace, Profile menu item fades out
   - Dashboard page reloads with Production data
   - URL updates to include workspace context

**Duration:** ~200-300ms for visual feedback, ~500-1000ms for data reload

---

### Example 2: Opening Organization Switcher

**User action:** Click user profile button at bottom

1. User hovers over profile button
   - Background darkens slightly
   - Cursor becomes pointer
2. User clicks
   - Chevron icon rotates 180° (smooth rotation)
   - Dropup panel fades in above button
   - Panel has subtle shadow
3. User hovers over "Acme Corp"
   - Row background darkens
4. User clicks "Acme Corp"
   - Immediate visual feedback (row highlights blue)
   - `switchOrganization('acme-id')` called
   - Panel closes (fade out)
   - Chevron rotates back
5. Sidebar updates:
   - Workspace column shows Acme's workspaces
   - Menu items update based on permissions in Acme
   - User profile shows "Acme Corp" as current org

**Duration:** ~150ms animation, ~500-1000ms context switch

---

### Example 3: Mobile Sidebar Interaction

**User on phone (< 768px screen)**

1. Page loads
   - Sidebar is hidden (off-screen left)
   - Hamburger menu icon visible in top bar
2. User taps hamburger icon
   - Black semi-transparent backdrop appears
   - Sidebar slides in from left (300ms)
   - Hamburger icon changes to X icon
3. User scrolls through menu
   - Can scroll workspace column independently
   - Can scroll main menu section
4. User clicks "Dashboard"
   - Navigation happens
   - Sidebar automatically slides out
   - Backdrop fades away
5. Alternative: User taps backdrop
   - Sidebar slides out (300ms)
   - Backdrop fades away
   - Returns to hamburger icon

---

## Implementation Checklist

**For developers implementing this sidebar:**

- [ ] Install required dependencies: `lucide-react`, `react-router-dom`, Tailwind CSS
- [ ] Set up dark theme colors in Tailwind config
- [ ] Create AppContext with organization/workspace state
- [ ] Implement permission system (hasPermission function)
- [ ] Build Sidebar component with 3-section layout
- [ ] Build two-column middle section (workspace + menu)
- [ ] Implement workspace avatars with shape morphing
- [ ] Add active workspace indicator (blue bar)
- [ ] Implement menu items with active/hover states
- [ ] Add permission-based filtering for menu items
- [ ] Implement Profile page visibility logic (default workspace only)
- [ ] Build user profile section at bottom
- [ ] Create organization dropup panel
- [ ] Add mobile responsiveness (hamburger menu, slide-in, backdrop)
- [ ] Implement keyboard navigation
- [ ] Add ARIA labels and screen reader support
- [ ] Test focus indicators and color contrast
- [ ] Add smooth transitions (200ms standard)
- [ ] Implement hidden scrollbars for workspace/menu columns
- [ ] Test switching workspaces and organizations
- [ ] Verify menu filtering works correctly

---

## Summary: Quick Reference Table

| Aspect                 | Value/Description                                     |
| ---------------------- | ----------------------------------------------------- |
| **Total Width**        | 260px (desktop), 280-300px (mobile/tablet)            |
| **Total Height**       | 100vh (full viewport height)                          |
| **Background**         | Dark gray #2B2D31 / #1E1F22                           |
| **Sections**           | 3 (Top: logo, Middle: 2-column, Bottom: user profile) |
| **Workspace Column**   | 72px wide, vertical scrollable                        |
| **Menu Column**        | ~188px wide, vertical scrollable                      |
| **Workspace Avatar**   | 44px, circle→rounded square, blue when active         |
| **Active Indicator**   | 4px blue bar on right of avatar                       |
| **Menu Item Height**   | 32-36px, rounded, blue when active                    |
| **Icon Size**          | 16-18px (responsive)                                  |
| **Text Sizes**         | 9-13px (labels/menu), 12-14px (names)                 |
| **Border Color**       | #3a3a3a / #26272B                                     |
| **Active Color**       | Blue #2563EB                                          |
| **Hover Color**        | Dark gray #36373D / #2B2D31                           |
| **Transitions**        | 200ms (shape/color), 300ms (slide-in mobile)          |
| **Mobile Breakpoint**  | < 768px (hamburger menu)                              |
| **Desktop Breakpoint** | ≥ 1024px (always visible)                             |
| **Permissions**        | Filters menu items dynamically                        |
| **Profile Visibility** | Only in default personal workspace                    |

---

## Conclusion

The Privexbot sidebar uses a **unique two-column layout** inspired by Discord's design:

**Key Features:**

- **Left column:** Vertical list of circular workspace avatars with Discord-like morphing and active indicators
- **Right column:** Traditional navigation menu with Main Menu and Others sections
- **Bottom section:** User profile with organization switcher (dropup)
- **Responsive:** Hamburger menu on mobile with slide-in animation
- **Permission-aware:** Dynamically filters menu items based on user permissions
- **Context-aware:** Profile page only shows in default workspace

**Design Philosophy:**

- Clear visual hierarchy with 3 distinct sections
- Smooth animations and transitions (200-300ms)
- High contrast dark theme for readability
- Accessibility-first with keyboard navigation and screen reader support
- Efficient use of space with scrollable sub-sections

This design allows users to quickly switch between workspaces (left column) while navigating pages (right column), all within a compact 260px sidebar.

---

---

Workspace Switcher Experience

What User Sees:

- Small "ACCT" label at top in gray uppercase text
- Stack of workspace avatars (circles by default)
- Currently active workspace shows as a rounded square with white border and a blue vertical bar on the right edge
- Each workspace has tiny text (9px) showing its name below the avatar
- Green dashed circle at bottom with "+" icon (if user has create permission)

Hover Interactions:

- Circle morphs into rounded square over 200ms
- Border appears
- Smooth, satisfying animation

On Click:

- Workspace switches immediately
- New JWT token issued with updated workspace_id
- Menu items change based on new permissions
- Main content reloads with workspace context

Organization Switching

What User Sees:

- User avatar with gradient (blue→purple)
- Username and email below
- Chevron icon on right

On Click:

- Chevron rotates 180°
- Menu drops upward (dropup, not dropdown)
- Shows list of all organizations user belongs to
- Each org shows: Name, subscription tier badge, user role

Switching Experience:

1. User clicks different organization
2. Backend issues new JWT with new org_id and first workspace of that org
3. Entire workspace list changes
4. Menu permissions recalculate
5. User sees different workspaces in left column

Permission-Based Menu Visibility

Key User Experience Insight:

When user switches from "Personal" organization to a team org:

- Profile page disappears from menu (only shows in Personal org + default workspace)
- New menu items may appear based on team role
- If user is just a "viewer", they won't see "Create Chatflow" option
- If user is "owner", they see billing and member management options

Example Scenarios:

1. User in Personal → Default Workspace:

   - Sees: Dashboard, Chatbots, Chatflows, Knowledge Bases, Leads, Analytics, Profile, Organizations, Settings

2. User switches to Team Org → Marketing Workspace (viewer role):

   - Sees: Dashboard, Chatbots (view only), Chatflows (view only), Knowledge Bases (view only), Analytics, Organizations, Settings
   - Profile is gone
   - Create buttons disabled or hidden

3. User switches to Team Org → Marketing Workspace (admin role):

   - Sees: Everything + ability to create/delete resources
   - Can manage workspace members
   - Still no Profile page (only in Personal org)

The "Why" Behind Context Switching

Problem Solved:
Multi-tenancy with clean separation - user can work on personal projects, freelance client projects, and team projects all in one account without data leakage or confusion.

JWT-Based Security:
Every context switch issues a new token with embedded org_id and workspace_id. Backend validates every request against this context. Impossible to access another org's data
even if you know the resource ID.

localStorage Persistence:
When user returns tomorrow, app remembers last org/workspace and restores to that context automatically. No annoying "where was I?" confusion.

Responsive Behavior

Mobile:

- Sidebar collapses to hamburger menu
- Workspace switcher becomes horizontal scrollable row at top
- Organization switcher moves to top-right profile menu
- Touch targets: minimum 44x44px for accessibility

Tablet:

- Workspace switcher: 60px width
- Sidebar menu: slightly condensed text
- Touch-friendly hover states

Desktop:

- Full 72px workspace switcher
- Spacious menu with comfortable click targets
- Mouse hover states work perfectly
