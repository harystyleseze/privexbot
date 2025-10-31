/**
 * Organizations Management Page
 *
 * WHY: Centralized organization and workspace management
 * HOW: Tabs-based UI with CRUD operations
 *
 * FEATURES:
 * - List all user's organizations
 * - Create/Edit/Delete organizations (role-based)
 * - View and manage workspaces per organization
 * - Switch organization/workspace context
 * - Member management (future enhancement)
 *
 * PERMISSIONS:
 * - View: All members
 * - Create org: All authenticated users
 * - Edit org: Admin/Owner
 * - Delete org: Owner only
 * - Create workspace: Admin/Owner
 * - Edit workspace: Workspace admin or Org admin/owner
 * - Delete workspace: Workspace admin or Org admin/owner (not default)
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Plus,
  Users,
  Folder,
  Settings,
  Trash2,
  Edit,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";
import { organizationApi } from "@/api/organization";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreateOrganizationModal } from "@/components/organization/CreateOrganizationModal";
import { EditOrganizationModal } from "@/components/organization/EditOrganizationModal";
import { DeleteOrganizationDialog } from "@/components/organization/DeleteOrganizationDialog";
import { ManageOrganizationModal } from "@/components/organization/ManageOrganizationModal";
import type { Organization, Workspace } from "@/types/tenant";

export function OrganizationsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    organizations,
    currentOrganization,
    workspaces,
    currentWorkspace,
    switchOrganization,
    switchWorkspace,
    refreshData,
    hasPermission,
    isLoading: contextLoading,
  } = useApp();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateOrganization, setShowCreateOrganization] = useState(false);
  const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null);
  const [deletingOrganization, setDeletingOrganization] = useState<Organization | null>(null);
  const [managingOrganization, setManagingOrganization] = useState<Organization | null>(null);

  const handleSwitchOrganization = async (orgId: string) => {
    try {
      setIsLoading(true);
      await switchOrganization(orgId);
      toast({
        variant: "success",
        title: "Organization switched",
        description: "You're now in a different organization context",
      });
      navigate("/dashboard");
    } catch (err: any) {
      console.error("[OrganizationsPage] Error switching organization:", err);
      toast({
        variant: "destructive",
        title: "Failed to switch organization",
        description: err.message || "Please try again",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchWorkspace = async (workspaceId: string) => {
    try {
      setIsLoading(true);
      await switchWorkspace(workspaceId);
      toast({
        variant: "success",
        title: "Workspace switched",
        description: "You're now in a different workspace context",
      });
      navigate("/dashboard");
    } catch (err: any) {
      console.error("[OrganizationsPage] Error switching workspace:", err);
      toast({
        variant: "destructive",
        title: "Failed to switch workspace",
        description: err.message || "Please try again",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-purple-500 text-white";
      case "admin":
        return "bg-blue-500 text-white";
      case "member":
        return "bg-gray-500 text-white";
      default:
        return "bg-gray-400 text-white";
    }
  };

  if (contextLoading && organizations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Organizations</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your organizations and workspaces
            </p>
          </div>
          <Button
            onClick={() => setShowCreateOrganization(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Organization
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Organizations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {organizations.map((org) => {
            const isActive = org.id === currentOrganization?.id;
            const canEdit = org.user_role === "admin" || org.user_role === "owner";
            const canDelete = org.user_role === "owner";

            return (
              <Card
                key={org.id}
                className={`relative transition-all ${
                  isActive ? "ring-2 ring-blue-600 shadow-lg" : "hover:shadow-md"
                }`}
              >
                {isActive && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-blue-600 text-white">
                      <Check className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-lg truncate">{org.name}</CardTitle>
                        <Badge className={`mt-1 ${getRoleBadgeColor(org.user_role)}`}>
                          {org.user_role}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Users className="h-4 w-4 mr-1" />
                      {org.member_count || 0} members
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Folder className="h-4 w-4 mr-1" />
                      {org.workspace_count || 0} workspaces
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {!isActive && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleSwitchOrganization(org.id)}
                        disabled={isLoading}
                        className="flex-1"
                      >
                        {isLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "Switch to"
                        )}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setManagingOrganization(org)}
                      className={!isActive ? "w-auto" : "flex-1"}
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Manage
                    </Button>
                    {canEdit && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingOrganization(org)}
                        className="w-auto"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeletingOrganization(org)}
                        className="w-auto text-red-500 hover:text-red-600 hover:border-red-500"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>

                  {/* Workspaces Preview (if active) */}
                  {isActive && workspaces.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-xs text-muted-foreground mb-2">Workspaces:</div>
                      <div className="space-y-1">
                        {workspaces.slice(0, 2).map((ws) => (
                          <div
                            key={ws.id}
                            className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-accent cursor-pointer"
                            onClick={() => handleSwitchWorkspace(ws.id)}
                          >
                            <span className="truncate">{ws.name}</span>
                            {ws.id === currentWorkspace?.id && (
                              <Check className="h-3 w-3 text-blue-600 flex-shrink-0 ml-2" />
                            )}
                          </div>
                        ))}
                      </div>
                      {workspaces.length > 2 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full mt-2 text-xs"
                          onClick={() => setManagingOrganization(org)}
                        >
                          View all {workspaces.length} workspaces
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {organizations.length === 0 && (
          <Card className="p-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No organizations yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first organization to get started
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Organization
            </Button>
          </Card>
        )}

        {/* Manage Organization Modal (Workspaces) */}
        {managingOrganization && (
          <ManageOrganizationModal
            isOpen={!!managingOrganization}
            onClose={() => setManagingOrganization(null)}
            organization={managingOrganization}
            onSuccess={refreshData}
          />
        )}

        {/* Create Organization Modal */}
        <CreateOrganizationModal
          isOpen={showCreateOrganization}
          onClose={() => setShowCreateOrganization(false)}
          onOrganizationCreated={async (organization) => {
            await refreshData();
            await handleSwitchOrganization(organization.id);
          }}
          onSuccess={refreshData}
        />

        {/* Edit Organization Modal */}
        {editingOrganization && (
          <EditOrganizationModal
            isOpen={!!editingOrganization}
            onClose={() => setEditingOrganization(null)}
            organization={editingOrganization}
            onSuccess={refreshData}
          />
        )}

        {/* Delete Organization Dialog */}
        {deletingOrganization && (
          <DeleteOrganizationDialog
            isOpen={!!deletingOrganization}
            onClose={() => setDeletingOrganization(null)}
            organization={deletingOrganization}
            onSuccess={async () => {
              await refreshData();
              // If deleted org was active, switch to first available org
              if (deletingOrganization.id === currentOrganization?.id && organizations.length > 1) {
                const nextOrg = organizations.find(o => o.id !== deletingOrganization.id);
                if (nextOrg) {
                  await handleSwitchOrganization(nextOrg.id);
                }
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
