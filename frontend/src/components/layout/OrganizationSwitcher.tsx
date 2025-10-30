/**
 * Organization Switcher Component (Bottom Section - Full Width)
 *
 * WHY: Allow users to switch between organizations with dropup menu
 * HOW: Fixed at bottom of sidebar spanning full width (260px)
 *
 * POSITION: Bottom section of 3-section layout (Top: Logo | Middle: Workspace+Menu | Bottom: This)
 *
 * FEATURES:
 * - User avatar with gradient (blue→purple)
 * - Username + email display
 * - Dropup menu (opens upward, not downward)
 * - Organization list with avatars, tier, and role
 * - Active indicator (blue bg-blue-600 + ChevronRight)
 * - Chevron rotates 180° when open
 * - Auto-closes on selection
 *
 * DESIGN:
 * - Spans full sidebar width (not nested in columns)
 * - Fixed at bottom (flex-shrink-0)
 * - Border-top: #3a3a3a / #26272B separator
 * - Dropup: bottom-full positioning (appears above)
 * - Colors: Blue-600 (active), gradient blue-500→purple-600 (avatar)
 */

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, Settings, LogOut, Plus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";

export function OrganizationSwitcher() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { organizations, currentOrganization, switchOrganization, isLoading } = useApp();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debug logging
  useEffect(() => {
    console.log("[OrganizationSwitcher] Organizations:", organizations);
    console.log("[OrganizationSwitcher] Current Org:", currentOrganization);
    console.log("[OrganizationSwitcher] User:", user);
  }, [organizations, currentOrganization, user]);

  /**
   * Get initials from name
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
   * Handle organization switch
   */
  const handleSwitch = async (orgId: string) => {
    if (orgId === currentOrganization?.id) {
      setShowDropdown(false);
      return;
    }

    try {
      await switchOrganization(orgId);
      setShowDropdown(false);
    } catch (error) {
      console.error("Failed to switch organization:", error);
    }
  };

  /**
   * Close dropdown when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <div
      ref={dropdownRef}
      className="flex-shrink-0 p-2 sm:p-3 border-t border-[#3a3a3a] dark:border-[#26272B] relative transition-colors bg-[#2B2D31] dark:bg-[#1E1F22]"
    >
      {/* Toggle Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="w-full flex items-center justify-between p-1.5 sm:p-2 rounded-md hover:bg-[#36373D] dark:hover:bg-[#2B2D31] transition-colors"
      >
        <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0 flex-1">
          {/* User Avatar with gradient (blue→purple) */}
          <Avatar className="h-7 sm:h-8 w-7 sm:w-8 flex-shrink-0">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-[10px] sm:text-xs font-semibold">
              {user ? getInitials(user.username) : "U"}
            </AvatarFallback>
          </Avatar>

          {/* User Info */}
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs sm:text-sm font-medium text-white truncate">
              {user?.username || "User"}
            </p>
            <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 truncate">
              {user?.email || "user@email.com"}
            </p>
          </div>
        </div>

        {/* Chevron rotates when open */}
        <ChevronDown
          className={cn(
            "h-3.5 sm:h-4 w-3.5 sm:w-4 text-gray-400 dark:text-gray-500 flex-shrink-0 transition-transform ml-1",
            showDropdown && "transform rotate-180"
          )}
        />
      </button>

      {/* Dropup Menu (appears ABOVE button) */}
      {showDropdown && (
        <div className="absolute bottom-full left-2 right-2 sm:left-3 sm:right-3 mb-2 bg-[#36373D] dark:bg-[#2B2D31] border border-[#4a4b50] dark:border-[#3a3b40] rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto scrollbar-hide transition-colors">
          {/* Organization List */}
          <div className="p-2">
            {/* Loading State */}
            {isLoading && organizations.length === 0 && (
              <div className="flex items-center space-x-2 p-2">
                <div className="h-6 w-6 rounded-full bg-gray-700 animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-700 rounded animate-pulse mb-1"></div>
                  <div className="h-2 bg-gray-700 rounded animate-pulse w-2/3"></div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && organizations.length === 0 && (
              <div className="p-4 text-center">
                <p className="text-xs text-gray-400">No organizations found</p>
                <p className="text-[10px] text-gray-500 mt-1">Please contact support</p>
              </div>
            )}

            {/* Organizations List */}
            {organizations.map((org) => {
              const isActive = org.id === currentOrganization?.id;

              return (
                <button
                  key={org.id}
                  onClick={() => handleSwitch(org.id)}
                  className={cn(
                    "w-full flex items-center space-x-1.5 sm:space-x-2 p-1.5 sm:p-2 rounded-md text-left transition-colors",
                    isActive
                      ? "bg-blue-600 text-white"
                      : "hover:bg-[#2B2D31] dark:hover:bg-[#232427] text-gray-200 dark:text-gray-300"
                  )}
                >
                  {/* Organization Avatar */}
                  <Avatar className="h-5 sm:h-6 w-5 sm:w-6 flex-shrink-0">
                    <AvatarFallback
                      className={cn(
                        "text-[10px] sm:text-xs font-semibold",
                        isActive
                          ? "bg-blue-700 text-white"
                          : "bg-[#4a4b50] dark:bg-[#3a3b40] text-gray-200 dark:text-gray-300"
                      )}
                    >
                      {getInitials(org.name)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Organization Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium truncate">{org.name}</p>
                    <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 capitalize truncate">
                      {org.subscription_tier} • {org.user_role}
                    </p>
                  </div>

                  {/* Active Indicator */}
                  {isActive && (
                    <ChevronRight className="h-3.5 sm:h-4 w-3.5 sm:w-4 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Separator */}
          <div className="border-t border-[#4a4b50] dark:border-[#3a3b40] my-1"></div>

          {/* Actions */}
          <div className="p-2 space-y-1">
            {/* Manage Organizations */}
            <button
              onClick={() => {
                navigate("/organizations");
                setShowDropdown(false);
              }}
              className="w-full flex items-center space-x-2 p-2 rounded-md text-gray-200 dark:text-gray-300 hover:bg-[#2B2D31] dark:hover:bg-[#232427] transition-colors text-left"
            >
              <Settings className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium">Manage Organizations</span>
            </button>

            {/* Logout */}
            <button
              onClick={() => {
                logout();
                setShowDropdown(false);
              }}
              className="w-full flex items-center space-x-2 p-2 rounded-md text-red-400 hover:bg-red-500/10 transition-colors text-left"
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium">Log Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
