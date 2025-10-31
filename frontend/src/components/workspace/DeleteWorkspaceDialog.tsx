/**
 * Delete Workspace Dialog Component
 *
 * Discord-style confirmation dialog for deleting workspaces
 * Only accessible by workspace admins
 * Uses react-hook-form + Zod validation to ensure user types workspace name exactly
 * Prevents deletion of default workspaces
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, AlertTriangle } from "lucide-react";
import { workspaceApi } from "@/api/workspace";
import { useToast } from "@/hooks/use-toast";
import {
  deleteWorkspaceSchema,
  type DeleteWorkspaceFormData,
} from "@/api/schemas/workspace.schema";
import type { Workspace } from "@/types/tenant";

interface DeleteWorkspaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: Workspace;
  organizationId: string;
  onSuccess?: () => void;
}

export const DeleteWorkspaceDialog = ({
  isOpen,
  onClose,
  workspace,
  organizationId,
  onSuccess
}: DeleteWorkspaceDialogProps) => {
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError: setFormError,
  } = useForm<DeleteWorkspaceFormData>({
    resolver: zodResolver(deleteWorkspaceSchema(workspace.name, workspace.is_default)),
    defaultValues: {
      confirmation_name: "",
    },
  });

  const onSubmit = async (data: DeleteWorkspaceFormData) => {
    try {
      await workspaceApi.delete(organizationId, workspace.id);

      toast({
        variant: "success",
        title: "Workspace deleted successfully",
        description: `"${workspace.name}" has been permanently deleted.`,
      });

      reset();

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (err: any) {
      console.error("[DeleteWorkspaceDialog] Error deleting workspace:", err);

      // Extract error message properly
      let errorMessage = "Failed to delete workspace";
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

      // Set form-level error
      setFormError("root", {
        type: "manual",
        message: errorMessage,
      });

      toast({
        variant: "destructive",
        title: "Failed to delete workspace",
        description: errorMessage,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-[#313338] rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#26272B]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <h2 className="text-xl font-bold text-white">
              Delete Workspace
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
          {/* Root Error Message */}
          {errors.root && (
            <div className="bg-red-500/10 border border-red-500/50 rounded p-3">
              <p className="text-sm text-red-400">{errors.root.message}</p>
            </div>
          )}

          {/* Warning */}
          <div className="bg-red-500/10 border border-red-500/50 rounded p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-semibold text-red-400">
                  This action cannot be undone
                </p>
                <p className="text-xs text-gray-300">
                  Deleting <span className="font-semibold text-white">"{workspace.name}"</span> will permanently delete:
                </p>
                <ul className="text-xs text-gray-300 list-disc list-inside space-y-1 ml-2">
                  <li>All chatbots and chatflows</li>
                  <li>All knowledge bases and documents</li>
                  <li>All members and their permissions</li>
                  <li>All analytics and conversation history</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Default Workspace Warning */}
          {workspace.is_default && (
            <div className="bg-yellow-500/10 border border-yellow-500/50 rounded p-3">
              <p className="text-sm text-yellow-400">
                This is the default workspace and cannot be deleted.
              </p>
            </div>
          )}

          {/* Confirmation Input */}
          <div>
            <label htmlFor="confirm-delete" className="block text-xs font-bold text-gray-300 uppercase mb-2">
              Type "{workspace.name}" to confirm <span className="text-red-400">*</span>
            </label>
            <input
              id="confirm-delete"
              type="text"
              {...register("confirmation_name")}
              placeholder={workspace.name}
              autoComplete="off"
              disabled={workspace.is_default}
              className="w-full px-3 py-2 bg-[#1E1F22] border border-[#26272B] rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {errors.confirmation_name && (
              <p className="mt-1 text-xs text-red-400">{errors.confirmation_name.message}</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white hover:underline disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || workspace.is_default}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "Deleting..." : "Delete Workspace"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
