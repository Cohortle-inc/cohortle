'use client';

/**
 * Convener Layout
 * Layout wrapper for all convener routes with navigation
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { getPendingApplicationsCount } from '@/lib/api/applications';

interface ConvenerLayoutProps {
  children: React.ReactNode;
}

export default function ConvenerLayout({ children }: ConvenerLayoutProps) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!user || user.role !== 'convener') return;
    getPendingApplicationsCount().then(setPendingCount).catch(() => {});
  }, [user]);

  // Show loading while auth is initializing
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // User should be authenticated at this point (middleware handles redirect)
  if (!user) {
    return null;
  }

  // Verify user has convener role
  if (user.role !== 'convener') {
    // Redirect non-conveners to the regular dashboard
    router.push('/dashboard');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand */}
            <div className="flex items-center">
              <button
                onClick={() => router.push('/convener/dashboard')}
                className="text-xl font-bold text-[#391D65] hover:text-[#391D65]/80"
              >
                Cohortle
              </button>
              <span className="ml-3 px-2 py-1 text-xs font-medium bg-[#391D65] text-white rounded">
                Convener
              </span>
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex space-x-1">
              <button
                onClick={() => router.push('/convener/dashboard')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  pathname === '/convener/dashboard'
                    ? 'bg-[#ECDCFF] text-[#391D65]'
                    : 'text-gray-700 hover:text-[#391D65] hover:bg-gray-50'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => router.push('/convener/applications')}
                className={`relative px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  pathname?.startsWith('/convener/applications')
                    ? 'bg-[#ECDCFF] text-[#391D65]'
                    : 'text-gray-700 hover:text-[#391D65] hover:bg-gray-50'
                }`}
              >
                Applications
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {pendingCount > 99 ? '99+' : pendingCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => router.push('/convener/learners')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  pathname?.startsWith('/convener/learners')
                    ? 'bg-[#ECDCFF] text-[#391D65]'
                    : 'text-gray-700 hover:text-[#391D65] hover:bg-gray-50'
                }`}
              >
                Learners
              </button>
              <button
                onClick={() => router.push('/convener/settings')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  pathname === '/convener/settings'
                    ? 'bg-[#ECDCFF] text-[#391D65]'
                    : 'text-gray-700 hover:text-[#391D65] hover:bg-gray-50'
                }`}
              >
                Settings
              </button>
              <button
                onClick={() => router.push('/convener/org-analytics')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  pathname === '/convener/org-analytics'
                    ? 'bg-[#ECDCFF] text-[#391D65]'
                    : 'text-gray-700 hover:text-[#391D65] hover:bg-gray-50'
                }`}
              >
                Org Analytics
              </button>
              <button
                onClick={() => router.push('/convener/operations-center')}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  pathname === '/convener/operations-center'
                    ? 'bg-[#ECDCFF] text-[#391D65]'
                    : 'text-gray-700 hover:text-[#391D65] hover:bg-gray-50'
                }`}
              >
                Operations Center
              </button>
            </nav>

            {/* User Menu */}
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

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}
