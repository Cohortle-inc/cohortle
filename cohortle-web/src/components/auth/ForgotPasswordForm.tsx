'use client';

/**
 * Forgot Password Form Component
 * Handles password reset request
 */

import React, { useState, FormEvent } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { FormInput } from '@/components/ui/FormInput';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { validateEmail, validateRequired } from '@/lib/utils/validation';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { resetPassword } = useAuth();

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!validateRequired(email)) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Invalid email format';
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
      await resetPassword(email);
      
      setSuccessMessage(
        'Password reset instructions have been sent to your email. Please check your inbox.'
      );
      setEmail('');
    } catch (error: unknown) {
      console.error('Password reset request error:', error);
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message 
        : undefined;
      setErrors({
        form: errorMessage || 'Failed to send reset email. Please try again.',
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

      {successMessage && (
        <div
          className="bg-green-50 border border-green-200 rounded-md p-4 mb-4"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm text-green-800">{successMessage}</p>
        </div>
      )}

      <FormInput
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        disabled={isSubmitting}
        autoComplete="email"
        helperText="Enter the email address associated with your account"
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
        {isSubmitting ? 'Sending...' : 'Send Reset Instructions'}
      </button>
    </form>
  );
}
