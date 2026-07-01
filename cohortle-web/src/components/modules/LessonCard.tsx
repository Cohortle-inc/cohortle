'use client';

/**
 * Lesson Card Component
 * Displays a lesson with type icon, duration, and completion status
 */

import React from 'react';
import Link from 'next/link';
import { Lesson } from '@/lib/api/programmes';

interface LessonCardProps {
  lesson: Lesson;
}

// Lesson type icons
const getLessonIcon = (type: Lesson['type']) => {
  switch (type) {
    case 'video':
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
        </svg>
      );
    case 'text':
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
            clipRule="evenodd"
          />
        </svg>
      );
    case 'pdf':
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
            clipRule="evenodd"
          />
        </svg>
      );
    case 'quiz':
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
      );
    case 'link':
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
            clipRule="evenodd"
          />
        </svg>
      );
    case 'live_session':
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
          <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
        </svg>
      );
    default:
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
          <path
            fillRule="evenodd"
            d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
            clipRule="evenodd"
          />
        </svg>
      );
  }
};

const getLessonTypeLabel = (type: Lesson['type']): string => {
  const labels: Record<Lesson['type'], string> = {
    video: 'Video',
    text: 'Text',
    pdf: 'PDF',
    quiz: 'Quiz',
    link: 'Link',
    live_session: 'Live Session',
  };
  return labels[type] || type;
};

export function LessonCard({ lesson }: LessonCardProps) {
  const completionStatus = lesson.isCompleted ? 'completed' : 'not completed';
  const lessonTypeLabel = getLessonTypeLabel(lesson.type);
  
  return (
    <Link 
      href={`/lessons/${lesson.id}`}
      aria-label={`${lesson.title}, ${lessonTypeLabel} lesson, ${completionStatus}`}
    >
      <div
        className={`
          bg-white rounded-lg shadow-sm hover:shadow-md
          transition-shadow duration-200 p-4 cursor-pointer
          border-l-4
          ${lesson.isCompleted ? 'border-green-500' : 'border-gray-300'}
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            {/* Lesson Type Icon */}
            <div
              className={`
                flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center
                ${lesson.isCompleted ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-600'}
              `}
              aria-hidden="true"
            >
              {getLessonIcon(lesson.type)}
            </div>

            {/* Lesson Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-medium text-gray-900 truncate">
                {lesson.title}
              </h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>{lessonTypeLabel}</span>
                {lesson.duration && (
                  <>
                    <span aria-hidden="true">•</span>
                    <span>{lesson.duration} min</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Completion Status */}
          <div className="flex-shrink-0 ml-4">
            {lesson.isCompleted ? (
              <div className="flex items-center text-green-700" aria-label="Completed">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full border-2 border-gray-300" aria-label="Not completed" />
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
