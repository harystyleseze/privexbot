/**
 * Recent Activities Component
 *
 * WHY: Show users what's happening across all their resources
 * HOW: Activity feed with color-coded icons and timestamps
 *
 * FEATURES:
 * - Color-coded icons based on activity type
 * - Relative timestamps (e.g., "2 hours ago")
 * - Hover effects for interactivity
 * - Clickable rows to navigate to resource
 * - Responsive layout
 */

import {
  Bot,
  Network,
  Book,
  Users,
  MessageCircle,
  AlertCircle,
  Settings,
  CheckCircle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/utils/time";
import type { Activity, ActivityType } from "@/types/dashboard";

interface RecentActivitiesProps {
  activities: Activity[];
  onViewAll?: () => void;
  onActivityClick?: (activity: Activity) => void;
  isLoading?: boolean;
}

export function RecentActivities({
  activities,
  onViewAll,
  onActivityClick,
  isLoading,
}: RecentActivitiesProps) {
  // Map activity types to icon and color
  const getActivityIcon = (type: ActivityType) => {
    const iconMap: Record<ActivityType, { icon: typeof Bot; colorClass: string; bgClass: string }> = {
      chatbot_created: {
        icon: Bot,
        colorClass: "text-blue-600 dark:text-blue-400",
        bgClass: "bg-blue-100 dark:bg-blue-900/30",
      },
      chatbot_updated: {
        icon: Bot,
        colorClass: "text-blue-600 dark:text-blue-400",
        bgClass: "bg-blue-100 dark:bg-blue-900/30",
      },
      chatbot_deployed: {
        icon: CheckCircle,
        colorClass: "text-green-600 dark:text-green-400",
        bgClass: "bg-green-100 dark:bg-green-900/30",
      },
      chatflow_created: {
        icon: Network,
        colorClass: "text-purple-600 dark:text-purple-400",
        bgClass: "bg-purple-100 dark:bg-purple-900/30",
      },
      chatflow_updated: {
        icon: Network,
        colorClass: "text-purple-600 dark:text-purple-400",
        bgClass: "bg-purple-100 dark:bg-purple-900/30",
      },
      chatflow_deployed: {
        icon: CheckCircle,
        colorClass: "text-green-600 dark:text-green-400",
        bgClass: "bg-green-100 dark:bg-green-900/30",
      },
      kb_created: {
        icon: Book,
        colorClass: "text-green-600 dark:text-green-400",
        bgClass: "bg-green-100 dark:bg-green-900/30",
      },
      kb_updated: {
        icon: Book,
        colorClass: "text-green-600 dark:text-green-400",
        bgClass: "bg-green-100 dark:bg-green-900/30",
      },
      lead_captured: {
        icon: Users,
        colorClass: "text-orange-600 dark:text-orange-400",
        bgClass: "bg-orange-100 dark:bg-orange-900/30",
      },
      conversation_started: {
        icon: MessageCircle,
        colorClass: "text-blue-600 dark:text-blue-400",
        bgClass: "bg-blue-100 dark:bg-blue-900/30",
      },
      error_occurred: {
        icon: AlertCircle,
        colorClass: "text-red-600 dark:text-red-400",
        bgClass: "bg-red-100 dark:bg-red-900/30",
      },
      settings_changed: {
        icon: Settings,
        colorClass: "text-yellow-600 dark:text-yellow-400",
        bgClass: "bg-yellow-100 dark:bg-yellow-900/30",
      },
    };

    return iconMap[type] || {
      icon: Clock,
      colorClass: "text-gray-600 dark:text-gray-400",
      bgClass: "bg-gray-100 dark:bg-gray-700/50",
    };
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#374151] border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm">
        <div className="p-4 sm:p-5 md:p-6 border-b border-gray-200 dark:border-gray-600">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="p-3 sm:p-4 md:p-5 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg animate-pulse">
              <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm h-full flex flex-col">
      {/* Header - No border divider for unified look */}
      <div className="flex items-start justify-between p-5 sm:p-6 flex-shrink-0">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1">
            Recent Activities
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Latest updates and events from your account
          </p>
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-gray-500 text-sm font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all bg-transparent"
          >
            View All
            <span className="text-xs">→</span>
          </button>
        )}
      </div>

      {/* Activities List */}
      <div className="flex-1 p-4 sm:p-5 md:p-6">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-3" />
            <p className="text-sm text-gray-700 dark:text-gray-200">No recent activities</p>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
              Activities will appear here as you work
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {activities.slice(0, 3).map((activity, index) => {
              const { icon: Icon, colorClass } = getActivityIcon(activity.type);

              // Extract base color from colorClass for border matching
              const borderColorClass = colorClass.includes('blue')
                ? 'border-blue-300 dark:border-blue-500'
                : colorClass.includes('purple')
                ? 'border-purple-300 dark:border-purple-500'
                : colorClass.includes('green')
                ? 'border-green-300 dark:border-green-500'
                : colorClass.includes('orange')
                ? 'border-orange-300 dark:border-orange-500'
                : colorClass.includes('red')
                ? 'border-red-300 dark:border-red-500'
                : colorClass.includes('yellow')
                ? 'border-yellow-300 dark:border-yellow-500'
                : 'border-gray-300 dark:border-gray-500';

              return (
                <div key={activity.id}>
                  <div
                    onClick={() => onActivityClick?.(activity)}
                    className={cn(
                      "flex items-center gap-3 py-3 transition-all duration-200",
                      "hover:bg-gray-50 dark:hover:bg-gray-700/50 -mx-2 px-2 rounded-lg",
                      onActivityClick && "cursor-pointer"
                    )}
                  >
                    {/* Icon - Small circular outline with activity-specific color */}
                    <div className="flex-shrink-0">
                      <div className={cn(
                        "w-8 h-8 rounded-full border flex items-center justify-center bg-transparent",
                        borderColorClass
                      )}>
                        <Icon className={cn("h-4 w-4", colorClass)} />
                      </div>
                    </div>

                    {/* Text Block - Center */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {activity.title}
                      </p>
                      {activity.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5 truncate">
                          {activity.description}
                        </p>
                      )}
                    </div>

                    {/* Timestamp - Right-aligned */}
                    <div className="flex-shrink-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatRelativeTime(activity.timestamp)}
                      </p>
                    </div>
                  </div>

                  {/* Light divider between items - aligned with text content */}
                  {index < Math.min(activities.length - 1, 2) && (
                    <div className="border-b border-gray-100 dark:border-gray-700 ml-11"></div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Mobile View All Button */}
      {onViewAll && (
        <div className="sm:hidden p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onViewAll}
            className="w-full min-h-[40px] text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium flex items-center justify-center gap-1 transition-colors"
          >
            View All Activities
            <span>→</span>
          </button>
        </div>
      )}
    </div>
  );
}
