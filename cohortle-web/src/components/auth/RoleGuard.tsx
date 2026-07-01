'use client';

/**
 * RoleGuard Component
 * Conditionally renders children based on user role
 * Supports role hierarchy (administrator > convener > student)
 * 
 * Requirements: 6.1, 6.2, 6.3
 */

import React, { ReactNode } from 'react';
import { useRole } from '@/lib/contexts/RoleContext';

interface RoleGuardProps {
  /** Single role or array of roles required to view content */
  role: string | string[];
  /** Content to render if user has required role */
  children: ReactNode;
  /** Optional fallback content to render if user lacks role */
  fallback?: ReactNode;
  /** If true, shows loading state while checking role */
  showLoading?: boolean;
}

/**
 * RoleGuard Component
 * Conditionally renders children based on user's role
 * 
 * @example
 * <RoleGuard role="convener">
 *   <ConvenerDashboard />
 * </RoleGuard>
 * 
 * @example
 * <RoleGuard role={['convener', 'administrator']} fallback={<AccessDenied />}>
 *   <AdminPanel />
 * </RoleGuard>
 */
export function RoleGuard({ 
  role, 
  children, 
  fallback = null,
  showLoading = false 
}: RoleGuardProps) {
  const { hasRole, isLoading } = useRole();

  // Show loading state if requested
  if (isLoading && showLoading) {
    return <div className="flex items-center justify-center p-4">Loading...</div>;
  }

  // Check if user has required role
  const hasRequiredRole = hasRole(role);

  // Render children if user has role, otherwise render fallback
  return hasRequiredRole ? <>{children}</> : <>{fallback}</>;
}
