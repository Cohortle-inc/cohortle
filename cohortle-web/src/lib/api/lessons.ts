/**
 * Lesson API functions
 * Handles all lesson-related API requests
 */

import apiClient from './client';
import { Lesson, LessonCompletion, ModuleLesson } from '@/types/lesson';

/**
 * Fetch a single lesson by ID
 * @param lessonId - The ID of the lesson to fetch
 * @returns Promise resolving to the lesson data
 */
export async function fetchLesson(lessonId: string): Promise<Lesson> {
  const response = await apiClient.get(`/v1/api/lessons/${lessonId}`);
  // API returns { error, message, lesson } — unwrap the lesson object
  return response.data.lesson ?? response.data;
}

/**
 * Fetch lesson completion status for a student in a cohort
 * @param lessonId - The ID of the lesson
 * @param cohortId - The ID of the cohort
 * @returns Promise resolving to the completion status
 */
export async function fetchLessonCompletion(
  lessonId: string,
  cohortId: string
): Promise<LessonCompletion> {
  const response = await apiClient.get(
    `/v1/api/lessons/${lessonId}/completion`,
    { params: { cohort_id: cohortId } }
  );
  return response.data;
}

/**
 * Mark a lesson as complete for a student in a cohort
 * @param lessonId - The ID of the lesson to mark complete
 * @param cohortId - The ID of the cohort
 * @returns Promise resolving when the operation completes
 */
export async function markLessonComplete(
  lessonId: string,
  cohortId: string
): Promise<void> {
  await apiClient.post(`/v1/api/lessons/${lessonId}/complete`, {
    cohort_id: cohortId,
  });
}

/**
 * Fetch all lessons in a module for navigation purposes
 * @param moduleId - The ID of the module
 * @param cohortId - The ID of the cohort
 * @returns Promise resolving to an array of module lessons
 */
export async function fetchModuleLessons(
  moduleId: string,
  cohortId: string
): Promise<ModuleLesson[]> {
  const response = await apiClient.get(
    `/v1/api/modules/${moduleId}/lessons`,
    { params: { cohort_id: cohortId } }
  );
  return response.data;
}

// ─── Native Quiz System ───────────────────────────────────────────────────────

import { QuizAttempt, QuizLearnerResult } from '@/types/quiz';

/**
 * Submit a quiz attempt for a learner.
 * The backend calculates the score, persists the attempt, and marks the lesson
 * complete if the passing score is met (or if no passing score is configured).
 *
 * @param lessonId  - The lesson ID (integer as string)
 * @param cohortId  - The cohort ID
 * @param answers   - Map of question id → learner's answer
 */
export async function submitQuizAttempt(
  lessonId: string,
  cohortId: number,
  answers: Record<string, string | number>
): Promise<QuizAttempt> {
  const response = await apiClient.post(
    `/v1/api/lessons/${lessonId}/quiz-attempt`,
    { cohort_id: cohortId, answers }
  );
  return response.data.attempt;
}

/**
 * Fetch the learner's most recent quiz attempt for a lesson.
 * Returns null if the learner has not yet attempted the quiz.
 */
export async function getLatestQuizAttempt(
  lessonId: string,
  cohortId: number
): Promise<QuizAttempt | null> {
  const response = await apiClient.get(
    `/v1/api/lessons/${lessonId}/quiz-attempt/latest`,
    { params: { cohort_id: cohortId } }
  );
  return response.data.attempt ?? null;
}

/**
 * Fetch all learner attempts for a quiz lesson (convener only).
 * Returns one result row per learner (their latest attempt + attempt count).
 */
export async function getQuizResults(
  lessonId: string
): Promise<QuizLearnerResult[]> {
  const response = await apiClient.get(
    `/v1/api/lessons/${lessonId}/quiz-results`
  );
  return response.data.results;
}
