/**
 * Optimistic Update Hook
 * Provides utilities for implementing optimistic UI updates with automatic rollback on failure
 */

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface OptimisticUpdateOptions<TData, TVariables> {
  queryKey: string[];
  mutationFn: (variables: TVariables) => Promise<TData>;
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables, previousData: TData | undefined) => void;
  updateCache?: (oldData: TData | undefined, variables: TVariables) => TData;
}

interface OptimisticUpdateResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for optimistic updates with automatic rollback
 * 
 * @example
 * const { mutate, isLoading } = useOptimisticUpdate({
 *   queryKey: ['lesson-completion', lessonId],
 *   mutationFn: (completed) => markLessonComplete(lessonId, completed),
 *   updateCache: (oldData, completed) => ({ ...oldData, completed }),
 * });
 */
export function useOptimisticUpdate<TData = any, TVariables = any>({
  queryKey,
  mutationFn,
  onSuccess,
  onError,
  updateCache,
}: OptimisticUpdateOptions<TData, TVariables>): OptimisticUpdateResult<TData, TVariables> {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: TVariables) => {
      setIsLoading(true);
      setError(null);

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<TData>(queryKey);

      try {
        // Optimistically update the cache
        if (updateCache && previousData !== undefined) {
          const optimisticData = updateCache(previousData, variables);
          queryClient.setQueryData(queryKey, optimisticData);
        }

        // Perform the actual mutation
        const result = await mutationFn(variables);

        // Update cache with server response
        queryClient.setQueryData(queryKey, result);

        // Call success callback
        onSuccess?.(result, variables);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        
        // Rollback to previous data on error
        if (previousData !== undefined) {
          queryClient.setQueryData(queryKey, previousData);
        }

        setError(error);
        onError?.(error, variables, previousData);
      } finally {
        setIsLoading(false);
      }
    },
    [queryKey, mutationFn, onSuccess, onError, updateCache, queryClient]
  );

  return { mutate, isLoading, error };
}

/**
 * Hook for optimistic list updates (add/remove items)
 */
export function useOptimisticListUpdate<TItem, TVariables = any>({
  queryKey,
  mutationFn,
  onSuccess,
  onError,
  addItem,
  removeItem,
  updateItem,
}: {
  queryKey: string[];
  mutationFn: (variables: TVariables) => Promise<TItem[]>;
  onSuccess?: (data: TItem[], variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables, previousData: TItem[] | undefined) => void;
  addItem?: (oldList: TItem[] | undefined, variables: TVariables) => TItem[];
  removeItem?: (oldList: TItem[] | undefined, variables: TVariables) => TItem[];
  updateItem?: (oldList: TItem[] | undefined, variables: TVariables) => TItem[];
}) {
  return useOptimisticUpdate<TItem[], TVariables>({
    queryKey,
    mutationFn,
    onSuccess,
    onError,
    updateCache: (oldData, variables) => {
      if (addItem) return addItem(oldData, variables);
      if (removeItem) return removeItem(oldData, variables);
      if (updateItem) return updateItem(oldData, variables);
      return oldData || [];
    },
  });
}

/**
 * Hook for optimistic counter updates (likes, counts, etc.)
 */
export function useOptimisticCounter({
  queryKey,
  mutationFn,
  increment = true,
  onSuccess,
  onError,
}: {
  queryKey: string[];
  mutationFn: () => Promise<number>;
  increment?: boolean;
  onSuccess?: (data: number) => void;
  onError?: (error: Error, previousData: number | undefined) => void;
}) {
  return useOptimisticUpdate<number, void>({
    queryKey,
    mutationFn,
    onSuccess: (data) => onSuccess?.(data),
    onError: (error, _, previousData) => onError?.(error, previousData),
    updateCache: (oldData) => {
      const current = oldData || 0;
      return increment ? current + 1 : Math.max(0, current - 1);
    },
  });
}

/**
 * Hook for optimistic boolean toggle (completion, like, etc.)
 */
export function useOptimisticToggle({
  queryKey,
  mutationFn,
  onSuccess,
  onError,
}: {
  queryKey: string[];
  mutationFn: (newValue: boolean) => Promise<boolean>;
  onSuccess?: (data: boolean, newValue: boolean) => void;
  onError?: (error: Error, newValue: boolean, previousData: boolean | undefined) => void;
}) {
  return useOptimisticUpdate<boolean, boolean>({
    queryKey,
    mutationFn,
    onSuccess,
    onError,
    updateCache: (oldData, newValue) => newValue,
  });
}
