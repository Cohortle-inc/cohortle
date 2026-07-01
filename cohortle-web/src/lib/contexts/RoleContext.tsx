'use client';

/**
 * Role Context
 * Provides role-based access control utilities throughout the application
 * Integrates with AuthContext for user role information
 * 
 * Requirements: 6.5
 */

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useAuth } from './AuthContext';

/**
 * Role context type
 */
export interface RoleContextType {
  userRole: string | null;
  permissions: string[];
  hasRole: (role: string | string[]) => boolean;
  hasPermission: (permission: string | string[]) => boolean;
  canPerformAction: (action: string, resource?: any) => Promise<boolean>;
  isLoading: boolean;
}

/**
 * Create role context
 */
const RoleContext = createContext<RoleContextType | undefined>(undefined);

/**
 * Role provider props
 */
interface RoleProviderProps {
  children: ReactNode;
}

/**
 * Role Provider Component
 * Provides role-based access control utilities to children
 */
export function RoleProvider({ children }: RoleProviderProps) {
  const { user, isLoading: authLoading } = useAuth();

  /**
   * Get user's current role
   */
  const userRole = useMemo(() => {
    return user?.role || null;
  }, [user]);

  /**
   * Get user's permissions (from token or API)
   * For now, returns empty array - will be populated from JWT token
   */
  const permissions = useMemo<string[]>(() => {
    // TODO: Extract permissions from JWT token or fetch from API
    return [];
  }, []);

  /**
   * Check if user has specific role(s)
   * Supports role hierarchy: administrator > convener > student
   * 
   * @param role - Single role or array of roles to check
   * @returns True if user has the role or a higher-level role
   */
  const hasRole = (role: string | string[]): boolean => {
    if (!userRole) return false;

    const roles = Array.isArray(role) ? role : [role];
    
    // Role hierarchy levels
    const roleHierarchy: Record<string, number> = {
      'student': 1,
      'convener': 2,
      'instructor': 2,
      'administrator': 3,
      'admin': 3,
    };

    const userLevel = roleHierarchy[userRole] || 0;

    // Check if user has any of the required roles or a higher-level role
    return roles.some(requiredRole => {
      const requiredLevel = roleHierarchy[requiredRole] || 0;
      return userLevel >= requiredLevel;
    });
  };

  /**
   * Check if user has specific permission(s)
   * 
   * @param permission - Single permission or array of permissions to check
   * @returns True if user has at least one of the permissions
   */
  const hasPermission = (permission: string | string[]): boolean => {
    if (permissions.length === 0) return false;

    const perms = Array.isArray(permission) ? permission : [permission];
    return perms.some(p => permissions.includes(p));
  };

  /**
   * Check if user can perform an action
   * Makes API call to backend for validation
   * 
   * @param action - Action to perform
   * @param resource - Optional resource context
   * @returns Promise resolving to true if action is allowed
   */
  const canPerformAction = async (
    action: string,
    resource?: any
  ): Promise<boolean> => {
    try {
      if (!user) return false;

      // For now, use client-side role checking
      // TODO: Implement API call to backend for server-side validation
      const actionRoleMap: Record<string, string[]> = {
        'access_convener_dashboard': ['convener', 'administrator'],
        'create_programme': ['convener', 'administrator'],
        'enroll_in_programme': ['student', 'convener', 'administrator'],
        'modify_system_settings': ['administrator'],
        'manage_users': ['administrator'],
        'manage_roles': ['administrator'],
      };

      const requiredRoles = actionRoleMap[action];
      if (!requiredRoles) return false;

      return hasRole(requiredRoles);
    } catch (error) {
      console.error('Error checking action permission:', error);
      return false;
    }
  };

  const value: RoleContextType = {
    userRole,
    permissions,
    hasRole,
    hasPermission,
    canPerformAction,
    isLoading: authLoading,
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

/**
 * Hook to use role context
 * Must be used within RoleProvider
 * Returns safe defaults during SSR/build time
 */
export function useRole(): RoleContextType {
  const context = useContext(RoleContext);
  
  // During SSR or build time, return safe defaults instead of throwing
  if (context === undefined) {
    if (typeof window === 'undefined') {
      // SSR/build time - return safe defaults
      return {
        userRole: null,
        permissions: [],
        hasRole: () => false,
        hasPermission: () => false,
        canPerformAction: async () => false,
        isLoading: true,
      };
    }
    // Client-side without provider - this is an error
    throw new Error('useRole must be used within a RoleProvider');
  }
  
  return context;
}
