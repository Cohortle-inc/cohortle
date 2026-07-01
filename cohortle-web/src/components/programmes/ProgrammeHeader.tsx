'use client';

/**
 * Programme Header Component
 * Displays programme name, description, breadcrumb navigation and overall progress.
 * Mobile-optimised layout.
 */

import React from 'react';
import Link from 'next/link';

interface ProgrammeHeaderProps {
  programme: {
    id: string;
    name: string;
    description: string;
  };
  progress?: {
    completed: number;
    total: number;
    percentage: number;
  };
  nextIncompleteLesson?: {
    id: string;
    title: string;
  } | null;
}

export function ProgrammeHeader({ programme, progress, nextIncompleteLesson }: ProgrammeHeaderProps) {
  const isComplete = progress && progress.percentage === 100;

  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">

        {/* Breadcrumb */}
        <nav className="flex mb-3 sm:mb-4" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm">
            <li>
              <Link
                href="/dashboard"
                className="text-gray-500 hover:text-gray-700 hover:underline inline-flex items-center min-h-[44px]"
              >
                Dashboard
              </Link>
            </li>
            <li aria-hidden="true">
              <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </li>
            <li>
              <span className="text-gray-900 font-medium line-clamp-1">{programme.name}</span>
            </li>
          </ol>
        </nav>

        {/* Main content: stacks on mobile, side-by-side on sm+ */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

          {/* Left: title, description, CTA */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 leading-tight">
              {programme.name}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 line-clamp-3 sm:line-clamp-none">
              {programme.description}
            </p>

            {/* Progress bar — mobile only (shown inline below description) */}
            {progress && progress.total > 0 && (
              <div className="sm:hidden mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-600">Progress</span>
                  <span className="text-xs font-bold text-gray-900">{progress.percentage}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-300"
                    style={{ width: `${progress.percentage}%` }}
                    role="progressbar"
                    aria-valuenow={progress.percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${progress.percentage}% complete`}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {progress.completed} of {progress.total} lessons completed
                </p>
              </div>
            )}

            {/* CTA button */}
            {!isComplete && nextIncompleteLesson && (
              <Link
                href={`/lessons/${nextIncompleteLesson.id}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#391D65] text-white rounded-lg hover:bg-[#391D65]/90 active:bg-[#391D65]/80 transition-colors text-sm font-medium min-h-[44px] w-full sm:w-auto justify-center sm:justify-start"
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Continue Learning
              </Link>
            )}
            {isComplete && (
              <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-100 text-green-800 rounded-lg text-sm font-medium w-full sm:w-auto justify-center sm:justify-start">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Programme Completed!
              </div>
            )}
          </div>

          {/* Right: progress card — desktop only */}
          {progress && progress.total > 0 && (
            <div className="hidden sm:block flex-shrink-0 bg-gray-50 rounded-xl p-4 w-52 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                <span className="text-xl font-bold text-gray-900">{progress.percentage}%</span>
              </div>
              <div
                className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-2"
                role="progressbar"
                aria-valuenow={progress.percentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${progress.percentage}% complete`}
              >
                <div
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">
                {progress.completed} of {progress.total} lessons completed
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
