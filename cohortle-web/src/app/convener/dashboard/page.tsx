'use client';

/**
 * Convener Dashboard Page
 * Main landing page for conveners to view and manage their programmes
 */

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useConvenerProgrammes } from '@/lib/hooks/useConvenerProgrammes';
import { ProgrammeCard } from '@/components/convener/ProgrammeCard';
import { ProgrammeActionGuard } from '@/components/programmes/ProgrammeActionGuard';
import { ConvenerDashboardSummary } from '@/components/convener/DashboardSummary';

export default function ConvenerDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { programmes, isLoading, error } = useConvenerProgrammes();

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // User should be authenticated at this point (middleware handles redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Convener Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Manage your programmes and cohorts
          </p>
        </div>
        
        {/* Create Programme Button */}
        <ProgrammeActionGuard action="create">
          <Link
            href="/convener/programmes/new"
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Programme
          </Link>
        </ProgrammeActionGuard>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-red-600 mt-0.5 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800 mb-1">
                Failed to load programmes
              </h3>
              <p className="text-sm text-red-700">{error.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && programmes.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <svg
            className="w-16 h-16 text-gray-400 mx-auto mb-4"
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No programmes yet
          </h3>
          <p className="text-gray-600 mb-6">
            Get started by creating your first programme
          </p>
          <Link
            href="/convener/programmes/new"
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Programme
          </Link>
        </div>
      )}

      {/* Programme List */}
      {!isLoading && !error && programmes.length > 0 && (
        <>
          <ConvenerDashboardSummary programmes={programmes} isLoading={isLoading} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programmes.map((programme) => (
              <ProgrammeCard key={programme.id} programme={programme} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
