'use client';

/**
 * Signup Form Component
 * Handles new user registration
 */

import React, { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { FormInput } from '@/components/ui/FormInput';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import {
  validateEmail,
  validatePassword,
  validateRequired,
} from '@/lib/utils/validation';
import { trackSignup } from '@/lib/utils/analytics';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { redeemAcceptanceToken } from '@/lib/api/applications';

interface SignupFormProps {
  acceptToken?: string;
  prefillName?: string;
  prefillEmail?: string;
}

export function SignupForm({ acceptToken, prefillName, prefillEmail }: SignupFormProps = {}) {
  const [email, setEmail] = useState(prefillEmail || '');
  const [firstName, setFirstName] = useState(() => {
    if (!prefillName) return '';
    const parts = prefillName.trim().split(' ');
    return parts[0] || '';
  });
  const [lastName, setLastName] = useState(() => {
    if (!prefillName) return '';
    const parts = prefillName.trim().split(' ');
    return parts.slice(1).join(' ') || '';
  });
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'convener'>('student');
  const [invitationCode, setInvitationCode] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { signup } = useAuth();

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!validateRequired(email)) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!validateRequired(firstName)) {
      newErrors.firstName = 'First name is required';
    }

    if (!validateRequired(lastName)) {
      newErrors.lastName = 'Last name is required';
    }

    if (!validateRequired(password)) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(password)) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (role === 'convener' && !validateRequired(invitationCode)) {
      newErrors.invitationCode = 'Invitation code is required for convener signup';
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
    setSuccessMessage('');

    try {
      await signup(email, firstName, lastName, password, role, invitationCode || undefined, {
        skipRedirect: !!acceptToken,
      });
      
      // Track signup event
      trackSignup(role);

      // Restore any pending bookmark saved before the user was prompted to sign up
      try {
        const raw = sessionStorage.getItem('cohortle_pending_bookmark');
        if (raw) {
          const bookmark = JSON.parse(raw);
          const existing = JSON.parse(localStorage.getItem('cohortle_discover_bookmarks') || '[]');
          const alreadySaved = existing.some((b: { id: number }) => b.id === bookmark.id);
          if (!alreadySaved) {
            existing.unshift({ ...bookmark, organisation_url: null, savedAt: new Date().toISOString() });
            localStorage.setItem('cohortle_discover_bookmarks', JSON.stringify(existing));
          }
          sessionStorage.removeItem('cohortle_pending_bookmark');
        }
      } catch {
        // Non-fatal — bookmark restore failed silently
      }

      // If this signup came from an acceptance email, redeem the token to enroll
      if (acceptToken) {
        try {
          const result = await redeemAcceptanceToken(acceptToken);
          if (result.enrolled && result.programmeId) {
            window.location.href = `/programmes/${result.programmeId}`;
            return;
          }
        } catch (tokenErr) {
          console.warn('Failed to redeem acceptance token after signup:', tokenErr);
          // Non-fatal — user is signed up, just redirect to dashboard
        }
        window.location.href = '/dashboard';
        return;
      }
      
      // Show success message with verification instructions
      setSuccessMessage(
        `Account created successfully! We've sent a verification email to ${email}. ` +
        `You can explore your account now, but you'll need to verify your email to join or create programmes.`
      );
    } catch (error: unknown) {
      console.error('Signup error:', error);
      
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message 
        : undefined;
      
      // Handle specific error cases
      if (errorMessage?.includes('email')) {
        setErrors({ email: 'An account with this email already exists' });
      } else if (errorMessage?.includes('first_name')) {
        setErrors({ firstName: 'Invalid first name' });
      } else if (errorMessage?.includes('last_name')) {
        setErrors({ lastName: 'Invalid last name' });
      } else {
        setErrors({
          form: errorMessage || 'Failed to create account. Please try again.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.form && (
        <ErrorMessage message={errors.form} className="mb-4" />
      )}

      {successMessage && (
        <div
          className="bg-green-50 border border-green-200 rounded-md p-4 mb-4"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm text-green-800">{successMessage}</p>
        </div>
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
          <span className="bg-white px-2 text-gray-500">or sign up with email</span>
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
        label="First Name"
        type="text"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        error={errors.firstName}
        disabled={isSubmitting}
        autoComplete="given-name"
      />

      <FormInput
        label="Last Name"
        type="text"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        error={errors.lastName}
        disabled={isSubmitting}
        autoComplete="family-name"
      />

      <FormInput
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        disabled={isSubmitting}
        autoComplete="new-password"
        helperText="Must be at least 8 characters"
      />

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          I want to
        </label>
        <div className="space-y-2">
          <label
            className={`
              relative flex cursor-pointer rounded-lg border p-4 focus:outline-none
              ${
                role === 'student'
                  ? 'border-[#391D65] bg-[#ECDCFF]'
                  : 'border-gray-300 bg-white hover:bg-gray-50'
              }
            `}
          >
            <input
              type="radio"
              name="role"
              value="student"
              checked={role === 'student'}
              onChange={(e) => setRole(e.target.value as 'student' | 'convener')}
              disabled={isSubmitting}
              className="sr-only"
            />
            <div className="flex items-center">
              <div className="text-2xl mr-3">🎓</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Join and learn from courses
                </p>
              </div>
            </div>
            {role === 'student' && (
              <div className="absolute -inset-px rounded-lg border-2 border-[#391D65] pointer-events-none" />
            )}
          </label>

          <label
            className={`
              relative flex cursor-pointer rounded-lg border p-4 focus:outline-none
              ${
                role === 'convener'
                  ? 'border-[#391D65] bg-[#ECDCFF]'
                  : 'border-gray-300 bg-white hover:bg-gray-50'
              }
            `}
          >
            <input
              type="radio"
              name="role"
              value="convener"
              checked={role === 'convener'}
              onChange={(e) => setRole(e.target.value as 'student' | 'convener')}
              disabled={isSubmitting}
              className="sr-only"
            />
            <div className="flex items-center">
              <div className="text-2xl mr-3">👨‍🏫</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Create and manage courses
                </p>
              </div>
            </div>
            {role === 'convener' && (
              <div className="absolute -inset-px rounded-lg border-2 border-[#391D65] pointer-events-none" />
            )}
          </label>
        </div>
      </div>

      {role === 'convener' && (
        <FormInput
          label="Invitation Code"
          type="text"
          value={invitationCode}
          onChange={(e) => setInvitationCode(e.target.value.trim())}
          error={errors.invitationCode}
          disabled={isSubmitting}
          autoComplete="off"
          helperText="Required for convener signup. Contact an administrator if you don't have one."
        />
      )}

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
        {isSubmitting ? 'Creating account...' : 'Sign Up'}
      </button>

      <p className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link
          href="/login"
          className="text-[#391D65] hover:text-[#391D65]/80 hover:underline font-medium"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}
