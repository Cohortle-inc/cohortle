'use client';

/**
 * Email Verification Page
 * Handles email verification via token from URL
 * Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.5
 */

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import Link from 'next/link';

type VerificationState = 'loading' | 'success' | 'error';

interface VerificationError {
  type: 'invalid' | 'expired' | 'already_verified' | 'user_not_found' | 'unknown';
  message: string;
}

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshVerificationStatus } = useAuth();
  
  const [state, setState] = useState<VerificationState>('loading');
  const [error, setError] = useState<VerificationError | null>(null);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setError({
          type: 'invalid',
          message: 'No verification token provided',
        });
        setState('error');
        return;
      }

      try {
        const response = await fetch('/api/proxy/v1/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok && !data.error) {
          // Success - update auth context
          await refreshVerificationStatus();
          setState('success');
          
          // Start countdown for redirect
          const timer = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(timer);
                router.push('/dashboard');
                return 0;
              }
              return prev - 1;
            });
          }, 1000);

          return () => clearInterval(timer);
        } else {
          // Handle specific error cases
          const errorMessage = data.message || 'Verification failed';
          let errorType: VerificationError['type'] = 'unknown';

          if (errorMessage.includes('invalid') || errorMessage.includes('not found')) {
            errorType = 'invalid';
          } else if (errorMessage.includes('expired')) {
            errorType = 'expired';
          } else if (errorMessage.includes('already')) {
            errorType = 'already_verified';
          } else if (errorMessage.includes('User not found')) {
            errorType = 'user_not_found';
          }

          setError({
            type: errorType,
            message: errorMessage,
          });
          setState('error');
        }
      } catch (err) {
        console.error('Verification error:', err);
        setError({
          type: 'unknown',
          message: 'An unexpected error occurred during verification',
        });
        setState('error');
      }
    };

    verifyEmail();
  }, [searchParams, refreshVerificationStatus, router]);

  const handleRequestNewLink = async () => {
    try {
      const response = await fetch('/api/proxy/v1/api/auth/resend-verification', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok && !data.error) {
        alert('A new verification email has been sent. Please check your inbox.');
      } else {
        alert(data.message || 'Failed to send verification email');
      }
    } catch (err) {
      alert('Failed to send verification email. Please try again later.');
    }
  };

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#391D65] mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Verifying your email...
          </h1>
          <p className="text-gray-600">
            Please wait while we verify your email address.
          </p>
        </div>
      </div>
    );
  }

  if (state === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-green-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Email verified successfully!
          </h1>
          <p className="text-gray-600 mb-4">
            You can now access all features including creating and joining programmes.
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to dashboard in {countdown} second{countdown !== 1 ? 's' : ''}...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-red-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
          <svg
            className="h-8 w-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {error?.type === 'invalid' && 'Invalid verification link'}
          {error?.type === 'expired' && 'Verification link expired'}
          {error?.type === 'already_verified' && 'Already verified'}
          {error?.type === 'user_not_found' && 'User not found'}
          {error?.type === 'unknown' && 'Verification failed'}
        </h1>
        
        <p className="text-gray-600 mb-6">
          {error?.message}
        </p>

        <div className="space-y-3">
          {error?.type === 'already_verified' ? (
            <Link
              href="/dashboard"
              className="
                inline-block w-full px-4 py-2 bg-[#391D65] text-white rounded-md
                font-medium hover:bg-[#391D65]/90
                focus:outline-none focus:ring-2 focus:ring-[#391D65]
                transition-colors duration-200
              "
            >
              Go to Dashboard
            </Link>
          ) : error?.type === 'user_not_found' ? (
            <Link
              href="/signup"
              className="
                inline-block w-full px-4 py-2 bg-[#391D65] text-white rounded-md
                font-medium hover:bg-[#391D65]/90
                focus:outline-none focus:ring-2 focus:ring-[#391D65]
                transition-colors duration-200
              "
            >
              Create Account
            </Link>
          ) : (
            <>
              <button
                onClick={handleRequestNewLink}
                className="
                  w-full px-4 py-2 bg-[#391D65] text-white rounded-md
                  font-medium hover:bg-[#391D65]/90
                  focus:outline-none focus:ring-2 focus:ring-[#391D65]
                  transition-colors duration-200
                "
              >
                Request new verification link
              </button>
              <Link
                href="/dashboard"
                className="
                  inline-block w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md
                  font-medium hover:bg-gray-50
                  focus:outline-none focus:ring-2 focus:ring-[#391D65]
                  transition-colors duration-200
                "
              >
                Go to Dashboard
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#391D65]"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
