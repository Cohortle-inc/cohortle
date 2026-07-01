'use client';

/**
 * Programme Form Component
 * Form for creating and editing programmes with validation
 * Enhanced with character counters, helpful tips, and date helpers
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FormInput } from '@/components/ui/FormInput';
import { ProgrammeFormData } from '@/lib/api/convener';
import { parseApiError, logError } from '@/lib/utils/errorHandling';

interface ProgrammeFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<ProgrammeFormData>;
  onSubmit: (data: ProgrammeFormData) => Promise<void>;
  onCancel: () => void;
}

export function ProgrammeForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
}: ProgrammeFormProps) {
  const [descriptionLength, setDescriptionLength] = useState(
    initialData?.description?.length || 0
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
    watch,
  } = useForm<ProgrammeFormData>({
    mode: 'onSubmit', // Validate on submit (task 13.3)
    reValidateMode: 'onChange', // Re-validate on change after first validation
    defaultValues: initialData || {
      name: '',
      description: '',
      startDate: '',
    },
  });

  const startDate = watch('startDate');
  const onboardingMode = watch('onboarding_mode');

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

  const onFormSubmit = async (data: ProgrammeFormData) => {
    // Log form submission
    console.log('📤 Submitting programme form:', {
      mode,
      data: {
        ...data,
        // Don't log sensitive data if any
      },
    });

    try {
      await onSubmit(data);
      console.log('✅ Programme saved successfully');
    } catch (error) {
      // Log error with context
      logError('Programme form submission', error, data);
      
      // Parse error and display to user
      const apiError = parseApiError(error);
      
      // If validation error with field details, set field-specific errors
      if (apiError.details) {
        Object.entries(apiError.details).forEach(([field, message]) => {
          setError(field as keyof ProgrammeFormData, {
            message: message as string,
          });
        });
      }
      
      // Set root error for display
      setError('root', {
        message: apiError.message,
      });
    }
  };

  const onFormError = (errors: any) => {
    console.error('Form validation errors:', errors);
  };

  // Get today's date in YYYY-MM-DD format for min date validation
  // Use local timezone to avoid date comparison issues
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayString = `${year}-${month}-${day}`;

  return (
    <form 
      onSubmit={handleSubmit(onFormSubmit, onFormError)} 
      className="space-y-6"
    >
      {/* Helpful tips banner */}
      {mode === 'create' && (
        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-md p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-blue-800 font-medium mb-1">
                Tips for creating a great programme:
              </p>
              <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                <li>Choose a clear, descriptive name that learners will understand</li>
                <li>Write a compelling description that explains what learners will gain</li>
                <li>Set a realistic start date that gives you time to add content</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {errors.root && (
        <div
          className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800"
          role="alert"
        >
          {errors.root.message}
        </div>
      )}

      <FormInput
        label="Programme Name"
        {...register('name', {
          required: 'Programme name is required',
          minLength: {
            value: 3,
            message: 'Programme name must be between 3 and 200 characters',
          },
          maxLength: {
            value: 200,
            message: 'Programme name must be between 3 and 200 characters',
          },
        })}
        error={errors.name?.message}
        disabled={isSubmitting}
        placeholder="Enter programme name"
        autoComplete="off"
      />

      <div className="mb-4">
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description (Optional)
        </label>
        <textarea
          id="description"
          {...register('description', {
            maxLength: {
              value: 1000,
              message: 'Description must be 1000 characters or less',
            },
            onChange: (e) => setDescriptionLength(e.target.value.length),
          })}
          className={`
            w-full px-3 py-3 min-h-[100px] border rounded-md shadow-sm text-base
            focus:outline-none focus:ring-2 focus:ring-blue-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${errors.description ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
          `}
          disabled={isSubmitting}
          placeholder="Describe what learners will learn and achieve in this programme"
          aria-invalid={!!errors.description}
          aria-describedby={
            errors.description ? 'description-error' : 'description-helper'
          }
        />
        {errors.description ? (
          <p id="description-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.description.message}
          </p>
        ) : (
          <div className="mt-1 flex items-center justify-between">
            <p id="description-helper" className="text-xs text-gray-600">
              Help learners understand what they'll gain from this programme
            </p>
            <p
              className={`text-xs ${
                descriptionLength > 900
                  ? 'text-orange-600 font-medium'
                  : 'text-gray-500'
              }`}
            >
              {descriptionLength}/1000
            </p>
          </div>
        )}
      </div>

      <div className="mb-4">
        <FormInput
          label="Start Date"
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
          error={errors.startDate?.message}
          disabled={isSubmitting}
          min={todayString}
        />
        {!errors.startDate && daysUntilStart !== null && (
          <p className="mt-1 text-sm text-gray-600">
            {daysUntilStart === 0 && '📅 Starting today'}
            {daysUntilStart === 1 && '📅 Starting tomorrow'}
            {daysUntilStart > 1 && `📅 Starting in ${daysUntilStart} days`}
            {daysUntilStart < 0 && '⚠️ This date is in the past'}
          </p>
        )}
      </div>

      {/* Onboarding mode — Requirements: 7.1, 7.6 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Onboarding Mode
        </label>
        <select
          {...register('onboarding_mode')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          disabled={isSubmitting}
          defaultValue="code"
        >
          <option value="code">Enrollment code only</option>
          <option value="application">Application only</option>
          <option value="hybrid">Hybrid (code + application)</option>
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Controls how learners join this programme.
        </p>
        {/* Warn when switching away from application mode — Requirement 7.5 */}
        {mode === 'edit' &&
          initialData?.onboarding_mode === 'application' &&
          onboardingMode === 'code' && (
            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800">
              Switching to code-only mode will not automatically resolve any pending applications. Existing applications will remain in their current status.
            </div>
          )}
      </div>

      {/* Application deadline — optional, only shown for application/hybrid */}
      {(onboardingMode === 'application' || onboardingMode === 'hybrid') && (
        <>
          <div className="mb-4">
            <label htmlFor="application_deadline" className="block text-sm font-medium text-gray-700 mb-1">
              Application Deadline <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="application_deadline"
              type="datetime-local"
              {...register('application_deadline')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-gray-500">
              Applications submitted after this date will be rejected automatically.
            </p>
          </div>

          <div className="mb-4">
            <label htmlFor="max_capacity" className="block text-sm font-medium text-gray-700 mb-1">
              Maximum Capacity <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="max_capacity"
              type="number"
              min={1}
              {...register('max_capacity', {
                valueAsNumber: true,
                min: { value: 1, message: 'Capacity must be at least 1' },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={isSubmitting}
              placeholder="e.g. 50"
            />
            {errors.max_capacity && (
              <p className="mt-1 text-xs text-red-600">{errors.max_capacity.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Once this limit is reached, new applications will be closed automatically.
            </p>
          </div>
        </>
      )}

      {/* Programme enrichment fields */}
      <details className="mb-4 border border-gray-200 rounded-md">
        <summary className="px-4 py-3 text-sm font-medium text-gray-700 cursor-pointer select-none hover:bg-gray-50">
          Programme Details (optional) — format, duration, highlights, outcomes
        </summary>
        <div className="px-4 pb-4 pt-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
              <select
                {...register('format' as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={isSubmitting}
              >
                <option value="">Not specified</option>
                <option value="online">Online</option>
                <option value="in-person">In-Person</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
              <input
                type="text"
                {...register('duration' as any)}
                placeholder="e.g. 12 weeks, 6 months"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={isSubmitting}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price / Funding</label>
            <input
              type="text"
              {...register('price_info' as any)}
              placeholder="e.g. Free, £500, Fully Funded"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Key Highlights</label>
            <textarea
              {...register('highlights_text' as any)}
              rows={3}
              placeholder="One highlight per line, e.g.&#10;Mentorship from industry experts&#10;Certificate on completion"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-gray-400">One bullet point per line. Shown on the programme card.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Learning Outcomes</label>
            <textarea
              {...register('learning_outcomes_text' as any)}
              rows={3}
              placeholder="One outcome per line, e.g.&#10;Lead cross-functional teams&#10;Apply agile methodologies"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prerequisites</label>
            <textarea
              {...register('prerequisites' as any)}
              rows={2}
              placeholder="e.g. No prior experience required"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Intro Video URL</label>
            <input
              type="url"
              {...register('intro_video_url' as any)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-gray-400">YouTube or Vimeo URL for a programme preview video.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL</label>
            <input
              type="url"
              {...register('thumbnail_url' as any)}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={isSubmitting}
            />
          </div>
        </div>
      </details>

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
          disabled={isSubmitting}
          className="
            flex-1 px-4 py-3 min-h-[44px] bg-[#391D65] text-white rounded-md
            font-medium hover:bg-[#391D65]/90
            disabled:opacity-50 disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-[#391D65]
            transition-colors duration-200
          "
        >
          {isSubmitting
            ? mode === 'create'
              ? 'Creating...'
              : 'Saving...'
            : mode === 'create'
            ? 'Create Programme'
            : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
