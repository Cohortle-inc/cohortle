'use client';

/**
 * Lesson List Component
 * Displays a list of lessons with loading and error states
 */

import React from 'react';
import { Lesson } from '@/lib/api/programmes';
import { LessonCard } from './LessonCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

interface LessonListProps {
  lessons?: Lesson[];
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

export function LessonList({ lessons, isLoading, error, onRetry }: LessonListProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="py-8">
        <ErrorMessage
          message="Failed to load lessons. Please try again."
          onRetry={onRetry}
        />
      </div>
    );
  }

  // Empty state
  if (!lessons || lessons.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No lessons yet
        </h3>
        <p className="text-gray-600">
          This module doesn&apos;t have any lessons yet.
        </p>
      </div>
    );
  }

  // Lesson list
  return (
    <div className="space-y-3">
      {lessons.map((lesson) => (
        <LessonCard key={lesson.id} lesson={lesson} />
      ))}
    </div>
  );
}
