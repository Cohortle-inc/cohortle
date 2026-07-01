/**
 * Unit tests for useLessonCompletion hooks
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLessonCompletion, useMarkLessonComplete } from '@/lib/hooks/useLessonCompletion';
import * as lessonsApi from '@/lib/api/lessons';
import { LessonCompletion } from '@/types/lesson';

// Mock the lessons API
jest.mock('@/lib/api/lessons');

// Helper to create a wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useLessonCompletion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch lesson completion status successfully', async () => {
    const mockCompletion: LessonCompletion = {
      lesson_id: 1,
      cohort_id: 1,
      user_id: 1,
      completed: true,
      completed_at: '2024-01-01T00:00:00Z',
    };

    (lessonsApi.fetchLessonCompletion as jest.Mock).mockResolvedValue(mockCompletion);

    const { result } = renderHook(() => useLessonCompletion('1', '1'), {
      wrapper: createWrapper(),
    });

    // Wait for the query to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Check the data
    expect(result.current.data).toEqual(mockCompletion);
    expect(lessonsApi.fetchLessonCompletion).toHaveBeenCalledWith('1', '1');
  });

  it('should handle errors when fetching completion status', async () => {
    const mockError = new Error('Failed to fetch completion');
    (lessonsApi.fetchLessonCompletion as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useLessonCompletion('1', '1'), {
      wrapper: createWrapper(),
    });

    // Wait for the query to complete
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Check the error
    expect(result.current.error).toEqual(mockError);
  });

  it('should not fetch when lessonId or cohortId is empty', () => {
    const { result } = renderHook(() => useLessonCompletion('', '1'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(false);
    expect(lessonsApi.fetchLessonCompletion).not.toHaveBeenCalled();
  });
});

describe('useMarkLessonComplete', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should mark lesson as complete successfully', async () => {
    (lessonsApi.markLessonComplete as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useMarkLessonComplete(), {
      wrapper: createWrapper(),
    });

    // Trigger the mutation
    act(() => {
      result.current.mutate({ lessonId: '1', cohortId: '1' });
    });

    // Wait for the mutation to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Check the API was called
    expect(lessonsApi.markLessonComplete).toHaveBeenCalledWith('1', '1');
  });

  it('should handle errors when marking complete', async () => {
    const mockError = new Error('Failed to mark complete');
    (lessonsApi.markLessonComplete as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useMarkLessonComplete(), {
      wrapper: createWrapper(),
    });

    // Trigger the mutation
    act(() => {
      result.current.mutate({ lessonId: '1', cohortId: '1' });
    });

    // Wait for the mutation to complete
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Check the error
    expect(result.current.error).toEqual(mockError);
  });

  it('should invalidate completion query on success', async () => {
    const mockCompletion: LessonCompletion = {
      lesson_id: 1,
      cohort_id: 1,
      user_id: 1,
      completed: false,
    };

    (lessonsApi.fetchLessonCompletion as jest.Mock).mockResolvedValue(mockCompletion);
    (lessonsApi.markLessonComplete as jest.Mock).mockResolvedValue(undefined);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    // First, fetch the completion status
    const { result: completionResult } = renderHook(
      () => useLessonCompletion('1', '1'),
      { wrapper }
    );

    await waitFor(() => expect(completionResult.current.isSuccess).toBe(true));
    expect(lessonsApi.fetchLessonCompletion).toHaveBeenCalledTimes(1);

    // Now mark as complete
    const { result: mutationResult } = renderHook(
      () => useMarkLessonComplete(),
      { wrapper }
    );

    act(() => {
      mutationResult.current.mutate({ lessonId: '1', cohortId: '1' });
    });

    await waitFor(() => expect(mutationResult.current.isSuccess).toBe(true));

    // The completion query should be invalidated and refetch
    await waitFor(() => expect(lessonsApi.fetchLessonCompletion).toHaveBeenCalledTimes(2));
  });
});
