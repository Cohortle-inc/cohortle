'use client';

/**
 * Email Verification Banner Component
 * Displays a warning banner for unverified users with resend functionality
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

import React, { useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';

export function EmailVerificationBanner() {
  const { user, resendVerificationEmail } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // MVP MODE: Check if email verification is required
  // Default to false (disabled) for MVP mode if environment variable is not set
  const requireVerification = process.env.NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION === 'true';

  // Don't show banner if:
  // - Email verification is disabled (MVP mode)
  // - User is not authenticated
  // - User is already verified
  if (!requireVerification || !user || user.emailVerified) {
    return null;
  }

  const handleResend = async () => {
    setIsResending(true);
    setError(null);
    setShowSuccess(false);

    try {
      await resendVerificationEmail();
      setShowSuccess(true);
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend verification email';
      
      // Handle rate limiting error
      if (errorMessage.includes('Too many')) {
        setError('Please wait before requesting another email');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3 flex-1">
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
              <p className="text-sm text-amber-800">
                Please verify your email address ({user.email}) to unlock all features.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {showSuccess && (
              <span className="text-sm text-green-700 font-medium">
                ✓ Email sent!
              </span>
            )}
            {error && (
              <span className="text-sm text-red-700 font-medium">
                {error}
              </span>
            )}
            <button
              onClick={handleResend}
              disabled={isResending}
              className="
                text-sm font-medium text-amber-800 hover:text-amber-900
                underline disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
                rounded px-2 py-1
              "
            >
              {isResending ? 'Sending...' : 'Resend verification email'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
