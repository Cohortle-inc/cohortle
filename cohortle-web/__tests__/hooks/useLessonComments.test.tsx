/**
 * Unit tests for useLessonComments hooks
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLessonComments, usePostComment } from '@/lib/hooks/useLessonComments';
import * as commentsApi from '@/lib/api/comments';
import { LessonComment } from '@/types/lesson';

// Mock the comments API
jest.mock('@/lib/api/comments');

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

describe('useLessonComments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch lesson comments successfully', async () => {
    const mockComments: LessonComment[] = [
      {
        id: 1,
        lesson_id: 1,
        cohort_id: 1,
        user_id: 1,
        author_name: 'John Doe',
        content: 'Great lesson!',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 2,
        lesson_id: 1,
        cohort_id: 1,
        user_id: 2,
        author_name: 'Jane Smith',
        content: 'Very helpful',
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      },
    ];

    (commentsApi.fetchLessonComments as jest.Mock).mockResolvedValue(mockComments);

    const { result } = renderHook(() => useLessonComments('1', '1'), {
      wrapper: createWrapper(),
    });

    // Wait for the query to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Check the data
    expect(result.current.data).toEqual(mockComments);
    expect(commentsApi.fetchLessonComments).toHaveBeenCalledWith('1', '1');
  });

  it('should handle errors when fetching comments', async () => {
    const mockError = new Error('Failed to fetch comments');
    (commentsApi.fetchLessonComments as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useLessonComments('1', '1'), {
      wrapper: createWrapper(),
    });

    // Wait for the query to complete
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Check the error
    expect(result.current.error).toEqual(mockError);
  });

  it('should not fetch when lessonId or cohortId is empty', () => {
    const { result } = renderHook(() => useLessonComments('', '1'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(false);
    expect(commentsApi.fetchLessonComments).not.toHaveBeenCalled();
  });

  it('should return empty array when no comments exist', async () => {
    (commentsApi.fetchLessonComments as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useLessonComments('1', '1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
  });
});

describe('usePostComment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should post a comment successfully', async () => {
    const mockComment: LessonComment = {
      id: 3,
      lesson_id: 1,
      cohort_id: 1,
      user_id: 1,
      author_name: 'John Doe',
      content: 'New comment',
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-03T00:00:00Z',
    };

    (commentsApi.postLessonComment as jest.Mock).mockResolvedValue(mockComment);

    const { result } = renderHook(() => usePostComment(), {
      wrapper: createWrapper(),
    });

    // Trigger the mutation
    act(() => {
      result.current.mutate({
        lessonId: '1',
        cohortId: '1',
        content: 'New comment',
      });
    });

    // Wait for the mutation to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Check the API was called
    expect(commentsApi.postLessonComment).toHaveBeenCalledWith('1', '1', 'New comment');
    expect(result.current.data).toEqual(mockComment);
  });

  it('should handle errors when posting comment', async () => {
    const mockError = new Error('Failed to post comment');
    (commentsApi.postLessonComment as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => usePostComment(), {
      wrapper: createWrapper(),
    });

    // Trigger the mutation
    act(() => {
      result.current.mutate({
        lessonId: '1',
        cohortId: '1',
        content: 'New comment',
      });
    });

    // Wait for the mutation to complete
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Check the error
    expect(result.current.error).toEqual(mockError);
  });

  it('should invalidate comments query on success', async () => {
    const mockComments: LessonComment[] = [
      {
        id: 1,
        lesson_id: 1,
        cohort_id: 1,
        user_id: 1,
        author_name: 'John Doe',
        content: 'First comment',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    const newComment: LessonComment = {
      id: 2,
      lesson_id: 1,
      cohort_id: 1,
      user_id: 1,
      author_name: 'John Doe',
      content: 'Second comment',
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    };

    (commentsApi.fetchLessonComments as jest.Mock).mockResolvedValue(mockComments);
    (commentsApi.postLessonComment as jest.Mock).mockResolvedValue(newComment);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    // First, fetch the comments
    const { result: commentsResult } = renderHook(
      () => useLessonComments('1', '1'),
      { wrapper }
    );

    await waitFor(() => expect(commentsResult.current.isSuccess).toBe(true));
    expect(commentsApi.fetchLessonComments).toHaveBeenCalledTimes(1);

    // Now post a new comment
    const { result: mutationResult } = renderHook(
      () => usePostComment(),
      { wrapper }
    );

    act(() => {
      mutationResult.current.mutate({
        lessonId: '1',
        cohortId: '1',
        content: 'Second comment',
      });
    });

    await waitFor(() => expect(mutationResult.current.isSuccess).toBe(true));

    // The comments query should be invalidated and refetch
    await waitFor(() => expect(commentsApi.fetchLessonComments).toHaveBeenCalledTimes(2));
  });
});
