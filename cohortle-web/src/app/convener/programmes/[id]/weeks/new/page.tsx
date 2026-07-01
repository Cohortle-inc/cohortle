'use client';

/**
 * Week Creation Page
 * Page for creating a new week for a programme
 */

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { WeekForm } from '@/components/convener/WeekForm';
import { createWeek, getWeeks, WeekFormData } from '@/lib/api/convener';

interface ExistingWeek {
  id: string;
  weekNumber: number;
  title: string;
  startDate: string;
}

export default function NewWeekPage() {
  const params = useParams();
  const router = useRouter();
  const programmeId = params.id as string;
  
  const [existingWeeks, setExistingWeeks] = useState<ExistingWeek[]>([]);
  const [previousWeekStartDate, setPreviousWeekStartDate] = useState<string | undefined>(undefined);
  const [isLoadingWeeks, setIsLoadingWeeks] = useState(true);

  // Fetch existing weeks to calculate suggestions
  useEffect(() => {
    async function fetchWeeks() {
      try {
        const weeks = await getWeeks(programmeId);
        
        // Store all existing weeks for display
        setExistingWeeks(weeks.map(w => ({
          id: w.id,
          weekNumber: w.weekNumber,
          title: w.title,
          startDate: w.startDate,
        })));
        
        if (weeks.length > 0) {
          // Sort weeks by week number to find the highest
          const sortedWeeks = [...weeks].sort((a, b) => b.weekNumber - a.weekNumber);
          const lastWeek = sortedWeeks[0];
          
          // Set previous week start date for calculation
          setPreviousWeekStartDate(lastWeek.startDate);
        }
      } catch (error) {
        console.error('Failed to fetch weeks:', error);
        // Continue with defaults if fetch fails
      } finally {
        setIsLoadingWeeks(false);
      }
    }

    fetchWeeks();
  }, [programmeId]);

  const handleSubmit = async (data: WeekFormData) => {
    try {
      await createWeek(programmeId, data);
      // Navigate back to programme detail page
      router.push(`/convener/programmes/${programmeId}`);
    } catch (error) {
      console.error('Failed to create week:', error);
      throw error;
    }
  };

  const handleCancel = () => {
    router.push(`/convener/programmes/${programmeId}`);
  };

  // Show loading state while fetching weeks
  if (isLoadingWeeks) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 sm:p-8">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#391D65]"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={handleCancel}
          className="mb-4 text-sm text-gray-600 hover:text-gray-900 flex items-center"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Programme
        </button>

        {/* Form Card */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Create New Week
          </h1>
          <p className="text-gray-600 mb-6">
            Add a new week to organise lessons in your programme.
          </p>

          <WeekForm
            programmeId={programmeId}
            previousWeekStartDate={previousWeekStartDate}
            existingWeeks={existingWeeks}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
}
