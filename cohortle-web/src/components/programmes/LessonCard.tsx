'use client';

/**
 * Lesson Card Component for Programme Context
 * Displays a WLIMP lesson with content type icon and view action
 */

import React from 'react';
import Link from 'next/link';
import { WLIMPLesson } from '@/lib/api/programmes';

interface LessonCardProps {
  lesson: WLIMPLesson;
  weekNumber: number;
  previewMode?: boolean;
  /** Optional assignment submission status — only shown when lesson.content_type === 'assignment' */
  locked?: boolean;
  lockedUntil?: string | null;
  assignmentStatus?: 'not_started' | 'submitted' | 'passed' | 'needs_revision';
}

// Content type icons
const getContentTypeIcon = (contentType: string) => {
  const type = contentType.toLowerCase();
  
  if (type.includes('video') || type === 'video') {
    return (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
      </svg>
    );
  }
  
  if (type.includes('pdf') || type === 'pdf') {
    return (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
  
  // Default to link icon
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
        clipRule="evenodd"
      />
    </svg>
  );
};

const getContentTypeLabel = (contentType: string): string => {
  const type = contentType.toLowerCase();
  
  if (type.includes('video') || type === 'video') return 'Video';
  if (type.includes('pdf') || type === 'pdf') return 'PDF';
  return 'Link';
};

export function LessonCard({ lesson, previewMode = false, locked = false, lockedUntil, assignmentStatus }: LessonCardProps) {
  const contentTypeLabel = getContentTypeLabel(lesson.content_type);
  const isCompleted = lesson.completed || false;
  const lockedDateLabel = lockedUntil ? new Date(lockedUntil).toLocaleDateString() : null;
  
  // Build the lesson URL with preview parameter if in preview mode
  const lessonUrl = previewMode 
    ? `/lessons/${lesson.id}?preview=true`
    : `/lessons/${lesson.id}`;

  const card = (
    <div
      className={`
        bg-white rounded-lg shadow-sm
        transition-shadow duration-200 p-4
        border ${locked ? 'border-gray-200 bg-gray-50 opacity-75' : isCompleted ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-blue-300 hover:shadow-md'}
        h-full flex flex-col min-h-[120px]
      `}
    >
      <div className="flex items-start space-x-3 flex-1">
        <div
          className={`
            flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center
            ${locked ? 'bg-gray-100 text-gray-500' : isCompleted ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-600'}
          `}
          aria-hidden="true"
        >
          {locked ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 2a4 4 0 00-4 4v2H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-1V6a4 4 0 00-4-4zm2 6V6a2 2 0 10-4 0v2h4z"
                clipRule="evenodd"
              />
            </svg>
          ) : getContentTypeIcon(lesson.content_type)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`text-sm sm:text-base font-medium mb-1 line-clamp-2 flex-1 ${locked ? 'text-gray-600' : 'text-gray-900'}`}>
              {lesson.title}
            </h3>
            {isCompleted && !locked && (
              <svg
                className="w-5 h-5 text-green-700 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-label="Completed"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          {lesson.description && (
            <p className={`text-xs sm:text-sm line-clamp-2 mb-2 ${locked ? 'text-gray-500' : 'text-gray-600'}`}>
              {lesson.description}
            </p>
          )}
          <span className="text-xs text-gray-500">{contentTypeLabel}</span>
          {lesson.content_type === 'assignment' && assignmentStatus && !locked && (
            <AssignmentStatusBadge status={assignmentStatus} />
          )}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <span className={`text-sm font-medium flex items-center min-h-[24px] ${locked ? 'text-gray-500' : isCompleted ? 'text-green-700 hover:text-green-800' : 'text-blue-600 hover:text-blue-700'}`}>
          {locked ? (lockedDateLabel ? `Unlocks ${lockedDateLabel}` : 'Locked') : isCompleted ? 'Review lesson' : 'View lesson'}
          {!locked && (
            <svg
              className="w-4 h-4 ml-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          )}
        </span>
      </div>
    </div>
  );

  if (locked && !previewMode) {
    return (
      <div
        aria-disabled="true"
        aria-label={`${lesson.title}, ${contentTypeLabel} lesson, locked${lockedDateLabel ? ` until ${lockedDateLabel}` : ''}`}
        className="block h-full cursor-not-allowed"
      >
        {card}
      </div>
    );
  }

  return (
    <Link
      href={lessonUrl}
      aria-label={`${lesson.title}, ${contentTypeLabel} lesson${isCompleted ? ', completed' : ''}`}
      className="block h-full"
    >
      {card}
    </Link>
  );
}

// ─── Assignment Status Badge ──────────────────────────────────────────────────

type AssignmentStatusBadgeProps = {
  status: 'not_started' | 'submitted' | 'passed' | 'needs_revision';
};

function AssignmentStatusBadge({ status }: AssignmentStatusBadgeProps) {
  const config = {
    not_started: { label: 'Not Started', className: 'bg-gray-100 text-gray-600' },
    submitted: { label: 'Submitted', className: 'bg-blue-100 text-blue-700' },
    passed: { label: 'Passed', className: 'bg-green-100 text-green-700' },
    needs_revision: { label: 'Needs Revision', className: 'bg-red-100 text-red-700' },
  };

  const { label, className } = config[status];

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}
      aria-label={`Assignment status: ${label}`}
    >
      {label}
    </span>
  );
}
