/**
 * TypeScript interfaces for role validation and assignment system
 */

/**
 * Role definition interface
 */
export interface Role {
  role_id: string;
  name: "student" | "convener" | "administrator";
  description: string;
  hierarchy_level: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Permission definition interface
 */
export interface Permission {
  permission_id: string;
  name: string;
  description: string;
  resource_type: string;
  action: "create" | "read" | "update" | "delete" | "manage";
  scope: "own" | "all" | "enrolled" | "assigned";
  created_at: Date;
}

/**
 * Role-Permission mapping interface
 */
export interface RolePermission {
  mapping_id: string;
  role_id: string;
  permission_id: string;
  granted_at: Date;
  granted_by: number | null;
}

/**
 * User role assignment interface
 */
export interface UserRoleAssignment {
  assignment_id: string;
  user_id: number;
  role_id: string;
  assigned_by: number | null;
  assigned_at: Date;
  effective_from: Date;
  effective_until: Date | null;
  status: "active" | "inactive" | "pending";
  notes: string | null;
}

/**
 * Role assignment history interface
 */
export interface RoleAssignmentHistory {
  history_id: string;
  user_id: number;
  previous_role_id: string | null;
  new_role_id: string;
  changed_by: number;
  changed_at: Date;
  reason: string | null;
  metadata: Record<string, any> | null;
}

/**
 * Enhanced JWT payload with role information
 */
export interface RoleAwareJWTPayload {
  user_id: number;
  email: string;
  role: string;
  permissions: string[];
  role_assignment_id: string;
  iat: number;
  exp: number;
}

/**
 * Role validation request interface
 */
export interface RoleValidationRequest {
  userId: number;
  action: string;
  resource?: {
    type: string;
    id: string | number;
    ownerId?: number;
  };
}

/**
 * Role validation response interface
 */
export interface RoleValidationResponse {
  allowed: boolean;
  reason?: string;
  requiredRole?: string;
  requiredPermission?: string;
}

/**
 * Role assignment request interface
 */
export interface RoleAssignmentRequest {
  userId: number;
  roleName: string;
  assignedBy: number;
  reason?: string;
  effectiveFrom?: Date;
  effectiveUntil?: Date;
}

/**
 * Role assignment response interface
 */
export interface RoleAssignmentResponse {
  success: boolean;
  assignment?: UserRoleAssignment;
  error?: string;
  code?: string;
}

/**
 * Role transition validation interface
 */
export interface RoleTransitionValidation {
  valid: boolean;
  currentRole: string;
  newRole: string;
  adminId: number;
  errors?: string[];
  warnings?: string[];
}

/**
 * User with role information interface
 */
export interface UserWithRole {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role_id: string;
  role_name: string;
  role_hierarchy_level: number;
  permissions: string[];
}

/**
 * Access control check interface
 */
export interface AccessControlCheck {
  userId: number;
  resourceType: string;
  resourceId: string | number;
  action: string;
  context?: Record<string, any>;
}

/**
 * Access control result interface
 */
export interface AccessControlResult {
  granted: boolean;
  reason?: string;
  requiredPermission?: string;
  userPermissions?: string[];
}

/**
 * Role management API response interface
 */
export interface RoleManagementResponse {
  success: boolean;
  data?: any;
  error?: string;
  code?: string;
  details?: Record<string, any>;
}

/**
 * Permission check interface
 */
export interface PermissionCheck {
  userId: number;
  permissionName: string;
  resourceContext?: {
    type: string;
    id: string | number;
    ownerId?: number;
  };
}

/**
 * Role hierarchy interface
 */
export interface RoleHierarchy {
  role: string;
  level: number;
  inheritsFrom: string[];
  permissions: string[];
}
