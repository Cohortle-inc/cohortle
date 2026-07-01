/**
 * React Query hooks for lesson completion tracking
 * Provides hooks for fetching completion status and marking lessons complete
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchLessonCompletion, markLessonComplete } from '@/lib/api/lessons';
import { LessonCompletion } from '@/types/lesson';

/**
 * Hook to fetch lesson completion status
 * @param lessonId - The ID of the lesson
 * @param cohortId - The ID of the cohort
 * @returns React Query result with completion status, loading state, and error state
 */
export function useLessonCompletion(lessonId: string, cohortId: string) {
  return useQuery<LessonCompletion, Error>({
    queryKey: ['lesson-completion', lessonId, cohortId],
    queryFn: () => fetchLessonCompletion(lessonId, cohortId),
    staleTime: 1 * 60 * 1000, // 1 minute
    enabled: !!lessonId && !!cohortId, // Only run if both IDs are provided
  });
}

/**
 * Hook to mark a lesson as complete
 * Automatically invalidates the completion cache and module lessons cache on success
 * Also invalidates progress queries to update progress indicators
 * Includes automatic retry with exponential backoff for transient failures
 * @returns Mutation hook with mutate function and status
 */
export function useMarkLessonComplete() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { lessonId: string; cohortId: string }>({
    mutationFn: ({ lessonId, cohortId }) => markLessonComplete(lessonId, cohortId),
    retry: (failureCount, error) => {
      // Don't retry on client errors (4xx) except for 408 (timeout) and 429 (rate limit)
      if (error && 'response' in error) {
        const axiosError = error as any;
        const status = axiosError.response?.status;
        
        // Don't retry on authentication errors or bad requests
        if (status === 401 || status === 403 || status === 400 || status === 404) {
          return false;
        }
        
        // Retry on timeout, rate limit, and server errors
        if (status === 408 || status === 429 || (status >= 500 && status < 600)) {
          return failureCount < 3;
        }
      }
      
      // Retry on network errors (no response)
      if (error && 'code' in error) {
        const networkError = error as any;
        if (networkError.code === 'ECONNABORTED' || networkError.code === 'ERR_NETWORK') {
          return failureCount < 3;
        }
      }
      
      // Default: retry up to 3 times for unknown errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff: 1s, 2s, 4s
      return Math.min(1000 * Math.pow(2, attemptIndex), 10000);
    },
    onSuccess: (_, variables) => {
      // Invalidate the completion query to refetch the updated status
      queryClient.invalidateQueries({
        queryKey: ['lesson-completion', variables.lessonId, variables.cohortId],
      });
      
      // Invalidate module lessons queries to update completion status in module views
      // This ensures both the existing lesson viewer navigation and new dashboard module view
      // show updated completion status when user navigates back
      queryClient.invalidateQueries({
        queryKey: ['module-lessons'],
      });
      
      // Also invalidate the new dashboard module lessons query
      queryClient.invalidateQueries({
        queryKey: ['modules'],
      });
      
      // Invalidate progress queries to update progress indicators in real-time
      queryClient.invalidateQueries({
        queryKey: ['programme-progress'],
      });
      
      queryClient.invalidateQueries({
        queryKey: ['module-progress'],
      });
    },
  });
}
