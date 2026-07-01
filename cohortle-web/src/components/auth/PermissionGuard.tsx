'use client';

/**
 * PermissionGuard Component
 * Conditionally renders children based on user permissions
 * 
 * Requirements: 6.1, 6.2, 6.3
 */

import React, { ReactNode } from 'react';
import { useRole } from '@/lib/contexts/RoleContext';

interface PermissionGuardProps {
  /** Single permission or array of permissions required to view content */
  permission: string | string[];
  /** Content to render if user has required permission */
  children: ReactNode;
  /** Optional fallback content to render if user lacks permission */
  fallback?: ReactNode;
  /** If true, shows loading state while checking permission */
  showLoading?: boolean;
}

/**
 * PermissionGuard Component
 * Conditionally renders children based on user's permissions
 * 
 * @example
 * <PermissionGuard permission="create_programme">
 *   <CreateProgrammeButton />
 * </PermissionGuard>
 * 
 * @example
 * <PermissionGuard 
 *   permission={['manage_users', 'manage_roles']} 
 *   fallback={<AccessDenied />}
 * >
 *   <UserManagementPanel />
 * </PermissionGuard>
 */
export function PermissionGuard({ 
  permission, 
  children, 
  fallback = null,
  showLoading = false 
}: PermissionGuardProps) {
  const { hasPermission, isLoading } = useRole();

  // Show loading state if requested
  if (isLoading && showLoading) {
    return <div className="flex items-center justify-center p-4">Loading...</div>;
  }

  // Check if user has required permission
  const hasRequiredPermission = hasPermission(permission);

  // Render children if user has permission, otherwise render fallback
  return hasRequiredPermission ? <>{children}</> : <>{fallback}</>;
}
