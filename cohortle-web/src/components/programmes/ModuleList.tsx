'use client';

/**
 * Module List Component
 * Displays a list of modules with loading and error states
 */

import React from 'react';
import { Module } from '@/lib/api/programmes';
import { ModuleCard } from './ModuleCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

interface ModuleListProps {
  modules?: Module[];
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

export function ModuleList({ modules, isLoading, error, onRetry }: ModuleListProps) {
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
          message="Failed to load modules. Please try again."
          onRetry={onRetry}
        />
      </div>
    );
  }

  // Empty state
  if (!modules || modules.length === 0) {
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No modules yet
        </h3>
        <p className="text-gray-600">
          This programme doesn&apos;t have any modules yet.
        </p>
      </div>
    );
  }

  // Module list
  return (
    <div className="space-y-4">
      {modules.map((module) => (
        <ModuleCard key={module.id} module={module} />
      ))}
    </div>
  );
}
