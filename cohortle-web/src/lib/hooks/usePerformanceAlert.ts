'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePerformanceMonitoring } from '@/lib/utils/performanceMonitoring';

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: number;
  metric?: string;
  value?: number;
  threshold?: number;
}

interface PerformanceThresholds {
  pageLoadTime: number;
  apiResponseTime: number;
  errorRate: number;
  coreWebVitals: {
    LCP: number;
    FID: number;
    CLS: number;
    FCP: number;
  };
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  pageLoadTime: 3000, // 3 seconds
  apiResponseTime: 2000, // 2 seconds
  errorRate: 0.05, // 5%
  coreWebVitals: {
    LCP: 4000, // 4 seconds
    FID: 300, // 300ms
    CLS: 0.25, // 0.25
    FCP: 3000, // 3 seconds
  },
};

export function usePerformanceAlert(thresholds: Partial<PerformanceThresholds> = {}) {
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const { getPerformanceSummary } = usePerformanceMonitoring();
  
  const mergedThresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };

  const addAlert = useCallback((alert: Omit<PerformanceAlert, 'id' | 'timestamp'>) => {
    const newAlert: PerformanceAlert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    
    setAlerts(prev => [...prev, newAlert]);
    
    // Auto-remove alert after 10 seconds for info alerts, 30 seconds for warnings/errors
    const timeout = alert.type === 'info' ? 10000 : 30000;
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== newAlert.id));
    }, timeout);
    
    return newAlert.id;
  }, []);

  const removeAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  const clearAllAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const checkPerformanceThresholds = useCallback(async () => {
    try {
      // Get current performance summary
      const summary = getPerformanceSummary();
      
      // Check page load time
      if (summary.averagePageLoadTime > mergedThresholds.pageLoadTime) {
        addAlert({
          type: 'warning',
          title: 'Slow Page Load Detected',
          message: `Average page load time is ${summary.averagePageLoadTime}ms, exceeding threshold of ${mergedThresholds.pageLoadTime}ms`,
          metric: 'pageLoadTime',
          value: summary.averagePageLoadTime,
          threshold: mergedThresholds.pageLoadTime,
        });
      }

      // Check Core Web Vitals
      summary.coreWebVitals.forEach((vital: any) => {
        const threshold = mergedThresholds.coreWebVitals[vital.name as keyof typeof mergedThresholds.coreWebVitals];
        if (vital.value > threshold) {
          addAlert({
            type: vital.rating === 'poor' ? 'error' : 'warning',
            title: `Poor ${vital.name} Performance`,
            message: `${vital.name} is ${vital.value}${vital.name === 'CLS' ? '' : 'ms'}, exceeding threshold of ${threshold}${vital.name === 'CLS' ? '' : 'ms'}`,
            metric: vital.name,
            value: vital.value,
            threshold,
          });
        }
      });

      // Check for slow API calls
      if (summary.slowAPICallsCount > 0) {
        addAlert({
          type: 'warning',
          title: 'Slow API Calls Detected',
          message: `${summary.slowAPICallsCount} API calls are taking longer than ${mergedThresholds.apiResponseTime}ms`,
          metric: 'apiResponseTime',
          value: summary.slowAPICallsCount,
          threshold: mergedThresholds.apiResponseTime,
        });
      }

      // Fetch server-side performance data for more comprehensive checks
      const response = await fetch('/api/analytics/performance?limit=100');
      if (response.ok) {
        const data = await response.json();
        
        // Check error rate
        const totalRequests = data.summary.dataPoints.apiCalls;
        const errorRequests = data.data.reduce((count: number, session: any) => {
          return count + session.apiMetrics.filter((api: any) => api.status >= 400).length;
        }, 0);
        
        const errorRate = totalRequests > 0 ? errorRequests / totalRequests : 0;
        
        if (errorRate > mergedThresholds.errorRate) {
          addAlert({
            type: 'error',
            title: 'High Error Rate Detected',
            message: `API error rate is ${(errorRate * 100).toFixed(1)}%, exceeding threshold of ${(mergedThresholds.errorRate * 100).toFixed(1)}%`,
            metric: 'errorRate',
            value: errorRate,
            threshold: mergedThresholds.errorRate,
          });
        }
      }
    } catch (error) {
      console.warn('Failed to check performance thresholds:', error);
    }
  }, [mergedThresholds, getPerformanceSummary, addAlert]);

  const startMonitoring = useCallback((interval: number = 30000) => {
    if (isMonitoring) return;
    
    setIsMonitoring(true);
    
    // Initial check
    checkPerformanceThresholds();
    
    // Set up periodic checks
    const intervalId = setInterval(checkPerformanceThresholds, interval);
    
    // Store interval ID for cleanup
    return () => {
      clearInterval(intervalId);
      setIsMonitoring(false);
    };
  }, [isMonitoring, checkPerformanceThresholds]);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  // Monitor performance observer for real-time alerts
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Monitor for layout shifts
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'layout-shift' && (entry as any).hadRecentInput === false) {
              const cls = (entry as any).value;
              if (cls > mergedThresholds.coreWebVitals.CLS) {
                addAlert({
                  type: 'warning',
                  title: 'Layout Shift Detected',
                  message: `Cumulative Layout Shift of ${cls.toFixed(3)} detected, exceeding threshold of ${mergedThresholds.coreWebVitals.CLS}`,
                  metric: 'CLS',
                  value: cls,
                  threshold: mergedThresholds.coreWebVitals.CLS,
                });
              }
            }
          }
        });
        
        observer.observe({ type: 'layout-shift', buffered: true });
        
        return () => observer.disconnect();
      } catch (error) {
        console.warn('Failed to set up performance observer:', error);
      }
    }
  }, [mergedThresholds.coreWebVitals.CLS, addAlert]);

  // Monitor for JavaScript errors
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleError = (event: ErrorEvent) => {
      addAlert({
        type: 'error',
        title: 'JavaScript Error Detected',
        message: `${event.error?.name || 'Error'}: ${event.message}`,
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      addAlert({
        type: 'error',
        title: 'Unhandled Promise Rejection',
        message: `${event.reason}`,
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [addAlert]);

  return {
    alerts,
    isMonitoring,
    addAlert,
    removeAlert,
    clearAllAlerts,
    startMonitoring,
    stopMonitoring,
    checkPerformanceThresholds,
    thresholds: mergedThresholds,
  };
}