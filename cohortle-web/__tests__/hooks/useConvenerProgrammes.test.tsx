/**
 * Unit tests for useConvenerProgrammes hook
 * Tests programme fetching, creation, and error handling
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useConvenerProgrammes } from '@/lib/hooks/useConvenerProgrammes';
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

describe('useConvenerProgrammes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch programmes successfully', async () => {
    const mockProgrammes = [
      {
        id: 1,
        name: 'Test Programme 1',
        description: 'Description 1',
        startDate: '2026-01-01',
        status: 'draft' as const,
        createdBy: 1,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 2,
        name: 'Test Programme 2',
        description: 'Description 2',
        startDate: '2026-02-01',
        status: 'published' as const,
        createdBy: 1,
        createdAt: '2026-01-15T00:00:00Z',
        updatedAt: '2026-01-15T00:00:00Z',
      },
    ];

    (convenerApi.getMyProgrammes as jest.Mock).mockResolvedValue(mockProgrammes);

    const { result } = renderHook(() => useConvenerProgrammes(), {
      wrapper: createWrapper(),
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.programmes).toEqual([]);

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Check data is loaded
    expect(result.current.programmes).toEqual(mockProgrammes);
    expect(result.current.error).toBeNull();
  });

  it('should handle empty programmes list', async () => {
    (convenerApi.getMyProgrammes as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useConvenerProgrammes(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.programmes).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch error', async () => {
    const mockError = new Error('Failed to fetch programmes');
    (convenerApi.getMyProgrammes as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useConvenerProgrammes(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.programmes).toEqual([]);
    expect(result.current.error).toEqual(mockError);
  });

  it('should create programme successfully', async () => {
    const existingProgrammes = [
      {
        id: 1,
        name: 'Existing Programme',
        description: 'Description',
        startDate: '2026-01-01',
        status: 'draft' as const,
        createdBy: 1,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ];

    const newProgramme = {
      id: 2,
      name: 'New Programme',
      description: 'New Description',
      startDate: '2026-02-01',
      status: 'draft' as const,
      createdBy: 1,
      createdAt: '2026-01-15T00:00:00Z',
      updatedAt: '2026-01-15T00:00:00Z',
    };

    (convenerApi.getMyProgrammes as jest.Mock).mockResolvedValue(existingProgrammes);
    (convenerApi.createProgramme as jest.Mock).mockResolvedValue(newProgramme);

    const { result } = renderHook(() => useConvenerProgrammes(), {
      wrapper: createWrapper(),
    });

    // Wait for initial data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.programmes).toEqual(existingProgrammes);

    // Create new programme
    const programmeData = {
      name: 'New Programme',
      description: 'New Description',
      startDate: '2026-02-01',
    };

    await result.current.createProgramme(programmeData);

    // Check that the new programme is added to the cache
    await waitFor(() => {
      expect(result.current.programmes).toHaveLength(2);
    });

    expect(result.current.programmes).toContainEqual(newProgramme);
    expect(convenerApi.createProgramme).toHaveBeenCalledWith(programmeData, expect.anything());
  });

  it('should handle create programme error', async () => {
    (convenerApi.getMyProgrammes as jest.Mock).mockResolvedValue([]);
    
    const mockError = new Error('Failed to create programme');
    (convenerApi.createProgramme as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useConvenerProgrammes(), {
      wrapper: createWrapper(),
    });

    // Wait for initial data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Try to create programme
    const programmeData = {
      name: 'New Programme',
      description: 'New Description',
      startDate: '2026-02-01',
    };

    await expect(result.current.createProgramme(programmeData)).rejects.toThrow(
      'Failed to create programme'
    );

    // Wait for error state to update
    await waitFor(() => {
      expect(result.current.createError).toEqual(mockError);
    });
  });

  it('should support refetch', async () => {
    const initialProgrammes = [
      {
        id: 1,
        name: 'Programme 1',
        description: 'Description 1',
        startDate: '2026-01-01',
        status: 'draft' as const,
        createdBy: 1,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ];

    const updatedProgrammes = [
      ...initialProgrammes,
      {
        id: 2,
        name: 'Programme 2',
        description: 'Description 2',
        startDate: '2026-02-01',
        status: 'draft' as const,
        createdBy: 1,
        createdAt: '2026-01-15T00:00:00Z',
        updatedAt: '2026-01-15T00:00:00Z',
      },
    ];

    (convenerApi.getMyProgrammes as jest.Mock)
      .mockResolvedValueOnce(initialProgrammes)
      .mockResolvedValueOnce(updatedProgrammes);

    const { result } = renderHook(() => useConvenerProgrammes(), {
      wrapper: createWrapper(),
    });

    // Wait for initial data
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.programmes).toEqual(initialProgrammes);

    // Refetch
    await result.current.refetch();

    // Check updated data
    await waitFor(() => {
      expect(result.current.programmes).toEqual(updatedProgrammes);
    });
  });
});
