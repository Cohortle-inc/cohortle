'use client';

import { useSearchParams } from 'next/navigation';
import { LoginForm } from '@/components/auth/LoginForm';
import Link from 'next/link';

export default function LoginPageInner() {
  const searchParams = useSearchParams();
  const acceptToken = searchParams.get('acceptToken');
  const prefillEmail = searchParams.get('email') || undefined;

  const isAcceptanceFlow = !!acceptToken;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isAcceptanceFlow ? 'Log in to complete your enrolment' : 'Log in to your account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isAcceptanceFlow
              ? 'Log in to access your accepted programme'
              : 'Access your learning programmes and continue your journey'}
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <LoginForm prefillEmail={prefillEmail} />
        </div>

        {isAcceptanceFlow && (
          <p className="text-center text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <a
              href={`/signup?acceptToken=${acceptToken}&email=${encodeURIComponent(prefillEmail || '')}`}
              className="text-[#391D65] hover:underline font-medium"
            >
              Sign up instead
            </a>
          </p>
        )}

        <div className="text-center">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 hover:underline">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
