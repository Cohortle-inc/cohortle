import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSubmissionsByAssignment,
  getMySubmission,
  getSubmissionById,
} from '@/api/submissions/getSubmissions';
import { submitAssignment } from '@/api/submissions/submitAssignment';
import { updateSubmission } from '@/api/submissions/updateSubmission';
import { gradeSubmission } from '@/api/submissions/gradeSubmission';
import { clearDraft } from '@/utils/draftManager';
import { LocalFile, GradeSubmissionPayload } from '@/types/assignments';

/**
 * Query hook to get all submissions for an assignment (convener view)
 * @param assignmentId - The ID of the assignment
 * @returns Query result with array of submissions
 */
export const useGetSubmissions = (assignmentId: string) => {
  return useQuery({
    queryKey: ['submissions', assignmentId],
    queryFn: () => getSubmissionsByAssignment(assignmentId),
    staleTime: 1 * 60 * 1000, // 1 minute - data considered fresh for 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes - cache kept for 5 minutes
    refetchOnReconnect: true,
    refetchOnWindowFocus: false, // Don't refetch on window focus for mobile
    retry: 2, // Retry failed requests twice
    enabled: !!assignmentId, // Only run query if assignmentId exists
  });
};

/**
 * Query hook to get the current student's submission for an assignment
 * @param assignmentId - The ID of the assignment
 * @returns Query result with student's submission or null
 */
export const useGetMySubmission = (assignmentId: string) => {
  return useQuery({
    queryKey: ['my-submission', assignmentId],
    queryFn: () => getMySubmission(assignmentId),
    staleTime: 2 * 60 * 1000, // 2 minutes - data considered fresh for 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes - cache kept for 10 minutes
    refetchOnReconnect: true,
    refetchOnWindowFocus: false, // Don't refetch on window focus for mobile
    retry: 2, // Retry failed requests twice
    enabled: !!assignmentId, // Only run query if assignmentId exists
  });
};

/**
 * Query hook to get a specific submission by ID
 * @param submissionId - The ID of the submission
 * @returns Query result with submission details
 */
export const useGetSubmission = (submissionId: string) => {
  return useQuery({
    queryKey: ['submission', submissionId],
    queryFn: () => getSubmissionById(submissionId),
    staleTime: 1 * 60 * 1000, // 1 minute - data considered fresh for 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes - cache kept for 5 minutes
    refetchOnReconnect: true,
    refetchOnWindowFocus: false, // Don't refetch on window focus for mobile
    retry: 2, // Retry failed requests twice
    enabled: !!submissionId, // Only run query if submissionId exists
  });
};

/**
 * Mutation hook to submit an assignment
 * @param assignmentId - The ID of the assignment
 * @returns Mutation result with submit assignment function
 */
export const useSubmitAssignment = (assignmentId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ textAnswer, files }: { textAnswer: string | null; files: LocalFile[] }) =>
      submitAssignment(assignmentId, textAnswer, files),
    onSuccess: async () => {
      // Clear the draft after successful submission
      await clearDraft(assignmentId);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['my-submission', assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['submissions', assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['student-assignments'] });
    },
  });
};

/**
 * Mutation hook to update an existing submission
 * @param submissionId - The ID of the submission to update
 * @param assignmentId - The ID of the assignment (for cache invalidation)
 * @returns Mutation result with update submission function
 */
export const useUpdateSubmission = (submissionId: string, assignmentId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ textAnswer, files }: { textAnswer?: string | null; files?: LocalFile[] }) =>
      updateSubmission(submissionId, textAnswer, files),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['my-submission', assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['submission', submissionId] });
      queryClient.invalidateQueries({ queryKey: ['submissions', assignmentId] });
    },
  });
};

/**
 * Mutation hook to grade a submission
 * @param assignmentId - The ID of the assignment (for cache invalidation)
 * @returns Mutation result with grade submission function
 */
export const useGradeSubmission = (assignmentId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      submissionId,
      payload,
    }: {
      submissionId: string;
      payload: GradeSubmissionPayload;
    }) => gradeSubmission(submissionId, payload),
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['submissions', assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['submission', variables.submissionId] });
      // Also invalidate student assignments in case they're viewing their own grade
      queryClient.invalidateQueries({ queryKey: ['student-assignments'] });
    },
  });
};
