'use client';

/**
 * Mobile Lesson Overview Component
 * Mobile-optimized lesson overview with bottom sheet/drawer
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useModuleLessons } from '@/lib/hooks/useModuleLessons';
import { useQuery } from '@tanstack/react-query';
import { fetchLessonCompletion } from '@/lib/api/lessons';

interface MobileLessonOverviewProps {
  currentLessonId: string;
  moduleId: string;
  cohortId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function MobileLessonOverview({
  currentLessonId,
  moduleId,
  cohortId,
  isOpen,
  onClose,
}: MobileLessonOverviewProps) {
  const router = useRouter();
  const { data: lessons, isLoading, error } = useModuleLessons(moduleId, cohortId);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleLessonClick = (lessonId: number) => {
    onClose();
    router.push(`/lessons/${lessonId}?cohortId=${cohortId}`);
  };

  // Handle animation states
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isAnimating && !isOpen) {
    return null;
  }

  const sortedLessons = lessons?.sort((a, b) => a.order_number - b.order_number) || [];
  const currentLessonIdNum = parseInt(currentLessonId);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-xl shadow-xl z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '80vh' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Lessons</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close lesson overview"
          >
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 120px)' }}>
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-200" />
              ))}
            </div>
          ) : error ? (
            <div className="p-4">
              <p className="text-sm text-red-600 text-center">Failed to load lessons</p>
            </div>
          ) : (
            <nav className="p-4 space-y-2" aria-label="Lesson navigation">
              {sortedLessons.map((lesson) => {
                const isCurrentLesson = lesson.id === currentLessonIdNum;
                
                return (
                  <MobileLessonOverviewItem
                    key={lesson.id}
                    lesson={lesson}
                    cohortId={cohortId}
                    isCurrentLesson={isCurrentLesson}
                    onClick={() => handleLessonClick(lesson.id)}
                  />
                );
              })}
            </nav>
          )}
        </div>
      </div>
    </>
  );
}

interface MobileLessonOverviewItemProps {
  lesson: {
    id: number;
    name: string;
    order_number: number;
  };
  cohortId: string;
  isCurrentLesson: boolean;
  onClick: () => void;
}

function MobileLessonOverviewItem({
  lesson,
  cohortId,
  isCurrentLesson,
  onClick,
}: MobileLessonOverviewItemProps) {
  // Fetch completion status for this lesson
  const { data: completion } = useQuery({
    queryKey: ['lesson-completion', lesson.id, cohortId],
    queryFn: () => fetchLessonCompletion(lesson.id.toString(), cohortId),
    staleTime: 30 * 1000, // 30 seconds
  });

  const isCompleted = completion?.completed || false;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-lg text-left transition-colors min-h-[60px] ${
        isCurrentLesson
          ? 'bg-blue-50 border-2 border-blue-500'
          : 'hover:bg-gray-50 border-2 border-transparent active:bg-gray-100'
      }`}
      aria-current={isCurrentLesson ? 'page' : undefined}
    >
      {/* Completion status icon */}
      <div className="flex-shrink-0">
        {isCompleted ? (
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-green-700"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-label="Completed"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-label="Not completed"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Lesson info */}
      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-500 mb-1 font-medium">
          Lesson {lesson.order_number}
        </div>
        <div
          className={`text-base font-medium leading-tight ${
            isCurrentLesson ? 'text-blue-900' : 'text-gray-900'
          }`}
        >
          {lesson.name}
        </div>
      </div>

      {/* Current lesson indicator */}
      {isCurrentLesson && (
        <div className="flex-shrink-0">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
        </div>
      )}
    </button>
  );
}