'use client';

/**
 * LoadingStateManager Component
 * Manages different loading states based on user context and API response times
 * Requirements: 1.1, 1.4, 3.1, 3.2, 3.3
 */

import React, { useState, useEffect, useCallback } from 'react';

export interface LoadingState {
  phase: 'initial' | 'fetching' | 'timeout' | 'complete';
  message: string;
  showSkeleton: boolean;
}

export interface LoadingStateManagerProps {
  isNewUser: boolean;
  loadingDuration: number;
  children: React.ReactNode;
  onTimeout?: () => void;
  onComplete?: () => void;
}

const LOADING_PHASES = {
  initial: { duration: 1000, message: 'Loading dashboard...', showSkeleton: true },
  fetching: { duration: 2000, message: 'Fetching your data...', showSkeleton: true },
  timeout: { duration: 0, message: 'Taking longer than expected...', showSkeleton: false },
} as const;

const MAX_LOADING_TIME = 10000; // 10 seconds maximum

export function LoadingStateManager({
  isNewUser,
  loadingDuration,
  children,
  onTimeout,
  onComplete,
}: LoadingStateManagerProps) {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    phase: 'initial',
    message: LOADING_PHASES.initial.message,
    showSkeleton: true,
  });

  const [hasTimedOut, setHasTimedOut] = useState(false);

  // Handle loading phase transitions
  const updateLoadingPhase = useCallback((phase: LoadingState['phase']) => {
    const phaseConfig = LOADING_PHASES[phase as keyof typeof LOADING_PHASES];
    if (phaseConfig) {
      setLoadingState({
        phase,
        message: phaseConfig.message,
        showSkeleton: phaseConfig.showSkeleton,
      });
    }
  }, []);

  // Handle completion
  const handleComplete = useCallback(() => {
    setLoadingState({
      phase: 'complete',
      message: '',
      showSkeleton: false,
    });
    onComplete?.();
  }, [onComplete]);

  // Handle timeout
  const handleTimeout = useCallback(() => {
    setHasTimedOut(true);
    updateLoadingPhase('timeout');
    onTimeout?.();
  }, [onTimeout, updateLoadingPhase]);

  // Loading phase progression effect
  useEffect(() => {
    if (loadingDuration === 0) {
      handleComplete();
      return;
    }

    let timeoutId: NodeJS.Timeout;

    // For new users, optimize loading sequence
    if (isNewUser) {
      // Skip unnecessary API calls, show empty state faster
      if (loadingDuration < 1000) {
        handleComplete();
        return;
      }
      
      // Show initial phase briefly, then complete
      timeoutId = setTimeout(() => {
        handleComplete();
      }, Math.min(loadingDuration, 1500));
    } else {
      // Regular loading progression for existing users
      const phases = [
        { phase: 'initial' as const, delay: 0 },
        { phase: 'fetching' as const, delay: LOADING_PHASES.initial.duration },
      ];

      phases.forEach(({ phase, delay }) => {
        setTimeout(() => {
          if (loadingDuration > delay) {
            updateLoadingPhase(phase);
          }
        }, delay);
      });

      // Complete when loading is done
      timeoutId = setTimeout(() => {
        handleComplete();
      }, loadingDuration);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [loadingDuration, isNewUser, handleComplete, updateLoadingPhase]);

  // Maximum loading time safety net
  useEffect(() => {
    const maxTimeoutId = setTimeout(() => {
      if (loadingState.phase !== 'complete') {
        handleTimeout();
      }
    }, MAX_LOADING_TIME);

    return () => clearTimeout(maxTimeoutId);
  }, [loadingState.phase, handleTimeout]);

  // If loading is complete, render children
  if (loadingState.phase === 'complete') {
    return <>{children}</>;
  }

  // If timed out, show timeout message with retry option
  if (hasTimedOut) {
    return (
      <div className="flex flex-col items-center justify-center py-12" role="status" aria-live="polite">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 mb-4">
            <svg
              className="w-6 h-6 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {loadingState.message}
          </h3>
          <p className="text-gray-600 mb-4">
            The system is still working. Please wait a moment or try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 bg-[#391D65] text-white rounded-lg hover:bg-[#391D65]/90 transition-colors font-medium"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Show loading state with skeleton or spinner
  return (
    <div className="space-y-6" role="status" aria-live="polite">
      <div className="flex items-center justify-center py-4">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#391D65]" aria-hidden="true"></div>
          <span className="text-gray-600 font-medium">{loadingState.message}</span>
        </div>
      </div>
      
      {loadingState.showSkeleton && (
        <div className="space-y-6">
          {/* Header skeleton */}
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          
          {/* Content skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>
          </div>
          
          {/* Programme cards skeleton */}
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-2 bg-gray-200 rounded w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}