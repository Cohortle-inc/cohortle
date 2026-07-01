'use client';

/**
 * Authentication Context
 * Provides global authentication state and methods throughout the application
 * Uses httpOnly cookies for secure token storage
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import * as authApi from '../api/auth';

/**
 * User data interface
 */
export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  role?: 'student' | 'convener' | 'instructor' | 'administrator';
  profilePicture?: string;
  emailVerified: boolean;
  organisationSlug?: string;
}

/**
 * Authentication context type
 */
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (googleIdToken: string) => Promise<void>;
  signup: (email: string, firstName: string, lastName: string, password: string, role: 'student' | 'convener', invitationCode?: string, options?: { skipRedirect?: boolean }) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (token: string, newPassword: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  refreshVerificationStatus: () => Promise<void>;
}

/**
 * Create authentication context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication provider props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication Provider Component
 * Manages authentication state and provides auth methods to children
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  /**
   * Initialize auth state from httpOnly cookie on mount
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if token exists via API
        const response = await fetch('/api/auth/token');
        const data = await response.json();
        
        if (data.hasToken) {
          // Validate token by fetching user profile via proxy
          const profileResponse = await fetch('/api/proxy/v1/api/profile');

          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            // Backend returns { error: false, message: "...", user: {...}, stats: {...} }
            if (!profileData.error && profileData.user) {
              const user = profileData.user;
              
              setUser({
                id: user.id.toString(),
                email: user.email,
                username: user.email.split('@')[0],
                name: user.name || user.email,
                role: user.role,
                profilePicture: user.profilePicture,
                emailVerified: user.email_verified === true || user.email_verified === 1,
                organisationSlug: user.organisation_slug || user.organisationSlug || undefined,
              });
            } else {
              // If profile fetch fails or returns error, clear the invalid token
              console.warn('Profile fetch returned error, clearing token');
              await fetch('/api/auth/logout', { method: 'POST' });
            }
          } else {
            // If profile fetch fails with non-OK status, clear the invalid token
            console.warn('Profile fetch failed with status:', profileResponse.status);
            await fetch('/api/auth/logout', { method: 'POST' });
          }
        }
      } catch (error) {
        console.error('Failed to validate token:', error);
        // On error, try to clear any potentially invalid token
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
        } catch (logoutError) {
          console.error('Failed to clear token on error:', logoutError);
        }
      }
      
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  /**
   * Login with email and password
   */
  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await authApi.login({ email, password });
      
      // Token is stored in httpOnly cookie by API route
      // Set user state
      setUser(response.user);
      
      // Redirect based on role with full page reload to clear cache
      const userRole = response.user.role;
      const dashboardUrl = userRole === 'convener' ? '/convener/dashboard'
        : userRole === 'administrator' ? '/admin'
        : '/dashboard';
      
      // Use window.location.href for full page reload to clear any cached state
      // This prevents the need for Ctrl+F5 after login
      window.location.href = dashboardUrl;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  /**
   * Sign in with Google ID token
   */
  const loginWithGoogle = async (googleIdToken: string): Promise<void> => {
    try {
      const response = await fetch('/api/auth/google-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ google_id_token: googleIdToken }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.message || 'Google sign-in failed');
      }

      setUser(data.user);

      const userRole = data.user?.role;
      const dashboardUrl = userRole === 'convener' ? '/convener/dashboard'
        : userRole === 'administrator' ? '/admin'
        : '/dashboard';
      window.location.href = dashboardUrl;
    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    }
  };

  /**
   * Sign up new user.
   * Returns the created user so callers can perform post-signup actions
   * (e.g. acceptance token redemption) before redirecting.
   * Pass `skipRedirect: true` to suppress the automatic navigation.
   */
  const signup = async (
    email: string,
    firstName: string,
    lastName: string,
    password: string,
    role: 'student' | 'convener',
    invitationCode?: string,
    options?: { skipRedirect?: boolean }
  ): Promise<void> => {
    try {
      const response = await authApi.register({ email, firstName, lastName, password, role, invitationCode });
      
      // Token is stored in httpOnly cookie by API route
      setUser(response.user);

      if (options?.skipRedirect) {
        // Caller is responsible for navigation (e.g. after token redemption)
        return;
      }
      
      // Redirect based on role from API response (not the parameter, as backend may override)
      const userRole = response.user.role || role;
      const dashboardUrl = userRole === 'convener' ? '/convener/dashboard'
        : userRole === 'administrator' ? '/admin'
        : '/dashboard';
      
      window.location.href = dashboardUrl;
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  };

  /**
   * Logout current user
   */
  const logout = async (): Promise<void> => {
    // Clear user state IMMEDIATELY (synchronously) to prevent flash of wrong dashboard
    setUser(null);
    
    try {
      // Call logout API to clear httpOnly cookie
      await authApi.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with redirect even if API call fails
    }
    
    // Use window.location.href for full page reload to clear any cached state
    window.location.href = '/login';
  };

  /**
   * Request password reset email
   */
  const resetPassword = async (email: string): Promise<void> => {
    try {
      await authApi.requestPasswordReset(email);
    } catch (error) {
      console.error('Password reset request failed:', error);
      throw error;
    }
  };

  /**
   * Update password with reset token
   */
  const updatePassword = async (
    token: string,
    newPassword: string
  ): Promise<void> => {
    try {
      await authApi.resetPassword(token, newPassword);
    } catch (error) {
      console.error('Password update failed:', error);
      throw error;
    }
  };

  /**
   * Resend verification email to current user
   */
  const resendVerificationEmail = async (): Promise<void> => {
    try {
      const response = await fetch('/api/proxy/v1/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.message || 'Failed to resend verification email');
      }
    } catch (error) {
      console.error('Resend verification email failed:', error);
      throw error;
    }
  };

  /**
   * Refresh verification status from backend
   */
  const refreshVerificationStatus = async (): Promise<void> => {
    try {
      const profileResponse = await fetch('/api/proxy/v1/api/profile');

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        if (!profileData.error && profileData.user) {
          const user = profileData.user;
          
          setUser({
            id: user.id.toString(),
            email: user.email,
            username: user.email.split('@')[0],
            name: user.name || user.email,
            role: user.role,
            profilePicture: user.profilePicture,
            emailVerified: user.email_verified === true || user.email_verified === 1,
            organisationSlug: user.organisation_slug || user.organisationSlug || undefined,
          });
        }
      }
    } catch (error) {
      console.error('Failed to refresh verification status:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    loginWithGoogle,
    signup,
    logout,
    resetPassword,
    updatePassword,
    resendVerificationEmail,
    refreshVerificationStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use authentication context
 * Must be used within AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
