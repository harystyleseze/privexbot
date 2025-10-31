/**
 * Edit Organization Modal Component
 *
 * Discord-style modal for editing existing organizations
 * Only accessible by organization admins/owners
 * Uses react-hook-form + Zod validation for proper form handling
 */

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { organizationApi } from "@/api/organization";
import { useToast } from "@/hooks/use-toast";
import {
  editOrganizationSchema,
  type EditOrganizationFormData,
} from "@/api/schemas/organization.schema";
import type { Organization } from "@/types/tenant";

interface EditOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: Organization;
  onSuccess?: () => void;
}

export const EditOrganizationModal = ({
  isOpen,
  onClose,
  organization,
  onSuccess
}: EditOrganizationModalProps) => {
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError: setFormError,
  } = useForm<EditOrganizationFormData>({
    resolver: zodResolver(editOrganizationSchema),
    defaultValues: {
      name: organization.name,
      billing_email: organization.billing_email,
    },
  });

  // Update form when organization changes
  useEffect(() => {
    reset({
      name: organization.name,
      billing_email: organization.billing_email,
    });
  }, [organization, reset]);

  const onSubmit = async (data: EditOrganizationFormData) => {
    try {
      await organizationApi.update(organization.id, data);

      toast({
        variant: "success",
        title: "Organization updated successfully",
        description: `"${data.name || organization.name}" has been updated.`,
      });

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (err: any) {
      console.error("[EditOrganizationModal] Error updating organization:", err);

      // Extract error message properly
      let errorMessage = "Failed to update organization";
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
        title: "Failed to update organization",
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

      {/* Modal */}
      <div className="relative bg-[#313338] rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#26272B]">
          <h2 className="text-xl font-bold text-white">
            Edit Organization
          </h2>
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

          {/* Organization Name */}
          <div>
            <label htmlFor="edit-organization-name" className="block text-xs font-bold text-gray-300 uppercase mb-2">
              Organization Name
            </label>
            <input
              id="edit-organization-name"
              type="text"
              {...register("name")}
              placeholder="e.g., Acme Corp"
              className="w-full px-3 py-2 bg-[#1E1F22] border border-[#26272B] rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>
            )}
          </div>

          {/* Billing Email */}
          <div>
            <label htmlFor="edit-organization-billing-email" className="block text-xs font-bold text-gray-300 uppercase mb-2">
              Billing Email
            </label>
            <input
              id="edit-organization-billing-email"
              type="email"
              {...register("billing_email")}
              placeholder="billing@example.com"
              className="w-full px-3 py-2 bg-[#1E1F22] border border-[#26272B] rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
            {errors.billing_email && (
              <p className="mt-1 text-xs text-red-400">{errors.billing_email.message}</p>
            )}
            {!errors.billing_email && (
              <p className="mt-1 text-xs text-gray-400">
                Email address for billing and subscription notifications
              </p>
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
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
