'use client';

/**
 * Unauthorized Access Page
 * Displayed when users try to access routes they don't have permission for
 * 
 * Requirements: 8.1, 8.3
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { useRole } from '@/lib/contexts/RoleContext';

// Force dynamic rendering to avoid build-time errors with context
export const dynamic = 'force-dynamic';

export default function UnauthorizedPage() {
  const router = useRouter();
  const { userRole } = useRole();

  const handleGoBack = () => {
    router.back();
  };

  const handleGoHome = () => {
    // Redirect based on role
    if (userRole === 'convener' || userRole === 'instructor') {
      router.push('/convener/dashboard');
    } else if (userRole === 'administrator' || userRole === 'admin') {
      router.push('/admin/dashboard');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page.
          </p>
          
          {userRole && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Your current role:</span> {userRole}
              </p>
              <p className="text-sm text-blue-600 mt-2">
                To access this feature, you may need a different role. Contact an administrator for assistance.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={handleGoHome}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
          <button
            onClick={handleGoBack}
            className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
