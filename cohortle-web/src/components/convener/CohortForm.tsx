'use client';

/**
 * Cohort Form Component
 * Form for creating cohorts with enrolment code generation and validation
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { CohortFormData, checkEnrollmentCodeAvailability } from '@/lib/api/convener';
import { parseApiError, logError } from '@/lib/utils/errorHandling';
import { ConfirmCohortDialog } from './ConfirmCohortDialog';

interface ExistingCohort {
  id: number | string;
  name: string;
  enrollmentCode: string;
  startDate: string;
}

interface CohortFormProps {
  programmeId: string;
  programmeName: string;
  existingCohorts?: ExistingCohort[];
  onSubmit: (data: CohortFormData) => Promise<void>;
  onCancel: () => void;
}

/**
 * Generate a random enrolment code in format: PROG-2024-ABC123
 */
function generateEnrollmentCode(): string {
  const year = new Date().getFullYear();
  const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PROG-${year}-${randomChars}`;
}

export function CohortForm({
  programmeId,
  programmeName,
  existingCohorts = [],
  onSubmit,
  onCancel,
}: CohortFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    setValue,
    watch,
    clearErrors,
  } = useForm<CohortFormData>({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      enrollmentCode: '',
      startDate: '',
    },
  });

  const startDate = watch('startDate');

  // Calculate days until start date
  const daysUntilStart = React.useMemo(() => {
    if (!startDate) return null;
    const start = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    const diffTime = start.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [startDate]);

  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [codeAvailability, setCodeAvailability] = useState<{
    available: boolean;
    message: string;
  } | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingData, setPendingData] = useState<CohortFormData | null>(null);

  const enrollmentCode = watch('enrollmentCode');

  // Check enrollment code availability in real-time
  useEffect(() => {
    const checkCode = async () => {
      if (!enrollmentCode || enrollmentCode.length < 3) {
        setCodeAvailability(null);
        return;
      }

      // Validate format: alphanumeric with hyphens
      const validFormat = /^[A-Za-z0-9-]+$/.test(enrollmentCode);
      if (!validFormat) {
        setCodeAvailability({
          available: false,
          message: 'Code must contain only letters, numbers, and hyphens',
        });
        return;
      }

      setIsCheckingCode(true);
      try {
        const available = await checkEnrollmentCodeAvailability(enrollmentCode);
        setCodeAvailability({
          available,
          message: available
            ? 'This code is available'
            : 'This code is already in use',
        });
        
        if (!available) {
          setError('enrollmentCode', {
            type: 'manual',
            message: 'This enrolment code is already in use',
          });
        } else {
          clearErrors('enrollmentCode');
        }
      } catch (error) {
        console.error('Error checking enrolment code:', error);
        setCodeAvailability(null);
      } finally {
        setIsCheckingCode(false);
      }
    };

    const timeoutId = setTimeout(checkCode, 500); // Debounce for 500ms
    return () => clearTimeout(timeoutId);
  }, [enrollmentCode, setError, clearErrors]);

  const handleGenerateCode = () => {
    const newCode = generateEnrollmentCode();
    setValue('enrollmentCode', newCode);
  };

  const onFormSubmit = async (data: CohortFormData) => {
    console.log('📤 Preparing cohort form for programme', programmeId, ':', data);
    
    // Final validation: ensure code is available
    if (codeAvailability && !codeAvailability.available) {
      setError('enrollmentCode', {
        message: 'Please choose a different enrolment code',
      });
      return;
    }

    // Show confirmation dialog instead of submitting immediately
    setPendingData(data);
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    if (!pendingData) return;

    setShowConfirmDialog(false);
    console.log('✅ User confirmed cohort creation');

    try {
      await onSubmit(pendingData);
      console.log('✅ Cohort created successfully');
    } catch (error) {
      // Log error with context
      logError('Cohort form submission', error, pendingData);
      
      // Parse error and display to user
      const apiError = parseApiError(error);
      
      // If validation error with field details, set field-specific errors
      if (apiError.details) {
        Object.entries(apiError.details).forEach(([field, message]) => {
          setError(field as keyof CohortFormData, {
            message: message as string,
          });
        });
      }
      
      // Set root error for display
      setError('root', {
        message: apiError.message,
      });
    } finally {
      setPendingData(null);
    }
  };

  const handleCancelConfirm = () => {
    setShowConfirmDialog(false);
    setPendingData(null);
    console.log('❌ User cancelled cohort creation');
  };

  // Get today's date in YYYY-MM-DD format for min date validation
  // Use local timezone to avoid date comparison issues
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayString = `${year}-${month}-${day}`;

  return (
    <>
      <ConfirmCohortDialog
        isOpen={showConfirmDialog}
        programmeName={programmeName}
        cohortName={pendingData?.name || ''}
        enrollmentCode={pendingData?.enrollmentCode || ''}
        startDate={pendingData?.startDate || ''}
        onConfirm={handleConfirmSubmit}
        onCancel={handleCancelConfirm}
      />
      
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Combined context banner */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex items-start gap-3 mb-3">
          <svg
            className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-blue-900">
              Creating cohort for: <span className="font-semibold">{programmeName}</span>
            </p>
          </div>
        </div>
        
        {existingCohorts.length > 0 && (
          <>
            <div className="border-t border-blue-300 my-3"></div>
            <details 
              className="group"
              open={existingCohorts.length <= 3}
            >
              <summary className="text-xs font-medium text-blue-800 cursor-pointer list-none flex items-center justify-between mb-2">
                <span>Existing cohorts ({existingCohorts.length})</span>
                <svg
                  className="w-3 h-3 transition-transform group-open:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </summary>
              <div className="space-y-1 mt-2">
                {existingCohorts.map((cohort) => (
                  <div
                    key={cohort.id}
                    className="flex items-center justify-between px-2 py-1.5 bg-blue-100 rounded text-xs"
                  >
                    <div>
                      <span className="font-medium text-blue-900">{cohort.name}</span>
                      <span className="text-blue-700 ml-2">
                        (<span className="font-mono font-semibold">{cohort.enrollmentCode}</span>)
                      </span>
                    </div>
                    <span className="text-xs text-blue-600">
                      {new Date(cohort.startDate).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-blue-700 mt-2">
                💡 Each cohort needs a unique enrolment code
              </p>
            </details>
          </>
        )}
      </div>

      {errors.root && (
        <div
          className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800"
          role="alert"
        >
          {errors.root.message}
        </div>
      )}

      <div className="mb-4">
        <label
          htmlFor="cohortName"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Cohort Name
        </label>
        <input
          id="cohortName"
          type="text"
          {...register('name', {
            required: 'Cohort name is required',
            minLength: {
              value: 3,
              message: 'Cohort name must be between 3 and 200 characters',
            },
            maxLength: {
              value: 200,
              message: 'Cohort name must be between 3 and 200 characters',
            },
          })}
          className={`
            w-full px-3 py-3 min-h-[44px] border rounded-md shadow-sm text-base
            focus:outline-none focus:ring-2 focus:ring-blue-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
          `}
          disabled={isSubmitting}
          placeholder="Enter cohort name"
          autoComplete="off"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'cohortName-error' : undefined}
        />
        {errors.name && (
          <p id="cohortName-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="mb-4">
        <label
          htmlFor="enrollmentCode"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Enrolment Code
        </label>
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              id="enrollmentCode"
              type="text"
              {...register('enrollmentCode', {
                required: 'Enrolment code is required',
                pattern: {
                  value: /^[A-Za-z0-9-]+$/,
                  message: 'Enrolment code must contain only letters, numbers, and hyphens',
                },
                minLength: {
                  value: 3,
                  message: 'Enrolment code must be at least 3 characters long',
                },
              })}
              className={`
                w-full px-3 py-3 min-h-[44px] border rounded-md shadow-sm text-base
                focus:outline-none focus:ring-2 focus:ring-blue-500
                disabled:bg-gray-100 disabled:cursor-not-allowed
                ${errors.enrollmentCode ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
              `}
              disabled={isSubmitting}
              placeholder="e.g., PROG-2024-ABC123"
              autoComplete="off"
              aria-invalid={!!errors.enrollmentCode}
              aria-describedby={
                errors.enrollmentCode || codeAvailability
                  ? 'enrollmentCode-feedback'
                  : undefined
              }
            />
          </div>
          <button
            type="button"
            onClick={handleGenerateCode}
            disabled={isSubmitting}
            className="
              px-4 py-3 min-h-[44px] border border-gray-300 text-gray-700 rounded-md
              font-medium hover:bg-gray-50 whitespace-nowrap
              disabled:opacity-50 disabled:cursor-not-allowed
              focus:outline-none focus:ring-2 focus:ring-gray-500
              transition-colors duration-200
            "
            aria-label="Generate random enrolment code"
          >
            Generate
          </button>
        </div>
        
        {/* Real-time availability feedback */}
        {isCheckingCode && (
          <p className="mt-1 text-sm text-gray-600">
            Checking availability...
          </p>
        )}
        
        {!isCheckingCode && codeAvailability && (
          <p
            id="enrollmentCode-feedback"
            className={`mt-1 text-sm ${
              codeAvailability.available ? 'text-green-600' : 'text-red-600'
            }`}
            role="status"
          >
            {codeAvailability.message}
          </p>
        )}
        
        {errors.enrollmentCode && (
          <p id="enrollmentCode-feedback" className="mt-1 text-sm text-red-600" role="alert">
            {errors.enrollmentCode.message}
          </p>
        )}
      </div>

      <div className="mb-4">
        <label
          htmlFor="startDate"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Start Date
        </label>
        <input
          id="startDate"
          type="date"
          {...register('startDate', {
            required: 'Start date is required',
            validate: (value) => {
              if (!value) return 'Start date is required';
              // Compare dates as strings to avoid timezone issues
              if (value < todayString) {
                return 'Start date cannot be in the past';
              }
              return true;
            },
          })}
          className={`
            w-full px-3 py-3 min-h-[44px] border rounded-md shadow-sm text-base
            focus:outline-none focus:ring-2 focus:ring-blue-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${errors.startDate ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
          `}
          disabled={isSubmitting}
          min={todayString}
          aria-invalid={!!errors.startDate}
          aria-describedby={errors.startDate ? 'startDate-error' : 'startDate-helper'}
        />
        {errors.startDate ? (
          <p id="startDate-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.startDate.message}
          </p>
        ) : daysUntilStart !== null && (
          <p id="startDate-helper" className="mt-1 text-sm text-gray-600">
            {daysUntilStart === 0 && '📅 Starting today'}
            {daysUntilStart === 1 && '📅 Starting tomorrow'}
            {daysUntilStart > 1 && `📅 Starting in ${daysUntilStart} days`}
            {daysUntilStart < 0 && '⚠️ This date is in the past'}
          </p>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="
            flex-1 px-4 py-3 min-h-[44px] border border-gray-300 text-gray-700 rounded-md
            font-medium hover:bg-gray-50
            disabled:opacity-50 disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-gray-500
            transition-colors duration-200
          "
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || isCheckingCode || (codeAvailability !== null && !codeAvailability.available)}
          className="
            flex-1 px-4 py-3 min-h-[44px] bg-[#391D65] text-white rounded-md
            font-medium hover:bg-[#391D65]/90
            disabled:opacity-50 disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-[#391D65]
            transition-colors duration-200
          "
        >
          {isSubmitting ? 'Creating...' : 'Create Cohort'}
        </button>
      </div>
    </form>
    </>
  );
}
