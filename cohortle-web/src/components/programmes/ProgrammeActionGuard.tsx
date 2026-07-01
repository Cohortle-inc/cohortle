'use client';

/**
 * Programme Action Guard Component
 * Prevents unverified users from creating/joining programmes
 * Requirements: 3.1, 3.2, 3.5
 */

import React, { ReactNode } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import Link from 'next/link';

interface ProgrammeActionGuardProps {
  children: ReactNode;
  action: 'create' | 'join';
  fallback?: ReactNode;
}

export function ProgrammeActionGuard({ children, action, fallback }: ProgrammeActionGuardProps) {
  const { user } = useAuth();

  // Check if email verification is required (MVP mode check)
  // Default to false (disabled) for MVP mode if environment variable is not set
  const requireVerification = process.env.NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION === 'true';

  // If verification is disabled (MVP mode), always render children
  if (!requireVerification) {
    return <>{children}</>;
  }

  // If user is verified, render children
  if (user?.emailVerified) {
    return <>{children}</>;
  }

  // If custom fallback provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default fallback message
  const actionText = action === 'create' ? 'create programmes' : 'join programmes';
  
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-amber-600"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-amber-800 mb-1">
            Email verification required
          </h3>
          <p className="text-sm text-amber-700 mb-3">
            Please verify your email address to {actionText}.
          </p>
          <Link
            href="/dashboard"
            className="
              inline-flex items-center text-sm font-medium text-amber-800 hover:text-amber-900
              underline focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
              rounded px-1
            "
          >
            Verify now →
          </Link>
        </div>
      </div>
    </div>
  );
}
