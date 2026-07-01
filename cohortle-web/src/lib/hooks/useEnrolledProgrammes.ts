/**
 * Hook for fetching enrolled programmes
 * Enhanced with better error handling, retry logic, and performance optimizations
 * Requirements: 6.2, 6.3, 4.1, 4.2, 4.3
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getEnrolledProgrammes, EnrolledProgramme } from '@/lib/api/programmes';
import { useAuth } from '@/lib/contexts/AuthContext';

interface UseEnrolledProgrammesResult {
  data: EnrolledProgramme[] | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  retryCount: number;
}

interface UseEnrolledProgrammesOptions {
  enabled?: boolean;
  retryOnError?: boolean;
  maxRetries?: number;
  cacheTime?: number;
  staleTime?: number;
}

// Cache for storing programme data
const programmeCache = new Map<string, {
  data: EnrolledProgramme[];
  timestamp: number;
  userId: string;
}>();

// Get cache key for user
function getCacheKey(userId: string): string {
  return `enrolled_programmes_${userId}`;
}

// Check if cached data is still valid
function isCacheValid(cacheEntry: any, staleTime: number): boolean {
  return Date.now() - cacheEntry.timestamp < staleTime;
}

/**
 * Fetch enrolled programmes for the current user
 * @param options - Hook options including enabled flag and retry settings
 * @returns Enrolled programmes data with loading and error states
 */
export function useEnrolledProgrammes(options: UseEnrolledProgrammesOptions = {}): UseEnrolledProgrammesResult {
  const { 
    enabled = true, 
    retryOnError = true, 
    maxRetries = 3,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    staleTime = 2 * 60 * 1000, // 2 minutes
  } = options;
  
  const { user } = useAuth();
  const [data, setData] = useState<EnrolledProgramme[] | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get current user ID from auth context
  const getCurrentUserId = useCallback((): string | null => {
    return user?.id || null;
  }, [user?.id]);

  // Check cache for existing data
  const getCachedData = useCallback((userId: string): EnrolledProgramme[] | null => {
    const cacheKey = getCacheKey(userId);
    const cached = programmeCache.get(cacheKey);
    
    if (cached && isCacheValid(cached, staleTime)) {
      return cached.data;
    }
    
    return null;
  }, [staleTime]);

  // Store data in cache
  const setCachedData = useCallback((userId: string, programmes: EnrolledProgramme[]) => {
    const cacheKey = getCacheKey(userId);
    programmeCache.set(cacheKey, {
      data: programmes,
      timestamp: Date.now(),
      userId,
    });

    // Clean up old cache entries
    const now = Date.now();
    // Convert Map entries to array for iteration
    const entries = Array.from(programmeCache.entries());
    for (const [key, entry] of entries) {
      if (now - entry.timestamp > cacheTime) {
        programmeCache.delete(key);
      }
    }
  }, [cacheTime]);

  // Manual refetch function
  const refetch = useCallback(async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      setError(new Error('User not authenticated'));
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    try {
      setIsLoading(true);
      setError(null);
      setRetryCount(0);
      
      const programmes = await getEnrolledProgrammes();
      
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      
      setData(programmes);
      setCachedData(userId, programmes);
      
    } catch (err) {
      // Don't set error if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      
      const error = err instanceof Error ? err : new Error('Failed to fetch programmes');
      setError(error);
      
    } finally {
      setIsLoading(false);
    }
  }, [getCurrentUserId, setCachedData]);

  // Initial fetch
  useEffect(() => {
    let isMounted = true;
    
    async function doFetch() {
      if (!enabled) {
        if (isMounted) {
          setIsLoading(false);
          setData(null);
          setError(null);
        }
        return;
      }
      
      const userId = getCurrentUserId();
      if (!userId) {
        if (isMounted) {
          setError(new Error('User not authenticated'));
          setIsLoading(false);
        }
        return;
      }

      // Check cache first
      const cachedData = getCachedData(userId);
      if (cachedData) {
        if (isMounted) {
          setData(cachedData);
          setIsLoading(false);
          setError(null);
        }
        return;
      }
      
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create new abort controller
      abortControllerRef.current = new AbortController();
      
      try {
        if (isMounted) {
          setIsLoading(true);
          setError(null);
        }
        
        const programmes = await getEnrolledProgrammes();
        
        // Check if request was aborted or component unmounted
        if (abortControllerRef.current?.signal.aborted || !isMounted) {
          return;
        }
        
        setData(programmes);
        setCachedData(userId, programmes);
        setRetryCount(0); // Reset retry count on success
        
      } catch (err) {
        // Don't set error if request was aborted or component unmounted
        if (abortControllerRef.current?.signal.aborted || !isMounted) {
          return;
        }
        
        const error = err instanceof Error ? err : new Error('Failed to fetch programmes');
        setError(error);
        
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    
    doFetch();
    
    // Cleanup function
    return () => {
      isMounted = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [enabled, user?.id]); // Only depend on enabled and user ID

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    data,
    isLoading,
    error,
    refetch,
    retryCount,
  };
}
