'use client';

/**
 * Programme Card Component
 * Displays a programme/community with thumbnail, progress, and module count
 */

import React from 'react';
import Link from 'next/link';
import { Community } from '@/lib/api/user';

interface ProgrammeCardProps {
  programme: Community;
}

export function ProgrammeCard({ programme }: ProgrammeCardProps) {
  const progress =
    programme.totalLessons > 0
      ? (programme.completedLessons / programme.totalLessons) * 100
      : 0;

  return (
    <Link 
      href={`/programmes/${programme.id}`}
      aria-label={`View ${programme.name} programme with ${programme.moduleCount} modules`}
    >
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden cursor-pointer">
        {/* Thumbnail */}
        {programme.thumbnail ? (
          <div className="h-48 w-full overflow-hidden bg-gray-200">
            <img
              src={programme.thumbnail}
              alt={`${programme.name} programme thumbnail`}
              title={programme.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to placeholder if image fails
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.innerHTML = `
                    <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700">
                      <span class="text-white text-4xl font-bold">${programme.name.charAt(0)}</span>
                    </div>
                  `;
                }
              }}
            />
          </div>
        ) : (
          <div className="h-48 w-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700">
            <span className="text-white text-4xl font-bold" aria-hidden="true">
              {programme.name.charAt(0)}
            </span>
          </div>
        )}

        {/* Content */}
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {programme.name}
          </h3>
          
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {programme.description}
          </p>

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div 
              className="w-full bg-gray-200 rounded-full h-2"
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Programme completion: ${Math.round(progress)}%`}
            >
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{programme.moduleCount} modules</span>
            <span>
              {programme.completedLessons} / {programme.totalLessons} lessons
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
