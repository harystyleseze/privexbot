/**
 * Dashboard Layout - Discord-Style Sidebar
 *
 * WHY: Consistent layout for all dashboard pages with org/workspace switching
 * HOW: 3 horizontal sections stacked vertically in sidebar
 *
 * STRUCTURE (3 Horizontal Sections):
 * 1. TOP SECTION: Logo only (fixed at top)
 * 2. MIDDLE SECTION: Two columns side-by-side
 *    - Left: Workspace switcher (60-72px Discord-style)
 *    - Right: Main menu (scrollable)
 * 3. BOTTOM SECTION: User profile + org switcher (fixed at bottom, full width)
 *
 * RESPONSIVE:
 * - Mobile: Workspace column 60px
 * - Small: Workspace column 70px
 * - Large: Workspace column 72px
 * - Total sidebar: 260px on desktop
 *
 * DESIGN:
 * - Always-dark sidebar (light: #2B2D31, dark: #1E1F22)
 * - Content adapts to theme
 * - Borders: #3a3a3a / #26272B
 */

import React, { useState } from "react";
import { Bot } from "lucide-react";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { MainMenu } from "./MainMenu";
import { OrganizationSwitcher } from "./OrganizationSwitcher";
import { CreateWorkspaceModal } from "../workspace/CreateWorkspaceModal";
import { useApp } from "@/contexts/AppContext";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const { currentOrganization, refreshData, switchWorkspace } = useApp();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar Container - Always Dark - 3 Horizontal Sections Stacked Vertically */}
      <div className="flex flex-col h-full w-[260px] flex-shrink-0 bg-[#2B2D31] dark:bg-[#1E1F22] border-r border-[#3a3a3a] dark:border-[#26272B]">
        {/* ========== TOP SECTION: Logo Only (Fixed at Top) ========== */}
        <div className="flex-shrink-0 px-3 sm:px-4 py-3 sm:py-4 border-b border-[#3a3a3a] dark:border-[#26272B] bg-[#2B2D31] dark:bg-[#1E1F22]">
          <div className="flex items-center space-x-2">
            {/* Privexbot Logo Icon */}
            <img
              src="/privexbot-logo-icon.png"
              alt="Privexbot Logo"
              loading="lazy"
              className="h-7 sm:h-8 w-7 sm:w-8 object-contain flex-shrink-0"
            />
            {/* Brand Name */}
            <span className="text-sm sm:text-base font-bold text-white truncate">
              Privexbot
            </span>
          </div>
        </div>

        {/* ========== MIDDLE SECTION: Two-Column Layout (Workspace + Menu) ========== */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Column: Workspace Switcher (72px Discord-style) */}
          <WorkspaceSwitcher onCreateWorkspace={() => setShowCreateWorkspace(true)} />

          {/* Right Column: Main Menu (scrollable) */}
          <MainMenu />
        </div>

        {/* ========== BOTTOM SECTION: User Profile + Org Switcher (Full Width) ========== */}
        <OrganizationSwitcher />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>

      {/* Create Workspace Modal */}
      {currentOrganization && (
        <CreateWorkspaceModal
          isOpen={showCreateWorkspace}
          onClose={() => setShowCreateWorkspace(false)}
          organizationId={currentOrganization.id}
          onWorkspaceCreated={async (workspace) => {
            // Refresh data first to load the new workspace into the array
            await refreshData();
            // Then switch to the newly created workspace
            await switchWorkspace(workspace.id);
          }}
        />
      )}
    </div>
  );
}
