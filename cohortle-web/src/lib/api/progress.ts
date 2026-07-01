/**
 * Progress and Dashboard API functions
 * Handles progress tracking, lesson completion, and dashboard data
 */

import apiClient from './client';

// ============================================================================
// Progress Types
// ============================================================================

/**
 * Programme progress data
 */
export interface ProgrammeProgress {
  progress: number; // 0-100
  completedLessons: number;
  totalLessons: number;
}

/**
 * Programme progress response
 */
export interface ProgrammeProgressResponse {
  error: boolean;
  message: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
}

/**
 * Lesson completion response
 */
export interface LessonCompletionResponse {
  error: boolean;
  message: string;
  success: boolean;
  completedAt: string;
}

/**
 * Lesson navigation data
 */
export interface LessonNavigation {
  hasPrevious: boolean;
  hasNext: boolean;
  previousLessonId?: string;
  nextLessonId?: string;
}

/**
 * Lesson navigation response
 */
export interface LessonNavigationResponse {
  error: boolean;
  message: string;
  navigation: LessonNavigation;
}

// ============================================================================
// Dashboard Types
// ============================================================================

/**
 * Live session data
 */
export interface LiveSession {
  id: string;
  title: string;
  programmeName: string;
  programmeId: number;
  dateTime: string; // ISO 8601
  joinUrl?: string;
}

/**
 * Upcoming sessions response
 */
export interface UpcomingSessionsResponse {
  error: boolean;
  message: string;
  sessions: LiveSession[];
}

/**
 * Completed lesson activity
 */
export interface CompletedLesson {
  id: string;
  title: string;
  programmeName: string;
  completedAt: string; // ISO 8601
}

/**
 * Recent activity response
 */
export interface RecentActivityResponse {
  error: boolean;
  message: string;
  activities: CompletedLesson[];
}

/**
 * Next lesson data
 */
export interface NextLesson {
  id: string;
  title: string;
  programmeId: number;
}

/**
 * Next lesson response
 */
export interface NextLessonResponse {
  error: boolean;
  message: string;
  lesson: NextLesson | null;
}

// ============================================================================
// Progress API Functions
// ============================================================================

/**
 * Get programme progress for the current user
 * @param programmeId - ID of the programme
 * @param cohortId - ID of the cohort
 * @returns Programme progress data
 * @throws Error if request fails
 */
export async function getProgrammeProgress(
  programmeId: number,
  cohortId: number
): Promise<ProgrammeProgress> {
  const response = await apiClient.get<ProgrammeProgressResponse>(
    `/v1/api/programmes/${programmeId}/progress`,
    { params: { cohort_id: cohortId } }
  );
  
  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to fetch programme progress');
  }
  
  return {
    progress: response.data.progress,
    completedLessons: response.data.completedLessons,
    totalLessons: response.data.totalLessons,
  };
}

/**
 * Mark a lesson as complete
 * @param lessonId - ID of the lesson
 * @param cohortId - ID of the cohort
 * @returns Completion timestamp
 * @throws Error if request fails
 */
export async function markLessonComplete(
  lessonId: string,
  cohortId: number
): Promise<string> {
  const response = await apiClient.post<LessonCompletionResponse>(
    `/v1/api/lessons/${lessonId}/complete`,
    { cohort_id: cohortId }
  );
  
  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to mark lesson complete');
  }
  
  return response.data.completedAt;
}

/**
 * Mark a lesson as incomplete (remove completion)
 * @param lessonId - ID of the lesson
 * @param cohortId - ID of the cohort
 * @throws Error if request fails
 */
export async function markLessonIncomplete(
  lessonId: string,
  cohortId: number
): Promise<void> {
  const response = await apiClient.delete<{ error: boolean; message: string; success: boolean }>(
    `/v1/api/lessons/${lessonId}/complete`,
    { data: { cohort_id: cohortId } }
  );
  
  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to mark lesson incomplete');
  }
}

/**
 * Get lesson navigation (previous/next lesson IDs)
 * @param lessonId - ID of the current lesson
 * @param cohortId - ID of the cohort
 * @returns Lesson navigation data
 * @throws Error if request fails
 */
export async function getLessonNavigation(
  lessonId: string,
  cohortId: number
): Promise<LessonNavigation> {
  const response = await apiClient.get<LessonNavigationResponse>(
    `/v1/api/lessons/${lessonId}/navigation`,
    { params: { cohort_id: cohortId } }
  );
  
  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to fetch lesson navigation');
  }
  
  return response.data.navigation;
}

// ============================================================================
// Dashboard API Functions
// ============================================================================

/**
 * Get upcoming live sessions across all enrolled programmes
 * @returns Array of upcoming live sessions
 * @throws Error if request fails
 */
export async function getUpcomingSessions(): Promise<LiveSession[]> {
  const response = await apiClient.get<UpcomingSessionsResponse>(
    '/v1/api/dashboard/upcoming-sessions'
  );
  
  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to fetch upcoming sessions');
  }
  
  return response.data.sessions;
}

/**
 * Get recent activity (recently completed lessons)
 * @param limit - Maximum number of activities to return (default 5)
 * @returns Array of completed lessons
 * @throws Error if request fails
 */
export async function getRecentActivity(limit: number = 5): Promise<CompletedLesson[]> {
  const response = await apiClient.get<RecentActivityResponse>(
    '/v1/api/dashboard/recent-activity',
    { params: { limit } }
  );
  
  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to fetch recent activity');
  }
  
  return response.data.activities;
}

/**
 * Get next incomplete lesson across all enrolled programmes
 * @returns Next lesson data or null if no incomplete lessons
 * @throws Error if request fails
 */
export async function getNextLesson(): Promise<NextLesson | null> {
  const response = await apiClient.get<NextLessonResponse>(
    '/v1/api/dashboard/next-lesson'
  );
  
  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to fetch next lesson');
  }
  
  return response.data.lesson;
}
