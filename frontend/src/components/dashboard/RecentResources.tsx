/**
 * Recent Resources Component
 *
 * WHY: Display recently created/modified resources (chatbots, chatflows, KBs)
 * HOW: Tabbed layout with resource cards
 *
 * FEATURES:
 * - Tabs for switching between resource types
 * - Resource cards with status badges
 * - Quick actions (view, edit)
 * - Responsive layout
 * - Fixed tab switching animation (no shaking)
 */

import { useState } from "react";
import { Bot, Network, Book, MessageCircle, MoreVertical, Eye, Edit, Trash2, FileText, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/utils/time";
import type { ChatbotSummary, ChatflowSummary, KnowledgeBaseSummary, ResourceStatus } from "@/types/dashboard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RecentResourcesProps {
  chatbots: ChatbotSummary[];
  chatflows: ChatflowSummary[];
  knowledgeBases: KnowledgeBaseSummary[];
  onViewChatbots?: () => void;
  onViewChatflows?: () => void;
  onViewKnowledgeBases?: () => void;
  onResourceClick?: (resourceId: string, resourceType: string) => void;
  isLoading?: boolean;
}

export function RecentResources({
  chatbots,
  chatflows,
  knowledgeBases,
  onViewChatbots,
  onViewChatflows,
  onViewKnowledgeBases,
  onResourceClick,
  isLoading,
}: RecentResourcesProps) {
  const [activeTab, setActiveTab] = useState<"chatbots" | "chatflows" | "knowledge_bases">("chatbots");

  // Get status badge styling
  const getStatusBadge = (status: ResourceStatus) => {
    const statusConfig = {
      active: { label: "Active", className: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" },
      inactive: { label: "Inactive", className: "bg-gray-100 dark:bg-gray-700/30 text-gray-700 dark:text-gray-400" },
      draft: { label: "Draft", className: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400" },
      deployed: { label: "Deployed", className: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" },
      archived: { label: "Archived", className: "bg-gray-100 dark:bg-gray-700/30 text-gray-700 dark:text-gray-400" },
    };

    return statusConfig[status] || statusConfig.inactive;
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#374151] border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm">
        <div className="p-4 sm:p-5 md:p-6 border-b border-gray-200 dark:border-gray-600">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="p-3 sm:p-4 md:p-5 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-lg animate-pulse">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm h-full flex flex-col">
      {/* Header */}
      <div className="p-4 sm:p-5 md:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
          Recent Resources
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-0.5">
          Your recently created and modified resources
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col min-h-0">
        <div className="px-2 sm:px-3 md:px-4 pt-4 sm:pt-5 md:pt-6 pb-2 sm:pb-3 md:pb-4">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg h-auto">
          <TabsTrigger
            value="chatbots"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-900 dark:text-gray-100 text-xs sm:text-sm min-h-[44px] px-2 sm:px-3 py-2 rounded-md flex items-center justify-center"
          >
            <Bot className="h-4 w-4 mr-1 sm:mr-1.5 flex-shrink-0" />
            <span className="truncate">Chatbots</span>
          </TabsTrigger>
          <TabsTrigger
            value="chatflows"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-900 dark:text-gray-100 text-xs sm:text-sm min-h-[44px] px-2 sm:px-3 py-2 rounded-md flex items-center justify-center"
          >
            <Network className="h-4 w-4 mr-1 sm:mr-1.5 flex-shrink-0" />
            <span className="truncate">Chatflows</span>
          </TabsTrigger>
          <TabsTrigger
            value="knowledge_bases"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-900 dark:text-gray-100 text-xs sm:text-sm min-h-[44px] px-2 sm:px-3 py-2 rounded-md flex items-center justify-center"
          >
            <Book className="h-4 w-4 mr-1 sm:mr-1.5 flex-shrink-0" />
            <span className="truncate hidden lg:inline">Knowledge Bases</span>
            <span className="truncate lg:hidden">KB</span>
          </TabsTrigger>
          </TabsList>
        </div>

        {/* Chatbots Tab */}
        <TabsContent value="chatbots" className="flex-1 mt-0 data-[state=active]:block data-[state=inactive]:hidden">
          <div className="p-3 sm:p-4 md:p-5">
            <div className="space-y-4">
              {/* Card Slots - Always render 4 slots for consistency */}
              <div className="space-y-4">
          {chatbots.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bot className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-3" />
              <p className="text-sm text-gray-700 dark:text-gray-200">No chatbots yet</p>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                Create your first chatbot to get started
              </p>
            </div>
          ) : (
            <>
              {chatbots.slice(0, 3).map((chatbot) => {
                const statusBadge = getStatusBadge(chatbot.status);
                return (
                  <div
                    key={chatbot.id}
                    onClick={() => onResourceClick?.(chatbot.id, "chatbot")}
                    className="group bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 sm:p-5 hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 cursor-pointer"
                  >
                    {/* Top Row (Primary Info Zone) */}
                    <div className="flex items-center gap-3 mb-3">
                      {/* Avatar/Icon (Left) */}
                      <div className="flex-shrink-0">
                        <div className="w-9 h-9 rounded-full border-2 border-blue-600 dark:border-blue-400 flex items-center justify-center bg-blue-100 dark:bg-blue-900/50">
                          <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>

                      {/* Text Column (Center-Left) */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                          {chatbot.name}
                        </h3>
                      </div>

                      {/* Status Tag (Close to Title) */}
                      <div className="flex-shrink-0 ml-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs px-2 py-1 rounded-full font-medium",
                            statusBadge.className
                          )}
                        >
                          {statusBadge.label}
                        </Badge>
                      </div>

                      {/* More Options (Far Right) */}
                      <div className="flex-shrink-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600">
                            <DropdownMenuItem className="hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem className="hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-700 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Horizontal Divider Line */}
                    <div className="flex justify-center mb-3">
                      <div className="w-[90%] h-px bg-gray-200 dark:bg-gray-500"></div>
                    </div>

                    {/* Bottom Row (Meta Information Zone) */}
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300 ml-12">
                      {/* Conversations (Left) */}
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4 flex-shrink-0" />
                        <span>{chatbot.conversations_count} conversations</span>
                      </div>

                      {/* Timestamp (Right, closer to meta info) */}
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 flex-shrink-0" />
                        <span>{formatRelativeTime(chatbot.last_active_at || chatbot.created_at)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {onViewChatbots && chatbots.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onViewChatbots}
                  className="w-full mt-2 min-h-[40px] text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  View All Chatbots ({chatbots.length})
                </Button>
              )}
            </>
          )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Chatflows Tab */}
        <TabsContent value="chatflows" className="flex-1 mt-0 data-[state=active]:block data-[state=inactive]:hidden">
          <div className="p-3 sm:p-4 md:p-5">
            <div className="space-y-4">
              {/* Card Slots - Always render 4 slots for consistency */}
              <div className="space-y-4">
          {chatflows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Network className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-3" />
              <p className="text-sm text-gray-700 dark:text-gray-200">No chatflows yet</p>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                Build your first chatflow in the studio
              </p>
            </div>
          ) : (
            <>
              {chatflows.slice(0, 3).map((chatflow) => {
                const statusBadge = getStatusBadge(chatflow.status);
                return (
                  <div
                    key={chatflow.id}
                    onClick={() => onResourceClick?.(chatflow.id, "chatflow")}
                    className="group bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 sm:p-5 hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 cursor-pointer"
                  >
                    {/* Top Row (Primary Info Zone) */}
                    <div className="flex items-center gap-3 mb-3">
                      {/* Avatar/Icon (Left) */}
                      <div className="flex-shrink-0">
                        <div className="w-9 h-9 rounded-full border-2 border-purple-600 dark:border-purple-400 flex items-center justify-center bg-purple-100 dark:bg-purple-900/50">
                          <Network className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                      </div>

                      {/* Text Column (Center-Left) */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                          {chatflow.name}
                        </h3>
                      </div>

                      {/* Status Tag (Close to Title) */}
                      <div className="flex-shrink-0 ml-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs px-2 py-1 rounded-full font-medium",
                            statusBadge.className
                          )}
                        >
                          {statusBadge.label}
                        </Badge>
                      </div>

                      {/* More Options (Far Right) */}
                      <div className="flex-shrink-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600">
                            <DropdownMenuItem className="hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem className="hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-700 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Horizontal Divider Line */}
                    <div className="flex justify-center mb-3">
                      <div className="w-[90%] h-px bg-gray-200 dark:bg-gray-500"></div>
                    </div>

                    {/* Bottom Row (Meta Information Zone) */}
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300 ml-12">
                      {/* Node Count (Left) */}
                      <span>{chatflow.nodes_count} nodes</span>

                      {/* Conversations Count */}
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4 flex-shrink-0" />
                        <span>{chatflow.conversations_count} conversations</span>
                      </div>

                      {/* Timestamp (Right, closer to meta info) */}
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 flex-shrink-0" />
                        <span>{formatRelativeTime(chatflow.updated_at || chatflow.created_at)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {onViewChatflows && chatflows.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onViewChatflows}
                  className="w-full mt-2 min-h-[40px] text-purple-600 dark:text-purple-400 border-gray-300 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  View All Chatflows ({chatflows.length})
                </Button>
              )}
            </>
          )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Knowledge Bases Tab */}
        <TabsContent value="knowledge_bases" className="flex-1 mt-0 data-[state=active]:block data-[state=inactive]:hidden">
          <div className="p-3 sm:p-4 md:p-5">
            <div className="space-y-4">
              {/* Card Slots - Always render 4 slots for consistency */}
              <div className="space-y-4">
          {knowledgeBases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Book className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-3" />
              <p className="text-sm text-gray-700 dark:text-gray-200">No knowledge bases yet</p>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                Create your first KB to power RAG
              </p>
            </div>
          ) : (
            <>
              {knowledgeBases.slice(0, 3).map((kb) => {
                const statusBadge = getStatusBadge(kb.status);
                return (
                  <div
                    key={kb.id}
                    onClick={() => onResourceClick?.(kb.id, "knowledge_base")}
                    className="group bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 sm:p-5 hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 cursor-pointer"
                  >
                    {/* Top Row (Primary Info Zone) */}
                    <div className="flex items-center gap-3 mb-3">
                      {/* Avatar/Icon (Left) */}
                      <div className="flex-shrink-0">
                        <div className="w-9 h-9 rounded-full border-2 border-green-600 dark:border-green-400 flex items-center justify-center bg-green-100 dark:bg-green-900/50">
                          <Book className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                      </div>

                      {/* Text Column (Center-Left) */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                          {kb.name}
                        </h3>
                      </div>

                      {/* Status Tag (Close to Title) */}
                      <div className="flex-shrink-0 ml-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs px-2 py-1 rounded-full font-medium",
                            statusBadge.className
                          )}
                        >
                          {statusBadge.label}
                        </Badge>
                      </div>

                      {/* More Options (Far Right) */}
                      <div className="flex-shrink-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600">
                            <DropdownMenuItem className="hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem className="hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-700 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Horizontal Divider Line */}
                    <div className="flex justify-center mb-3">
                      <div className="w-[90%] h-px bg-gray-200 dark:bg-gray-500"></div>
                    </div>

                    {/* Bottom Row (Meta Information Zone) */}
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300 ml-12">
                      {/* Documents Count (Left) */}
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4 flex-shrink-0" />
                        <span>{kb.documents_count} documents</span>
                      </div>

                      {/* Timestamp (Right, closer to meta info) */}
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 flex-shrink-0" />
                        <span>{formatRelativeTime(kb.updated_at || kb.created_at)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {onViewKnowledgeBases && knowledgeBases.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onViewKnowledgeBases}
                  className="w-full mt-2 min-h-[40px] text-green-600 dark:text-green-400 border-gray-300 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  View All Knowledge Bases ({knowledgeBases.length})
                </Button>
              )}
            </>
          )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
