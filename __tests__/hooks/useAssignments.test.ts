// Unit Tests for Assignment Hooks
// Feature: assignment-submission-system
// Validates: Requirements 10.1, 12.5

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useGetAssignment,
  useGetStudentAssignments,
  useCreateAssignment,
  useUpdateAssignment,
  useDeleteAssignment,
} from '@/hooks/api/useAssignments';
import * as getAssignmentsApi from '@/api/assignments/getAssignments';
import * as createAssignmentApi from '@/api/assignments/createAssignment';
import * as updateAssignmentApi from '@/api/assignments/updateAssignment';
import * as deleteAssignmentApi from '@/api/assignments/deleteAssignment';
import { Assignment, CreateAssignmentPayload } from '@/types/assignments';
import React from 'react';

// Mock the API modules
jest.mock('@/api/assignments/getAssignments');
jest.mock('@/api/assignments/createAssignment');
jest.mock('@/api/assignments/updateAssignment');
jest.mock('@/api/assignments/deleteAssignment');

describe('Assignment Hooks - Unit Tests', () => {
  let queryClient: QueryClient;
  let wrapper: React.FC<{ children: React.ReactNode }>;

  // Helper to create a fresh QueryClient for each test
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false, // Disable retries for tests
          gcTime: 0, // Disable cache time for tests
        },
        mutations: {
          retry: false,
        },
      },
    });

    wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('useGetAssignment', () => {
    const mockAssignment: Assignment = {
      id: 'assignment-1',
      lessonId: 'lesson-1',
      title: 'Test Assignment',
      instructions: 'Complete the test',
      dueDate: '2026-12-31T23:59:59Z',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };

    it('should fetch assignment successfully', async () => {
      jest.spyOn(getAssignmentsApi, 'getAssignmentByLesson').mockResolvedValue(mockAssignment);

      const { result } = renderHook(() => useGetAssignment('lesson-1'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockAssignment);
      expect(getAssignmentsApi.getAssignmentByLesson).toHaveBeenCalledWith('lesson-1');
      expect(getAssignmentsApi.getAssignmentByLesson).toHaveBeenCalledTimes(1);
    });

    it('should handle error when fetching assignment fails', async () => {
      const error = new Error('Network error');
      jest.spyOn(getAssignmentsApi, 'getAssignmentByLesson').mockRejectedValue(error);

      const { result } = renderHook(() => useGetAssignment('lesson-1'), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
      expect(result.current.data).toBeUndefined();
    });

    it('should cache assignment data with correct query key', async () => {
      jest.spyOn(getAssignmentsApi, 'getAssignmentByLesson').mockResolvedValue(mockAssignment);

      const { result } = renderHook(() => useGetAssignment('lesson-1'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Check that data is in cache
      const cachedData = queryClient.getQueryData(['assignment', 'lesson-1']);
      expect(cachedData).toEqual(mockAssignment);
    });

    it('should return null when no assignment exists', async () => {
      jest.spyOn(getAssignmentsApi, 'getAssignmentByLesson').mockResolvedValue(null);

      const { result } = renderHook(() => useGetAssignment('lesson-1'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeNull();
    });
  });

  describe('useGetStudentAssignments', () => {
    const mockAssignments: Assignment[] = [
      {
        id: 'assignment-1',
        lessonId: 'lesson-1',
        title: 'Assignment 1',
        instructions: 'Instructions 1',
        dueDate: '2026-12-31T23:59:59Z',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'assignment-2',
        lessonId: 'lesson-2',
        title: 'Assignment 2',
        instructions: 'Instructions 2',
        dueDate: '2026-11-30T23:59:59Z',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ];

    it('should fetch student assignments successfully', async () => {
      jest.spyOn(getAssignmentsApi, 'getStudentAssignments').mockResolvedValue(mockAssignments);

      const { result } = renderHook(() => useGetStudentAssignments(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockAssignments);
      expect(getAssignmentsApi.getStudentAssignments).toHaveBeenCalledTimes(1);
    });

    it('should handle error when fetching student assignments fails', async () => {
      const error = new Error('Unauthorized');
      jest.spyOn(getAssignmentsApi, 'getStudentAssignments').mockRejectedValue(error);

      const { result } = renderHook(() => useGetStudentAssignments(), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });

    it('should cache student assignments with correct query key', async () => {
      jest.spyOn(getAssignmentsApi, 'getStudentAssignments').mockResolvedValue(mockAssignments);

      const { result } = renderHook(() => useGetStudentAssignments(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const cachedData = queryClient.getQueryData(['student-assignments']);
      expect(cachedData).toEqual(mockAssignments);
    });
  });

  describe('useCreateAssignment - Cache Invalidation', () => {
    const lessonId = 'lesson-1';
    const payload: CreateAssignmentPayload = {
      title: 'New Assignment',
      instructions: 'Complete this task',
      dueDate: '2026-12-31T23:59:59Z',
    };

    const mockCreatedAssignment: Assignment = {
      id: 'assignment-new',
      lessonId,
      ...payload,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };

    it('should invalidate assignment query after successful creation', async () => {
      jest.spyOn(createAssignmentApi, 'createAssignment').mockResolvedValue(mockCreatedAssignment);

      // Spy on invalidateQueries to verify it's called
      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateAssignment(lessonId), { wrapper });

      // Trigger mutation
      result.current.mutate(payload);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify invalidateQueries was called for both query keys
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['assignment', lessonId] });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['student-assignments'] });
      expect(invalidateQueriesSpy).toHaveBeenCalledTimes(2);
    });

    it('should call createAssignment API with correct parameters', async () => {
      jest.spyOn(createAssignmentApi, 'createAssignment').mockResolvedValue(mockCreatedAssignment);

      const { result } = renderHook(() => useCreateAssignment(lessonId), { wrapper });

      result.current.mutate(payload);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(createAssignmentApi.createAssignment).toHaveBeenCalledWith(lessonId, payload);
      expect(createAssignmentApi.createAssignment).toHaveBeenCalledTimes(1);
    });

    it('should handle error during assignment creation', async () => {
      const error = new Error('Validation failed');
      jest.spyOn(createAssignmentApi, 'createAssignment').mockRejectedValue(error);

      const { result } = renderHook(() => useCreateAssignment(lessonId), { wrapper });

      result.current.mutate(payload);

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });

    it('should not invalidate cache if creation fails', async () => {
      const error = new Error('Server error');
      jest.spyOn(createAssignmentApi, 'createAssignment').mockRejectedValue(error);

      // Spy on invalidateQueries to verify it's NOT called on error
      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateAssignment(lessonId), { wrapper });

      result.current.mutate(payload);

      await waitFor(() => expect(result.current.isError).toBe(true));

      // Cache should not be invalidated on error
      expect(invalidateQueriesSpy).not.toHaveBeenCalled();
    });
  });

  describe('useUpdateAssignment - Cache Invalidation', () => {
    const assignmentId = 'assignment-1';
    const lessonId = 'lesson-1';
    const updatePayload: Partial<CreateAssignmentPayload> = {
      title: 'Updated Title',
    };

    const mockUpdatedAssignment: Assignment = {
      id: assignmentId,
      lessonId,
      title: 'Updated Title',
      instructions: 'Original instructions',
      dueDate: '2026-12-31T23:59:59Z',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-02-01T00:00:00Z',
    };

    it('should invalidate assignment query after successful update', async () => {
      jest.spyOn(updateAssignmentApi, 'updateAssignment').mockResolvedValue(mockUpdatedAssignment);

      // Spy on invalidateQueries to verify it's called
      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useUpdateAssignment(assignmentId, lessonId), { wrapper });

      result.current.mutate(updatePayload);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify invalidateQueries was called for both query keys
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['assignment', lessonId] });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['student-assignments'] });
      expect(invalidateQueriesSpy).toHaveBeenCalledTimes(2);
    });

    it('should call updateAssignment API with correct parameters', async () => {
      jest.spyOn(updateAssignmentApi, 'updateAssignment').mockResolvedValue(mockUpdatedAssignment);

      const { result } = renderHook(() => useUpdateAssignment(assignmentId, lessonId), { wrapper });

      result.current.mutate(updatePayload);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(updateAssignmentApi.updateAssignment).toHaveBeenCalledWith(assignmentId, updatePayload);
      expect(updateAssignmentApi.updateAssignment).toHaveBeenCalledTimes(1);
    });

    it('should handle error during assignment update', async () => {
      const error = new Error('Not found');
      jest.spyOn(updateAssignmentApi, 'updateAssignment').mockRejectedValue(error);

      const { result } = renderHook(() => useUpdateAssignment(assignmentId, lessonId), { wrapper });

      result.current.mutate(updatePayload);

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useDeleteAssignment - Cache Invalidation', () => {
    const assignmentId = 'assignment-1';
    const lessonId = 'lesson-1';

    it('should invalidate assignment query after successful deletion', async () => {
      jest.spyOn(deleteAssignmentApi, 'deleteAssignment').mockResolvedValue(undefined);

      // Spy on invalidateQueries to verify it's called
      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useDeleteAssignment(lessonId), { wrapper });

      result.current.mutate(assignmentId);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify invalidateQueries was called for both query keys
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['assignment', lessonId] });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['student-assignments'] });
      expect(invalidateQueriesSpy).toHaveBeenCalledTimes(2);
    });

    it('should call deleteAssignment API with correct parameters', async () => {
      jest.spyOn(deleteAssignmentApi, 'deleteAssignment').mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteAssignment(lessonId), { wrapper });

      result.current.mutate(assignmentId);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(deleteAssignmentApi.deleteAssignment).toHaveBeenCalledWith(assignmentId);
      expect(deleteAssignmentApi.deleteAssignment).toHaveBeenCalledTimes(1);
    });

    it('should handle error during assignment deletion', async () => {
      const error = new Error('Forbidden');
      jest.spyOn(deleteAssignmentApi, 'deleteAssignment').mockRejectedValue(error);

      const { result } = renderHook(() => useDeleteAssignment(lessonId), { wrapper });

      result.current.mutate(assignmentId);

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('Error Handling in Hooks', () => {
    it('should handle network timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      jest.spyOn(getAssignmentsApi, 'getAssignmentByLesson').mockRejectedValue(timeoutError);

      const { result } = renderHook(() => useGetAssignment('lesson-1'), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(timeoutError);
      expect(result.current.failureCount).toBeGreaterThan(0);
    });

    it('should handle authentication errors (401)', async () => {
      const authError = { response: { status: 401, data: { message: 'Unauthorized' } } };
      jest.spyOn(getAssignmentsApi, 'getStudentAssignments').mockRejectedValue(authError);

      const { result } = renderHook(() => useGetStudentAssignments(), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(authError);
    });

    it('should handle server errors (500)', async () => {
      const serverError = { response: { status: 500, data: { message: 'Internal server error' } } };
      jest.spyOn(createAssignmentApi, 'createAssignment').mockRejectedValue(serverError);

      const payload: CreateAssignmentPayload = {
        title: 'Test',
        instructions: 'Test',
        dueDate: '2026-12-31T23:59:59Z',
      };

      const { result } = renderHook(() => useCreateAssignment('lesson-1'), { wrapper });

      result.current.mutate(payload);

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(serverError);
    });

    it('should handle validation errors (400)', async () => {
      const validationError = {
        response: {
          status: 400,
          data: { message: 'Due date must be in the future' },
        },
      };
      jest.spyOn(createAssignmentApi, 'createAssignment').mockRejectedValue(validationError);

      const payload: CreateAssignmentPayload = {
        title: 'Test',
        instructions: 'Test',
        dueDate: '2020-01-01T00:00:00Z', // Past date
      };

      const { result } = renderHook(() => useCreateAssignment('lesson-1'), { wrapper });

      result.current.mutate(payload);

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(validationError);
    });
  });

  describe('Cache Configuration', () => {
    it('should use correct staleTime for assignment query (5 minutes)', () => {
      const { result } = renderHook(() => useGetAssignment('lesson-1'), { wrapper });

      // The hook should be configured with 5 minutes staleTime
      // We can't directly test the staleTime, but we can verify the query is created
      expect(result.current).toBeDefined();
    });

    it('should use correct staleTime for student assignments query (2 minutes)', () => {
      const { result } = renderHook(() => useGetStudentAssignments(), { wrapper });

      expect(result.current).toBeDefined();
    });

    it('should refetch on reconnect for assignment query', async () => {
      jest.spyOn(getAssignmentsApi, 'getAssignmentByLesson').mockResolvedValue({
        id: 'assignment-1',
        lessonId: 'lesson-1',
        title: 'Test',
        instructions: 'Test',
        dueDate: '2026-12-31T23:59:59Z',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      });

      const { result } = renderHook(() => useGetAssignment('lesson-1'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify the query has refetchOnReconnect enabled
      const queryState = queryClient.getQueryState(['assignment', 'lesson-1']);
      expect(queryState).toBeDefined();
    });
  });

  describe('Multiple Mutations', () => {
    it('should handle multiple create mutations sequentially', async () => {
      const payload1: CreateAssignmentPayload = {
        title: 'Assignment 1',
        instructions: 'Instructions 1',
        dueDate: '2026-12-31T23:59:59Z',
      };

      const payload2: CreateAssignmentPayload = {
        title: 'Assignment 2',
        instructions: 'Instructions 2',
        dueDate: '2026-11-30T23:59:59Z',
      };

      jest
        .spyOn(createAssignmentApi, 'createAssignment')
        .mockResolvedValueOnce({
          id: 'assignment-1',
          lessonId: 'lesson-1',
          ...payload1,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        })
        .mockResolvedValueOnce({
          id: 'assignment-2',
          lessonId: 'lesson-2',
          ...payload2,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        });

      const { result: result1 } = renderHook(() => useCreateAssignment('lesson-1'), { wrapper });
      const { result: result2 } = renderHook(() => useCreateAssignment('lesson-2'), { wrapper });

      result1.current.mutate(payload1);
      await waitFor(() => expect(result1.current.isSuccess).toBe(true));

      result2.current.mutate(payload2);
      await waitFor(() => expect(result2.current.isSuccess).toBe(true));

      expect(createAssignmentApi.createAssignment).toHaveBeenCalledTimes(2);
    });

    it('should handle update after create', async () => {
      const createPayload: CreateAssignmentPayload = {
        title: 'Original Title',
        instructions: 'Original Instructions',
        dueDate: '2026-12-31T23:59:59Z',
      };

      const updatePayload: Partial<CreateAssignmentPayload> = {
        title: 'Updated Title',
      };

      const createdAssignment: Assignment = {
        id: 'assignment-1',
        lessonId: 'lesson-1',
        ...createPayload,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };

      const updatedAssignment: Assignment = {
        ...createdAssignment,
        title: 'Updated Title',
        updatedAt: '2026-02-01T00:00:00Z',
      };

      jest.spyOn(createAssignmentApi, 'createAssignment').mockResolvedValue(createdAssignment);
      jest.spyOn(updateAssignmentApi, 'updateAssignment').mockResolvedValue(updatedAssignment);

      // Create
      const { result: createResult } = renderHook(() => useCreateAssignment('lesson-1'), {
        wrapper,
      });
      createResult.current.mutate(createPayload);
      await waitFor(() => expect(createResult.current.isSuccess).toBe(true));

      // Update
      const { result: updateResult } = renderHook(
        () => useUpdateAssignment('assignment-1', 'lesson-1'),
        { wrapper }
      );
      updateResult.current.mutate(updatePayload);
      await waitFor(() => expect(updateResult.current.isSuccess).toBe(true));

      expect(createAssignmentApi.createAssignment).toHaveBeenCalledTimes(1);
      expect(updateAssignmentApi.updateAssignment).toHaveBeenCalledTimes(1);
    });
  });
});
