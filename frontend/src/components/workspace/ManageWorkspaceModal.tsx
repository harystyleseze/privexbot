/**
 * Manage Workspace Modal Component
 *
 * Comprehensive modal for managing workspace settings and members
 * Features tabs for Settings and Members
 */

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Settings, Users, Loader2 } from "lucide-react";
import { workspaceApi } from "@/api/workspace";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "@/contexts/AppContext";
import { WorkspaceMembersTab } from "@/components/workspace/WorkspaceMembersTab";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  editWorkspaceSchema,
  type EditWorkspaceFormData,
} from "@/api/schemas/workspace.schema";
import type { Workspace } from "@/types/tenant";

interface ManageWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: Workspace;
  organizationId: string;
  onSuccess?: () => void;
}

export const ManageWorkspaceModal = ({
  isOpen,
  onClose,
  workspace,
  organizationId,
  onSuccess
}: ManageWorkspaceModalProps) => {
  const { toast } = useToast();
  const { refreshData } = useApp();
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors: formErrors, isDirty },
    reset,
    setError: setFormError,
  } = useForm<EditWorkspaceFormData>({
    resolver: zodResolver(editWorkspaceSchema),
    defaultValues: {
      name: workspace.name,
      description: workspace.description || "",
    },
  });

  // Update form when workspace changes
  useEffect(() => {
    if (isOpen) {
      reset({
        name: workspace.name,
        description: workspace.description || "",
      });
    }
  }, [isOpen, workspace, reset]);

  const handleSaveSettings = async (data: EditWorkspaceFormData) => {
    try {
      setIsSaving(true);
      await workspaceApi.update(organizationId, workspace.id, data);

      toast({
        variant: "success",
        title: "Workspace updated",
        description: "Settings have been saved successfully",
      });

      // Refresh data to show updated workspace
      await refreshData();

      if (onSuccess) {
        onSuccess();
      }

      // Reset form dirty state
      reset(data);
    } catch (err: any) {
      console.error("[ManageWorkspaceModal] Error updating workspace:", err);

      let errorMessage = "Failed to update workspace";
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (Array.isArray(detail)) {
          errorMessage = detail.map((e: any) => e.msg || e.message || String(e)).join(', ');
        } else if (typeof detail === 'object') {
          errorMessage = detail.msg || detail.message || JSON.stringify(detail);
        }
      }

      setFormError("root", {
        type: "manual",
        message: errorMessage,
      });

      toast({
        variant: "destructive",
        title: "Failed to update workspace",
        description: errorMessage,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const canEditSettings = workspace.user_role === "admin" || workspace.user_role === "editor";

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
              Manage Workspace
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {workspace.name}
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
        <Tabs defaultValue="settings" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-4 mt-4 grid w-auto grid-cols-2 bg-[#1E1F22]">
            <TabsTrigger value="settings" className="data-[state=active]:bg-blue-600">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="members" className="data-[state=active]:bg-blue-600">
              <Users className="h-4 w-4 mr-2" />
              Members
            </TabsTrigger>
          </TabsList>

          {/* Settings Tab */}
          <TabsContent value="settings" className="flex-1 overflow-y-auto p-4 mt-0">
            <form onSubmit={handleSubmit(handleSaveSettings)} className="space-y-4">
              {/* Root Error Message */}
              {formErrors.root && (
                <div className="bg-red-500/10 border border-red-500/50 rounded p-3">
                  <p className="text-sm text-red-400">{formErrors.root.message}</p>
                </div>
              )}

              {/* Workspace Name */}
              <div>
                <label htmlFor="workspace-name" className="block text-xs font-bold text-gray-300 uppercase mb-2">
                  Workspace Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="workspace-name"
                  type="text"
                  {...register("name")}
                  disabled={!canEditSettings}
                  placeholder="Enter workspace name"
                  className="w-full px-3 py-2 bg-[#1E1F22] border border-[#26272B] rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {formErrors.name && (
                  <p className="mt-1 text-xs text-red-400">{formErrors.name.message}</p>
                )}
              </div>

              {/* Workspace Description */}
              <div>
                <label htmlFor="workspace-description" className="block text-xs font-bold text-gray-300 uppercase mb-2">
                  Description (Optional)
                </label>
                <textarea
                  id="workspace-description"
                  {...register("description")}
                  disabled={!canEditSettings}
                  placeholder="Enter workspace description"
                  rows={3}
                  className="w-full px-3 py-2 bg-[#1E1F22] border border-[#26272B] rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                />
                {formErrors.description && (
                  <p className="mt-1 text-xs text-red-400">{formErrors.description.message}</p>
                )}
              </div>

              {/* Workspace Info */}
              <div className="bg-[#2B2D31] rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Your Role</span>
                  <span className="text-white capitalize">{workspace.user_role}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Created</span>
                  <span className="text-white">
                    {new Date(workspace.created_at).toLocaleDateString()}
                  </span>
                </div>
                {workspace.is_default && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Type</span>
                    <span className="text-blue-400">Default Workspace</span>
                  </div>
                )}
              </div>

              {/* Save Button */}
              {canEditSettings && (
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={!isDirty || isSaving}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => reset()}
                    disabled={!isDirty || isSaving}
                    className="flex-1"
                  >
                    Reset
                  </Button>
                </div>
              )}

              {!canEditSettings && (
                <div className="bg-yellow-500/10 border border-yellow-500/50 rounded p-3">
                  <p className="text-sm text-yellow-400">
                    You need admin or editor role to edit workspace settings
                  </p>
                </div>
              )}
            </form>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="flex-1 overflow-y-auto p-4 mt-0">
            <WorkspaceMembersTab
              workspace={workspace}
              organizationId={organizationId}
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
    </div>
  );
};
