'use client';

/**
 * LessonNavigation Component
 * Provides navigation controls between lessons in a module
 * 
 * Requirements:
 * - 3.1: Sequential navigation with Previous/Next buttons
 * - 3.2: Navigate to next/previous lesson in sequence
 * - 3.3: Navigate to previous lesson
 * - 3.4: Disable navigation buttons appropriately
 */

import { useRouter } from 'next/navigation';
import { useModuleLessons } from '@/lib/hooks/useModuleLessons';

interface LessonNavigationProps {
  currentLessonId: string;
  moduleId: string;
  cohortId: string;
  isCompleted: boolean;
}

export function LessonNavigation({
  currentLessonId,
  moduleId,
  cohortId,
  isCompleted,
}: LessonNavigationProps) {
  const router = useRouter();
  const { data: lessons, isLoading, error } = useModuleLessons(moduleId, cohortId);

  // Find the current lesson index and determine previous/next lessons
  const currentLessonIdNum = parseInt(currentLessonId);
  const sortedLessons = lessons?.sort((a, b) => a.order_number - b.order_number) || [];
  const currentIndex = sortedLessons.findIndex((l) => l.id === currentLessonIdNum);
  
  const previousLesson = currentIndex > 0 ? sortedLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < sortedLessons.length - 1 
    ? sortedLessons[currentIndex + 1] 
    : null;

  const handlePreviousLesson = () => {
    if (previousLesson) {
      router.push(`/lessons/${previousLesson.id}?cohortId=${cohortId}`);
    }
  };

  const handleNextLesson = () => {
    if (nextLesson) {
      router.push(`/lessons/${nextLesson.id}?cohortId=${cohortId}`);
    }
  };

  const handleBackToModule = () => {
    router.push(`/modules/${moduleId}`);
  };

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-between gap-3 sm:gap-4">
        <div className="h-11 w-full sm:w-32 animate-pulse rounded bg-gray-200"></div>
        <div className="h-11 w-full sm:w-32 animate-pulse rounded bg-gray-200"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 sm:mt-8 flex justify-center">
        <button
          onClick={handleBackToDashboard}
          className="min-h-[44px] rounded-lg bg-gray-600 px-4 sm:px-6 py-3 text-white transition hover:bg-gray-700 active:bg-gray-800 font-medium"
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 sm:mt-8 space-y-4">
      {/* Sequential navigation buttons */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4">
        <button
          onClick={handlePreviousLesson}
          disabled={!previousLesson}
          className={`flex-1 sm:flex-none min-h-[44px] rounded-lg px-4 sm:px-6 py-3 text-white transition font-medium ${
            previousLesson
              ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              : 'cursor-not-allowed bg-gray-300 text-gray-500'
          }`}
          aria-label="Previous lesson"
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Previous Lesson</span>
            <span className="sm:hidden">Previous</span>
          </span>
        </button>

        <button
          onClick={handleNextLesson}
          disabled={!nextLesson}
          className={`flex-1 sm:flex-none min-h-[44px] rounded-lg px-4 sm:px-6 py-3 text-white transition font-medium ${
            nextLesson
              ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              : 'cursor-not-allowed bg-gray-300 text-gray-500'
          }`}
          aria-label="Next lesson"
        >
          <span className="flex items-center justify-center gap-2">
            <span className="hidden sm:inline">Next Lesson</span>
            <span className="sm:hidden">Next</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </button>
      </div>

      {/* Back to module button */}
      <div className="flex justify-center">
        <button
          onClick={handleBackToModule}
          className="min-h-[44px] rounded-lg bg-gray-600 px-4 sm:px-6 py-3 text-white transition hover:bg-gray-700 active:bg-gray-800 font-medium"
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Back to Module</span>
            <span className="sm:hidden">Back</span>
          </span>
        </button>
      </div>
    </div>
  );
}
