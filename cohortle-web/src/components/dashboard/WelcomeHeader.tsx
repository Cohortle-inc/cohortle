'use client';

/**
 * Welcome Header Component
 * Displays welcome message with user's name and profile picture
 */

import React from 'react';
import { User } from '@/lib/contexts/AuthContext';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { sanitizeName } from '@/lib/utils/sanitize';

interface WelcomeHeaderProps {
  user: User | null;
}

export function WelcomeHeader({ user }: WelcomeHeaderProps) {
  if (!user) {
    return null;
  }

  // Get user initials for avatar fallback
  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const initials = getInitials(sanitizeName(user.name || user.username));

  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Profile Picture or Initials */}
            <div className="flex-shrink-0">
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={`${user.name || user.username}'s profile`}
                  title={`${user.name || user.username}'s profile picture`}
                  className="h-12 w-12 rounded-full object-cover"
                  onError={(e) => {
                    // Fallback to initials if image fails to load
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) {
                      fallback.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <div
                className={`h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center ${
                  user.profilePicture ? 'hidden' : 'flex'
                }`}
              >
                <span className="text-white font-semibold text-lg">{initials}</span>
              </div>
            </div>

            {/* Welcome Message */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {sanitizeName(user.name || user.username)}!
              </h1>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
          </div>

          {/* Logout Button */}
          <div>
            <LogoutButton variant="secondary" />
          </div>
        </div>
      </div>
    </div>
  );
}
