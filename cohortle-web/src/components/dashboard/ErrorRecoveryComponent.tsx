'use client';

/**
 * ErrorRecoveryComponent
 * Handles various error scenarios with appropriate recovery actions
 * Requirements: 1.3, 4.1, 4.2, 4.3, 4.4
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface ApiError {
  type: 'network' | 'authentication' | 'server' | 'timeout' | 'validation' | 'unknown';
  message: string;
  statusCode?: number;
  retryable: boolean;
  details?: Record<string, any>;
}

export interface RecoveryAction {
  label: string;
  action: () => void;
  primary: boolean;
  icon?: React.ReactNode;
}

export interface ErrorRecoveryProps {
  error: ApiError;
  onRetry: () => void;
  onReportIssue?: () => void;
  onDismiss?: () => void;
  className?: string;
  showDetails?: boolean;
}

// Error classification utility
export function classifyError(error: any): ApiError {
  // Network errors
  if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR') {
    return {
      type: 'network',
      message: 'Unable to connect to the server. Please check your internet connection.',
      retryable: true,
    };
  }

  // Authentication errors
  if (error.status === 401 || error.statusCode === 401) {
    return {
      type: 'authentication',
      message: 'Your session has expired. Please log in again.',
      statusCode: 401,
      retryable: false,
    };
  }

  // Server errors
  if (error.status >= 500 || error.statusCode >= 500) {
    return {
      type: 'server',
      message: 'Something went wrong on our end. Please try again in a moment.',
      statusCode: error.status || error.statusCode,
      retryable: true,
    };
  }

  // Timeout errors
  if (error.name === 'TimeoutError' || error.code === 'TIMEOUT') {
    return {
      type: 'timeout',
      message: 'The request took too long to complete. Please try again.',
      retryable: true,
    };
  }

  // Validation errors
  if (error.status === 400 || error.statusCode === 400) {
    return {
      type: 'validation',
      message: error.message || 'There was a problem with your request.',
      statusCode: 400,
      retryable: false,
    };
  }

  // Default unknown error
  return {
    type: 'unknown',
    message: error.message || 'An unexpected error occurred. Please try again.',
    retryable: true,
  };
}

// Error recovery strategies
export const ERROR_RECOVERY_STRATEGIES = {
  network: {
    maxRetries: 3,
    backoffStrategy: 'exponential' as const,
    retryDelays: [1000, 2000, 4000], // 1s, 2s, 4s
  },
  server: {
    maxRetries: 2,
    backoffStrategy: 'linear' as const,
    retryDelays: [2000, 4000], // 2s, 4s
  },
  timeout: {
    maxRetries: 2,
    backoffStrategy: 'linear' as const,
    retryDelays: [1000, 2000], // 1s, 2s
  },
  authentication: {
    maxRetries: 0,
    backoffStrategy: 'none' as const,
    retryDelays: [],
  },
  validation: {
    maxRetries: 0,
    backoffStrategy: 'none' as const,
    retryDelays: [],
  },
  unknown: {
    maxRetries: 1,
    backoffStrategy: 'linear' as const,
    retryDelays: [2000], // 2s
  },
} as const;

export function ErrorRecoveryComponent({
  error,
  onRetry,
  onReportIssue,
  onDismiss,
  className = '',
  showDetails = false,
}: ErrorRecoveryProps) {
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showErrorDetails, setShowErrorDetails] = useState(showDetails);

  const strategy = ERROR_RECOVERY_STRATEGIES[error.type];
  const canRetry = error.retryable && retryCount < strategy.maxRetries;

  // Handle retry with exponential backoff
  const handleRetry = async () => {
    if (!canRetry || isRetrying) return;

    setIsRetrying(true);
    
    try {
      // Apply backoff delay
      const delay = strategy.retryDelays[retryCount] || 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      setRetryCount(prev => prev + 1);
      await onRetry();
    } catch (retryError) {
      console.error('Retry failed:', retryError);
    } finally {
      setIsRetrying(false);
    }
  };

  // Handle authentication redirect
  const handleAuthRedirect = () => {
    router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
  };

  // Handle issue reporting
  const handleReportIssue = () => {
    onReportIssue?.();
    
    // Log error details for debugging
    console.error('Error reported:', {
      type: error.type,
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });
  };

  // Get error icon based on type
  const getErrorIcon = () => {
    switch (error.type) {
      case 'network':
        return (
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'authentication':
        return (
          <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
      case 'server':
        return (
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  // Get recovery actions based on error type
  const getRecoveryActions = (): RecoveryAction[] => {
    const actions: RecoveryAction[] = [];

    // Retry action
    if (canRetry) {
      actions.push({
        label: isRetrying ? 'Retrying...' : `Retry${retryCount > 0 ? ` (${retryCount}/${strategy.maxRetries})` : ''}`,
        action: handleRetry,
        primary: true,
        icon: isRetrying ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" aria-hidden="true"></div>
        ) : (
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        ),
      });
    }

    // Authentication-specific actions
    if (error.type === 'authentication') {
      actions.push({
        label: 'Log In Again',
        action: handleAuthRedirect,
        primary: true,
        icon: (
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
        ),
      });
    }

    // Report issue action
    if (onReportIssue) {
      actions.push({
        label: 'Report Issue',
        action: handleReportIssue,
        primary: false,
        icon: (
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        ),
      });
    }

    // Dismiss action
    if (onDismiss) {
      actions.push({
        label: 'Dismiss',
        action: onDismiss,
        primary: false,
      });
    }

    return actions;
  };

  const recoveryActions = getRecoveryActions();

  return (
    <div className={`bg-white border border-red-200 rounded-lg p-6 shadow-sm ${className}`} role="alert">
      <div className="flex items-start space-x-4">
        {/* Error icon */}
        <div className="flex-shrink-0">
          {getErrorIcon()}
        </div>

        {/* Error content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {error.type === 'network' && 'Connection Problem'}
            {error.type === 'authentication' && 'Session Expired'}
            {error.type === 'server' && 'Server Error'}
            {error.type === 'timeout' && 'Request Timeout'}
            {error.type === 'validation' && 'Invalid Request'}
            {error.type === 'unknown' && 'Something Went Wrong'}
          </h3>
          
          <p className="text-gray-600 mb-4">
            {error.message}
          </p>

          {/* Error details (collapsible) */}
          {(error.statusCode || error.details) && (
            <div className="mb-4">
              <button
                onClick={() => setShowErrorDetails(!showErrorDetails)}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
              >
                <svg
                  className={`w-4 h-4 mr-1 transition-transform ${showErrorDetails ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                {showErrorDetails ? 'Hide' : 'Show'} details
              </button>
              
              {showErrorDetails && (
                <div className="mt-2 p-3 bg-gray-50 rounded text-sm text-gray-600 font-mono">
                  {error.statusCode && <div>Status Code: {error.statusCode}</div>}
                  {error.details && (
                    <div>Details: {JSON.stringify(error.details, null, 2)}</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Recovery actions */}
          {recoveryActions.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {recoveryActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  disabled={isRetrying && action.primary}
                  className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                    action.primary
                      ? 'bg-[#391D65] text-white hover:bg-[#391D65]/90 disabled:opacity-50'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Hook for managing error recovery state
export function useErrorRecovery() {
  const [error, setError] = useState<ApiError | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const handleError = (err: any) => {
    const classifiedError = classifyError(err);
    setError(classifiedError);
    setRetryCount(0);
  };

  const clearError = () => {
    setError(null);
    setRetryCount(0);
  };

  const incrementRetryCount = () => {
    setRetryCount(prev => prev + 1);
  };

  return {
    error,
    retryCount,
    handleError,
    clearError,
    incrementRetryCount,
  };
}