'use client';

/**
 * Module Detail Page
 * Displays lessons for a specific module
 */

import React from 'react';
import { useModuleLessons } from '@/lib/hooks/useModules';
import { ModuleHeader } from '@/components/modules/ModuleHeader';
import { LessonList } from '@/components/modules/LessonList';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface ModulePageProps {
  params: {
    id: string;
  };
}

export default function ModulePage({ params }: ModulePageProps) {
  const { data, isLoading, error, refetch } = useModuleLessons(params.id);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load module</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Module Header */}
      <ModuleHeader module={data.module} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Lessons</h2>
          <p className="text-gray-600">
            Select a lesson to start learning
          </p>
        </div>

        <LessonList
          lessons={data.data}
          isLoading={isLoading}
          error={error}
          onRetry={() => refetch()}
        />
      </div>
    </div>
  );
}
