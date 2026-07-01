import { PerformanceDashboard } from '@/components/monitoring/PerformanceDashboard';
import { PerformanceAlerts } from '@/components/monitoring/PerformanceAlerts';

export default function PerformancePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PerformanceAlerts />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Performance Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Monitor Core Web Vitals, API performance, and user interactions across the platform.
        </p>
      </div>
      
      <PerformanceDashboard />
    </div>
  );
}