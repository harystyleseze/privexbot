/**
 * Dashboard Page (Protected)
 *
 * WHY: Main dashboard for authenticated users with org/workspace context
 * HOW: Displays workspace stats and quick actions
 */

import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Network, Book } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardPage() {
  const { user } = useAuth();
  const { currentOrganization, currentWorkspace } = useApp();

  return (
    <DashboardLayout>
      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-5xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Welcome back, {user?.username}!
          </h1>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-400">
            {currentOrganization?.name} / {currentWorkspace?.name}
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-primary-100 dark:bg-primary-500/10 rounded-lg">
                  <Zap className="h-6 w-6 text-primary-600" />
                </div>
                <CardTitle className="text-2xl font-semibold">Chatbots</CardTitle>
              </div>
              <CardDescription>
                Build simple form-based chatbots with AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-primary-600 hover:bg-primary-700 text-white">
                Create Chatbot
              </Button>
            </CardContent>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-secondary-100 dark:bg-secondary-500/10 rounded-lg">
                  <Network className="h-6 w-6 text-secondary-600" />
                </div>
                <CardTitle className="text-2xl font-semibold">Chatflows</CardTitle>
              </div>
              <CardDescription>
                Design complex visual workflow-based AI flows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-secondary-600 hover:bg-secondary-700 text-white">
                Create Chatflow
              </Button>
            </CardContent>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-accent-100 dark:bg-accent-500/10 rounded-lg">
                  <Book className="h-6 w-6 text-accent-600" />
                </div>
                <CardTitle className="text-2xl font-semibold">Knowledge Bases</CardTitle>
              </div>
              <CardDescription>
                Upload documents and data for RAG-powered AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-accent-600 hover:bg-accent-700 text-white">
                Create Knowledge Base
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Workspace Info */}
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Current Context</CardTitle>
            <CardDescription>Your active organization and workspace</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">Organization</p>
                <p className="text-lg font-medium">{currentOrganization?.name}</p>
                <p className="text-xs text-gray-500 capitalize">
                  {currentOrganization?.subscription_tier} • {currentOrganization?.user_role}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">Workspace</p>
                <p className="text-lg font-medium">{currentWorkspace?.name}</p>
                <p className="text-xs text-gray-500 capitalize">
                  Role: {currentWorkspace?.user_role}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
