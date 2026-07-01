'use client';

/**
 * Logout Button Component
 * Handles user logout with loading state
 */

import React, { useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';

interface LogoutButtonProps {
  className?: string;
  variant?: 'primary' | 'secondary' | 'text';
}

export function LogoutButton({ className = '', variant = 'secondary' }: LogoutButtonProps) {
  const { logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear local state even if API call fails
    } finally {
      setIsLoading(false);
    }
  };

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    text: 'text-gray-700 hover:text-gray-900 hover:underline',
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      aria-label="Log out of your account"
      className={`
        px-4 py-2 rounded-md font-medium
        transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-blue-500
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {isLoading ? 'Logging out...' : 'Logout'}
    </button>
  );
}
