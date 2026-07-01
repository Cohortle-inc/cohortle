'use client';

/**
 * Signup Page
 * Allows new users to create an account.
 * Supports acceptToken query param for acceptance-email-based signup.
 */

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SignupForm } from '@/components/auth/SignupForm';
import Link from 'next/link';

function SignupPageInner() {
  const searchParams = useSearchParams();
  const acceptToken = searchParams.get('acceptToken') || undefined;
  const prefillName = searchParams.get('name') || undefined;
  const prefillEmail = searchParams.get('email') || undefined;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {acceptToken ? 'Complete your enrolment' : 'Create your account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {acceptToken
              ? 'Create an account to access your programme'
              : 'Join us and start your learning journey'}
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <SignupForm
            acceptToken={acceptToken}
            prefillName={prefillName}
            prefillEmail={prefillEmail}
          />
        </div>

        {acceptToken && (
          <p className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <a
              href={`/login?acceptToken=${acceptToken}&email=${encodeURIComponent(prefillEmail || '')}`}
              className="text-[#391D65] hover:underline font-medium"
            >
              Log in instead
            </a>
          </p>
        )}

        <div className="text-center">
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#391D65]" /></div>}>
      <SignupPageInner />
    </Suspense>
  );
}
