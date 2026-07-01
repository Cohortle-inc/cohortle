/**
 * Community API functions
 * Handles cohort community feed posts and interactions
 */

import apiClient from './client';

// ============================================================================
// Community Types
// ============================================================================

/**
 * Post data structure
 */
export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  isEdited: boolean;
  likeCount: number;
  isLikedByUser: boolean;
  commentCount: number;
  comments: PostComment[];
  canEdit: boolean;
  canDelete: boolean;
}

/**
 * Post comment data structure
 */
export interface PostComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  text: string;
  createdAt: string;
}

/**
 * Cohort posts response
 */
export interface CohortPostsResponse {
  error: boolean;
  message: string;
  posts: Post[];
  hasMore: boolean;
  total: number;
}

/**
 * Post creation response
 */
export interface PostCreationResponse {
  error: boolean;
  message: string;
  post: Post;
}

/**
 * Post update response
 */
export interface PostUpdateResponse {
  error: boolean;
  message: string;
  post: Post;
}

/**
 * Post deletion response
 */
export interface PostDeletionResponse {
  error: boolean;
  message: string;
  success: boolean;
}

/**
 * Post like response
 */
export interface PostLikeResponse {
  error: boolean;
  message: string;
  success: boolean;
  likeCount: number;
}

/**
 * Post comment creation response
 */
export interface PostCommentCreationResponse {
  error: boolean;
  message: string;
  comment: PostComment;
}

// ============================================================================
// Community API Functions
// ============================================================================

/**
 * Get posts for a cohort community feed
 * @param cohortId - ID of the cohort
 * @param page - Page number (default 1)
 * @param limit - Number of posts per page (default 20)
 * @returns Paginated posts with metadata
 * @throws Error if request fails or user is not enrolled
 */
export async function getCohortPosts(
  cohortId: number,
  page: number = 1,
  limit: number = 20
): Promise<{ posts: Post[]; hasMore: boolean; total: number }> {
  const response = await apiClient.get<CohortPostsResponse>(
    `/v1/api/cohorts/${cohortId}/posts`,
    { params: { page, limit } }
  );
  
  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to fetch cohort posts');
  }
  
  return {
    posts: response.data.posts,
    hasMore: response.data.hasMore,
    total: response.data.total,
  };
}

/**
 * Create a new post in a cohort community feed
 * @param cohortId - ID of the cohort
 * @param content - Post content text (max 2000 characters)
 * @returns Created post
 * @throws Error if request fails or user is not enrolled
 */
export async function createPost(
  cohortId: number,
  content: string
): Promise<Post> {
  const response = await apiClient.post<PostCreationResponse>(
    `/v1/api/cohorts/${cohortId}/posts`,
    { content }
  );
  
  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to create post');
  }
  
  return response.data.post;
}

/**
 * Update an existing post
 * @param postId - ID of the post to update
 * @param content - New post content text
 * @returns Updated post
 * @throws Error if request fails or user is not the author
 */
export async function updatePost(
  postId: string,
  content: string
): Promise<Post> {
  const response = await apiClient.put<PostUpdateResponse>(
    `/v1/api/posts/${postId}`,
    { content }
  );
  
  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to update post');
  }
  
  return response.data.post;
}

/**
 * Delete a post
 * @param postId - ID of the post to delete
 * @throws Error if request fails or user is not the author
 */
export async function deletePost(postId: string): Promise<void> {
  const response = await apiClient.delete<PostDeletionResponse>(
    `/v1/api/posts/${postId}`
  );
  
  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to delete post');
  }
}

/**
 * Like a post
 * @param postId - ID of the post to like
 * @returns Updated like count
 * @throws Error if request fails
 */
export async function likePost(postId: string): Promise<number> {
  const response = await apiClient.post<PostLikeResponse>(
    `/v1/api/posts/${postId}/like`
  );
  
  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to like post');
  }
  
  return response.data.likeCount;
}

/**
 * Unlike a post (remove like)
 * @param postId - ID of the post to unlike
 * @returns Updated like count
 * @throws Error if request fails
 */
export async function unlikePost(postId: string): Promise<number> {
  const response = await apiClient.delete<PostLikeResponse>(
    `/v1/api/posts/${postId}/like`
  );
  
  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to unlike post');
  }
  
  return response.data.likeCount;
}

/**
 * Add a comment to a post
 * @param postId - ID of the post
 * @param text - Comment text content
 * @returns Created comment
 * @throws Error if request fails
 */
export async function addPostComment(
  postId: string,
  text: string
): Promise<PostComment> {
  const response = await apiClient.post<PostCommentCreationResponse>(
    `/v1/api/posts/${postId}/comments`,
    { text }
  );
  
  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to add comment');
  }
  
  return response.data.comment;
}
