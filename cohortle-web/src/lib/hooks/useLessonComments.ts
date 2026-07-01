/**
 * React Query hooks for lesson comments
 * Provides hooks for fetching comments and posting new comments
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchLessonComments, postLessonComment, updateLessonComment, deleteLessonComment } from '@/lib/api/comments';
import { LessonComment } from '@/types/lesson';

/**
 * Hook to fetch lesson comments
 * @param lessonId - The ID of the lesson
 * @param cohortId - The ID of the cohort
 * @returns React Query result with comments array, loading state, and error state
 */
export function useLessonComments(lessonId: string, cohortId: string) {
  return useQuery<LessonComment[], Error>({
    queryKey: ['lesson-comments', lessonId, cohortId],
    queryFn: () => fetchLessonComments(lessonId, cohortId),
    staleTime: 30 * 1000, // 30 seconds
    enabled: !!lessonId && !!cohortId, // Only run if both IDs are provided
  });
}

/**
 * Hook to post a new comment on a lesson
 * Automatically invalidates the comments cache on success
 * @returns Mutation hook with mutate function and status
 */
export function usePostComment() {
  const queryClient = useQueryClient();

  return useMutation<
    LessonComment,
    Error,
    { lessonId: string; cohortId: string; content: string }
  >({
    mutationFn: ({ lessonId, cohortId, content }) =>
      postLessonComment(lessonId, cohortId, content),
    onSuccess: (_, variables) => {
      // Invalidate the comments query to refetch the updated list
      queryClient.invalidateQueries({
        queryKey: ['lesson-comments', variables.lessonId, variables.cohortId],
      });
    },
  });
}

/**
 * Hook to update an existing comment
 * Automatically invalidates the comments cache on success
 * @returns Mutation hook with mutate function and status
 */
export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    { commentId: number; content: string; lessonId: string; cohortId: string }
  >({
    mutationFn: ({ commentId, content }) =>
      updateLessonComment(commentId, content),
    onSuccess: (_, variables) => {
      // Invalidate the comments query to refetch the updated list
      queryClient.invalidateQueries({
        queryKey: ['lesson-comments', variables.lessonId, variables.cohortId],
      });
    },
  });
}

/**
 * Hook to delete a comment
 * Automatically invalidates the comments cache on success
 * @returns Mutation hook with mutate function and status
 */
export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    { commentId: number; lessonId: string; cohortId: string }
  >({
    mutationFn: ({ commentId }) =>
      deleteLessonComment(commentId),
    onSuccess: (_, variables) => {
      // Invalidate the comments query to refetch the updated list
      queryClient.invalidateQueries({
        queryKey: ['lesson-comments', variables.lessonId, variables.cohortId],
      });
    },
  });
}
