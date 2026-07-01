'use client';

/**
 * Login Form Component
 * Handles user login with email and password
 */

import React, { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { FormInput } from '@/components/ui/FormInput';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { validateEmail, validateRequired } from '@/lib/utils/validation';
import { trackLogin } from '@/lib/utils/analytics';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';

interface LoginFormProps {
  onSuccess?: () => void;
  prefillEmail?: string;
}

export function LoginForm({ onSuccess, prefillEmail }: LoginFormProps) {
  const [email, setEmail] = useState(prefillEmail || '');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!validateRequired(email)) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!validateRequired(password)) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await login(email, password);
      
      // Track login event
      trackLogin();
      
      // Call success callback if provided
      onSuccess?.();

      // If this login came from an acceptance email, redeem the token
      const acceptToken = searchParams.get('acceptToken');
      if (acceptToken) {
        try {
          const { redeemAcceptanceToken } = await import('@/lib/api/applications');
          const result = await redeemAcceptanceToken(acceptToken);
          if (result.enrolled && result.programmeId) {
            window.location.href = `/programmes/${result.programmeId}`;
            return;
          }
        } catch (tokenErr) {
          console.warn('Failed to redeem acceptance token after login:', tokenErr);
        }
        window.location.href = '/dashboard';
        return;
      }

      // Check for a redirect/returnUrl param and send the user back there
      const redirectTo = searchParams.get('redirect') || searchParams.get('returnUrl');
      if (redirectTo && redirectTo.startsWith('/')) {
        window.location.href = redirectTo;
        return;
      }

      // Note: Redirect is handled by AuthContext.login() with full page reload
    } catch (error: unknown) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message 
        : undefined;
      setErrors({
        form: errorMessage || 'Invalid email or password. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.form && (
        <ErrorMessage message={errors.form} className="mb-4" />
      )}

      <GoogleAuthButton
        onSuccess={(_user) => {
          window.location.href = '/dashboard';
        }}
        onError={(message) => setErrors({ form: message })}
        disabled={isSubmitting}
      />

      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-gray-500">or sign in with email</span>
        </div>
      </div>

      <FormInput
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        disabled={isSubmitting}
        autoComplete="email"
      />

      <FormInput
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        disabled={isSubmitting}
        autoComplete="current-password"
      />

      <div className="flex items-center justify-between">
        <Link
          href="/forgot-password"
          className="text-sm text-[#391D65] hover:text-[#391D65]/80 hover:underline"
        >
          Forgot Password?
        </Link>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="
          w-full px-4 py-2 bg-[#391D65] text-white rounded-md
          font-medium hover:bg-[#391D65]/90
          disabled:opacity-50 disabled:cursor-not-allowed
          focus:outline-none focus:ring-2 focus:ring-[#391D65]
          transition-colors duration-200
        "
      >
        {isSubmitting ? 'Logging in...' : 'Log In'}
      </button>

      <p className="text-center text-sm text-gray-600">
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          className="text-[#391D65] hover:text-[#391D65]/80 hover:underline font-medium"
        >
          Sign up
        </Link>
      </p>
    </form>
  );
}
