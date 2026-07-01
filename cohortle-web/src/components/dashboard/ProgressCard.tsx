'use client';

/**
 * ProgressCard Component
 * Displays enrolled programme with progress, cohort info, and next lesson
 * Requirements: 2.2, 2.5
 */

import React from 'react';
import { useRouter } from 'next/navigation';

/**
 * Enrolled programme data with progress
 */
export interface EnrolledProgramme {
  id: number;
  name: string;
  description: string;
  thumbnail?: string;
  progress: number; // 0-100
  cohortName: string;
  cohortId: number;
  nextLesson?: {
    id: string;
    title: string;
    weekNumber: number;
  };
}

interface ProgressCardProps {
  programme: EnrolledProgramme;
  onClick: () => void;
}

export function ProgressCard({ programme, onClick }: ProgressCardProps) {
  const router = useRouter();

  const handleClick = () => {
    onClick();
  };

  const handleNextLessonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (programme.nextLesson) {
      router.push(`/lessons/${programme.nextLesson.id}`);
    }
  };

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

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-600">Progress</span>
          <span className="text-xs font-medium text-gray-900">
            {Math.round(programme.progress)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-[#391D65] h-2 rounded-full transition-all duration-300"
            style={{ width: `${programme.progress}%` }}
            role="progressbar"
            aria-valuenow={programme.progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${Math.round(programme.progress)}% complete`}
          />
        </div>
      </div>

      {/* Next Lesson Info */}
      {programme.nextLesson && (
        <div className="pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Next Lesson:</p>
          <button
            onClick={handleNextLessonClick}
            className="text-sm text-[#391D65] hover:text-[#391D65]/80 font-medium flex items-center min-h-[44px] py-2"
            aria-label={`Continue to ${programme.nextLesson.title}`}
          >
            Week {programme.nextLesson.weekNumber}: {programme.nextLesson.title} →
          </button>
        </div>
      )}
    </div>
  );
}
