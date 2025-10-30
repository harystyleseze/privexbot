/**
 * Create Workspace Modal Component
 *
 * Discord-style modal for creating new workspaces within an organization
 */

import { useState } from "react";
import { X, CheckCircle2 } from "lucide-react";
import { workspaceApi } from "@/api/workspace";
import { useToast } from "@/hooks/use-toast";
import type { Workspace } from "@/types/tenant";

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  onSuccess?: () => void;
  onWorkspaceCreated?: (workspace: Workspace) => void;
}

export const CreateWorkspaceModal = ({
  isOpen,
  onClose,
  organizationId,
  onSuccess,
  onWorkspaceCreated
}: CreateWorkspaceModalProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const payload = {
        name,
        description: description || undefined,
        organization_id: organizationId
      };

      const newWorkspace = await workspaceApi.create(organizationId, payload);

      // Show success toast
      toast({
        variant: "success",
        title: "Workspace created successfully",
        description: `"${newWorkspace.name}" is now active and ready to use.`,
      });

      // Reset form
      setName("");
      setDescription("");

      // Call workspace created callback (for auto-switching)
      if (onWorkspaceCreated) {
        onWorkspaceCreated(newWorkspace);
      }

      // Call success callback (for refreshing data)
      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (err: any) {
      console.error("[CreateWorkspaceModal] Error creating workspace:", err);

      // Extract error message properly
      let errorMessage = "Failed to create workspace";
      if (err.response?.data?.detail) {
        // Handle both string and array/object detail formats
        const detail = err.response.data.detail;
        if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (Array.isArray(detail)) {
          errorMessage = detail.map((e: any) => e.msg || e.message || String(e)).join(', ');
        } else if (typeof detail === 'object') {
          errorMessage = detail.msg || detail.message || JSON.stringify(detail);
        }
      }

      setError(errorMessage);

      // Also show error toast
      toast({
        variant: "destructive",
        title: "Failed to create workspace",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
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

      {/* Modal */}
      <div className="relative bg-[#313338] rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#26272B]">
          <h2 className="text-xl font-bold text-white">
            Create Workspace
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded p-3">
              <p className="text-sm text-red-400">{error}</p>
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Marketing Team"
              required
              className="w-full px-3 py-2 bg-[#1E1F22] border border-[#26272B] rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-400">
              This is the name that will appear in your workspace switcher
            </p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="workspace-description" className="block text-xs font-bold text-gray-300 uppercase mb-2">
              Description
            </label>
            <textarea
              id="workspace-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this workspace for?"
              rows={3}
              className="w-full px-3 py-2 bg-[#1E1F22] border border-[#26272B] rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white hover:underline disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Creating..." : "Create Workspace"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
