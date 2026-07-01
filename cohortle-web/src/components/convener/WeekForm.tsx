'use client';

/**
 * Week Form Component
 * Form for creating weeks with auto-suggested week number and start date
 * Enhanced with UX improvements to prevent duplicate week numbers
 */

import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { WeekFormData } from '@/lib/api/convener';

interface ExistingWeek {
  id: string;
  weekNumber: number;
  title: string;
}

interface WeekFormProps {
  programmeId: string;
  suggestedWeekNumber?: number;
  previousWeekStartDate?: string;
  existingWeeks?: ExistingWeek[];
  onSubmit: (data: WeekFormData) => Promise<void>;
  onCancel: () => void;
}

/**
 * Calculate suggested start date based on previous week
 * Adds 7 days to the previous week's start date
 * Uses local timezone to avoid date comparison issues
 */
function calculateSuggestedStartDate(previousStartDate: string): string {
  // Parse the date string (YYYY-MM-DD) in local timezone
  const [year, month, day] = previousStartDate.split('-').map(Number);
  const prevDate = new Date(year, month - 1, day);
  prevDate.setDate(prevDate.getDate() + 7);
  
  // Format back to YYYY-MM-DD in local timezone
  const newYear = prevDate.getFullYear();
  const newMonth = String(prevDate.getMonth() + 1).padStart(2, '0');
  const newDay = String(prevDate.getDate()).padStart(2, '0');
  return `${newYear}-${newMonth}-${newDay}`;
}

export function WeekForm({
  programmeId,
  suggestedWeekNumber = 1,
  previousWeekStartDate,
  existingWeeks = [],
  onSubmit,
  onCancel,
}: WeekFormProps) {
  // Get today's date in YYYY-MM-DD format for min date validation
  // Use local timezone to avoid date comparison issues
  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Calculate next available week number
  const nextAvailableWeek = useMemo(() => {
    if (existingWeeks.length === 0) return 1;
    return Math.max(...existingWeeks.map(w => w.weekNumber)) + 1;
  }, [existingWeeks]);

  // Create a set of existing week numbers for quick lookup
  const existingWeekNumbers = useMemo(() => {
    return new Set(existingWeeks.map(w => w.weekNumber));
  }, [existingWeeks]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    setValue,
  } = useForm<WeekFormData>({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      weekNumber: nextAvailableWeek,
      title: '',
      startDate: '',
    },
  });

  // Sync weekNumber field whenever nextAvailableWeek changes (e.g. after existingWeeks loads)
  useEffect(() => {
    setValue('weekNumber', nextAvailableWeek);
  }, [nextAvailableWeek, setValue]);

  // Auto-fill suggested start date if previous week exists
  useEffect(() => {
    if (previousWeekStartDate) {
      const suggestedDate = calculateSuggestedStartDate(previousWeekStartDate);
      // If the suggested date is in the past, use today instead
      if (suggestedDate < todayString) {
        setValue('startDate', todayString);
      } else {
        setValue('startDate', suggestedDate);
      }
    }
  }, [previousWeekStartDate, setValue, todayString]);

  const onFormSubmit = async (data: WeekFormData) => {
    try {
      console.log('WeekForm: Submitting data for programme', programmeId, ':', data);
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
      setError('root', {
        message:
          error instanceof Error
            ? error.message
            : 'Failed to create week. Please try again.',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Display existing weeks - collapsible if more than 5 */}
      {existingWeeks.length > 0 && (
        <details 
          className="p-3 bg-blue-50 border border-blue-200 rounded-md group"
          open={existingWeeks.length <= 5}
        >
          <summary className="text-sm font-medium text-blue-900 cursor-pointer list-none flex items-center justify-between">
            <span>Existing weeks ({existingWeeks.length})</span>
            <svg
              className="w-4 h-4 transition-transform group-open:rotate-180"
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
          <div className="mt-2 flex flex-wrap gap-2">
            {existingWeeks
              .sort((a, b) => a.weekNumber - b.weekNumber)
              .map((week) => (
                <span
                  key={week.id}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded"
                >
                  Week {week.weekNumber}: {week.title}
                </span>
              ))}
          </div>
        </details>
      )}

      {errors.root && errors.root.message && (
        <div
          className="p-4 bg-red-50 border border-red-200 rounded-md"
          role="alert"
        >
          <p className="text-red-800 font-medium">{errors.root.message}</p>
          {errors.root.message.includes('already exists') && (
            <p className="text-red-700 text-sm mt-2">
              Try using week number {nextAvailableWeek} instead.
            </p>
          )}
        </div>
      )}

      <div className="mb-4">
        <label
          htmlFor="weekNumber"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Week Number
        </label>
        <input
          id="weekNumber"
          type="number"
          {...register('weekNumber', {
            required: 'Week number is required',
            min: {
              value: 1,
              message: 'Week number must be 1 or greater',
            },
            valueAsNumber: true,
            validate: (value) => {
              if (existingWeekNumbers.has(value)) {
                return `Week ${value} already exists. Try week ${nextAvailableWeek}.`;
              }
              return true;
            },
          })}
          className={`
            w-full px-3 py-3 min-h-[44px] border rounded-md shadow-sm text-base
            focus:outline-none focus:ring-2 focus:ring-blue-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${errors.weekNumber ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
          `}
          disabled={isSubmitting}
          placeholder="Enter week number"
          min="1"
          step="1"
          aria-invalid={!!errors.weekNumber}
          aria-describedby={errors.weekNumber ? 'weekNumber-error' : 'weekNumber-helper'}
        />
        {errors.weekNumber ? (
          <p id="weekNumber-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.weekNumber.message}
          </p>
        ) : (
          <p id="weekNumber-helper" className="mt-1 text-sm text-gray-600">
            Next available: Week {nextAvailableWeek}
          </p>
        )}
      </div>

      <div className="mb-4">
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Week Title
        </label>
        <input
          id="title"
          type="text"
          {...register('title', {
            required: 'Week title is required',
            minLength: {
              value: 3,
              message: 'Week title must be between 3 and 200 characters',
            },
            maxLength: {
              value: 200,
              message: 'Week title must be between 3 and 200 characters',
            },
          })}
          className={`
            w-full px-3 py-3 min-h-[44px] border rounded-md shadow-sm text-base
            focus:outline-none focus:ring-2 focus:ring-blue-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${errors.title ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
          `}
          disabled={isSubmitting}
          placeholder="Enter week title"
          autoComplete="off"
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? 'title-error' : undefined}
        />
        {errors.title && (
          <p id="title-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.title.message}
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
          })}
          className={`
            w-full px-3 py-3 min-h-[44px] border rounded-md shadow-sm text-base
            focus:outline-none focus:ring-2 focus:ring-blue-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${errors.startDate ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
          `}
          disabled={isSubmitting}
          aria-invalid={!!errors.startDate}
          aria-describedby={errors.startDate ? 'startDate-error' : undefined}
        />
        {errors.startDate && (
          <p id="startDate-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.startDate.message}
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
          disabled={isSubmitting}
          className="
            flex-1 px-4 py-3 min-h-[44px] bg-[#391D65] text-white rounded-md
            font-medium hover:bg-[#391D65]/90
            disabled:opacity-50 disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-[#391D65]
            transition-colors duration-200
          "
        >
          {isSubmitting ? 'Creating...' : 'Create Week'}
        </button>
      </div>
    </form>
  );
}
