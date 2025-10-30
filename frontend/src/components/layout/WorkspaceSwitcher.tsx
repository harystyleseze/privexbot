/**
 * Workspace Switcher Component (Left Sidebar Column)
 *
 * WHY: Discord-style workspace switching with visual feedback
 * HOW: Avatar column with circle→square morphing, active indicators
 *
 * FEATURES:
 * - Workspace avatars with initials
 * - Circle → Rounded square hover transition (200ms)
 * - Active: Rounded square + white border + blue bar on right
 * - Workspace name below avatar (text-[9px])
 * - Add workspace button (dashed, green hover)
 * - "ACCT" label at top
 *
 * DESIGN:
 * - Width: 60px (mobile) → 70px (sm) → 72px (lg)
 * - Border-right: #3a3a3a (light) / #26272B (dark)
 * - Background: Always dark (light: #2B2D31, dark: #1E1F22)
 */

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useApp } from "@/contexts/AppContext";

interface WorkspaceSwitcherProps {
  onCreateWorkspace?: () => void;
}

export function WorkspaceSwitcher({ onCreateWorkspace }: WorkspaceSwitcherProps) {
  const { workspaces, currentWorkspace, switchWorkspace, hasPermission, isLoading, error } = useApp();

  const canCreateWorkspace = hasPermission("workspace:create");

  // Debug logging
  React.useEffect(() => {
    console.log("[WorkspaceSwitcher] Workspaces:", workspaces);
    console.log("[WorkspaceSwitcher] Current Workspace:", currentWorkspace);
    console.log("[WorkspaceSwitcher] Can Create:", canCreateWorkspace);
  }, [workspaces, currentWorkspace, canCreateWorkspace]);

  /**
   * Get initials from workspace name
   */
  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  /**
   * Handle workspace switch
   */
  const handleSwitch = async (workspaceId: string) => {
    if (workspaceId === currentWorkspace?.id) return;

    try {
      await switchWorkspace(workspaceId);
    } catch (error) {
      console.error("Failed to switch workspace:", error);
    }
  };

  return (
    <div className="w-[60px] sm:w-[70px] lg:w-[72px] flex-shrink-0 flex flex-col bg-[#2B2D31] dark:bg-[#1E1F22] border-r border-[#3a3a3a] dark:border-[#26272B] overflow-y-auto scrollbar-hide">
      {/* ACCT Label */}
      <div className="px-1.5 sm:px-2 pt-3 pb-2 flex-shrink-0">
        <span className="text-[8px] sm:text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          ACCT
        </span>
      </div>

      {/* Workspace List - Scrollable */}
      <div className="flex-1 px-1.5 sm:px-2 space-y-2 overflow-y-auto scrollbar-hide">
        {/* Loading State */}
        {isLoading && workspaces.length === 0 && (
          <div className="flex flex-col items-center py-4">
            <div className="h-11 w-11 rounded-full bg-gray-700 animate-pulse mb-1"></div>
            <div className="h-2 w-12 bg-gray-700 rounded animate-pulse"></div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && workspaces.length === 0 && (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="h-11 w-11 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center mb-1">
              <span className="text-xs text-gray-500">?</span>
            </div>
            <span className="text-[9px] text-gray-500">No workspaces</span>
          </div>
        )}

        {/* Workspace List */}
        {workspaces.map((workspace) => {
          const isActive = workspace.id === currentWorkspace?.id;

          return (
            <button
              key={workspace.id}
              onClick={() => handleSwitch(workspace.id)}
              className={cn(
                "relative group flex flex-col items-center w-full",
                // Active indicator - blue bar on right side (4px × 32px)
                isActive &&
                  "after:absolute after:-right-2 after:top-3 after:w-1 after:h-8 after:bg-blue-600 after:rounded-full"
              )}
              title={workspace.name}
            >
              {/* Avatar with transition effects */}
              <div
                className={cn(
                  "relative mb-1 transition-all duration-200",
                  isActive
                    ? "rounded-[14px]" // Active: Rounded square
                    : "rounded-full group-hover:rounded-[14px]" // Inactive: Circle → Rounded square on hover
                )}
              >
                <Avatar
                  className={cn(
                    "h-11 w-11 transition-all duration-200 border-2",
                    isActive
                      ? "border-white rounded-[14px]"
                      : "border-transparent rounded-full group-hover:rounded-[14px] group-hover:border-gray-500"
                  )}
                >
                  <AvatarFallback
                    className={cn(
                      "text-xs font-bold transition-colors",
                      isActive
                        ? "bg-blue-600 text-white"
                        : "bg-[#36373D] dark:bg-[#2B2D31] text-gray-300 dark:text-gray-400 group-hover:bg-blue-500 group-hover:text-white"
                    )}
                  >
                    {getInitials(workspace.name)}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Workspace name below avatar */}
              <span
                className={cn(
                  "text-[9px] font-medium text-center truncate w-full px-0.5 transition-colors",
                  isActive
                    ? "text-white"
                    : "text-gray-400 dark:text-gray-500 group-hover:text-gray-200"
                )}
              >
                {workspace.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Add Workspace Button - Fixed at bottom of workspace list */}
      {canCreateWorkspace && onCreateWorkspace && (
        <div className="flex-shrink-0 px-1.5 sm:px-2 pb-3">
          <button
            onClick={onCreateWorkspace}
            className="group flex flex-col items-center w-full"
            title="Add Workspace"
          >
            {/* Dashed border circle that transforms */}
            <div className="h-11 w-11 rounded-full border-2 border-dashed border-gray-600 dark:border-gray-700 flex items-center justify-center group-hover:border-green-500 group-hover:rounded-[14px] transition-all duration-200 mb-1">
              <Plus className="h-5 w-5 text-gray-500 dark:text-gray-600 group-hover:text-green-400 transition-colors" />
            </div>
            <span className="text-[9px] font-medium text-gray-500 dark:text-gray-600 group-hover:text-green-400 transition-colors">
              Add
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
