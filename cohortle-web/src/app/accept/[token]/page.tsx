'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { redeemAcceptanceToken, RedemptionResult } from '@/lib/api/applications';
import { useAuth } from '@/lib/contexts/AuthContext';

/**
 * Acceptance landing page — handles the acceptance email link.
 * Requirements: 5.4, 5.5, 5.8
 */
export default function AcceptanceLandingPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const { user } = useAuth();

  const [status, setStatus] = useState<'loading' | 'success' | 'expired' | 'used' | 'error'>('loading');
  const [result, setResult] = useState<RedemptionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const redeem = async () => {
      try {
        const data = await redeemAcceptanceToken(token);
        setResult(data);

        if (data.requiresSignup) {
          // Could be a new user or an existing user who isn't logged in.
          // Redirect to signup with pre-fill; if they already have an account
          // the signup page will show an error and they can switch to login.
          const params = new URLSearchParams({
            name: data.prefill?.name || '',
            email: data.prefill?.email || '',
            acceptToken: token,
          });
          // Also provide a login fallback link
          router.push(`/signup?${params.toString()}`);
          return;
        }

        // Existing user enrolled — redirect to programme
        setStatus('success');
        setTimeout(() => {
          if (data.programmeId) {
            router.push(`/programmes/${data.programmeId}`);
          } else {
            router.push('/dashboard');
          }
        }, 2500);
      } catch (err: unknown) {
        const code = (err as { response?: { data?: { code?: string } } })?.response?.data?.code;
        if (code === 'TOKEN_EXPIRED') {
          setStatus('expired');
        } else if (code === 'TOKEN_ALREADY_USED') {
          setStatus('used');
        } else {
          setStatus('error');
          setErrorMessage(err instanceof Error ? err.message : 'Something went wrong');
        }
      }
    };

    redeem();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-gray-500 text-lg">Processing your acceptance link...</div>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re enrolled!</h1>
          <p className="text-gray-600">Redirecting you to your programme...</p>
        </div>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="text-5xl mb-4">⏰</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Link expired</h1>
          <p className="text-gray-600 mb-6">
            This acceptance link has expired (links are valid for 7 days). Please contact the programme organiser to request a new link.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Go to dashboard
          </a>
        </div>
      </div>
    );
  }

  if (status === 'used') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Already redeemed</h1>
          <p className="text-gray-600 mb-6">
            This acceptance link has already been used. If you&apos;re already enrolled, head to your dashboard.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Go to dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="text-5xl mb-4">❌</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-gray-600 mb-6">{errorMessage || 'This link is invalid or has already been used.'}</p>
        <a
          href="/dashboard"
          className="inline-flex items-center px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Go to dashboard
        </a>
      </div>
    </div>
  );
}
