'use client';

import React, { useState } from 'react';
import { LearnerActivity } from '@/lib/api/convener';

interface LearnerActivityTimelineProps {
  activities: LearnerActivity[];
}

export default function LearnerActivityTimeline({ activities = [] }: LearnerActivityTimelineProps) {
  const [filter, setFilter] = useState<string>('all');

  const filteredActivities = (activities || []).filter(a => {
    if (filter === 'all') return true;
    if (filter === 'content') return ['lesson_completion', 'quiz_completion', 'assignment_submission'].includes(a.type);
    if (filter === 'community') return ['community_post', 'comment'].includes(a.type);
    if (filter === 'programme') return ['enrollment', 'programme_completion', 'achievement'].includes(a.type);
    return true;
  });

  const getActivityIcon = (type: LearnerActivity['type']) => {
    switch (type) {
      case 'enrollment':
        return (
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        );
      case 'lesson_completion':
        return (
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'assignment_submission':
        return (
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        );
      case 'community_post':
        return (
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
          </div>
        );
      case 'programme_completion':
        return (
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Activity Timeline</h3>
        <div className="flex gap-2">
          {['all', 'content', 'community', 'programme'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filter === f
                  ? 'bg-[#391D65] text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">No activity found matching your criteria.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100" />

            <div className="space-y-8">
              {filteredActivities.map((activity, idx) => (
                <div key={activity.id} className="relative pl-12">
                  {/* Icon */}
                  <div className="absolute left-0 top-0 z-10">
                    {getActivityIcon(activity.type)}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{activity.title}</p>
                      {activity.description && (
                        <p className="text-sm text-gray-600 mt-0.5">{activity.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {activity.programmeName && (
                          <span className="text-xs font-medium text-[#391D65] bg-[#ECDCFF] px-2 py-0.5 rounded">
                            {activity.programmeName}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-400">
                        {activity.timestamp ? new Date(activity.timestamp).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
