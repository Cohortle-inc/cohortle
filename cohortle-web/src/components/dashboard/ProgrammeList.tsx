'use client';

/**
 * Programme List Component
 * Displays a list of programmes with loading and empty states
 */

import React from 'react';
import { Community } from '@/lib/api/user';
import { ProgrammeCard } from './ProgrammeCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

interface ProgrammeListProps {
  programmes?: Community[];
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

export function ProgrammeList({
  programmes,
  isLoading,
  error,
  onRetry,
}: ProgrammeListProps) {
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
          message="Failed to load programmes. Please try again."
          onRetry={onRetry}
        />
      </div>
    );
  }

  // Empty state
  if (!programmes || programmes.length === 0) {
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
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No programmes yet
        </h3>
        <p className="text-gray-600 max-w-md mx-auto">
          You&apos;re not enrolled in any programmes yet. Contact your instructor to get
          started with your learning journey.
        </p>
      </div>
    );
  }

  // Programme grid
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {programmes.map((programme) => (
        <ProgrammeCard key={programme.id} programme={programme} />
      ))}
    </div>
  );
}
