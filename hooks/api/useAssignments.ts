import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAssignmentByLesson,
  getStudentAssignments,
  getAssignmentById,
} from '@/api/assignments/getAssignments';
import { createAssignment } from '@/api/assignments/createAssignment';
import { updateAssignment } from '@/api/assignments/updateAssignment';
import { deleteAssignment } from '@/api/assignments/deleteAssignment';
import { CreateAssignmentPayload } from '@/types/assignments';

/**
 * Query hook to get assignment for a specific lesson
 * @param lessonId - The ID of the lesson
 * @returns Query result with assignment data
 */
export const useGetAssignment = (lessonId: string) => {
  return useQuery({
    queryKey: ['assignment', lessonId],
    queryFn: () => getAssignmentByLesson(lessonId),
    staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes - cache kept for 10 minutes after last use
    refetchOnReconnect: true,
    refetchOnWindowFocus: false, // Don't refetch on window focus for mobile
    retry: 2, // Retry failed requests twice
    enabled: !!lessonId, // Only run query if lessonId exists
  });
};

/**
 * Query hook to get all assignments for the current student
 * @returns Query result with array of student assignments
 */
export const useGetStudentAssignments = () => {
  return useQuery({
    queryKey: ['student-assignments'],
    queryFn: getStudentAssignments,
    staleTime: 2 * 60 * 1000, // 2 minutes - data considered fresh for 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes - cache kept for 5 minutes
    refetchOnReconnect: true,
    refetchOnWindowFocus: false, // Don't refetch on window focus for mobile
    retry: 2, // Retry failed requests twice
  });
};

/**
 * Query hook to get a single assignment by ID
 * @param assignmentId - The ID of the assignment
 * @returns Query result with assignment data
 */
export const useGetAssignmentById = (assignmentId: string) => {
  return useQuery({
    queryKey: ['assignment-detail', assignmentId],
    queryFn: () => getAssignmentById(assignmentId),
    staleTime: 2 * 60 * 1000, // 2 minutes - data considered fresh for 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes - cache kept for 10 minutes
    refetchOnReconnect: true,
    refetchOnWindowFocus: false, // Don't refetch on window focus for mobile
    retry: 2, // Retry failed requests twice
    enabled: !!assignmentId, // Only run query if assignmentId exists
  });
};

/**
 * Mutation hook to create a new assignment for a lesson
 * @param lessonId - The ID of the lesson
 * @returns Mutation result with create assignment function
 */
export const useCreateAssignment = (lessonId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAssignmentPayload) =>
      createAssignment(lessonId, payload),
    onMutate: async (newAssignment) => {
      // Cancel outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['assignment', lessonId] });

      // Snapshot previous value for rollback
      const previousAssignment = queryClient.getQueryData(['assignment', lessonId]);

      // Optimistically update cache with new assignment
      queryClient.setQueryData(['assignment', lessonId], {
        ...newAssignment,
        id: 'temp-id',
        lessonId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return { previousAssignment };
    },
    onError: (err, newAssignment, context) => {
      // Rollback on error
      if (context?.previousAssignment) {
        queryClient.setQueryData(['assignment', lessonId], context.previousAssignment);
      }
    },
    onSuccess: () => {
      // Invalidate assignment query for this lesson
      queryClient.invalidateQueries({ queryKey: ['assignment', lessonId] });
      // Invalidate student assignments list
      queryClient.invalidateQueries({ queryKey: ['student-assignments'] });
    },
  });
};

/**
 * Mutation hook to update an existing assignment
 * @param assignmentId - The ID of the assignment to update
 * @param lessonId - The ID of the lesson (for cache invalidation)
 * @returns Mutation result with update assignment function
 */
export const useUpdateAssignment = (assignmentId: string, lessonId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<CreateAssignmentPayload>) =>
      updateAssignment(assignmentId, payload),
    onSuccess: () => {
      // Invalidate assignment query for this lesson
      queryClient.invalidateQueries({ queryKey: ['assignment', lessonId] });
      // Invalidate student assignments list
      queryClient.invalidateQueries({ queryKey: ['student-assignments'] });
    },
  });
};

/**
 * Mutation hook to delete an assignment
 * @param lessonId - The ID of the lesson (for cache invalidation)
 * @returns Mutation result with delete assignment function
 */
export const useDeleteAssignment = (lessonId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assignmentId: string) => deleteAssignment(assignmentId),
    onSuccess: () => {
      // Invalidate assignment query for this lesson
      queryClient.invalidateQueries({ queryKey: ['assignment', lessonId] });
      // Invalidate student assignments list
      queryClient.invalidateQueries({ queryKey: ['student-assignments'] });
    },
  });
};
