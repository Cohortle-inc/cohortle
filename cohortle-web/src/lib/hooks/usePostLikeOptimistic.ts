/**
 * Optimistic Post Like Hook
 * Provides instant UI feedback for post likes with automatic rollback on failure
 */

import { useQueryClient } from '@tanstack/react-query';
import { useOptimisticUpdate } from './useOptimisticUpdate';
import { likePost, unlikePost } from '@/lib/api/community';

interface Post {
  id: string;
  likes_count: number;
  user_has_liked: boolean;
  [key: string]: any;
}

interface UsePostLikeOptimisticOptions {
  postId: string;
  cohortId: string;
  onSuccess?: (liked: boolean) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for optimistic post like/unlike updates
 * Updates UI immediately, then syncs with server
 * Automatically rolls back on failure
 * 
 * @example
 * const { toggleLike, isLoading, isLiked } = usePostLikeOptimistic({
 *   postId: '123',
 *   cohortId: '456',
 * });
 */
export function usePostLikeOptimistic({
  postId,
  cohortId,
  onSuccess,
  onError,
}: UsePostLikeOptimisticOptions) {
  const queryClient = useQueryClient();
  const postsQueryKey = ['cohort-posts', cohortId];

  // Get current like status from cache
  const posts = queryClient.getQueryData<Post[]>(postsQueryKey);
  const currentPost = posts?.find(p => p.id === postId);
  const isLiked = currentPost?.user_has_liked || false;

  const { mutate: toggleLike, isLoading, error } = useOptimisticUpdate<Post[], boolean>({
    queryKey: postsQueryKey,
    mutationFn: async (shouldLike: boolean) => {
      if (shouldLike) {
        await likePost(postId);
      } else {
        await unlikePost(postId);
      }
      
      // Return updated posts list (will be set by server response)
      const updatedPosts = queryClient.getQueryData<Post[]>(postsQueryKey);
      return updatedPosts || [];
    },
    updateCache: (oldPosts, shouldLike) => {
      if (!oldPosts) return [];
      
      return oldPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            user_has_liked: shouldLike,
            likes_count: shouldLike 
              ? post.likes_count + 1 
              : Math.max(0, post.likes_count - 1),
          };
        }
        return post;
      });
    },
    onSuccess: (_, liked) => {
      onSuccess?.(liked);
    },
    onError: (err) => {
      onError?.(err);
    },
  });

  const handleToggle = () => {
    toggleLike(!isLiked);
  };

  return {
    toggleLike: handleToggle,
    isLoading,
    isLiked,
    error,
  };
}

/**
 * Hook for liking a post with optimistic update
 */
export function useLikePostOptimistic({
  postId,
  cohortId,
  onSuccess,
  onError,
}: UsePostLikeOptimisticOptions) {
  const { toggleLike, isLoading, isLiked, error } = usePostLikeOptimistic({
    postId,
    cohortId,
    onSuccess,
    onError,
  });

  const likePost = () => {
    if (!isLiked) {
      toggleLike();
    }
  };

  return {
    likePost,
    isLoading,
    isLiked,
    error,
  };
}

/**
 * Hook for unliking a post with optimistic update
 */
export function useUnlikePostOptimistic({
  postId,
  cohortId,
  onSuccess,
  onError,
}: UsePostLikeOptimisticOptions) {
  const { toggleLike, isLoading, isLiked, error } = usePostLikeOptimistic({
    postId,
    cohortId,
    onSuccess,
    onError,
  });

  const unlikePost = () => {
    if (isLiked) {
      toggleLike();
    }
  };

  return {
    unlikePost,
    isLoading,
    isLiked,
    error,
  };
}
