'use client';

/**
 * Week Section Component
 * Displays a week with its lessons grouped together.
 * Mobile-optimised: single column on small screens, grid on larger.
 */

import React, { useState } from 'react';
import { WLIMPWeek } from '@/lib/api/programmes';
import { LessonCard } from './LessonCard';

interface WeekSectionProps {
  week: WLIMPWeek;
  previewMode?: boolean;
  /** If true the week starts collapsed on mobile */
  defaultCollapsed?: boolean;
}

export function WeekSection({ week, previewMode = false, defaultCollapsed = false }: WeekSectionProps) {
  const totalLessons = week.lessons.length;
  const completedLessons = week.lessons.filter(l => l.completed).length;
  const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const isLocked = !previewMode && Boolean(week.isLocked);
  const lockedUntil = week.locked_until || week.start_date;

  // Collapsible on mobile
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

      {/* Week Header — acts as toggle on mobile */}
      <button
        type="button"
        onClick={() => setCollapsed(v => !v)}
        className="w-full text-left bg-gray-50 px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#391D65] focus-visible:ring-inset"
        aria-expanded={!collapsed}
        aria-controls={`week-${week.id}-lessons`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">
                Week {week.week_number}
              </h2>
              {week.isCurrent && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Current
                </span>
              )}
              {isLocked && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  Locked
                </span>
              )}
              {completedLessons === totalLessons && totalLessons > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Complete
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-0.5 truncate">{week.title}</p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Progress — compact on mobile */}
            {totalLessons > 0 && (
              <div className="hidden xs:flex items-center gap-2">
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {completedLessons}/{totalLessons}
                </span>
                <div
                  className="w-16 sm:w-24 h-2 bg-gray-200 rounded-full overflow-hidden"
                  role="progressbar"
                  aria-valuenow={progressPercentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Week ${week.week_number} progress`}
                >
                  <div
                    className="h-full bg-green-500 transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Chevron toggle */}
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Mobile progress bar — shown inside header */}
        {totalLessons > 0 && (
          <div className="xs:hidden mt-2 flex items-center gap-2">
            <div
              className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={progressPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Week ${week.week_number} progress`}
            >
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
              {completedLessons}/{totalLessons}
            </span>
          </div>
        )}
      </button>

      {/* Lessons */}
      <div
        id={`week-${week.id}-lessons`}
        className={collapsed ? 'hidden' : undefined}
      >
        <div className="p-3 sm:p-6">
          {week.lessons.length === 0 ? (
            <p className="text-gray-500 text-center py-4 text-sm">No lessons available</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {[...week.lessons]
                .sort((a, b) => a.order_index - b.order_index)
                .map((lesson) => (
                  <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                    weekNumber={week.week_number}
                    previewMode={previewMode}
                    locked={isLocked}
                    lockedUntil={lockedUntil}
                  />
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
