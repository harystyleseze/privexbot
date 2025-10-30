/**
 * Main Menu Component (Right Sidebar Column)
 *
 * WHY: Navigation with permission-based filtering and context-aware visibility
 * HOW: Two sections with intelligent menu item filtering
 *
 * SECTIONS:
 * 1. Main Menu - Core pages with "MAIN MENU" label (scrollable)
 * 2. Others - Documentation, Settings with "OTHERS" label (fixed at bottom)
 *
 * MENU ITEMS:
 * - Main: Dashboard, Chatbots, Studio, KB, Leads, Analytics, Profile, Organizations, Marketplace, Referrals
 * - Others: Documentation, Settings
 *
 * VISIBILITY RULES:
 * - Always visible: Dashboard, Analytics, Organizations, Marketplace, Referrals, Documentation, Settings
 * - Permission-based: Chatbots (chatbot:view), Studio (chatflow:view), KB (kb:view), Leads (lead:view)
 * - Context-based: Profile (ONLY in Personal org + default workspace)
 *
 * DESIGN:
 * - Height: 32-36px per item, rounded-lg
 * - Active: Blue bg-blue-600, white text, shadow-sm
 * - Hover: Dark gray bg, white text
 * - Icons: 16-18px responsive
 * - Text: 12-13px responsive, font-medium
 * - Transitions: 200ms
 */

import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutGrid,
  Bot,
  Workflow,
  Database,
  Mail,
  BarChart3,
  User,
  Building2,
  Briefcase,
  Gift,
  FileText,
  Settings,
  CreditCard,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useApp } from "@/contexts/AppContext";
import type { Permission } from "@/types/tenant";

interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  permission?: Permission;
  requiresDefaultWorkspace?: boolean;
}

const mainMenuItems: MenuItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutGrid,
  },
  {
    name: "Chatbots",
    href: "/chatbots",
    icon: Bot,
    permission: "chatbot:view",
  },
  {
    name: "Studio",
    href: "/studio",
    icon: Workflow,
    badge: "New",
    permission: "chatflow:view",
  },
  {
    name: "Knowledge Base",
    href: "/knowledge-base",
    icon: Database,
    permission: "kb:view",
  },
  {
    name: "Leads",
    href: "/leads",
    icon: Mail,
    permission: "lead:view",
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    name: "Billings",
    href: "/billings",
    icon: CreditCard,
    permission: "org:billing", // Only for owners and admins
  },
  {
    name: "Profile",
    href: "/profile",
    icon: User,
    requiresDefaultWorkspace: true, // Special: Only in Personal org + default workspace
  },
  {
    name: "Organizations",
    href: "/organizations",
    icon: Building2,
  },
  {
    name: "Marketplace",
    href: "/marketplace",
    icon: Briefcase,
  },
  {
    name: "Referrals",
    href: "/referrals",
    icon: Gift,
  },
];

const otherMenuItems: MenuItem[] = [
  {
    name: "Documentation",
    href: "/documentation",
    icon: FileText,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function MainMenu() {
  const location = useLocation();
  const { organizations, currentOrganization, workspaces, currentWorkspace, hasPermission } =
    useApp();

  /**
   * Check if user is in default context (Personal org + default workspace)
   */
  const isInDefaultContext = React.useMemo(() => {
    // First organization is Personal org (created on signup)
    const isDefaultOrganization = organizations?.[0]?.id === currentOrganization?.id;

    // Default workspace: name matches org name OR is_default flag OR first workspace
    const isDefaultWorkspace =
      currentWorkspace?.is_default ||
      currentWorkspace?.name === currentOrganization?.name ||
      workspaces?.[0]?.id === currentWorkspace?.id;

    return isDefaultOrganization && isDefaultWorkspace;
  }, [organizations, currentOrganization, workspaces, currentWorkspace]);

  /**
   * Filter menu items based on permissions and context
   */
  const filterMenuItems = (items: MenuItem[]): MenuItem[] => {
    return items.filter((item) => {
      // Check permission requirement
      if (item.permission && !hasPermission(item.permission)) {
        return false;
      }

      // Check workspace context requirement (Profile page)
      if (item.requiresDefaultWorkspace && !isInDefaultContext) {
        return false;
      }

      return true;
    });
  };

  const filteredMainMenu = filterMenuItems(mainMenuItems);
  const filteredOtherMenu = filterMenuItems(otherMenuItems);

  /**
   * Render menu item
   */
  const renderMenuItem = (item: MenuItem) => {
    const isActive = location.pathname === item.href;
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        to={item.href}
        className={cn(
          "flex items-center justify-between px-2 sm:px-3 py-2 rounded-lg transition-all duration-200",
          isActive
            ? "bg-blue-600 text-white shadow-sm"
            : "text-gray-300 dark:text-gray-400 hover:bg-[#36373D] dark:hover:bg-[#2B2D31] hover:text-white"
        )}
      >
        <div className="flex items-center mr-2 sm:mr-3 min-w-0 flex-1">
          <Icon className={cn(
            "h-4 w-4 sm:h-[18px] sm:w-[18px] flex-shrink-0 mr-2 sm:mr-3 transition-colors",
            isActive ? "text-white" : "text-gray-400 dark:text-gray-500"
          )} />
          <span className="text-xs sm:text-[13px] font-medium truncate">{item.name}</span>
        </div>
        {item.badge && (
          <Badge
            variant="secondary"
            className="ml-2 text-[10px] sm:text-xs bg-green-500 text-white hover:bg-green-600 flex-shrink-0"
          >
            {item.badge}
          </Badge>
        )}
      </Link>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#2B2D31] dark:bg-[#1E1F22]">
      {/* Main Menu Section - Scrollable */}
      <div className="flex-1 px-2 sm:px-3 py-3 sm:py-4 space-y-0.5 sm:space-y-1 overflow-y-auto scrollbar-hide">
        {/* "MAIN MENU" Label */}
        <div className="mb-2 px-1">
          <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Main Menu
          </span>
        </div>

        {/* Main Menu Items */}
        {filteredMainMenu.map(renderMenuItem)}
      </div>

      {/* Others Section - Fixed at bottom */}
      <div className="flex-shrink-0 px-2 sm:px-3 py-2 sm:py-3 space-y-0.5 sm:space-y-1 border-t border-[#3a3a3a] dark:border-[#26272B]">
        {/* "OTHERS" Label */}
        <div className="mb-1 sm:mb-2 px-1">
          <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Others
          </span>
        </div>

        {/* Others Menu Items */}
        {filteredOtherMenu.map(renderMenuItem)}
      </div>
    </div>
  );
}
