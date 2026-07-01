/**
 * Unit tests for useLessonData hook
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLessonData } from '@/lib/hooks/useLessonData';
import * as lessonsApi from '@/lib/api/lessons';
import { Lesson } from '@/types/lesson';

// Mock the lessons API
jest.mock('@/lib/api/lessons');

// Helper to create a wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries for tests
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useLessonData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch lesson data successfully', async () => {
    const mockLesson: Lesson = {
      id: 1,
      name: 'Test Lesson',
      description: 'Test Description',
      text: '<p>Test content</p>',
      module_id: 1,
      order_number: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    (lessonsApi.fetchLesson as jest.Mock).mockResolvedValue(mockLesson);

    const { result } = renderHook(() => useLessonData('1'), {
      wrapper: createWrapper(),
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for the query to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Check the data
    expect(result.current.data).toEqual(mockLesson);
    expect(lessonsApi.fetchLesson).toHaveBeenCalledWith('1');
  });

  it('should handle errors when fetching lesson data', async () => {
    const mockError = new Error('Failed to fetch lesson');
    (lessonsApi.fetchLesson as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useLessonData('1'), {
      wrapper: createWrapper(),
    });

    // Wait for the query to complete
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Check the error
    expect(result.current.error).toEqual(mockError);
  });

  it('should not fetch when lessonId is empty', () => {
    const { result } = renderHook(() => useLessonData(''), {
      wrapper: createWrapper(),
    });

    // Should not be loading or fetching
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(false);
    expect(lessonsApi.fetchLesson).not.toHaveBeenCalled();
  });

  it('should cache lesson data with 5 minute staleTime', async () => {
    const mockLesson: Lesson = {
      id: 1,
      name: 'Test Lesson',
      description: 'Test Description',
      text: '<p>Test content</p>',
      module_id: 1,
      order_number: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    (lessonsApi.fetchLesson as jest.Mock).mockResolvedValue(mockLesson);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result, rerender } = renderHook(() => useLessonData('1'), { wrapper });

    // Wait for initial fetch
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(lessonsApi.fetchLesson).toHaveBeenCalledTimes(1);

    // Rerender should use cached data (not refetch)
    rerender();
    expect(lessonsApi.fetchLesson).toHaveBeenCalledTimes(1);
  });
});
