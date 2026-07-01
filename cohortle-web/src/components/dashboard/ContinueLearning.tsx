'use client';

/**
 * ContinueLearning Component
 * Fetches and displays next incomplete lesson with prominent CTA
 * Requirements: 2.11, 2.12
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getNextLesson, NextLesson } from '@/lib/api/progress';

export function ContinueLearning() {
  const router = useRouter();
  const [nextLesson, setNextLesson] = useState<NextLesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNextLesson() {
      try {
        setIsLoading(true);
        setError(null);
        const lesson = await getNextLesson();
        setNextLesson(lesson);
      } catch (err) {
        console.error('Failed to fetch next lesson:', err);
        setError('Failed to load next lesson');
      } finally {
        setIsLoading(false);
      }
    }

    fetchNextLesson();
  }, []);

  const handleContinue = () => {
    if (nextLesson) {
      router.push(`/lessons/${nextLesson.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  // All lessons complete - show completion message
  if (!nextLesson) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 p-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-green-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              All Caught Up!
            </h2>
            <p className="text-sm text-gray-600">
              You've completed all available lessons. Great work!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Next lesson available - show continue learning CTA
  return (
    <div className="bg-gradient-to-r from-[#F8F1FF] to-[#E8D5FF] rounded-lg border border-[#391D65]/20 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">
        Continue Learning
      </h2>
      <p className="text-sm text-gray-700 mb-4">
        {nextLesson.title}
      </p>
      <button
        onClick={handleContinue}
        className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-[#391D65] rounded-lg hover:bg-[#391D65]/90 transition-colors min-h-[44px]"
        aria-label={`Continue to ${nextLesson.title}`}
      >
        Continue Learning →
      </button>
    </div>
  );
}
