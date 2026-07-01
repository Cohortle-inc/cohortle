'use client';

/**
 * RecentActivityFeed Component
 * Displays recently completed lessons with relative timestamps
 * Requirements: 2.9, 2.10
 */

import React from 'react';

/**
 * Completed lesson activity
 */
export interface CompletedLesson {
  id: string;
  title: string;
  programmeName: string;
  completedAt: string; // ISO 8601
}

interface RecentActivityFeedProps {
  activities: CompletedLesson[];
  maxDisplay?: number; // default 5
}

export function RecentActivityFeed({ 
  activities, 
  maxDisplay = 5 
}: RecentActivityFeedProps) {
  // Memoize sorted activities for performance
  const displayActivities = React.useMemo(() => {
    return activities
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
      .slice(0, maxDisplay);
  }, [activities, maxDisplay]);

  // Format timestamp as relative time with better error handling
  const formatRelativeTime = React.useCallback((isoString: string): string => {
    try {
      const now = new Date();
      const completed = new Date(isoString);
      
      if (isNaN(completed.getTime())) {
        return 'Unknown time';
      }
      
      const diffMs = now.getTime() - completed.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      
      return completed.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting relative time:', error);
      return 'Unknown time';
    }
  }, []);

  if (displayActivities.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Activity
        </h2>
        <p className="text-sm text-gray-600">
          No completed lessons yet. Start learning to see your progress here!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Recent Activity
      </h2>
      <div className="space-y-3">
        {displayActivities.map((activity) => (
          <div
            key={`${activity.id}-${activity.completedAt}`}
            className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            {/* Checkmark Icon */}
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
              <svg
                className="w-3 h-3 text-green-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            {/* Activity Details */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 mb-1 truncate">
                {activity.title}
              </h3>
              <p className="text-xs text-gray-600 mb-1 truncate">
                {activity.programmeName}
              </p>
              <p className="text-xs text-gray-500">
                Completed {formatRelativeTime(activity.completedAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
