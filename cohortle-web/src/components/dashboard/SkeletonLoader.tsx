'use client';

/**
 * SkeletonLoader Component
 * Configurable skeleton UI for dashboard sections
 * Requirements: 3.1, 7.1
 */

import React from 'react';

export interface SkeletonConfig {
  showHeader: boolean;
  showProgrammeCards: number;
  showSidebar: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
}

export interface SkeletonLoaderProps {
  config: SkeletonConfig;
  className?: string;
}

const ANIMATION_CLASSES = {
  slow: 'animate-pulse [animation-duration:2s]',
  normal: 'animate-pulse',
  fast: 'animate-pulse [animation-duration:0.5s]',
} as const;

export function SkeletonLoader({ config, className = '' }: SkeletonLoaderProps) {
  const animationClass = ANIMATION_CLASSES[config.animationSpeed];

  return (
    <div className={`space-y-6 ${className}`} role="status" aria-label="Loading content">
      {/* Header skeleton */}
      {config.showHeader && (
        <div className={animationClass}>
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      )}

      {/* Main content layout */}
      <div className={`grid gap-6 ${config.showSidebar ? 'grid-cols-1 lg:grid-cols-4' : 'grid-cols-1'}`}>
        {/* Main content area */}
        <div className={config.showSidebar ? 'lg:col-span-3' : 'col-span-1'}>
          {/* Continue Learning Section Skeleton */}
          <div className={`${animationClass} mb-6`}>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-10 bg-gray-200 rounded w-1/4 mt-4"></div>
              </div>
            </div>
          </div>

          {/* Two column sections skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Upcoming Sessions */}
            <div className={`${animationClass} bg-white rounded-lg border border-gray-200 p-6`}>
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-3 p-3 border border-gray-100 rounded">
                    <div className="w-10 h-10 bg-gray-200 rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className={`${animationClass} bg-white rounded-lg border border-gray-200 p-6`}>
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start space-x-3 p-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Programme cards skeleton */}
          {config.showProgrammeCards > 0 && (
            <div className="space-y-4">
              <div className={`h-6 bg-gray-200 rounded w-1/4 ${animationClass}`}></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: config.showProgrammeCards }).map((_, i) => (
                  <div key={i} className={`${animationClass} bg-white rounded-lg border border-gray-200 p-6`}>
                    <div className="space-y-4">
                      {/* Programme thumbnail */}
                      <div className="h-32 bg-gray-200 rounded"></div>
                      
                      {/* Programme title */}
                      <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                      
                      {/* Programme description */}
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                        </div>
                        <div className="h-2 bg-gray-200 rounded w-full"></div>
                      </div>
                      
                      {/* Action button */}
                      <div className="h-10 bg-gray-200 rounded w-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar skeleton */}
        {config.showSidebar && (
          <div className="lg:col-span-1">
            <div className={`${animationClass} bg-white rounded-lg border border-gray-200 p-6`}>
              <div className="h-6 bg-gray-200 rounded w-2/3 mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Screen reader announcement */}
      <div className="sr-only" aria-live="polite">
        Loading dashboard content, please wait...
      </div>
    </div>
  );
}

// Preset configurations for common use cases
export const SKELETON_PRESETS: Record<string, SkeletonConfig> = {
  dashboard: {
    showHeader: true,
    showProgrammeCards: 3,
    showSidebar: false,
    animationSpeed: 'normal',
  },
  programmes: {
    showHeader: false,
    showProgrammeCards: 6,
    showSidebar: false,
    animationSpeed: 'normal',
  },
  minimal: {
    showHeader: true,
    showProgrammeCards: 0,
    showSidebar: false,
    animationSpeed: 'fast',
  },
  detailed: {
    showHeader: true,
    showProgrammeCards: 4,
    showSidebar: true,
    animationSpeed: 'slow',
  },
};