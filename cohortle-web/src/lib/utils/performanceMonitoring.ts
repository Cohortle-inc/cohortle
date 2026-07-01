/**
 * Performance Monitoring Utilities
 * Tracks Core Web Vitals, page load times, and user interactions
 */

// Performance metrics interface
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

// Core Web Vitals thresholds
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  FID: { good: 100, poor: 300 },   // First Input Delay
  CLS: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte
};

// Performance monitoring class
class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private pageLoadMetrics: PageLoadMetric[] = [];
  private apiMetrics: APIMetric[] = [];
  private userInteractionMetrics: UserInteractionMetric[] = [];
  private isEnabled: boolean = true;
  private batchSize: number = 10;
  private flushInterval: number = 30000; // 30 seconds
  private flushTimer?: NodeJS.Timeout;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeMonitoring();
    }
  }

  private initializeMonitoring() {
    // Initialize Core Web Vitals monitoring
    this.initializeCoreWebVitals();
    
    // Initialize page load monitoring
    this.initializePageLoadMonitoring();
    
    // Initialize API monitoring
    this.initializeAPIMonitoring();
    
    // Initialize user interaction monitoring
    this.initializeUserInteractionMonitoring();
    
    // Start periodic flushing
    this.startPeriodicFlush();
    
    // Flush on page unload
    window.addEventListener('beforeunload', () => this.flush());
  }

  private initializeCoreWebVitals() {
    // Use web-vitals library if available, otherwise use Performance Observer
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint (LCP)
      this.observeMetric('largest-contentful-paint', (entry: any) => {
        this.recordMetric('LCP', entry.startTime, this.getRating('LCP', entry.startTime));
      });

      // First Input Delay (FID)
      this.observeMetric('first-input', (entry: any) => {
        const fid = entry.processingStart - entry.startTime;
        this.recordMetric('FID', fid, this.getRating('FID', fid));
      });

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      this.observeMetric('layout-shift', (entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          this.recordMetric('CLS', clsValue, this.getRating('CLS', clsValue));
        }
      });

      // First Contentful Paint (FCP)
      this.observeMetric('paint', (entry: any) => {
        if (entry.name === 'first-contentful-paint') {
          this.recordMetric('FCP', entry.startTime, this.getRating('FCP', entry.startTime));
        }
      });
    }
  }

  private observeMetric(type: string, callback: (entry: any) => void) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          callback(entry);
        }
      });
      observer.observe({ type, buffered: true });
    } catch (error) {
      console.warn(`Failed to observe ${type}:`, error);
    }
  }

  private initializePageLoadMonitoring() {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          const pageLoadMetric: PageLoadMetric = {
            url: window.location.href,
            loadTime: navigation.loadEventEnd - navigation.fetchStart,
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
            timestamp: Date.now(),
          };

          // Add paint metrics if available
          const paintEntries = performance.getEntriesByType('paint');
          paintEntries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              pageLoadMetric.firstContentfulPaint = entry.startTime;
            }
          });

          this.pageLoadMetrics.push(pageLoadMetric);
        }
      }, 0);
    });
  }

  private initializeAPIMonitoring() {
    // Monitor fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
      const method = args[1]?.method || 'GET';
      
      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - startTime;
        
        this.recordAPIMetric({
          endpoint: this.sanitizeURL(url),
          method,
          duration,
          status: response.status,
          timestamp: Date.now(),
          cached: response.headers.get('x-cache') === 'HIT' || 
                  response.headers.get('cf-cache-status') === 'HIT',
        });
        
        return response;
      } catch (error) {
        const duration = performance.now() - startTime;
        this.recordAPIMetric({
          endpoint: this.sanitizeURL(url),
          method,
          duration,
          status: 0,
          timestamp: Date.now(),
          cached: false,
        });
        throw error;
      }
    };
  }

  private initializeUserInteractionMonitoring() {
    // Monitor click interactions
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const element = this.getElementSelector(target);
      
      this.recordUserInteraction({
        action: 'click',
        element,
        timestamp: Date.now(),
        url: window.location.href,
      });
    });

    // Monitor form submissions
    document.addEventListener('submit', (event) => {
      const target = event.target as HTMLFormElement;
      const element = this.getElementSelector(target);
      
      this.recordUserInteraction({
        action: 'form_submit',
        element,
        timestamp: Date.now(),
        url: window.location.href,
      });
    });

    // Monitor navigation timing
    let navigationStartTime = performance.now();
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      const duration = performance.now() - navigationStartTime;
      performanceMonitor.recordUserInteraction({
        action: 'navigation',
        element: 'pushState',
        duration,
        timestamp: Date.now(),
        url: args[2] != null ? String(args[2]) : window.location.href,
      });
      navigationStartTime = performance.now();
      return originalPushState.apply(this, args);
    };

    history.replaceState = function(...args) {
      const duration = performance.now() - navigationStartTime;
      performanceMonitor.recordUserInteraction({
        action: 'navigation',
        element: 'replaceState',
        duration,
        timestamp: Date.now(),
        url: args[2] != null ? String(args[2]) : window.location.href,
      });
      navigationStartTime = performance.now();
      return originalReplaceState.apply(this, args);
    };
  }

  private getRating(metric: keyof typeof THRESHOLDS, value: number): 'good' | 'needs-improvement' | 'poor' {
    const threshold = THRESHOLDS[metric];
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  private recordMetric(name: string, value: number, rating: 'good' | 'needs-improvement' | 'poor') {
    const metric: PerformanceMetric = {
      name,
      value,
      rating,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connectionType: this.getConnectionType(),
    };

    this.metrics.push(metric);
    
    // Also send to analytics if available
    if (window.gtag) {
      window.gtag('event', 'web_vitals', {
        metric_name: name,
        metric_value: Math.round(value),
        metric_rating: rating,
      });
    }

    // Auto-flush if batch is full
    if (this.metrics.length >= this.batchSize) {
      this.flush();
    }
  }

  private recordAPIMetric(metric: APIMetric) {
    this.apiMetrics.push(metric);
    
    // Track slow API calls
    if (metric.duration > 2000) {
      console.warn(`Slow API call detected: ${metric.endpoint} took ${metric.duration}ms`);
      
      if (window.gtag) {
        window.gtag('event', 'slow_api_call', {
          endpoint: metric.endpoint,
          duration: Math.round(metric.duration),
          status: metric.status,
        });
      }
    }
  }

  private recordUserInteraction(metric: UserInteractionMetric) {
    this.userInteractionMetrics.push(metric);
  }

  private getConnectionType(): string {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    return connection?.effectiveType || 'unknown';
  }

  private sanitizeURL(url: string): string {
    try {
      const urlObj = new URL(url, window.location.origin);
      // Remove query parameters and hash for privacy
      return urlObj.pathname;
    } catch {
      return url;
    }
  }

  private getElementSelector(element: HTMLElement): string {
    // Create a simple selector for the element
    const tag = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : '';
    const className = element.className ? `.${element.className.split(' ').join('.')}` : '';
    const text = element.textContent?.slice(0, 20) || '';
    
    return `${tag}${id}${className}${text ? `[${text}]` : ''}`;
  }

  private startPeriodicFlush() {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  private async flush() {
    if (!this.isEnabled || (
      this.metrics.length === 0 && 
      this.pageLoadMetrics.length === 0 && 
      this.apiMetrics.length === 0 && 
      this.userInteractionMetrics.length === 0
    )) {
      return;
    }

    const payload = {
      metrics: [...this.metrics],
      pageLoadMetrics: [...this.pageLoadMetrics],
      apiMetrics: [...this.apiMetrics],
      userInteractionMetrics: [...this.userInteractionMetrics],
      timestamp: Date.now(),
      sessionId: this.getSessionId(),
      userId: this.getUserId(),
    };

    // Clear the arrays
    this.metrics.length = 0;
    this.pageLoadMetrics.length = 0;
    this.apiMetrics.length = 0;
    this.userInteractionMetrics.length = 0;

    try {
      // Send to your analytics endpoint
      await fetch('/api/analytics/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.warn('Failed to send performance metrics:', error);
      // Could implement retry logic or local storage fallback here
    }
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('performance_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      sessionStorage.setItem('performance_session_id', sessionId);
    }
    return sessionId;
  }

  private getUserId(): string | null {
    // Try to get user ID from your auth system
    try {
      const authData = localStorage.getItem('auth_user');
      if (authData) {
        const user = JSON.parse(authData);
        return user.id || null;
      }
    } catch {
      // Ignore errors
    }
    return null;
  }

  // Public methods
  public trackCustomMetric(name: string, value: number, unit: string = 'ms') {
    if (window.gtag) {
      window.gtag('event', 'custom_metric', {
        metric_name: name,
        metric_value: value,
        metric_unit: unit,
      });
    }
  }

  public trackPageView(url?: string) {
    const pageUrl = url || window.location.href;
    
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_location: pageUrl,
        page_title: document.title,
      });
    }
  }

  public trackError(error: Error, context?: string) {
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: false,
        context: context || 'unknown',
      });
    }
  }

  public disable() {
    this.isEnabled = false;
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
  }

  public enable() {
    this.isEnabled = true;
    this.startPeriodicFlush();
  }

  // Get current performance summary
  public getPerformanceSummary() {
    return {
      coreWebVitals: this.metrics.filter(m => ['LCP', 'FID', 'CLS', 'FCP'].includes(m.name)),
      averagePageLoadTime: this.pageLoadMetrics.length > 0 
        ? this.pageLoadMetrics.reduce((sum, m) => sum + m.loadTime, 0) / this.pageLoadMetrics.length 
        : 0,
      slowAPICallsCount: this.apiMetrics.filter(m => m.duration > 2000).length,
      totalInteractions: this.userInteractionMetrics.length,
    };
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export utility functions
export function trackCustomMetric(name: string, value: number, unit: string = 'ms') {
  performanceMonitor.trackCustomMetric(name, value, unit);
}

export function trackPageView(url?: string) {
  performanceMonitor.trackPageView(url);
}

export function trackError(error: Error, context?: string) {
  performanceMonitor.trackError(error, context);
}

export function getPerformanceSummary() {
  return performanceMonitor.getPerformanceSummary();
}

// React hook for performance monitoring
export function usePerformanceMonitoring() {
  return {
    trackCustomMetric,
    trackPageView,
    trackError,
    getPerformanceSummary,
  };
}