/**
 * Stats Cards Component
 *
 * WHY: Display key workspace metrics in a unified, visually cohesive layout
 * HOW: Icon and label on same line, value prominent, growth indicators beneath
 *
 * DESIGN:
 * - Cards feel unified with shortened vertical dividers between them
 * - Responsive grid: 1 column (mobile) → 2 columns (sm) → 4 columns (lg)
 * - Icon and label on SAME LINE (Title Case, not UPPERCASE)
 * - Metric value prominent below
 * - Growth indicator beneath the value
 * - Vertical dividers positioned more to the right, not touching horizontal dividers
 */

import { Bot, Network, Book, MessageCircle, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardStats } from "@/types/dashboard";

interface StatsCardsProps {
  stats: DashboardStats;
  isLoading?: boolean;
  timeRange?: string; // For dynamic reference period
  customDateRange?: string | null; // For custom date selections
}

export function StatsCards({ stats, isLoading, timeRange, customDateRange }: StatsCardsProps) {
  // Helper function to get exact comparison period with specific dates
  const getReferencePeriod = (timeRange?: string, customDateRange?: string | null) => {
    const today = new Date();

    // If custom date range is selected, calculate exact previous period
    if (customDateRange) {
      const [startStr, endStr] = customDateRange.split(' - ');
      if (startStr && endStr) {
        // Parse the selected dates (assuming current year)
        const startDate = new Date(startStr + ', 2024');
        const endDate = new Date(endStr + ', 2024');
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        // Calculate the exact previous period (same duration, immediately before)
        const prevEndDate = new Date(startDate);
        prevEndDate.setDate(prevEndDate.getDate() - 1);
        const prevStartDate = new Date(prevEndDate);
        prevStartDate.setDate(prevStartDate.getDate() - daysDiff);

        const prevStartStr = prevStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const prevEndStr = prevEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        return `vs ${prevStartStr}-${prevEndStr}`;
      }
    }

    // Standard time range comparisons with calculated dates
    switch (timeRange) {
      case "Last 24 hours": {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const dayBefore = new Date(today);
        dayBefore.setDate(dayBefore.getDate() - 2);

        const yesterdayStr = yesterday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const dayBeforeStr = dayBefore.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `vs ${dayBeforeStr}-${yesterdayStr}`;
      }
      case "Last 7 days": {
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const fourteenDaysAgo = new Date(today);
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        const startStr = fourteenDaysAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endStr = sevenDaysAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `vs ${startStr}-${endStr}`;
      }
      case "Last 30 days": {
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const sixtyDaysAgo = new Date(today);
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        const startStr = sixtyDaysAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endStr = thirtyDaysAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `vs ${startStr}-${endStr}`;
      }
      case "Last 90 days": {
        const ninetyDaysAgo = new Date(today);
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        const oneEightyDaysAgo = new Date(today);
        oneEightyDaysAgo.setDate(oneEightyDaysAgo.getDate() - 180);

        const startStr = oneEightyDaysAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endStr = ninetyDaysAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `vs ${startStr}-${endStr}`;
      }
      default: {
        // Default to last 30 days comparison
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const sixtyDaysAgo = new Date(today);
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        const startStr = sixtyDaysAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endStr = thirtyDaysAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `vs ${startStr}-${endStr}`;
      }
    }
  };

  const referencePeriod = getReferencePeriod(timeRange, customDateRange);
  if (isLoading) {
    return (
      <div className="w-full bg-white dark:bg-[#1F2937] transition-all duration-500 ease-out">
        <div className="px-4 sm:px-6 lg:pl-6 lg:pr-8 xl:pl-8 xl:pr-12 2xl:pl-8 2xl:pr-16 max-w-none">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={cn(
                "p-4 sm:p-5 md:p-6 lg:p-7 relative",
                "border-b border-gray-200 dark:border-gray-700/50 sm:border-b-0 last:border-b-0",
                "animate-pulse transition-all duration-500 ease-out"
              )}
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0 transition-all duration-300" />
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded transition-all duration-300" />
                </div>
                <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded transition-all duration-300" />
              </div>
            </div>
          ))}
          </div>
        </div>
      </div>
    );
  }

  const statItems = [
    {
      icon: Bot,
      label: "Total Chatbots",
      value: stats.total_chatbots,
      delta: stats.chatbots_delta,
      color: "blue",
    },
    {
      icon: Network,
      label: "Total Chatflows",
      value: stats.total_chatflows,
      delta: stats.chatflows_delta,
      color: "purple",
    },
    {
      icon: Book,
      label: "Knowledge Bases",
      value: stats.total_knowledge_bases,
      delta: stats.knowledge_bases_delta,
      color: "green",
    },
    {
      icon: MessageCircle,
      label: "Conversations",
      value: stats.total_conversations.toLocaleString(),
      delta: stats.conversations_delta,
      color: "orange",
    },
  ];

  return (
    <div className="w-full bg-white dark:bg-[#1F2937] transition-all duration-500 ease-out">
      <div className="px-4 sm:px-6 lg:pl-6 lg:pr-8 xl:pl-8 xl:pr-12 2xl:pl-8 2xl:pr-16 max-w-none">
        {/* Unified Stats Grid with Shortened Vertical Dividers and smooth animations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 relative transition-all duration-300 ease-out">
        {statItems.map((stat, index) => {
          const Icon = stat.icon;
          const isPositive = stat.delta !== undefined && stat.delta > 0;
          const isNegative = stat.delta !== undefined && stat.delta < 0;

          // Icon colors
          const iconColors = {
            blue: "text-blue-700 dark:text-blue-300",
            purple: "text-purple-700 dark:text-purple-300",
            green: "text-green-700 dark:text-green-300",
            orange: "text-orange-700 dark:text-orange-300",
          };

          return (
            <div
              key={index}
              className={cn(
                "p-4 sm:p-5 md:p-6 lg:p-7 group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all duration-300 cursor-default relative transform hover:scale-[1.02]",
                // Bottom border on mobile for separation
                "border-b border-gray-200 dark:border-gray-700/50 sm:border-b-0 last:border-b-0"
              )}
            >
              {/* Shortened Vertical Divider - Positioned more to the right */}
              {index < 3 && (
                <>
                  {/* Desktop dividers (4 columns) */}
                  <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 h-16 w-px bg-gray-200 dark:bg-gray-700/50" />
                  {/* Tablet dividers (2 columns) */}
                  {index < 2 && (
                    <div className="hidden sm:block lg:hidden absolute right-0 top-1/2 -translate-y-1/2 h-16 w-px bg-gray-200 dark:bg-gray-700/50" />
                  )}
                  {/* Special case for 3rd item on tablet (2x2 grid) */}
                  {index === 2 && (
                    <div className="hidden sm:block lg:hidden absolute right-0 top-1/2 -translate-y-1/2 h-16 w-px bg-gray-200 dark:bg-gray-700/50" />
                  )}
                </>
              )}

              <div className="space-y-3">
                {/* Icon and Label on Same Line */}
                <div className="flex items-center gap-2">
                  {/* Icon */}
                  <div className="inline-flex flex-shrink-0 transition-transform group-hover:scale-105">
                    <Icon
                      className={cn("h-4 w-4 sm:h-5 sm:w-5", iconColors[stat.color as keyof typeof iconColors])}
                    />
                  </div>

                  {/* Label - Title Case */}
                  <p className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </p>
                </div>

                {/* Value - Large and Prominent with smooth transitions */}
                <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white transition-all duration-500 ease-out">
                  <span className="inline-block transition-transform duration-500 ease-out group-hover:scale-105">
                    {stat.value}
                  </span>
                </p>

                {/* Growth Indicator Badge (Beneath Value) with smooth animations */}
                {stat.delta !== undefined && (
                  <div
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs transition-all duration-300 ease-out transform hover:scale-105",
                      isPositive &&
                        "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
                      isNegative &&
                        "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
                      !isPositive &&
                        !isNegative &&
                        "bg-gray-100 dark:bg-gray-700/30 text-gray-700 dark:text-gray-400"
                    )}
                  >
                    {/* Growth icon */}
                    {isPositive ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : isNegative ? (
                      <TrendingDown className="h-3 w-3" />
                    ) : null}

                    {/* Bold percentage */}
                    <span className="font-bold text-xs">
                      {isPositive ? '+' : ''}{Math.abs(stat.delta).toFixed(1)}%
                    </span>

                    {/* Smaller contextual comparison dates */}
                    <span className="text-[10px] opacity-75 font-normal">
                      {referencePeriod}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
