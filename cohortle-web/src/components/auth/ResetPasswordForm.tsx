'use client';

/**
 * Reset Password Form Component
 * Handles password reset with token
 */

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { FormInput } from '@/components/ui/FormInput';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { validatePassword, validateRequired } from '@/lib/utils/validation';

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updatePassword } = useAuth();
  const router = useRouter();

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!validateRequired(password)) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(password)) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!validateRequired(confirmPassword)) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      await updatePassword(token, password);
      
      // Redirect to login with success message
      router.push('/login?message=password-reset-success');
    } catch (error: unknown) {
      console.error('Password reset error:', error);
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message 
        : undefined;
      setErrors({
        form:
          errorMessage ||
          'Failed to reset password. The link may have expired. Please try again.',
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

      <FormInput
        label="New Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        disabled={isSubmitting}
        autoComplete="new-password"
        helperText="Must be at least 8 characters"
      />

      <FormInput
        label="Confirm Password"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={errors.confirmPassword}
        disabled={isSubmitting}
        autoComplete="new-password"
      />

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
        {isSubmitting ? 'Resetting password...' : 'Reset Password'}
      </button>
    </form>
  );
}
