'use client';

/**
 * Admin Layout
 * Layout wrapper for all /internal routes with navigation and role protection.
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 3.1, 3.2, 5.1, 5.2
 */

import React from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Requirement 1.3: Show loading spinner while auth is initialising
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Requirement 1.5: Redirect to /login if no authenticated user
  if (!user) {
    router.push('/login');
    return null;
  }

  // Requirement 1.4: Redirect to /unauthorized if user is not an administrator
  if (user.role !== 'administrator') {
    router.push('/unauthorized');
    return null;
  }

  // Requirement 3.1, 3.2: Logout handler
  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Requirement 2.2: Determine active nav link
  const isLeadsActive = pathname === '/internal/leads';
  const isDemoGuideActive = pathname === '/internal/demo-guide';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Requirement 1.1: Navigation header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Brand + Admin badge */}
            <div className="flex items-center">
              <button
                onClick={() => router.push('/internal/leads')}
                className="text-xl font-bold text-[#391D65] hover:text-[#391D65]/80"
              >
                Cohortle
              </button>
              <span className="ml-3 px-2 py-1 text-xs font-medium bg-[#391D65] text-white rounded">
                Admin
              </span>
            </div>

            {/* Requirement 2.1: Navigation links */}
            <nav className="hidden md:flex space-x-8">
              <button
                onClick={() => router.push('/internal/leads')}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  isLeadsActive
                    ? 'text-[#391D65] border-b-2 border-[#391D65]'
                    : 'text-gray-700 hover:text-[#391D65]'
                }`}
              >
                Leads
              </button>
              <button
                onClick={() => router.push('/internal/demo-guide')}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  isDemoGuideActive
                    ? 'text-[#391D65] border-b-2 border-[#391D65]'
                    : 'text-gray-700 hover:text-[#391D65]'
                }`}
              >
                Demo Guide
              </button>
            </nav>

            {/* Requirement 1.2: User name + logout button */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700 hidden sm:block">
                {user.name}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-700 hover:text-[#391D65] font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Requirement 5.1: Render page content */}
      <main>{children}</main>
    </div>
  );
}
