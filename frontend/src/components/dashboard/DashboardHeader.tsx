/**
 * Dashboard Header Component
 *
 * WHY: Provide quick access to search, notifications, and resource creation
 * HOW: Clean icon-based design with pill-shaped controls and dynamic states
 *
 * DESIGN:
 * - Left: Clickable Avatar (to profile) + Greeting (truncated username)
 * - Right: Expandable Search + Bell + Unified Time/Calendar Picker + Create Button
 * - Modern, clean aesthetic with proper spacing and dynamic updates
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, Calendar, Plus, Bot, Network, Book, ChevronDown, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { User } from "@/types/auth";

interface DashboardHeaderProps {
  user?: User | null;
  onCreateChatbot?: () => void;
  onCreateChatflow?: () => void;
  onCreateKnowledgeBase?: () => void;
  onTimeRangeChange?: (timeRange: string) => void;
  selectedTimeRange?: string;
  onCustomDateRangeChange?: (dateRange: string | null) => void;
}

export function DashboardHeader({
  user,
  onCreateChatbot,
  onCreateChatflow,
  onCreateKnowledgeBase,
  onTimeRangeChange,
  selectedTimeRange: propSelectedTimeRange,
  onCustomDateRangeChange,
}: DashboardHeaderProps) {
  const navigate = useNavigate();
  const [hasUnreadNotifications] = useState(true); // TODO: Get from API
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTimeRange, setSelectedTimeRange] = useState(propSelectedTimeRange || "Last 7 days");
  const [selectedDateRange, setSelectedDateRange] = useState<string | null>(null);
  const [calendarStartDate, setCalendarStartDate] = useState<Date | null>(null);
  const [calendarEndDate, setCalendarEndDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Get user initials for avatar fallback
  const userInitials = user?.username
    ? user.username
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const handleSearchToggle = () => {
    setSearchExpanded(!searchExpanded);
    if (searchExpanded) {
      setSearchQuery("");
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // TODO: Implement search functionality
      console.log("Searching for:", searchQuery);
      setSearchExpanded(false);
      setSearchQuery("");
    }
  };

  const handleNotifications = () => {
    // TODO: Open notifications panel
    console.log("Open notifications");
  };

  const handleProfile = () => {
    navigate("/profile");
  };

  const handleTimeRangeSelect = (range: string) => {
    setSelectedTimeRange(range);
    onTimeRangeChange?.(range); // Notify parent component

    // Clear custom date range when selecting a time range
    setSelectedDateRange(null);
    onCustomDateRangeChange?.(null);

    // TODO: Fetch data for selected time range
    console.log("Time range selected:", range);
  };

  const handleDateClick = (date: Date) => {
    if (!calendarStartDate || (calendarStartDate && calendarEndDate)) {
      // First click or reset: set start date
      setCalendarStartDate(date);
      setCalendarEndDate(null);
    } else if (calendarStartDate && !calendarEndDate) {
      // Second click: set end date
      if (date >= calendarStartDate) {
        setCalendarEndDate(date);
      } else {
        // If second date is before first, reset start date
        setCalendarStartDate(date);
        setCalendarEndDate(null);
      }
    }
  };

  const handleApplyCustomRange = () => {
    if (calendarStartDate && calendarEndDate) {
      const startStr = calendarStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const endStr = calendarEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dateRangeStr = `${startStr} - ${endStr}`;
      setSelectedDateRange(dateRangeStr);
      setIsCalendarOpen(false);

      // Notify parent component about custom date range
      onCustomDateRangeChange?.(dateRangeStr);

      // Clear the time range since we're using custom dates
      onTimeRangeChange?.("");

      // TODO: Fetch data for custom date range
      console.log("Custom date range applied:", startStr, endStr);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const isDateInRange = (date: Date) => {
    if (!calendarStartDate) return false;
    if (!calendarEndDate) return date.getTime() === calendarStartDate.getTime();
    return date >= calendarStartDate && date <= calendarEndDate;
  };

  const isDateSelected = (date: Date) => {
    if (!calendarStartDate) return false;
    if (calendarEndDate) {
      return date.getTime() === calendarStartDate.getTime() || date.getTime() === calendarEndDate.getTime();
    }
    return date.getTime() === calendarStartDate.getTime();
  };

  return (
    <div className="w-full bg-white dark:bg-[#1F2937] transition-all duration-500 ease-out">
      <div className="px-4 sm:px-6 lg:pl-6 lg:pr-8 xl:pl-8 xl:pr-12 2xl:pl-8 2xl:pr-16 max-w-none">
        <div className="flex items-center justify-between gap-4 py-4 sm:py-5 md:py-6 lg:py-8">
        {/* Left: Clickable Avatar + Greeting */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          <button
            onClick={handleProfile}
            className="flex-shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-transform hover:scale-105"
          >
            <Avatar className="h-11 w-11 md:h-12 md:w-12 ring-2 ring-gray-200 dark:ring-gray-600 cursor-pointer">
              <AvatarImage src={user?.avatar_url} alt={user?.username} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm md:text-base">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-50 truncate transition-all duration-300 ease-out">
              Hey {user?.username}!
            </h1>
            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-200 truncate transition-all duration-300 ease-out">
              Welcome back! Here's what's happening with your workspace.
            </p>
          </div>
        </div>

        {/* Right: Icon Buttons + Time/Calendar Picker + Create Button */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0">
          {/* Expandable Search */}
          {searchExpanded ? (
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                autoFocus
                className="h-10 w-48 sm:w-64 px-4 pr-10 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full text-sm text-gray-900 dark:text-gray-50 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-400 focus:border-transparent transition-all"
              />
              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={handleSearchToggle}
                className="h-9 w-9 sm:h-10 sm:w-10 min-h-[36px] min-w-[36px] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </form>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSearchToggle}
              className="h-9 w-9 sm:h-10 sm:w-10 min-h-[36px] min-w-[36px] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <Search className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          )}

          {/* Notifications Icon Button */}
          {!searchExpanded && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNotifications}
              className="relative h-9 w-9 sm:h-10 sm:w-10 min-h-[36px] min-w-[36px] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
              {hasUnreadNotifications && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900" />
              )}
            </Button>
          )}

          {/* Unified Time Range + Calendar Picker (Pill-shaped) - Hidden on mobile or when search expanded */}
          {!searchExpanded && (
            <div className="hidden md:flex items-center h-10 bg-gray-100 dark:bg-gray-700 rounded-full border border-gray-200 dark:border-gray-600 overflow-hidden">
              {/* Time Range Selector - Shows selected value */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 px-3 h-full text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors whitespace-nowrap focus:outline-none focus:ring-0">
                    <span className="font-medium transition-all duration-300 ease-out">{selectedTimeRange}</span>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600">
                  <DropdownMenuItem
                    onClick={() => handleTimeRangeSelect("Last 24 hours")}
                    className="hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-50"
                  >
                    Last 24 hours
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleTimeRangeSelect("Last 7 days")}
                    className="hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-50"
                  >
                    Last 7 days
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleTimeRangeSelect("Last 30 days")}
                    className="hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-50"
                  >
                    Last 30 days
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleTimeRangeSelect("Last 90 days")}
                    className="hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-50"
                  >
                    Last 90 days
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Vertical Divider */}
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

              {/* Calendar Date Picker - Shows selected date or icon */}
              <DropdownMenu open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 px-3 h-full text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 focus:outline-none focus:ring-0">
                    <Calendar className="h-4 w-4" />
                    {selectedDateRange && <span className="font-medium hidden lg:inline transition-opacity duration-200">{selectedDateRange}</span>}
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 shadow-xl w-80">
                  {/* Advanced Calendar with Month/Year Navigation */}
                  <div className="space-y-4">
                    {/* Month/Year Header with Navigation */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => navigateMonth('prev')}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">
                        {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </h3>
                      <button
                        onClick={() => navigateMonth('next')}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Selected Range Display */}
                    {(calendarStartDate || calendarEndDate) && (
                      <div className="text-sm text-center bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                        <span className="text-blue-700 dark:text-blue-300 font-medium">
                          {calendarStartDate && !calendarEndDate && "Start: "}
                          {calendarStartDate && calendarStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          {calendarStartDate && calendarEndDate && " - "}
                          {calendarEndDate && calendarEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    )}

                    {/* Calendar Grid */}
                    <div className="space-y-2">
                      {/* Day Headers */}
                      <div className="grid grid-cols-7 gap-1 text-xs">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, i) => (
                          <div key={i} className="text-center font-medium text-gray-500 dark:text-gray-400 p-2">
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* Calendar Days */}
                      <div className="grid grid-cols-7 gap-1">
                        {getDaysInMonth(currentMonth).map((date, i) => {
                          const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                          const isToday = date.toDateString() === new Date().toDateString();
                          const isInRange = isDateInRange(date);
                          const isSelected = isDateSelected(date);

                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => isCurrentMonth && handleDateClick(date)}
                              disabled={!isCurrentMonth}
                              className={cn(
                                "p-2 text-sm text-center rounded-lg transition-all duration-200 hover:scale-105",
                                isCurrentMonth
                                  ? "text-gray-900 dark:text-gray-50 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                  : "text-gray-300 dark:text-gray-600 cursor-not-allowed",
                                isToday && "font-bold text-blue-600 dark:text-blue-400",
                                isSelected && "bg-blue-600 text-white hover:bg-blue-700",
                                isInRange && !isSelected && "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                              )}
                            >
                              {date.getDate()}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => {
                          setCalendarStartDate(null);
                          setCalendarEndDate(null);
                          setSelectedDateRange(null);
                        }}
                        className="flex-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors"
                      >
                        Clear
                      </button>
                      <button
                        onClick={handleApplyCustomRange}
                        disabled={!calendarStartDate || !calendarEndDate}
                        className={cn(
                          "flex-1 text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200",
                          calendarStartDate && calendarEndDate
                            ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                        )}
                      >
                        Apply Range
                      </button>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Create Button (Pill-shaped, Bright) */}
          {!searchExpanded && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="h-10 min-h-[40px] px-4 sm:px-5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-md hover:shadow-lg rounded-full transition-all duration-200">
                  <Plus className="h-4 w-4 mr-1.5" />
                  <span>Create</span>
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 rounded-xl shadow-lg">
                <DropdownMenuItem
                  onClick={onCreateChatbot || (() => navigate("/chatbots/create"))}
                  className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 rounded-lg m-1 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-gray-50">Chatbot</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Simple form-based bot</div>
                    </div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onCreateChatflow || (() => navigate("/studio"))}
                  className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 rounded-lg m-1 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <Network className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-gray-50">Chatflow</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Visual workflow builder</div>
                    </div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onCreateKnowledgeBase || (() => navigate("/knowledge-bases/create"))}
                  className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 rounded-lg m-1 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <Book className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-gray-50">Knowledge Base</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Upload documents for RAG</div>
                    </div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
