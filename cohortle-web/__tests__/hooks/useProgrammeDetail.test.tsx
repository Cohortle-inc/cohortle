/**
 * Unit tests for useProgrammeDetail hook
 * Tests programme detail fetching, updating, publishing, and error handling
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProgrammeDetail } from '@/lib/hooks/useProgrammeDetail';
import * as convenerApi from '@/lib/api/convener';

// Mock the convener API
jest.mock('@/lib/api/convener');

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

describe('useProgrammeDetail', () => {
  const mockProgrammeDetail = {
    id: 1,
    name: 'Test Programme',
    description: 'Test Description',
    startDate: '2026-01-01',
    status: 'draft' as const,
    createdBy: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    cohorts: [
      {
        id: 1,
        programmeId: 1,
        name: 'Cohort 1',
        enrollmentCode: 'TEST-2026',
        startDate: '2026-01-01',
        status: 'active' as const,
        enrolledCount: 5,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ],
    weeks: [
      {
        id: 'week-1',
        programmeId: 1,
        weekNumber: 1,
        title: 'Week 1',
        startDate: '2026-01-01',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        lessons: [
          {
            id: 'lesson-1',
            weekId: 'week-1',
            title: 'Lesson 1',
            description: 'First lesson',
            contentType: 'video' as const,
            contentUrl: 'https://youtube.com/watch?v=test',
            orderIndex: 0,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch programme detail successfully', async () => {
    (convenerApi.getProgramme as jest.Mock).mockResolvedValue(mockProgrammeDetail);

    const { result } = renderHook(() => useProgrammeDetail('1'), {
      wrapper: createWrapper(),
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.programme).toBeNull();

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Check data is loaded
    expect(result.current.programme).toEqual(mockProgrammeDetail);
    expect(result.current.error).toBeNull();
    expect(convenerApi.getProgramme).toHaveBeenCalledWith('1');
  });

  it('should not fetch when programmeId is empty', async () => {
    const { result } = renderHook(() => useProgrammeDetail(''), {
      wrapper: createWrapper(),
    });

    // Should not be loading
    expect(result.current.isLoading).toBe(false);
    expect(result.current.programme).toBeNull();
    expect(convenerApi.getProgramme).not.toHaveBeenCalled();
  });

  it('should handle fetch error', async () => {
    const mockError = new Error('Failed to fetch programme');
    (convenerApi.getProgramme as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useProgrammeDetail('1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.programme).toBeNull();
    expect(result.current.error).toEqual(mockError);
  });

  it('should update programme successfully', async () => {
    const updatedProgramme = {
      ...mockProgrammeDetail,
      name: 'Updated Programme',
      description: 'Updated Description',
    };

    (convenerApi.getProgramme as jest.Mock)
      .mockResolvedValueOnce(mockProgrammeDetail)
      .mockResolvedValueOnce(updatedProgramme);
    (convenerApi.updateProgramme as jest.Mock).mockResolvedValue(updatedProgramme);

    const { result } = renderHook(() => useProgrammeDetail('1'), {
      wrapper: createWrapper(),
    });

    // Wait for initial data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.programme).toEqual(mockProgrammeDetail);

    // Update programme
    const updateData = {
      name: 'Updated Programme',
      description: 'Updated Description',
    };

    await result.current.updateProgramme(updateData);

    // Check that the programme is updated in the cache
    await waitFor(() => {
      expect(result.current.programme?.name).toBe('Updated Programme');
    });

    expect(result.current.programme).toEqual(updatedProgramme);
    expect(convenerApi.updateProgramme).toHaveBeenCalledWith('1', updateData);
  });

  it('should handle update programme error', async () => {
    (convenerApi.getProgramme as jest.Mock).mockResolvedValue(mockProgrammeDetail);
    
    const mockError = new Error('Failed to update programme');
    (convenerApi.updateProgramme as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useProgrammeDetail('1'), {
      wrapper: createWrapper(),
    });

    // Wait for initial data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Try to update programme
    const updateData = {
      name: 'Updated Programme',
    };

    await expect(result.current.updateProgramme(updateData)).rejects.toThrow(
      'Failed to update programme'
    );

    // Wait for error state to update
    await waitFor(() => {
      expect(result.current.updateError).toEqual(mockError);
    });

    // Original data should remain unchanged
    expect(result.current.programme).toEqual(mockProgrammeDetail);
  });

  it('should publish programme successfully', async () => {
    const publishedProgramme = {
      ...mockProgrammeDetail,
      status: 'published' as const,
    };

    // Clear any previous calls
    jest.clearAllMocks();

    // Track call order
    let callCount = 0;
    (convenerApi.getProgramme as jest.Mock).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(mockProgrammeDetail);
      }
      return Promise.resolve(publishedProgramme);
    });
    (convenerApi.publishProgramme as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useProgrammeDetail('1'), {
      wrapper: createWrapper(),
    });

    // Wait for initial data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.programme?.status).toBe('draft');

    // Publish programme
    await result.current.publishProgramme();

    // Wait for publishing to complete and data to update
    await waitFor(() => {
      expect(result.current.programme?.status).toBe('published');
    });

    expect(convenerApi.publishProgramme).toHaveBeenCalledWith('1');
    // getProgramme should be called at least twice (initial + after publish)
    expect(convenerApi.getProgramme).toHaveBeenCalledWith('1');
  });

  it('should handle publish programme error', async () => {
    (convenerApi.getProgramme as jest.Mock).mockResolvedValue(mockProgrammeDetail);
    
    const mockError = new Error('Failed to publish programme');
    (convenerApi.publishProgramme as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useProgrammeDetail('1'), {
      wrapper: createWrapper(),
    });

    // Wait for initial data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Try to publish programme
    await expect(result.current.publishProgramme()).rejects.toThrow(
      'Failed to publish programme'
    );

    // Wait for error state to update
    await waitFor(() => {
      expect(result.current.publishError).toEqual(mockError);
    });

    // Status should remain unchanged
    expect(result.current.programme?.status).toBe('draft');
  });

  it('should support refetch', async () => {
    const updatedProgramme = {
      ...mockProgrammeDetail,
      cohorts: [
        ...mockProgrammeDetail.cohorts,
        {
          id: 2,
          programmeId: 1,
          name: 'Cohort 2',
          enrollmentCode: 'TEST-2026-2',
          startDate: '2026-02-01',
          status: 'active' as const,
          enrolledCount: 3,
          createdAt: '2026-01-15T00:00:00Z',
          updatedAt: '2026-01-15T00:00:00Z',
        },
      ],
    };

    (convenerApi.getProgramme as jest.Mock)
      .mockResolvedValueOnce(mockProgrammeDetail)
      .mockResolvedValueOnce(updatedProgramme);

    const { result } = renderHook(() => useProgrammeDetail('1'), {
      wrapper: createWrapper(),
    });

    // Wait for initial data
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.programme?.cohorts).toHaveLength(1);

    // Refetch
    await result.current.refetch();

    // Check updated data
    await waitFor(() => {
      expect(result.current.programme?.cohorts).toHaveLength(2);
    });

    expect(result.current.programme).toEqual(updatedProgramme);
  });

  it('should include cohorts, weeks, and lessons in programme detail', async () => {
    (convenerApi.getProgramme as jest.Mock).mockResolvedValue(mockProgrammeDetail);

    const { result } = renderHook(() => useProgrammeDetail('1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const programme = result.current.programme;
    expect(programme).not.toBeNull();
    expect(programme?.cohorts).toHaveLength(1);
    expect(programme?.cohorts[0].name).toBe('Cohort 1');
    expect(programme?.weeks).toHaveLength(1);
    expect(programme?.weeks[0].title).toBe('Week 1');
    expect(programme?.weeks[0].lessons).toHaveLength(1);
    expect(programme?.weeks[0].lessons[0].title).toBe('Lesson 1');
  });
});
