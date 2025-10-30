/**
 * Multi-Tenancy Type Definitions
 *
 * WHY: Type-safe organization, workspace, and permission management
 * HOW: TypeScript interfaces matching backend API responses
 *
 * HIERARCHY:
 * User → Organizations → Workspaces → Resources (Chatbots, KBs, etc.)
 */

// Organization roles
export type OrganizationRole = "owner" | "admin" | "member";

// Workspace roles
export type WorkspaceRole = "admin" | "editor" | "viewer";

// Subscription tiers - FREE → STARTER → PRO → ENTERPRISE
export type SubscriptionTier = "free" | "starter" | "pro" | "enterprise";

/**
 * Organization
 */
export interface Organization {
  id: string;
  name: string;
  billing_email: string;
  subscription_tier: SubscriptionTier;
  user_role: OrganizationRole;
  member_count: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Workspace
 */
export interface Workspace {
  id: string;
  name: string;
  description?: string;
  organization_id: string;
  user_role: WorkspaceRole;
  is_default: boolean;
  member_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Permission keys
 */
export type Permission =
  // Organization-level
  | "org:read"
  | "org:write"
  | "org:billing"
  | "org:members"
  // Workspace-level
  | "workspace:read"
  | "workspace:write"
  | "workspace:create"
  | "workspace:delete"
  | "workspace:members"
  // Chatbot permissions
  | "chatbot:view"
  | "chatbot:create"
  | "chatbot:edit"
  | "chatbot:delete"
  // Chatflow permissions
  | "chatflow:view"
  | "chatflow:create"
  | "chatflow:edit"
  | "chatflow:delete"
  // Knowledge Base permissions
  | "kb:view"
  | "kb:create"
  | "kb:edit"
  | "kb:delete"
  // Lead permissions
  | "lead:view"
  | "lead:export"
  | "lead:edit"
  | "lead:delete";

/**
 * Permission map
 */
export type PermissionMap = Record<Permission, boolean>;

/**
 * Create organization request
 */
export interface CreateOrganizationRequest {
  name: string;
  billing_email: string;
}

/**
 * Create organization response
 */
export interface CreateOrganizationResponse extends Organization {
  default_workspace: Workspace;
}

/**
 * List organizations response
 */
export interface ListOrganizationsResponse {
  organizations: Organization[];
  total: number;
  page: number;
  page_size: number;
}

/**
 * Create workspace request
 */
export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
}

/**
 * Switch organization request
 */
export interface SwitchOrganizationRequest {
  organization_id: string;
  workspace_id?: string; // Optional, uses default if not provided
}

/**
 * Switch workspace request
 */
export interface SwitchWorkspaceRequest {
  workspace_id: string;
}

/**
 * Context switch response
 */
export interface ContextSwitchResponse {
  access_token: string;
  organization_id: string;
  workspace_id: string;
}

/**
 * Current context response
 */
export interface CurrentContextResponse {
  organization_id: string;
  workspace_id: string;
  user_id: string;
}
