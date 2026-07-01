'use client';

/**
 * DashboardErrorBoundary Component
 * React error boundary for component errors with graceful degradation
 * Requirements: 4.4
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorRecoveryComponent, classifyError } from './ErrorRecoveryComponent';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class DashboardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate unique error ID for tracking
    const errorId = `dashboard_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('Dashboard Error Boundary caught an error:', error, errorInfo);
    
    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Log to external error reporting service
    this.logErrorToService(error, errorInfo);
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // This would integrate with your error reporting service (e.g., Sentry, LogRocket)
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getUserId(),
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', errorData);
    }

    // Send to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { extra: errorData });
      // Example: LogRocket.captureException(error);
    }
  };

  private getUserId = (): string | null => {
    // Get user ID from auth context or local storage
    // Note: In a class component, we can't use hooks, so we rely on localStorage
    // The AuthContext stores user data in state, not localStorage
    // This is a limitation of class components - consider refactoring to functional component
    try {
      // Try to get from window.__AUTH__ if available (set by AuthContext)
      if (typeof window !== 'undefined' && (window as any).__AUTH__?.user?.id) {
        return (window as any).__AUTH__.user.id;
      }
      
      // Fallback to localStorage for backward compatibility
      const authData = localStorage.getItem('auth');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.user?.id || null;
      }
    } catch {
      // Ignore parsing errors
    }
    return null;
  };

  private handleRetry = () => {
    // Reset error state to retry rendering
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  private handleReportIssue = () => {
    // Open issue reporting modal or redirect to support
    const errorDetails = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      timestamp: new Date().toISOString(),
    };

    // Example: Open support chat or email
    const subject = encodeURIComponent(`Dashboard Error Report - ${this.state.errorId}`);
    const body = encodeURIComponent(`
Error Details:
- Error ID: ${errorDetails.errorId}
- Message: ${errorDetails.message}
- Time: ${errorDetails.timestamp}
- Page: ${window.location.href}

Please describe what you were doing when this error occurred:
[Your description here]
    `);

    window.open(`mailto:support@example.com?subject=${subject}&body=${body}`);
  };

  private handleGoHome = () => {
    // Navigate to safe page
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Classify the error for appropriate handling
      const classifiedError = classifyError(this.state.error);

      // Render error recovery component
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Oops! Something went wrong
              </h1>
              <p className="text-gray-600">
                We encountered an unexpected error while loading your dashboard.
              </p>
            </div>

            <ErrorRecoveryComponent
              error={classifiedError}
              onRetry={this.handleRetry}
              onReportIssue={this.handleReportIssue}
              showDetails={process.env.NODE_ENV === 'development'}
            />

            {/* Additional recovery options */}
            <div className="mt-8 text-center">
              <div className="space-y-4">
                <button
                  onClick={this.handleGoHome}
                  className="inline-flex items-center px-6 py-3 bg-[#391D65] text-white rounded-lg hover:bg-[#391D65]/90 transition-colors font-medium"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  Go to Dashboard
                </button>

                <div className="text-sm text-gray-500">
                  <p>Error ID: {this.state.errorId}</p>
                  <p>If this problem persists, please contact support.</p>
                </div>
              </div>
            </div>

            {/* Development-only error details */}
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="text-lg font-medium text-red-900 mb-2">
                  Development Error Details
                </h3>
                <div className="text-sm text-red-800 space-y-2">
                  <div>
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  <div>
                    <strong>Stack:</strong>
                    <pre className="mt-1 text-xs bg-red-100 p-2 rounded overflow-auto">
                      {this.state.error.stack}
                    </pre>
                  </div>
                  <div>
                    <strong>Component Stack:</strong>
                    <pre className="mt-1 text-xs bg-red-100 p-2 rounded overflow-auto">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export function withDashboardErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  const WrappedComponent = (props: P) => (
    <DashboardErrorBoundary fallback={fallback}>
      <Component {...props} />
    </DashboardErrorBoundary>
  );

  WrappedComponent.displayName = `withDashboardErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook for triggering error boundary from functional components
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  const triggerError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  return triggerError;
}