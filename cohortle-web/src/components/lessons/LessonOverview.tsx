'use client';

/**
 * LessonOverview Component
 * Displays a sidebar with all lessons in the current module/week
 * 
 * Requirements:
 * - 3.5: Display sidebar with all lessons in the week
 * - 3.6: Clicking a lesson navigates to that lesson
 * - 3.7: Highlight the current lesson in the overview
 * - 3.8: Show completion status for all lessons
 */

import { useRouter } from 'next/navigation';
import { useModuleLessons } from '@/lib/hooks/useModuleLessons';
import { useQuery } from '@tanstack/react-query';
import { fetchLessonCompletion } from '@/lib/api/lessons';

interface LessonOverviewProps {
  currentLessonId: string;
  moduleId: string;
  cohortId: string;
}

export function LessonOverview({
  currentLessonId,
  moduleId,
  cohortId,
}: LessonOverviewProps) {
  const router = useRouter();
  const { data: lessons, isLoading, error } = useModuleLessons(moduleId, cohortId);

  const handleLessonClick = (lessonId: number) => {
    router.push(`/lessons/${lessonId}?cohortId=${cohortId}`);
  };

  if (isLoading) {
    return (
      <div className="w-64 bg-white border-r border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Lessons</h3>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-gray-200"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-64 bg-white border-r border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Lessons</h3>
        <p className="text-sm text-red-600">Failed to load lessons</p>
      </div>
    );
  }

  const sortedLessons = lessons?.sort((a, b) => a.order_number - b.order_number) || [];
  const currentLessonIdNum = parseInt(currentLessonId);

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Lessons</h3>
      <nav className="space-y-1" aria-label="Lesson navigation">
        {sortedLessons.map((lesson) => {
          const isCurrentLesson = lesson.id === currentLessonIdNum;
          
          return (
            <LessonOverviewItem
              key={lesson.id}
              lesson={lesson}
              cohortId={cohortId}
              isCurrentLesson={isCurrentLesson}
              onClick={() => handleLessonClick(lesson.id)}
            />
          );
        })}
      </nav>
    </div>
  );
}

interface LessonOverviewItemProps {
  lesson: {
    id: number;
    name: string;
    order_number: number;
  };
  cohortId: string;
  isCurrentLesson: boolean;
  onClick: () => void;
}

function LessonOverviewItem({
  lesson,
  cohortId,
  isCurrentLesson,
  onClick,
}: LessonOverviewItemProps) {
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
      className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition ${
        isCurrentLesson
          ? 'bg-blue-50 border-2 border-blue-500'
          : 'hover:bg-gray-50 border-2 border-transparent'
      }`}
      aria-current={isCurrentLesson ? 'page' : undefined}
    >
      {/* Completion status icon */}
      <div className="flex-shrink-0 mt-0.5">
        {isCompleted ? (
          <svg
            className="h-5 w-5 text-green-700"
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
        ) : (
          <svg
            className="h-5 w-5 text-gray-300"
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
        )}
      </div>

      {/* Lesson info */}
      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-500 mb-1">
          Lesson {lesson.order_number}
        </div>
        <div
          className={`text-sm font-medium ${
            isCurrentLesson ? 'text-blue-900' : 'text-gray-900'
          }`}
        >
          {lesson.name}
        </div>
      </div>
    </button>
  );
}
