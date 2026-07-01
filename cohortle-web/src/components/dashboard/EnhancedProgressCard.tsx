'use client';

/**
 * EnhancedProgressCard Component
 * Displays enrolled programme with real progress data, cohort info, and next lesson
 * Improvements: Real progress fetching, better error handling, loading states
 * Requirements: 2.2, 2.5
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getProgrammeProgress, ProgrammeProgress } from '@/lib/api/progress';

/**
 * Enrolled programme data
 */
export interface EnrolledProgramme {
  id: number;
  name: string;
  description: string;
  thumbnail?: string;
  cohortName: string;
  cohortId: number;
  nextLesson?: {
    id: string;
    title: string;
    weekNumber: number;
  };
}

interface EnhancedProgressCardProps {
  programme: EnrolledProgramme;
  onClick: () => void;
}

export function EnhancedProgressCard({ programme, onClick }: EnhancedProgressCardProps) {
  const router = useRouter();
  
  // Progress state
  const [progressData, setProgressData] = useState<ProgrammeProgress | null>(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [progressError, setProgressError] = useState<string | null>(null);

  // Fetch progress data
  const fetchProgress = useCallback(async () => {
    try {
      setIsLoadingProgress(true);
      setProgressError(null);
      
      const progress = await getProgrammeProgress(programme.id, programme.cohortId);
      setProgressData(progress);
    } catch (error) {
      console.error('Failed to fetch programme progress:', error);
      setProgressError('Unable to load progress');
      // Fallback to default progress
      setProgressData({
        progress: 0,
        completedLessons: 0,
        totalLessons: 0,
      });
    } finally {
      setIsLoadingProgress(false);
    }
  }, [programme.id, programme.cohortId]);

  // Initial progress fetch
  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const handleClick = () => {
    onClick();
  };

  const handleNextLessonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (programme.nextLesson) {
      router.push(`/lessons/${programme.nextLesson.id}`);
    }
  };

  const handleRetryProgress = (e: React.MouseEvent) => {
    e.stopPropagation();
    fetchProgress();
  };

  // Calculate progress percentage
  const progressPercentage = progressData?.progress || 0;
  const completedLessons = progressData?.completedLessons || 0;
  const totalLessons = progressData?.totalLessons || 0;

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow cursor-pointer"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={`View ${programme.name} programme`}
    >
      {/* Programme Thumbnail */}
      {programme.thumbnail && (
        <div className="mb-4 rounded-lg overflow-hidden bg-gray-100">
          <img
            src={programme.thumbnail}
            alt={`${programme.name} programme thumbnail`}
            title={programme.name}
            className="w-full h-32 object-cover"
          />
        </div>
      )}

      {/* Programme Title */}
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
        {programme.name}
      </h3>

      {/* Cohort Name */}
      <p className="text-sm text-gray-600 mb-3">
        Cohort: {programme.cohortName}
      </p>

      {/* Progress Section */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-600">Progress</span>
          {isLoadingProgress ? (
            <div className="w-8 h-3 bg-gray-200 rounded animate-pulse"></div>
          ) : progressError ? (
            <button
              onClick={handleRetryProgress}
              className="text-xs text-red-600 hover:text-red-700 underline"
              aria-label="Retry loading progress"
            >
              Retry
            </button>
          ) : (
            <span className="text-xs font-medium text-gray-900">
              {Math.round(progressPercentage)}%
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
          {isLoadingProgress ? (
            <div className="bg-gray-300 h-2 rounded-full animate-pulse w-1/3"></div>
          ) : (
            <div
              className="bg-[#391D65] h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
              role="progressbar"
              aria-valuenow={progressPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${Math.round(progressPercentage)}% complete`}
            />
          )}
        </div>

        {/* Progress Details */}
        {!isLoadingProgress && !progressError && (
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>
              {completedLessons} of {totalLessons} lessons
            </span>
            {progressPercentage === 100 && (
              <span className="text-green-600 font-medium">Complete!</span>
            )}
          </div>
        )}

        {/* Error State */}
        {progressError && !isLoadingProgress && (
          <p className="text-xs text-red-600 mt-1">{progressError}</p>
        )}
      </div>

      {/* Next Lesson Info */}
      {programme.nextLesson && (
        <div className="pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Next Lesson:</p>
          <button
            onClick={handleNextLessonClick}
            className="text-sm text-[#391D65] hover:text-[#391D65]/80 font-medium flex items-center min-h-[44px] py-2 transition-colors"
            aria-label={`Continue to ${programme.nextLesson.title}`}
          >
            Week {programme.nextLesson.weekNumber}: {programme.nextLesson.title} →
          </button>
        </div>
      )}

      {/* Completion State */}
      {!programme.nextLesson && progressPercentage === 100 && (
        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2 text-green-600">
            <svg
              className="w-4 h-4"
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
            <span className="text-sm font-medium">Programme Complete!</span>
          </div>
        </div>
      )}
    </div>
  );
}
