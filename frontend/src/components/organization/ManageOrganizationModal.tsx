/**
 * Manage Organization Modal Component
 *
 * Comprehensive modal for managing an organization's workspaces
 * Displays all workspaces, allows CRUD operations
 */

import { useState, useEffect } from "react";
import { X, Plus, Edit, Trash2, Check, Loader2, Folder, Users } from "lucide-react";
import { organizationApi } from "@/api/organization";
import { workspaceApi } from "@/api/workspace";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "@/contexts/AppContext";
import { CreateWorkspaceModal } from "@/components/workspace/CreateWorkspaceModal";
import { EditWorkspaceModal } from "@/components/workspace/EditWorkspaceModal";
import { DeleteWorkspaceDialog } from "@/components/workspace/DeleteWorkspaceDialog";
import { OrganizationMembersTab } from "@/components/organization/OrganizationMembersTab";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Organization, Workspace } from "@/types/tenant";

interface ManageOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: Organization;
  onSuccess?: () => void;
}

export const ManageOrganizationModal = ({
  isOpen,
  onClose,
  organization,
  onSuccess
}: ManageOrganizationModalProps) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [deletingWorkspace, setDeletingWorkspace] = useState<Workspace | null>(null);
  const { toast } = useToast();
  const { currentOrganization, currentWorkspace, switchOrganization, switchWorkspace, refreshData } = useApp();

  // Load workspaces when modal opens
  useEffect(() => {
    if (isOpen) {
      loadWorkspaces();
    }
  }, [isOpen, organization.id]);

  const loadWorkspaces = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const workspacesData = await organizationApi.getWorkspaces(organization.id);
      setWorkspaces(workspacesData);
    } catch (err: any) {
      console.error("[ManageOrganizationModal] Error loading workspaces:", err);
      const errorMessage = err.response?.data?.detail || "Failed to load workspaces";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Failed to load workspaces",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchWorkspace = async (workspaceId: string) => {
    try {
      // Check if workspace belongs to a different organization
      const isDifferentOrg = currentOrganization?.id !== organization.id;

      if (isDifferentOrg) {
        // Switch to the organization first, then the workspace
        await switchOrganization(organization.id, workspaceId);
        toast({
          variant: "success",
          title: "Organization and workspace switched",
          description: `Switched to ${organization.name} organization and selected workspace`,
        });
      } else {
        // Just switch workspace in current organization
        await switchWorkspace(workspaceId);
        toast({
          variant: "success",
          title: "Workspace switched",
          description: "You're now in a different workspace context",
        });
      }
      onClose();
    } catch (err: any) {
      console.error("[ManageOrganizationModal] Error switching workspace:", err);
      toast({
        variant: "destructive",
        title: "Failed to switch workspace",
        description: err.message || "Please try again",
      });
    }
  };

  const handleDeleteSuccess = async () => {
    await loadWorkspaces();
    if (onSuccess) {
      onSuccess();
    }
  };

  if (!isOpen) return null;

  const canCreateWorkspace = organization.user_role === "admin" || organization.user_role === "owner";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#313338] rounded-lg shadow-xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#26272B] flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">
              Manage Workspaces
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {organization.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content with Tabs */}
        <Tabs defaultValue="workspaces" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-4 mt-4 grid w-auto grid-cols-2 bg-[#1E1F22]">
            <TabsTrigger value="workspaces" className="data-[state=active]:bg-blue-600">
              <Folder className="h-4 w-4 mr-2" />
              Workspaces
            </TabsTrigger>
            <TabsTrigger value="members" className="data-[state=active]:bg-blue-600">
              <Users className="h-4 w-4 mr-2" />
              Members
            </TabsTrigger>
          </TabsList>

          {/* Workspaces Tab */}
          <TabsContent value="workspaces" className="flex-1 overflow-y-auto p-4 space-y-4 mt-0">
            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded p-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Create Workspace Button */}
            {canCreateWorkspace && (
              <Button
                onClick={() => setShowCreateWorkspace(true)}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Workspace
              </Button>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            )}

            {/* Workspaces List */}
            {!isLoading && workspaces.length === 0 && (
              <div className="text-center py-8">
                <Folder className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No workspaces found</p>
              </div>
            )}

            {!isLoading && workspaces.length > 0 && (
              <div className="space-y-3">
                {workspaces.map((workspace) => {
                  const isActive = workspace.id === currentWorkspace?.id;
                  const canEdit = workspace.user_role === "admin" || organization.user_role === "admin" || organization.user_role === "owner";
                  const canDelete = !workspace.is_default && (workspace.user_role === "admin" || organization.user_role === "admin" || organization.user_role === "owner");

                  return (
                    <div
                      key={workspace.id}
                      className={`bg-[#2B2D31] rounded-lg p-4 border transition-all ${
                        isActive ? "border-blue-600 shadow-md" : "border-[#26272B] hover:border-[#3a3a3a]"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-white font-medium truncate">
                              {workspace.name}
                            </h3>
                            {isActive && (
                              <Badge className="bg-blue-600 text-white text-xs">
                                <Check className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            )}
                            {workspace.is_default && (
                              <Badge variant="outline" className="text-xs text-gray-400 border-gray-600">
                                Default
                              </Badge>
                            )}
                          </div>
                          {workspace.description && (
                            <p className="text-sm text-gray-400 mb-2">
                              {workspace.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {workspace.member_count || 0} members
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                          {!isActive && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSwitchWorkspace(workspace.id)}
                              className="text-xs"
                            >
                              Switch to
                            </Button>
                          )}
                          {canEdit && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingWorkspace(workspace)}
                              className="text-xs"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDeletingWorkspace(workspace)}
                              className="text-xs text-red-500 hover:text-red-600 hover:border-red-500"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="flex-1 overflow-y-auto p-4 mt-0">
            <OrganizationMembersTab
              organization={organization}
              onMembersChanged={onSuccess}
            />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-[#26272B] flex-shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-white hover:bg-[#2B2D31]"
          >
            Close
          </Button>
        </div>
      </div>

      {/* Create Workspace Modal */}
      <CreateWorkspaceModal
        isOpen={showCreateWorkspace}
        onClose={() => setShowCreateWorkspace(false)}
        organizationId={organization.id}
        onWorkspaceCreated={async (workspace) => {
          // IMPORTANT: Refresh data FIRST so workspace is in context
          await refreshData();
          await loadWorkspaces();
          // Now workspace should be available for switching
          await handleSwitchWorkspace(workspace.id);
        }}
        onSuccess={loadWorkspaces}
      />

      {/* Edit Workspace Modal */}
      {editingWorkspace && (
        <EditWorkspaceModal
          isOpen={!!editingWorkspace}
          onClose={() => setEditingWorkspace(null)}
          workspace={editingWorkspace}
          organizationId={organization.id}
          onSuccess={async () => {
            await loadWorkspaces();
            setEditingWorkspace(null);
            if (onSuccess) {
              onSuccess();
            }
          }}
        />
      )}

      {/* Delete Workspace Dialog */}
      {deletingWorkspace && (
        <DeleteWorkspaceDialog
          isOpen={!!deletingWorkspace}
          onClose={() => setDeletingWorkspace(null)}
          workspace={deletingWorkspace}
          organizationId={organization.id}
          onSuccess={async () => {
            await handleDeleteSuccess();
            setDeletingWorkspace(null);
          }}
        />
      )}
    </div>
  );
};
