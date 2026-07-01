'use client';

/**
 * Join Programme Page
 * Allows learners to enrol in programmes using enrolment codes
 */

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { FormInput } from '@/components/ui/FormInput';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { enrollInProgramme } from '@/lib/api/programmes';
import { getEnrollmentCodeError } from '@/lib/utils/validation';
import { ProgrammeActionGuard } from '@/components/programmes/ProgrammeActionGuard';
import { trackProgrammeJoin } from '@/lib/utils/analytics';

export default function JoinPage() {
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    const codeError = getEnrollmentCodeError(code);
    if (codeError) {
      newErrors.code = codeError;
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
      const result = await enrollInProgramme(code.trim().toUpperCase());
      
      trackProgrammeJoin(String(result.programme_id));
      // Redirect to programme page on success
      router.push(`/programmes/${result.programme_id}`);
    } catch (error: unknown) {
      console.error('Enrolment error:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Enrolment failed. Please try again.';
      
      setErrors({
        form: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-8 px-4 sm:py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-2xl sm:text-3xl font-bold text-gray-900">
          Join a Programme
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600 px-4">
          Enter your enrolment code to get started
        </p>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 px-4 shadow sm:rounded-lg sm:py-8 sm:px-10">
          <ProgrammeActionGuard action="join">
            <form onSubmit={handleSubmit} className="space-y-6">
              {errors.form && (
                <ErrorMessage message={errors.form} className="mb-4" />
              )}

              <FormInput
                label="Enrolment Code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                error={errors.code}
                disabled={isSubmitting}
                placeholder="e.g., WLIMP-2026 or PROG-2026-ABC"
                helperText="Format: PROGRAMME-YEAR or PROGRAMME-YEAR-SUFFIX"
                autoComplete="off"
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="
                  w-full px-4 py-3 min-h-[44px] bg-[#391D65] text-white rounded-md
                  font-medium hover:bg-[#391D65]/90
                  disabled:opacity-50 disabled:cursor-not-allowed
                  focus:outline-none focus:ring-2 focus:ring-[#391D65] focus:ring-offset-2
                  transition-colors duration-200 text-base
                "
              >
                {isSubmitting ? 'Joining...' : 'Join Programme'}
              </button>
            </form>
          </ProgrammeActionGuard>
        </div>
      </div>
    </div>
  );
}
