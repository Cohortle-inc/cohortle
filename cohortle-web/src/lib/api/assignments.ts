/**
 * Assignment API functions
 * Handles learner submission and convener grading operations
 */

import apiClient from './client';

export interface AssignmentData {
  instructions: string;
  due_date?: string | null;
  allow_text_answer: boolean;
  allow_file_uploads: boolean;
  max_file_size_mb?: number;
  allowed_file_types?: string[];
}

export interface SubmissionFile {
  id: number;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_at: string;
}

export interface AssignmentSubmission {
  id: number;
  lesson_id: number;
  user_id: number;
  cohort_id: number;
  text_answer: string | null;
  status: 'submitted' | 'graded';
  grading_status: 'pending' | 'passed' | 'failed';
  feedback: string | null;
  submitted_at: string | null;
  graded_at: string | null;
  files: SubmissionFile[];
}

export interface AssignmentResponse {
  lesson_id: number;
  assignment_data: AssignmentData | null;
  submission: AssignmentSubmission | null;
}

export interface ConvenerSubmission {
  submission_id: number;
  learner_id: number;
  learner_name: string;
  learner_email: string;
  status: 'submitted' | 'graded';
  grading_status: 'pending' | 'passed' | 'failed';
  text_answer: string | null;
  feedback: string | null;
  submitted_at: string | null;
  graded_at: string | null;
  files: SubmissionFile[];
}

/**
 * Get assignment submission statuses for the authenticated learner in a cohort.
 * Returns a map of lesson_id (string) → status string.
 */
export async function getAssignmentStatuses(
  cohortId: string | number
): Promise<Record<string, 'submitted' | 'passed' | 'needs_revision'>> {
  const response = await apiClient.get<{ error: boolean; message: string; statuses: Record<string, string> }>(
    `/v1/api/cohorts/${cohortId}/assignment-statuses`
  );
  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to fetch assignment statuses');
  }
  return response.data.statuses as Record<string, 'submitted' | 'passed' | 'needs_revision'>;
}


export async function getAssignment(
  lessonId: string,
  cohortId: string
): Promise<AssignmentResponse> {
  const response = await apiClient.get<AssignmentResponse & { error: boolean; message: string }>(
    `/v1/api/lessons/${lessonId}/assignment`,
    { params: { cohort_id: cohortId } }
  );
  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to fetch assignment');
  }
  return response.data;
}

/**
 * Submit (or re-submit) an assignment text answer
 */
export async function submitAssignment(
  lessonId: string,
  cohortId: string,
  textAnswer?: string
): Promise<AssignmentSubmission> {
  const response = await apiClient.post<{ error: boolean; message: string; submission: AssignmentSubmission }>(
    `/v1/api/lessons/${lessonId}/assignment/submit`,
    { cohort_id: Number(cohortId), text_answer: textAnswer ?? null }
  );
  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to submit assignment');
  }
  return response.data.submission;
}

/**
 * Upload files for an assignment submission
 */
export async function submitAssignmentFiles(
  lessonId: string,
  cohortId: string,
  files: File[]
): Promise<SubmissionFile[]> {
  const formData = new FormData();
  formData.append('cohort_id', cohortId);
  files.forEach(f => formData.append('files', f));

  const response = await apiClient.post<{ error: boolean; message: string; files: SubmissionFile[] }>(
    `/v1/api/lessons/${lessonId}/assignment/submit/files`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to upload files');
  }
  return response.data.files;
}

/**
 * Get all submissions for a lesson (convener only)
 */
export async function getAssignmentSubmissions(
  lessonId: string
): Promise<ConvenerSubmission[]> {
  const response = await apiClient.get<{ error: boolean; message: string; submissions: ConvenerSubmission[] }>(
    `/v1/api/lessons/${lessonId}/assignment/submissions`
  );
  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to fetch submissions');
  }
  return response.data.submissions;
}

/**
 * Grade a submission (convener only)
 */
export async function gradeSubmission(
  submissionId: number,
  status: 'passed' | 'failed',
  feedback?: string
): Promise<void> {
  const response = await apiClient.post<{ error: boolean; message: string }>(
    `/v1/api/assignment-submissions/${submissionId}/grade`,
    { status, feedback: feedback ?? null }
  );
  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to grade submission');
  }
}
