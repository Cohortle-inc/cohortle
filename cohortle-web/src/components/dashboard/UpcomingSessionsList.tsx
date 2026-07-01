'use client';

/**
 * UpcomingSessionsList Component
 * Displays upcoming live sessions sorted chronologically
 * Requirements: 2.6, 2.7, 2.8
 */

import React from 'react';

/**
 * Live session data
 */
export interface LiveSession {
  id: string;
  title: string;
  programmeName: string;
  programmeId: number;
  dateTime: string; // ISO 8601
  joinUrl?: string;
}

interface UpcomingSessionsListProps {
  sessions: LiveSession[];
  maxDisplay?: number; // default 5
}

export function UpcomingSessionsList({ 
  sessions, 
  maxDisplay = 5 
}: UpcomingSessionsListProps) {
  // Memoize sorted and filtered sessions for performance
  const displaySessions = React.useMemo(() => {
    const now = new Date();
    return sessions
      .filter(session => new Date(session.dateTime) > now) // Only future sessions
      .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
      .slice(0, maxDisplay);
  }, [sessions, maxDisplay]);

  // Format date and time with better error handling
  const formatDateTime = React.useCallback((isoString: string) => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) {
        return { dateStr: 'Invalid date', timeStr: '' };
      }
      
      const dateStr = date.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
      const timeStr = date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return { dateStr, timeStr };
    } catch (error) {
      console.error('Error formatting date:', error);
      return { dateStr: 'Invalid date', timeStr: '' };
    }
  }, []);

  if (displaySessions.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Upcoming Live Sessions
        </h2>
        <p className="text-sm text-gray-600">
          No upcoming live sessions scheduled.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Upcoming Live Sessions
      </h2>
      <div className="space-y-3">
        {displaySessions.map((session) => {
          const { dateStr, timeStr } = formatDateTime(session.dateTime);
          const isToday = new Date(session.dateTime).toDateString() === new Date().toDateString();
          const isWithinHour = new Date(session.dateTime).getTime() - Date.now() < 60 * 60 * 1000;
          
          return (
            <div
              key={session.id}
              className={`flex items-start justify-between p-3 rounded-lg border transition-colors ${
                isWithinHour 
                  ? 'border-orange-200 bg-orange-50 hover:bg-orange-100' 
                  : isToday 
                    ? 'border-blue-200 bg-blue-50 hover:bg-blue-100'
                    : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {session.title}
                  </h3>
                  {isWithinHour && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      Starting soon
                    </span>
                  )}
                  {isToday && !isWithinHour && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Today
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 mb-1 truncate">
                  {session.programmeName}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{dateStr}</span>
                  <span>•</span>
                  <span>{timeStr}</span>
                </div>
              </div>
              {session.joinUrl && (
                <a
                  href={session.joinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`ml-3 flex-shrink-0 inline-flex items-center px-3 py-1.5 text-xs font-medium rounded transition-colors min-h-[44px] ${
                    isWithinHour
                      ? 'text-white bg-orange-600 hover:bg-orange-700'
                      : 'text-white bg-[#391D65] hover:bg-[#391D65]/90'
                  }`}
                  aria-label={`Join ${session.title}`}
                >
                  {isWithinHour ? 'Join Now' : 'Join'}
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
