'use client';

/**
 * DashboardSection Component
 * Wrapper component for dashboard sections with error boundaries and loading states
 * Provides consistent error handling and loading UX across all dashboard sections
 */

import React, { ReactNode } from 'react';

interface DashboardSectionProps {
  title: string;
  children: ReactNode;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  loadingComponent?: ReactNode;
  emptyComponent?: ReactNode;
  isEmpty?: boolean;
  className?: string;
}

/**
 * Default loading skeleton for dashboard sections
 */
function DefaultLoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse">
          <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-200">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Default error component for dashboard sections
 */
function DefaultErrorComponent({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div className="text-center py-6">
      <div className="w-12 h-12 mx-auto mb-4 text-red-400">
        <svg
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          className="w-full h-full"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>
      <h3 className="text-sm font-medium text-gray-900 mb-2">
        Unable to load content
      </h3>
      <p className="text-xs text-gray-600 mb-4">
        {error.message || 'Something went wrong'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-[#391D65] rounded hover:bg-[#391D65]/90 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

/**
 * Default empty state component
 */
function DefaultEmptyComponent({ title }: { title: string }) {
  return (
    <div className="text-center py-6">
      <div className="w-12 h-12 mx-auto mb-4 text-gray-400">
        <svg
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          className="w-full h-full"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </div>
      <p className="text-sm text-gray-600">
        No {title.toLowerCase()} available
      </p>
    </div>
  );
}

export function DashboardSection({
  title,
  children,
  isLoading = false,
  error = null,
  onRetry,
  loadingComponent,
  emptyComponent,
  isEmpty = false,
  className = '',
}: DashboardSectionProps) {
  return (
    <section className={`bg-white rounded-lg border border-gray-200 p-4 sm:p-6 ${className}`}>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {title}
        </h2>
        {onRetry && !isLoading && !error && (
          <button
            onClick={onRetry}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            aria-label={`Refresh ${title}`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Section Content */}
      <div className="min-h-[80px]">
        {isLoading ? (
          loadingComponent || <DefaultLoadingSkeleton />
        ) : error ? (
          <DefaultErrorComponent error={error} onRetry={onRetry} />
        ) : isEmpty ? (
          emptyComponent || <DefaultEmptyComponent title={title} />
        ) : (
          children
        )}
      </div>
    </section>
  );
}

/**
 * Specialized loading components for different dashboard sections
 */
export function SessionsLoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse">
          <div className="flex items-start justify-between p-3 rounded-lg border border-gray-200">
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
            <div className="w-16 h-8 bg-gray-200 rounded ml-3"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ActivityLoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse">
          <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-200">
            <div className="w-5 h-5 bg-gray-200 rounded-full mt-0.5"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProgrammesLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <div className="h-3 bg-gray-200 rounded w-16"></div>
                <div className="h-3 bg-gray-200 rounded w-8"></div>
              </div>
              <div className="h-2 bg-gray-200 rounded"></div>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <div className="h-3 bg-gray-200 rounded w-20 mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}