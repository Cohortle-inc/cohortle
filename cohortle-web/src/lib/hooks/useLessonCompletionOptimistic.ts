/**
 * Optimistic Lesson Completion Hook
 * Provides instant UI feedback for lesson completion with automatic rollback on failure
 */

import { useQueryClient } from '@tanstack/react-query';
import { useOptimisticToggle } from './useOptimisticUpdate';
import { markLessonComplete } from '@/lib/api/lessons';
import { markLessonIncomplete } from '@/lib/api/progress';

interface UseLessonCompletionOptimisticOptions {
  lessonId: string;
  cohortId: string;
  onSuccess?: (completed: boolean) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for optimistic lesson completion updates
 * Updates UI immediately, then syncs with server
 * Automatically rolls back on failure
 * 
 * @example
 * const { toggleCompletion, isLoading } = useLessonCompletionOptimistic({
 *   lessonId: '123',
 *   cohortId: '456',
 *   onSuccess: () => toast.success('Lesson marked complete!'),
 *   onError: (error) => toast.error('Failed to update completion'),
 * });
 */
export function useLessonCompletionOptimistic({
  lessonId,
  cohortId,
  onSuccess,
  onError,
}: UseLessonCompletionOptimisticOptions) {
  const queryClient = useQueryClient();
  const completionQueryKey = ['lesson-completion', lessonId, cohortId];

  const { mutate: toggleCompletion, isLoading, error } = useOptimisticToggle({
    queryKey: completionQueryKey,
    mutationFn: async (newValue: boolean) => {
      if (newValue) {
        await markLessonComplete(lessonId, cohortId);
      } else {
        await markLessonIncomplete(lessonId, parseInt(cohortId, 10));
      }
      return newValue;
    },
    onSuccess: (completed) => {
      // Invalidate related queries to update progress indicators
      queryClient.invalidateQueries({ queryKey: ['module-lessons'] });
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['programme-progress'] });
      queryClient.invalidateQueries({ queryKey: ['module-progress'] });
      
      onSuccess?.(completed);
    },
    onError: (err) => {
      onError?.(err);
    },
  });

  return {
    toggleCompletion,
    isLoading,
    error,
  };
}

/**
 * Hook for marking lesson complete with optimistic update
 */
export function useMarkLessonCompleteOptimistic({
  lessonId,
  cohortId,
  onSuccess,
  onError,
}: Omit<UseLessonCompletionOptimisticOptions, 'onSuccess'> & {
  onSuccess?: () => void;
}) {
  const { toggleCompletion, isLoading, error } = useLessonCompletionOptimistic({
    lessonId,
    cohortId,
    onSuccess: (completed) => {
      if (completed) onSuccess?.();
    },
    onError,
  });

  const markComplete = () => toggleCompletion(true);

  return {
    markComplete,
    isLoading,
    error,
  };
}

/**
 * Hook for marking lesson incomplete with optimistic update
 */
export function useMarkLessonIncompleteOptimistic({
  lessonId,
  cohortId,
  onSuccess,
  onError,
}: Omit<UseLessonCompletionOptimisticOptions, 'onSuccess'> & {
  onSuccess?: () => void;
}) {
  const { toggleCompletion, isLoading, error } = useLessonCompletionOptimistic({
    lessonId,
    cohortId,
    onSuccess: (completed) => {
      if (!completed) onSuccess?.();
    },
    onError,
  });

  const markIncomplete = () => toggleCompletion(false);

  return {
    markIncomplete,
    isLoading,
    error,
  };
}
