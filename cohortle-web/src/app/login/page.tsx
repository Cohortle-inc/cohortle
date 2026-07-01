/**
 * Login Page
 * Allows users to log in with email and password.
 * Supports acceptToken query param for acceptance-email-based login.
 */

import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import LoginPageInner from './LoginPageInner';

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    }>
      <LoginPageInner />
    </Suspense>
  );
}
