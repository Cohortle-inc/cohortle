/**
 * Comments API functions
 * Handles all lesson comment-related API requests
 */

import apiClient from './client';
import { LessonComment } from '@/types/lesson';

// ============================================================================
// Comment Types (Learner Experience Complete)
// ============================================================================

/**
 * Comment data structure
 */
export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  text: string;
  createdAt: string;
  updatedAt?: string;
  isEdited: boolean;
  replies: Comment[];
  canEdit: boolean;
  canDelete: boolean;
}

/**
 * Comments response
 */
export interface CommentsResponse {
  error: boolean;
  message: string;
  comments: Comment[];
}

/**
 * Comment creation response
 */
export interface CommentCreationResponse {
  error: boolean;
  message: string;
  comment: Comment;
}

/**
 * Comment update response
 */
export interface CommentUpdateResponse {
  error: boolean;
  message: string;
  comment: Comment;
}

/**
 * Comment deletion response
 */
export interface CommentDeletionResponse {
  error: boolean;
  message: string;
  success: boolean;
}

// ============================================================================
// Legacy Comment Functions (Existing)
// ============================================================================

/**
 * Fetch all comments for a lesson in a cohort
 * @param lessonId - The ID of the lesson
 * @param cohortId - The ID of the cohort
 * @returns Promise resolving to an array of lesson comments
 */
export async function fetchLessonComments(
  lessonId: string,
  cohortId: string
): Promise<LessonComment[]> {
  const response = await apiClient.get(
    `/api/lessons/${lessonId}/comments`,
    { params: { cohort_id: cohortId } }
  );
  return response.data;
}

/**
 * Post a new comment on a lesson in a cohort
 * @param lessonId - The ID of the lesson
 * @param cohortId - The ID of the cohort
 * @param content - The comment content text
 * @returns Promise resolving to the created comment
 */
export async function postLessonComment(
  lessonId: string,
  cohortId: string,
  content: string
): Promise<LessonComment> {
  const response = await apiClient.post(
    `/api/lessons/${lessonId}/comments`,
    { content, cohort_id: cohortId }
  );
  return response.data;
}

/**
 * Update an existing comment
 * @param commentId - The ID of the comment to update
 * @param content - The new comment content text
 * @returns Promise resolving when the comment is updated
 */
export async function updateLessonComment(
  commentId: number,
  content: string
): Promise<void> {
  await apiClient.put(
    `/api/lesson-comments/${commentId}`,
    { comment_text: content }
  );
}

/**
 * Delete a comment
 * @param commentId - The ID of the comment to delete
 * @returns Promise resolving when the comment is deleted
 */
export async function deleteLessonComment(
  commentId: number
): Promise<void> {
  await apiClient.delete(`/api/lesson-comments/${commentId}`);
}

// ============================================================================
// Learner Experience Complete Comment Functions
// ============================================================================

/**
 * Get all comments for a lesson
 * @param lessonId - ID of the lesson
 * @returns Array of comments with threaded replies
 * @throws Error if request fails
 */
export async function getLessonComments(lessonId: string): Promise<Comment[]> {
  const response = await apiClient.get<CommentsResponse>(
    `/v1/api/lessons/${lessonId}/comments`
  );
  
  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to fetch lesson comments');
  }
  
  return response.data.comments;
}

/**
 * Create a new comment on a lesson
 * @param lessonId - ID of the lesson
 * @param text - Comment text content
 * @param parentId - Optional parent comment ID for replies
 * @returns Created comment
 * @throws Error if request fails
 */
export async function createComment(
  lessonId: string,
  text: string,
  parentId?: string
): Promise<Comment> {
  const response = await apiClient.post<CommentCreationResponse>(
    `/v1/api/lessons/${lessonId}/comments`,
    { text, parent_id: parentId }
  );
  
  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to create comment');
  }
  
  return response.data.comment;
}

/**
 * Update an existing comment
 * @param commentId - ID of the comment to update
 * @param text - New comment text content
 * @returns Updated comment
 * @throws Error if request fails or user is not the author
 */
export async function updateComment(
  commentId: string,
  text: string
): Promise<Comment> {
  const response = await apiClient.put<CommentUpdateResponse>(
    `/v1/api/comments/${commentId}`,
    { text }
  );
  
  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to update comment');
  }
  
  return response.data.comment;
}

/**
 * Delete a comment
 * @param commentId - ID of the comment to delete
 * @throws Error if request fails or user is not the author
 */
export async function deleteComment(commentId: string): Promise<void> {
  const response = await apiClient.delete<CommentDeletionResponse>(
    `/v1/api/comments/${commentId}`
  );
  
  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to delete comment');
  }
}
