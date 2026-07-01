'use client';

/**
 * RoleRedirect Component
 * Redirects users based on their role
 * Useful for role-based navigation and access control
 * 
 * Requirements: 6.1, 6.2, 6.3
 */

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRole } from '@/lib/contexts/RoleContext';

interface RoleRedirectProps {
  /** Role-to-URL mapping for redirects */
  roleMap: Record<string, string>;
  /** Default URL if role not found in map */
  defaultUrl?: string;
  /** If true, shows loading state during redirect */
  showLoading?: boolean;
}

/**
 * RoleRedirect Component
 * Automatically redirects users based on their role
 * 
 * @example
 * <RoleRedirect 
 *   roleMap={{
 *     'student': '/dashboard',
 *     'convener': '/convener/dashboard',
 *     'administrator': '/admin/dashboard'
 *   }}
 *   defaultUrl="/login"
 * />
 */
export function RoleRedirect({ 
  roleMap, 
  defaultUrl = '/login',
  showLoading = true 
}: RoleRedirectProps) {
  const { userRole, isLoading } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // Get redirect URL based on role
      const redirectUrl = userRole && roleMap[userRole] 
        ? roleMap[userRole] 
        : defaultUrl;

      // Perform redirect
      router.push(redirectUrl);
    }
  }, [userRole, isLoading, roleMap, defaultUrl, router]);

  // Show loading state during redirect
  if (showLoading && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return null;
}
