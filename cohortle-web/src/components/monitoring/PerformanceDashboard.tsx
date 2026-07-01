'use client';

import { useState, useEffect } from 'react';
import { usePerformanceMonitoring } from '@/lib/utils/performanceMonitoring';

interface PerformanceData {
  data: any[];
  summary: {
    totalSessions: number;
    averagePageLoadTime: number;
    coreWebVitals: Record<string, any>;
    slowAPICallsCount: number;
    totalInteractions: number;
    dataPoints: {
      metrics: number;
      pageLoads: number;
      apiCalls: number;
      interactions: number;
    };
  };
  total: number;
}

export function PerformanceDashboard() {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getPerformanceSummary } = usePerformanceMonitoring();

  useEffect(() => {
    fetchPerformanceData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchPerformanceData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPerformanceData = async () => {
    try {
      const response = await fetch('/api/analytics/performance?limit=1000');
      if (!response.ok) {
        throw new Error('Failed to fetch performance data');
      }
      const data = await response.json();
      setPerformanceData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good': return 'text-green-600 bg-green-100';
      case 'needs-improvement': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getMetricStatus = (metric: string, value: number) => {
    const thresholds: Record<string, { good: number; poor: number }> = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      FCP: { good: 1800, poor: 3000 },
    };

    const threshold = thresholds[metric];
    if (!threshold) return 'unknown';
    
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="text-red-600">
          <h3 className="text-lg font-semibold mb-2">Error Loading Performance Data</h3>
          <p>{error}</p>
          <button
            onClick={fetchPerformanceData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!performanceData) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <p className="text-gray-600">No performance data available</p>
      </div>
    );
  }

  const { summary } = performanceData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Performance Dashboard</h2>
          <button
            onClick={fetchPerformanceData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
        <p className="text-gray-600 mt-2">
          Real-time performance monitoring and Core Web Vitals tracking
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Sessions</h3>
          <p className="text-3xl font-bold text-gray-900">{summary.totalSessions}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Avg Page Load</h3>
          <p className="text-3xl font-bold text-gray-900">
            {summary.averagePageLoadTime}
            <span className="text-sm font-normal text-gray-500 ml-1">ms</span>
          </p>
          <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium mt-2 ${
            getMetricStatus('LCP', summary.averagePageLoadTime) === 'good' 
              ? 'text-green-600 bg-green-100'
              : getMetricStatus('LCP', summary.averagePageLoadTime) === 'needs-improvement'
              ? 'text-yellow-600 bg-yellow-100'
              : 'text-red-600 bg-red-100'
          }`}>
            {getMetricStatus('LCP', summary.averagePageLoadTime)}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Slow API Calls</h3>
          <p className="text-3xl font-bold text-gray-900">{summary.slowAPICallsCount}</p>
          <p className="text-sm text-gray-500 mt-1">
            {summary.dataPoints.apiCalls} total calls
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">User Interactions</h3>
          <p className="text-3xl font-bold text-gray-900">{summary.totalInteractions}</p>
        </div>
      </div>

      {/* Core Web Vitals */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Core Web Vitals</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(summary.coreWebVitals).map(([metric, data]: [string, any]) => (
            <div key={metric} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{metric}</h4>
                <span className="text-sm text-gray-500">{data.count} samples</span>
              </div>
              
              <p className="text-2xl font-bold text-gray-900">
                {data.average}
                <span className="text-sm font-normal text-gray-500 ml-1">
                  {metric === 'CLS' ? '' : 'ms'}
                </span>
              </p>
              
              <div className="mt-3 space-y-1">
                {Object.entries(data.ratings).map(([rating, count]: [string, any]) => (
                  <div key={rating} className="flex items-center justify-between text-sm">
                    <span className={`px-2 py-1 rounded-full ${getRatingColor(rating)}`}>
                      {rating}
                    </span>
                    <span className="text-gray-600">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Points Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Collection Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{summary.dataPoints.metrics}</p>
            <p className="text-sm text-gray-500">Performance Metrics</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{summary.dataPoints.pageLoads}</p>
            <p className="text-sm text-gray-500">Page Loads</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{summary.dataPoints.apiCalls}</p>
            <p className="text-sm text-gray-500">API Calls</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">{summary.dataPoints.interactions}</p>
            <p className="text-sm text-gray-500">User Interactions</p>
          </div>
        </div>
      </div>

      {/* Performance Thresholds Reference */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Thresholds</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Core Web Vitals</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>LCP (Largest Contentful Paint)</span>
                <span className="text-gray-600">≤2.5s good, ≤4s needs improvement</span>
              </div>
              <div className="flex justify-between">
                <span>FID (First Input Delay)</span>
                <span className="text-gray-600">≤100ms good, ≤300ms needs improvement</span>
              </div>
              <div className="flex justify-between">
                <span>CLS (Cumulative Layout Shift)</span>
                <span className="text-gray-600">≤0.1 good, ≤0.25 needs improvement</span>
              </div>
              <div className="flex justify-between">
                <span>FCP (First Contentful Paint)</span>
                <span className="text-gray-600">≤1.8s good, ≤3s needs improvement</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Custom Thresholds</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Page Load Time</span>
                <span className="text-gray-600">≤2s good, ≤3s acceptable</span>
              </div>
              <div className="flex justify-between">
                <span>API Response Time</span>
                <span className="text-gray-600">≤1s good, ≤2s acceptable</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}