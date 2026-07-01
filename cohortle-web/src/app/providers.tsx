'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { AuthProvider } from '@/lib/contexts/AuthContext';
import { RoleProvider } from '@/lib/contexts/RoleContext';
import { WebSocketPrevention } from '@/components/WebSocketPrevention';
import { performanceMonitor } from '@/lib/utils/performanceMonitoring';

export function Providers({ children }: { children: React.ReactNode }) {
  // Create a new QueryClient instance for each request to avoid sharing state between users
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Default staleTime: data is considered fresh for 5 minutes
            staleTime: 5 * 60 * 1000,
            // Default cacheTime: unused data stays in cache for 10 minutes
            gcTime: 10 * 60 * 1000,
            // Retry failed requests once
            retry: 1,
            // Don't refetch on window focus by default (can be overridden per query)
            refetchOnWindowFocus: false,
          },
          mutations: {
            // Retry failed mutations once
            retry: 1,
          },
        },
      })
  );

  // Initialize performance monitoring
  useEffect(() => {
    // Performance monitoring is automatically initialized in the constructor
    // Track initial page view
    if (typeof window !== 'undefined') {
      performanceMonitor.trackPageView();
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RoleProvider>
          <WebSocketPrevention />
          {children}
        </RoleProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
