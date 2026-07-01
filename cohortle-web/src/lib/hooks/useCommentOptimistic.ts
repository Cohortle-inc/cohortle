/**
 * Optimistic Comment Hook
 * Provides instant UI feedback for comment creation with automatic rollback on failure
 */

import { useQueryClient } from '@tanstack/react-query';
import { useOptimisticListUpdate } from './useOptimisticUpdate';
import { createComment, Comment as LessonCommentType } from '@/lib/api/comments';
import { addPostComment, PostComment } from '@/lib/api/community';

interface Comment {
  id: string;
  content: string;
  user_id: string;
  user_name: string;
  created_at: string;
  parent_id?: string | null;
  is_optimistic?: boolean;
  [key: string]: any;
}

interface UseCommentOptimisticOptions {
  lessonId?: string;
  postId?: string;
  cohortId: string;
  onSuccess?: (comment: Comment) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for optimistic comment creation
 * Adds comment to UI immediately, then syncs with server
 * Automatically removes on failure
 * 
 * @example
 * const { addComment, isLoading } = useCommentOptimistic({
 *   lessonId: '123',
 *   cohortId: '456',
 *   onSuccess: () => toast.success('Comment added!'),
 * });
 */
export function useCommentOptimistic({
  lessonId,
  postId,
  cohortId,
  onSuccess,
  onError,
}: UseCommentOptimisticOptions) {
  const queryClient = useQueryClient();
  
  // Determine query key based on whether it's a lesson or post comment
  const queryKey = lessonId 
    ? ['lesson-comments', lessonId, cohortId]
    : ['post-comments', postId!, cohortId];

  const { mutate: addComment, isLoading, error } = useOptimisticListUpdate<Comment, { content: string; parentId?: string }>({
    queryKey,
    mutationFn: async (variables) => {
      if (lessonId) {
        const lessonComment = await createComment(lessonId, variables.content, variables.parentId);
        // Convert LessonCommentType to Comment format
        const newComment: Comment = {
          id: lessonComment.id,
          content: lessonComment.text,
          user_id: lessonComment.authorId,
          user_name: lessonComment.authorName,
          created_at: lessonComment.createdAt,
          parent_id: variables.parentId || null,
        };
        
        // Return updated comments list
        const updatedComments = queryClient.getQueryData<Comment[]>(queryKey);
        return updatedComments || [];
      } else if (postId) {
        // addPostComment returns PostComment, need to convert to Comment format
        const postComment = await addPostComment(postId, variables.content);
        const newComment: Comment = {
          id: postComment.id,
          content: postComment.text,
          user_id: postComment.authorId,
          user_name: postComment.authorName,
          created_at: postComment.createdAt,
        };
        
        // Return updated comments list
        const updatedComments = queryClient.getQueryData<Comment[]>(queryKey);
        return updatedComments || [];
      } else {
        throw new Error('Either lessonId or postId must be provided');
      }
    },
    addItem: (oldComments, variables) => {
      // Create optimistic comment with temporary ID
      const optimisticComment: Comment = {
        id: `temp-${Date.now()}`,
        content: variables.content,
        user_id: 'current-user', // Will be replaced by server response
        user_name: 'You',
        created_at: new Date().toISOString(),
        parent_id: variables.parentId || null,
        is_optimistic: true, // Flag to show loading state
      };
      
      return [...(oldComments || []), optimisticComment];
    },
    onSuccess: (comments, variables) => {
      // Find the newly created comment (last one without is_optimistic flag)
      const newComment = comments.find(c => !('is_optimistic' in c) && c.content === variables.content);
      if (newComment) {
        onSuccess?.(newComment);
      }
    },
    onError: (err) => {
      onError?.(err);
    },
  });

  return {
    addComment,
    isLoading,
    error,
  };
}

/**
 * Hook for optimistic lesson comment creation
 */
export function useLessonCommentOptimistic({
  lessonId,
  cohortId,
  onSuccess,
  onError,
}: Omit<UseCommentOptimisticOptions, 'postId'> & { lessonId: string }) {
  return useCommentOptimistic({
    lessonId,
    cohortId,
    onSuccess,
    onError,
  });
}

/**
 * Hook for optimistic post comment creation
 */
export function usePostCommentOptimistic({
  postId,
  cohortId,
  onSuccess,
  onError,
}: Omit<UseCommentOptimisticOptions, 'lessonId'> & { postId: string }) {
  return useCommentOptimistic({
    postId,
    cohortId,
    onSuccess,
    onError,
  });
}
