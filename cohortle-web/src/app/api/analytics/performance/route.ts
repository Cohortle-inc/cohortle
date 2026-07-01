import { NextRequest, NextResponse } from 'next/server';

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  url: string;
  userAgent: string;
  connectionType?: string;
}

interface PageLoadMetric {
  url: string;
  loadTime: number;
  domContentLoaded: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  firstInputDelay?: number;
  cumulativeLayoutShift?: number;
  timestamp: number;
}

interface APIMetric {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  timestamp: number;
  cached: boolean;
}

interface UserInteractionMetric {
  action: string;
  element: string;
  duration?: number;
  timestamp: number;
  url: string;
}

interface PerformancePayload {
  metrics: PerformanceMetric[];
  pageLoadMetrics: PageLoadMetric[];
  apiMetrics: APIMetric[];
  userInteractionMetrics: UserInteractionMetric[];
  timestamp: number;
  sessionId: string;
  userId?: string | null;
}

// In-memory storage for demo purposes
// In production, you'd want to use a proper database or analytics service
const performanceData: PerformancePayload[] = [];

export async function POST(request: NextRequest) {
  try {
    const payload: PerformancePayload = await request.json();
    
    // Validate payload
    if (!payload || typeof payload !== 'object') {
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      );
    }

    // Store the performance data
    performanceData.push({
      ...payload,
      timestamp: Date.now(), // Server timestamp
    });

    // Log performance issues for monitoring
    logPerformanceIssues(payload);

    // In production, you might want to:
    // 1. Send to analytics service (Google Analytics, Mixpanel, etc.)
    // 2. Store in database for analysis
    // 3. Trigger alerts for performance degradation
    // 4. Send to APM service (New Relic, DataDog, etc.)

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing performance metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    const userId = url.searchParams.get('userId');
    const limit = parseInt(url.searchParams.get('limit') || '100');

    let filteredData = performanceData;

    // Filter by session ID if provided
    if (sessionId) {
      filteredData = filteredData.filter(d => d.sessionId === sessionId);
    }

    // Filter by user ID if provided
    if (userId) {
      filteredData = filteredData.filter(d => d.userId === userId);
    }

    // Limit results
    const limitedData = filteredData.slice(-limit);

    // Calculate summary statistics
    const summary = calculatePerformanceSummary(limitedData);

    return NextResponse.json({
      data: limitedData,
      summary,
      total: filteredData.length,
    });
  } catch (error) {
    console.error('Error retrieving performance metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function logPerformanceIssues(payload: PerformancePayload) {
  // Log Core Web Vitals issues
  payload.metrics.forEach(metric => {
    if (metric.rating === 'poor') {
      console.warn(`Poor ${metric.name}: ${metric.value}ms on ${metric.url}`);
    }
  });

  // Log slow page loads
  payload.pageLoadMetrics.forEach(metric => {
    if (metric.loadTime > 3000) {
      console.warn(`Slow page load: ${metric.url} took ${metric.loadTime}ms`);
    }
  });

  // Log slow API calls
  payload.apiMetrics.forEach(metric => {
    if (metric.duration > 2000) {
      console.warn(`Slow API call: ${metric.method} ${metric.endpoint} took ${metric.duration}ms`);
    }
  });
}

function calculatePerformanceSummary(data: PerformancePayload[]) {
  if (data.length === 0) {
    return {
      totalSessions: 0,
      averagePageLoadTime: 0,
      coreWebVitals: {},
      slowAPICallsCount: 0,
      totalInteractions: 0,
    };
  }

  const allMetrics = data.flatMap(d => d.metrics);
  const allPageLoadMetrics = data.flatMap(d => d.pageLoadMetrics);
  const allAPIMetrics = data.flatMap(d => d.apiMetrics);
  const allInteractionMetrics = data.flatMap(d => d.userInteractionMetrics);

  // Calculate Core Web Vitals averages
  const coreWebVitals: Record<string, any> = {};
  ['LCP', 'FID', 'CLS', 'FCP'].forEach(metric => {
    const metricData = allMetrics.filter(m => m.name === metric);
    if (metricData.length > 0) {
      const average = metricData.reduce((sum, m) => sum + m.value, 0) / metricData.length;
      const ratings = metricData.reduce((acc, m) => {
        acc[m.rating] = (acc[m.rating] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      coreWebVitals[metric] = {
        average: Math.round(average),
        count: metricData.length,
        ratings,
      };
    }
  });

  // Calculate average page load time
  const averagePageLoadTime = allPageLoadMetrics.length > 0
    ? Math.round(allPageLoadMetrics.reduce((sum, m) => sum + m.loadTime, 0) / allPageLoadMetrics.length)
    : 0;

  // Count slow API calls
  const slowAPICallsCount = allAPIMetrics.filter(m => m.duration > 2000).length;

  return {
    totalSessions: new Set(data.map(d => d.sessionId)).size,
    averagePageLoadTime,
    coreWebVitals,
    slowAPICallsCount,
    totalInteractions: allInteractionMetrics.length,
    dataPoints: {
      metrics: allMetrics.length,
      pageLoads: allPageLoadMetrics.length,
      apiCalls: allAPIMetrics.length,
      interactions: allInteractionMetrics.length,
    },
  };
}