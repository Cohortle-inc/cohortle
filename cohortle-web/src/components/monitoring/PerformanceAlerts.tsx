'use client';

import { useEffect } from 'react';
import { usePerformanceAlert } from '@/lib/hooks/usePerformanceAlert';

interface PerformanceAlertsProps {
  autoStart?: boolean;
  monitoringInterval?: number;
  className?: string;
}

export function PerformanceAlerts({ 
  autoStart = true, 
  monitoringInterval = 30000,
  className = '' 
}: PerformanceAlertsProps) {
  const {
    alerts,
    removeAlert,
    clearAllAlerts,
    startMonitoring,
  } = usePerformanceAlert();

  useEffect(() => {
    if (autoStart) {
      const cleanup = startMonitoring(monitoringInterval);
      return cleanup;
    }
  }, [autoStart, monitoringInterval, startMonitoring]);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getAlertStyles = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 space-y-2 max-w-sm ${className}`}>
      {alerts.length > 1 && (
        <div className="flex justify-end mb-2">
          <button
            onClick={clearAllAlerts}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Alert List */}
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`border rounded-lg p-4 shadow-lg ${getAlertStyles(alert.type)} animate-slide-in`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getAlertIcon(alert.type)}
            </div>
            <div className="ml-3 flex-1">
              <h4 className="text-sm font-medium">{alert.title}</h4>
              <p className="text-sm mt-1 opacity-90">{alert.message}</p>
              
              {/* Metric Details */}
              {alert.metric && alert.value !== undefined && alert.threshold !== undefined && (
                <div className="mt-2 text-xs opacity-75">
                  <span className="font-medium">{alert.metric}:</span>{' '}
                  {typeof alert.value === 'number' ? alert.value.toFixed(alert.metric === 'CLS' ? 3 : 0) : alert.value}
                  {alert.metric !== 'CLS' && alert.metric !== 'errorRate' && 'ms'}{' '}
                  (threshold: {typeof alert.threshold === 'number' ? alert.threshold.toFixed(alert.metric === 'CLS' ? 3 : 0) : alert.threshold}
                  {alert.metric !== 'CLS' && alert.metric !== 'errorRate' && 'ms'})
                </div>
              )}
              
              {/* Timestamp */}
              <div className="mt-2 text-xs opacity-60">
                {new Date(alert.timestamp).toLocaleTimeString()}
              </div>
            </div>
            <button
              onClick={() => removeAlert(alert.id)}
              className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      ))}

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

// Lightweight version for production use
export function PerformanceAlertsMinimal() {
  const { alerts, removeAlert } = usePerformanceAlert();

  // Only show error alerts in minimal version
  const errorAlerts = alerts.filter(alert => alert.type === 'error');

  if (errorAlerts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {errorAlerts.map((alert) => (
        <div
          key={alert.id}
          className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 shadow-lg"
        >
          <div className="flex items-start">
            <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="ml-2 flex-1">
              <p className="text-sm font-medium">{alert.title}</p>
            </div>
            <button
              onClick={() => removeAlert(alert.id)}
              className="ml-2 text-red-400 hover:text-red-600"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}