'use client';

/**
 * Module Card Component
 * Displays a module with lesson count and completion status
 */

import React from 'react';
import Link from 'next/link';
import { Module } from '@/lib/api/programmes';

interface ModuleCardProps {
  module: Module;
}

export function ModuleCard({ module }: ModuleCardProps) {
  const progress =
    module.lessonCount > 0
      ? (module.completedLessons / module.lessonCount) * 100
      : 0;

  return (
    <Link 
      href={`/modules/${module.id}`}
      aria-label={`View ${module.name} module with ${module.completedLessons} of ${module.lessonCount} lessons completed`}
    >
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-4 sm:p-6 cursor-pointer border border-gray-200 min-h-[140px] sm:min-h-[160px]">
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
              {module.name}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
              {module.description}
            </p>
          </div>
          
          {/* Completion Badge */}
          {module.completedLessons === module.lessonCount && module.lessonCount > 0 && (
            <div className="ml-3 sm:ml-4 flex-shrink-0">
              <div className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="hidden sm:inline">Complete</span>
                <span className="sm:hidden">✓</span>
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <div 
            className="w-full bg-gray-200 rounded-full h-2"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Module completion: ${Math.round(progress)}%`}
          >
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Lesson Count */}
        <div className="flex items-center text-xs sm:text-sm text-gray-600">
          <svg
            className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          <span className="truncate">
            <span className="font-medium">{module.completedLessons}</span>
            <span className="text-gray-500"> / </span>
            <span className="font-medium">{module.lessonCount}</span>
            <span className="hidden sm:inline"> lessons completed</span>
            <span className="sm:hidden"> lessons</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
