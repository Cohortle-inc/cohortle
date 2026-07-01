'use client';

import Link from 'next/link';
import { memo, useMemo } from 'react';
import ProgressIndicator from '../learning/ProgressIndicator';

interface EnrolledProgramme {
  id: number;
  name: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  lastAccessed?: string;
  status?: 'active' | 'completed' | 'paused';
}

interface EnrolledProgrammesListProps {
  programmes: EnrolledProgramme[];
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

function EnrolledProgrammesListComponent({ 
  programmes, 
  isLoading = false, 
  error = null, 
  onRetry 
}: EnrolledProgrammesListProps) {
  const sortedProgrammes = useMemo(() => {
    return [...programmes].sort((a, b) => {
      // Sort by status: active first, then by last accessed
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (b.status === 'active' && a.status !== 'active') return 1;
      
      // Then by progress (higher progress first)
      return b.progress - a.progress;
    });
  }, [programmes]);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'paused':
        return 'Paused';
      case 'active':
      default:
        return 'In Progress';
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-3 sm:space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2 gap-2">
                  <div className="h-4 bg-gray-200 rounded w-48"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Enrolled Programmes</h2>
        <div className="text-center py-6">
          <div className="w-12 h-12 mx-auto mb-4 text-red-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">Unable to load programmes</h3>
          <p className="text-xs text-gray-600 mb-4">{error.message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-[#391D65] rounded hover:bg-[#391D65]/90 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  // Empty state
  if (sortedProgrammes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Enrolled Programmes</h2>
        <div className="text-center py-6 sm:py-8">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">No programmes yet</h3>
          <p className="text-sm text-gray-500 mb-4">
            You haven't enrolled in any programmes yet.
          </p>
          <Link
            href="/discover"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Discover Programmes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Enrolled Programmes</h2>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Refresh programmes"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}
      </div>
      
      <div className="space-y-3 sm:space-y-4">
        {sortedProgrammes.map((programme) => (
          <Link
            key={programme.id}
            href={`/programmes/${programme.id}/learn`}
            className="block border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-blue-500 hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between mb-2 gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                  {programme.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                    {programme.completedLessons}/{programme.totalLessons} lessons
                  </span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(programme.status)}`}>
                    {getStatusText(programme.status)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">
                  {programme.progress}%
                </div>
              </div>
            </div>
            
            <ProgressIndicator
              current={programme.completedLessons}
              total={programme.totalLessons}
              size="small"
            />
            
            {programme.lastAccessed && (
              <div className="mt-2 text-xs text-gray-500">
                Last accessed {new Date(programme.lastAccessed).toLocaleDateString()}
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* Quick stats */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {sortedProgrammes.filter(p => p.status === 'active').length}
            </div>
            <div className="text-xs text-gray-600">Active</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {sortedProgrammes.filter(p => p.status === 'completed').length}
            </div>
            <div className="text-xs text-gray-600">Completed</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {Math.round(sortedProgrammes.reduce((acc, p) => acc + p.progress, 0) / sortedProgrammes.length) || 0}%
            </div>
            <div className="text-xs text-gray-600">Avg Progress</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(EnrolledProgrammesListComponent);
