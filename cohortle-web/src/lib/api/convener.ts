/**
 * Convener API functions
 * Handles programme management operations for conveners
 */

import apiClient from './client';
import { toCamelCase, toSnakeCase } from '../utils/caseTransform';

/**
 * Programme data
 */
export interface Programme {
  id: number;
  name: string;
  description: string;
  startDate: string;
  status: 'draft' | 'published';
  lifecycleStatus?: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  onboarding_mode?: 'code' | 'application' | 'hybrid';
  application_deadline?: string | null;
  max_capacity?: number | null;
  application_form_slug?: string | null;
  enrolledCount?: number;
  enrolled_count?: number;
  cohortCount?: number;
  cohort_count?: number;
}

/**
 * Programme form data for creation/update
 */
export interface ProgrammeFormData {
  name: string;
  description: string;
  startDate: string;
  onboarding_mode?: 'code' | 'application' | 'hybrid';
  application_deadline?: string;
  max_capacity?: number;
  format?: string;
  duration?: string;
  price_info?: string;
  highlights_text?: string;
  learning_outcomes_text?: string;
  prerequisites?: string;
  intro_video_url?: string;
  thumbnail_url?: string;
}

/**
 * Cohort data
 */
export interface Cohort {
  id: number;
  programmeId: number;
  programmeName?: string;
  name: string;
  enrollmentCode: string;
  startDate: string;
  status: 'active' | 'inactive';
  enrolledCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Week data
 */
export interface Week {
  id: string;
  programmeId: number;
  weekNumber: number;
  title: string;
  startDate: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Lesson data
 */
export interface Lesson {
  id: string;
  weekId: string;
  title: string;
  description: string;
  contentType: 'video' | 'pdf' | 'link' | 'text' | 'live_session' | 'quiz' | 'assignment';
  contentUrl: string;
  contentText?: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Week with lessons
 */
export interface WeekWithLessons extends Week {
  lessons: Lesson[];
}

/**
 * Programme detail with cohorts and weeks
 */
export interface ProgrammeDetail extends Programme {
  cohorts: Cohort[];
  weeks: WeekWithLessons[];
}

/**
 * API response wrapper
 */
interface ApiResponse<T> {
  error: boolean;
  message: string;
  data?: T;
  programme?: Programme;
  cohort?: Cohort;
  week?: Week;
  lesson?: Lesson;
  lessons?: Lesson[];
  weeks?: WeekWithLessons[];
  programmes?: Programme[];

}

/**
 * Create a new programme
 * @param data - Programme form data
 * @returns Created programme
 * @throws Error if creation fails
 */
export async function createProgramme(
  data: ProgrammeFormData
): Promise<Programme> {
  // Transform camelCase to snake_case for backend
  // Also convert text fields to arrays
  const { highlights_text, learning_outcomes_text, ...rest } = data;
  const requestData = toSnakeCase({
    ...rest,
    highlights: highlights_text ? highlights_text.split('\n').map(s => s.trim()).filter(Boolean) : undefined,
    learning_outcomes: learning_outcomes_text ? learning_outcomes_text.split('\n').map(s => s.trim()).filter(Boolean) : undefined,
  });

  try {
    const response = await apiClient.post<ApiResponse<Programme>>(
      '/v1/api/programmes',
      requestData
    );

    if (response.data.error) {
      throw new Error(response.data.message || 'Failed to create programme');
    }

    // Transform snake_case response to camelCase for frontend
    return toCamelCase<Programme>(response.data.programme!);
  } catch (error) {
    throw error;
  }
}

/**
 * Update an existing programme
 * @param id - Programme ID
 * @param data - Partial programme form data
 * @returns Updated programme
 * @throws Error if update fails
 */
export async function updateProgramme(
  id: string,
  data: Partial<ProgrammeFormData>
): Promise<Programme> {
  // Transform camelCase to snake_case for backend, convert text fields to arrays
  const { highlights_text, learning_outcomes_text, ...rest } = data;
  const requestData = toSnakeCase({
    ...rest,
    ...(highlights_text !== undefined ? { highlights: highlights_text.split('\n').map(s => s.trim()).filter(Boolean) } : {}),
    ...(learning_outcomes_text !== undefined ? { learning_outcomes: learning_outcomes_text.split('\n').map(s => s.trim()).filter(Boolean) } : {}),
  });

  const response = await apiClient.put<ApiResponse<Programme>>(
    `/v1/api/programmes/${id}`,
    requestData
  );

  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to update programme');
  }

  // PUT route returns no programme body — return a minimal object so callers don't crash
  return (response.data.programme ? toCamelCase<Programme>(response.data.programme) : { id: parseInt(id) } as Programme);
}

/**
 * Get a programme by ID with cohorts and weeks
 * @param id - Programme ID
 * @returns Programme detail
 * @throws Error if programme not found or request fails
 */
export async function getProgramme(id: string): Promise<ProgrammeDetail> {
  const response = await apiClient.get<ApiResponse<ProgrammeDetail>>(
    `/v1/api/programmes/${id}`
  );

  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to fetch programme');
  }

  // Transform snake_case response to camelCase for frontend
  return toCamelCase<ProgrammeDetail>(response.data.programme!);
}

/**
 * Get all programmes created by the current convener
 * @returns Array of programmes
 * @throws Error if request fails
 */
export async function getMyProgrammes(): Promise<Programme[]> {
  const response = await apiClient.get<ApiResponse<Programme[]>>(
    '/v1/api/programmes/my'
  );

  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to fetch programmes');
  }

  // Transform snake_case response to camelCase for frontend
  return toCamelCase<Programme[]>(response.data.programmes || []);
}

/**
 * Publish a programme (make it available to learners)
 * @param id - Programme ID
 * @throws Error if publish fails
 */
export async function publishProgramme(id: string): Promise<void> {
  const response = await apiClient.post<ApiResponse<void>>(
    `/v1/api/programmes/${id}/publish`
  );

  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to publish programme');
  }
}

/**
 * Cohort form data for creation
 */
export interface CohortFormData {
  name: string;
  enrollmentCode: string;
  startDate: string;
}

/**
 * Create a new cohort for a programme
 * @param programmeId - Programme ID
 * @param data - Cohort form data
 * @returns Created cohort
 * @throws Error if creation fails
 */
export async function createCohort(
  programmeId: string,
  data: CohortFormData
): Promise<Cohort> {
  // Transform camelCase to snake_case for backend
  const requestData = toSnakeCase(data);

  console.log('createCohort: Sending request to backend:', {
    programmeId,
    requestData,
    originalData: data
  });

  try {
    const response = await apiClient.post<ApiResponse<Cohort>>(
      `/v1/api/programmes/${programmeId}/cohorts`,
      requestData
    );

    console.log('createCohort: Backend response:', response.data);

    if (response.data.error) {
      throw new Error(response.data.message || 'Failed to create cohort');
    }

    // Transform snake_case response to camelCase for frontend
    return toCamelCase<Cohort>(response.data.cohort!);
  } catch (error) {
    console.error('createCohort: Error occurred:', error);
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as any;
      console.error('createCohort: Response data:', axiosError.response?.data);
      console.error('createCohort: Response status:', axiosError.response?.status);
    }
    throw error;
  }
}

/**
 * Get all cohorts for a programme
 * @param programmeId - Programme ID
 * @returns Array of cohorts
 * @throws Error if request fails
 */
export async function getCohorts(programmeId: string): Promise<Cohort[]> {
  const response = await apiClient.get<ApiResponse<Cohort[]>>(
    `/v1/api/programmes/${programmeId}/cohorts`
  );

  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to fetch cohorts');
  }

  // Transform snake_case response to camelCase for frontend
  return toCamelCase<Cohort[]>((response.data as any).cohorts || response.data.data || []);
}

/**
 * Check if an enrollment code is available (not already in use)
 * @param code - Enrollment code to check
 * @returns True if available, false if already in use
 * @throws Error if request fails
 */
export async function checkEnrollmentCodeAvailability(
  code: string
): Promise<boolean> {
  console.log('checkEnrollmentCodeAvailability: Checking code:', code);

  try {
    const response = await apiClient.get<ApiResponse<{ available: boolean }>>(
      `/v1/api/enrollment-codes/check`,
      {
        params: { code },
      }
    );

    console.log('checkEnrollmentCodeAvailability: Backend response:', response.data);

    if (response.data.error) {
      throw new Error(
        response.data.message || 'Failed to check enrollment code availability'
      );
    }

    // Backend returns available directly in response.data, not in response.data.data
    const available = (response.data as any).available;
    console.log('checkEnrollmentCodeAvailability: Code available:', available);
    return available;
  } catch (error) {
    console.error('checkEnrollmentCodeAvailability: Error occurred:', error);
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as any;
      console.error('checkEnrollmentCodeAvailability: Response data:', axiosError.response?.data);
      console.error('checkEnrollmentCodeAvailability: Response status:', axiosError.response?.status);
    }
    throw error;
  }
}

/**
 * Week form data for creation
 */
export interface WeekFormData {
  weekNumber: number;
  title: string;
  startDate: string;
}

/**
 * Create a new week for a programme
 * @param programmeId - Programme ID
 * @param data - Week form data
 * @returns Created week
 * @throws Error if creation fails
 */
export async function createWeek(
  programmeId: string,
  data: WeekFormData
): Promise<Week> {
  // Transform camelCase to snake_case for backend
  const requestData = toSnakeCase(data);

  console.log('createWeek: Sending request to backend:', {
    programmeId,
    requestData,
    originalData: data
  });

  try {
    const response = await apiClient.post<ApiResponse<Week>>(
      `/v1/api/programmes/${programmeId}/weeks`,
      requestData
    );

    console.log('createWeek: Backend response:', response.data);

    if (response.data.error) {
      throw new Error(response.data.message || 'Failed to create week');
    }

    // Transform snake_case response to camelCase for frontend
    return toCamelCase<Week>(response.data.week!);
  } catch (error) {
    console.error('createWeek: Error occurred:', error);
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as any;
      console.error('createWeek: Response data:', axiosError.response?.data);
      console.error('createWeek: Response status:', axiosError.response?.status);
    }
    throw error;
  }
}

/**
 * Get all weeks for a programme
 * @param programmeId - Programme ID
 * @returns Array of weeks with lessons
 * @throws Error if request fails
 */
export async function getWeeks(programmeId: string): Promise<WeekWithLessons[]> {
  const response = await apiClient.get<ApiResponse<WeekWithLessons[]>>(
    `/v1/api/programmes/${programmeId}/weeks`
  );

  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to fetch weeks');
  }

  // Transform snake_case response to camelCase for frontend
  return toCamelCase<WeekWithLessons[]>(response.data.weeks || []);
}

/**
 * Lesson form data for creation/update
 */
export interface LessonFormData {
  title: string;
  description: string;
  contentType: 'video' | 'pdf' | 'link' | 'text' | 'live_session' | 'quiz' | 'assignment';
  contentUrl: string;
  contentText?: string;
  orderIndex: number;
  /** Native quiz data — only used when contentType === 'quiz' */
  quizData?: import('@/types/quiz').QuizData;
  /** Live session fields — only used when contentType === 'live_session' */
  liveSessionDate?: string;       // datetime-local string
  liveSessionDuration?: number;   // minutes
  liveSessionJoinUrl?: string;
  liveSessionMeetingId?: string;
  liveSessionPasscode?: string;
  /** Assignment data — only used when contentType === 'assignment' */
  assignmentData?: {
    instructions: string;
    due_date?: string | null;
    allow_text_answer: boolean;
    allow_file_uploads: boolean;
    max_file_size_mb?: number;
    allowed_file_types?: string[];
  };
}

/**
 * Create a new lesson for a week
 * @param weekId - Week ID
 * @param data - Lesson form data
 * @returns Created lesson
 * @throws Error if creation fails
 */
export async function createLesson(
  weekId: string,
  data: LessonFormData
): Promise<Lesson> {
  // Prepare request data based on content type
  let requestData: any = {
    title: data.title,
    description: data.description,
    contentType: data.contentType,
    orderIndex: data.orderIndex,
  };

  // For text content, use content_text field
  // For live_session, serialize session data as JSON into content_text
  // For other types, use content_url field
  if (data.contentType === 'text') {
    requestData.contentText = data.contentText || '';
  } else if (data.contentType === 'quiz') {
    // Native quiz — send quiz_data, no URL needed
    if (data.quizData) {
      requestData.quizData = data.quizData;
    }
  } else if (data.contentType === 'assignment') {
    // Assignment — send assignment_data, no URL needed
    if (data.assignmentData) {
      requestData.assignmentData = data.assignmentData;
    }
  } else if (data.contentType === 'live_session') {    // Serialize live session fields into JSON stored in content_text
    const sessionData = {
      scheduled_date: data.liveSessionDate ? new Date(data.liveSessionDate).toISOString() : undefined,
      duration: data.liveSessionDuration,
      join_url: data.liveSessionJoinUrl,
      meeting_id: data.liveSessionMeetingId || undefined,
      passcode: data.liveSessionPasscode || undefined,
    };
    requestData.contentText = JSON.stringify(sessionData);
  } else {
    requestData.contentUrl = data.contentUrl;
  }

  // Transform camelCase to snake_case for backend
  const snakeCaseData = toSnakeCase(requestData);

  console.log('createLesson: Sending request to backend:', {
    weekId,
    snakeCaseData,
    originalData: data
  });

  try {
    const response = await apiClient.post<ApiResponse<Lesson>>(
      `/v1/api/weeks/${weekId}/lessons`,
      snakeCaseData
    );

    console.log('createLesson: Backend response:', response.data);

    if (response.data.error) {
      throw new Error(response.data.message || 'Failed to create lesson');
    }

    // Transform snake_case response to camelCase for frontend
    return toCamelCase<Lesson>(response.data.lesson!);
  } catch (error) {
    console.error('createLesson: Error occurred:', error);
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as any;
      console.error('createLesson: Response data:', axiosError.response?.data);
      console.error('createLesson: Response status:', axiosError.response?.status);
    }
    throw error;
  }
}

/**
 * Update an existing lesson
 * @param lessonId - Lesson ID
 * @param data - Partial lesson form data
 * @returns Updated lesson
 * @throws Error if update fails
 */
export async function updateLesson(
  lessonId: string,
  data: Partial<LessonFormData>
): Promise<Lesson> {
  // Prepare request data based on content type
  let requestData: any = { ...data };

  // Remove contentText if not text type, and contentUrl if text/assignment type
  // to avoid sending wrong field to backend
  if (data.contentType === 'text') {
    delete requestData.contentUrl;
  } else if (data.contentType === 'assignment') {
    delete requestData.contentUrl;
    delete requestData.contentText;
    // assignmentData is kept and will be snake_cased to assignment_data
  } else if (data.contentType) {
    // video, pdf, link, live_session, quiz — no text content
    delete requestData.contentText;
  }

  // Transform camelCase to snake_case for backend
  const snakeCaseData = toSnakeCase(requestData);

  const response = await apiClient.put<ApiResponse<Lesson>>(
    `/v1/api/lessons/${lessonId}`,
    snakeCaseData
  );

  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to update lesson');
  }

  // Transform snake_case response to camelCase for frontend
  return toCamelCase<Lesson>(response.data.lesson!);
}

/**
 * Reorder lessons within a week
 * @param weekId - Week ID
 * @param lessonIds - Array of lesson IDs in the new order
 * @returns Updated lessons array
 * @throws Error if reorder fails
 */
export async function reorderLessons(
  weekId: string,
  lessonIds: string[]
): Promise<Lesson[]> {
  // Transform camelCase to snake_case for backend
  const requestData = toSnakeCase({ lessonIds });

  const response = await apiClient.put<ApiResponse<Lesson[]>>(
    `/v1/api/weeks/${weekId}/lessons/reorder`,
    requestData
  );

  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to reorder lessons');
  }

  // Backend returns reordered lessons under `lessons`.
  return toCamelCase<Lesson[]>(response.data.lessons || response.data.data || []);
}

/**
 * Delete a programme
 * @param id - Programme ID
 * @throws Error if deletion fails
 */
export async function deleteProgramme(id: string): Promise<void> {
  const response = await apiClient.delete<ApiResponse<void>>(
    `/v1/api/programmes/${id}`
  );

  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to delete programme');
  }
}

/**
 * Update an existing cohort
 * @param cohortId - Cohort ID
 * @param data - Partial cohort form data
 * @returns Updated cohort
 * @throws Error if update fails
 */
export async function updateCohort(
  cohortId: string,
  data: Partial<CohortFormData>
): Promise<Cohort> {
  // Transform camelCase to snake_case for backend
  const requestData = toSnakeCase(data);

  const response = await apiClient.put<ApiResponse<Cohort>>(
    `/v1/api/cohorts/${cohortId}`,
    requestData
  );

  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to update cohort');
  }

  // Transform snake_case response to camelCase for frontend
  return toCamelCase<Cohort>(response.data.cohort!);
}

/**
 * Delete a cohort
 * @param cohortId - Cohort ID
 * @throws Error if deletion fails
 */
export async function deleteCohort(cohortId: string): Promise<void> {
  const response = await apiClient.delete<ApiResponse<void>>(
    `/v1/api/cohorts/${cohortId}`
  );

  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to delete cohort');
  }
}

/**
 * Update an existing week
 * @param weekId - Week ID
 * @param data - Partial week form data
 * @returns Updated week
 * @throws Error if update fails
 */
export async function updateWeek(
  weekId: string,
  data: Partial<WeekFormData>
): Promise<Week> {
  // Transform camelCase to snake_case for backend
  const requestData = toSnakeCase(data);

  const response = await apiClient.put<ApiResponse<Week>>(
    `/v1/api/weeks/${weekId}`,
    requestData
  );

  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to update week');
  }

  // Transform snake_case response to camelCase for frontend
  return toCamelCase<Week>(response.data.week!);
}

/**
 * Delete a week
 * @param weekId - Week ID
 * @throws Error if deletion fails
 */
export async function deleteWeek(weekId: string): Promise<void> {
  const response = await apiClient.delete<ApiResponse<void>>(
    `/v1/api/weeks/${weekId}`
  );

  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to delete week');
  }
}

/**
 * Delete a lesson
 * @param lessonId - Lesson ID
 * @throws Error if deletion fails
 */
export async function deleteLesson(lessonId: string): Promise<void> {
  const response = await apiClient.delete<ApiResponse<void>>(
    `/v1/api/lessons/${lessonId}`
  );

  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to delete lesson');
  }
}

/**
 * Learner data with progress (camelCase after toCamelCase transform)
 */
export interface Learner {
  id: number;
  enrollmentId: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImage: string | null;
  status: string;
  paymentStatus?: string | null;
  paymentDueDate?: string | null;
  progress?: number;
  enrolledAt: string;
  completedLessons: number;
  totalLessons: number;
  completionPercentage: number;
  lastActivityAt: string | null;
}

/**
 * Lesson progress data (camelCase after toCamelCase transform)
 */
export interface LessonProgress {
  lessonId: number;
  lessonName: string;
  moduleName: string;
  completed: boolean;
  completedAt: string | null;
}

/**
 * Learner detail with lesson progress
 */
export interface LearnerDetail extends Learner {
  lessonProgress: LessonProgress[];
}

export interface LearnerPayment {
  id: number;
  enrollmentId: number;
  amount: string;
  currency: string;
  status: string;
  paymentType: string;
  provider: string | null;
  providerReference: string | null;
  installmentPlanId: number | null;
  installmentNumber: number | null;
  dueDate: string | null;
  paidAt: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InstallmentPlan {
  id: number;
  enrollmentId: number;
  totalAmount: string;
  currency: string;
  numInstallments: number;
  installmentAmount: string;
  frequency: string;
  startDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface LearnerPaymentDetails {
  enrollment: {
    paymentStatus: string | null;
    paymentDueDate: string | null;
  };
  payments: LearnerPayment[];
  installmentPlan: InstallmentPlan | null;
}

/**
 * Learner history entry for cross-programme view
 */
export interface LearnerHistoryEntry {
  programmeId: number;
  programmeName: string;
  cohortId: number;
  cohortName: string;
  enrolledAt: string;
  status: string;
  completionPercentage: number;
  completedLessons: number;
  totalLessons: number;
}

/**
 * Global learner profile with cross-programme intelligence
 */
export interface GlobalLearnerProfile extends Learner {
  history: LearnerHistoryEntry[];
  stats: {
    overallCompletionRate: number;
    averageProgress: number;
    programmesEnrolled: number;
    programmesCompleted: number;
    activeProgrammesCount: number;
    totalLessonsCompleted: number;
    assignmentsSubmitted: number;
    communityContributions: number;
    learningStreak?: number;
  };
}

/**
 * Learner activity for the timeline
 */
export interface LearnerActivity {
  id: string;
  type:
    | 'enrollment'
    | 'lesson_completion'
    | 'assignment_submission'
    | 'quiz_completion'
    | 'community_post'
    | 'comment'
    | 'achievement'
    | 'programme_completion';
  title: string;
  description?: string;
  timestamp: string;
  programmeId?: number;
  programmeName?: string;
  metadata?: Record<string, any>;
}

/**
 * Get all learners in a cohort with their progress
 * @param cohortId - Cohort ID
 * @returns Array of learners with progress
 * @throws Error if request fails
 */
export async function getCohortLearners(cohortId: string): Promise<Learner[]> {
  const response = await apiClient.get<ApiResponse<Learner[]>>(
    `/v1/api/cohorts/${cohortId}/learners`
  );

  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to fetch learners');
  }

  // Backend returns learners in snake_case, transform to camelCase
  return toCamelCase<Learner[]>((response.data as any).learners || []);
}

/**
 * Get a specific learner's details and progress in a cohort
 * @param cohortId - Cohort ID
 * @param learnerId - Learner ID
 * @returns Learner detail with lesson progress
 * @throws Error if request fails
 */
export async function getLearnerDetail(
  cohortId: string,
  learnerId: string
): Promise<LearnerDetail> {
  const response = await apiClient.get<ApiResponse<LearnerDetail>>(
    `/v1/api/cohorts/${cohortId}/learners/${learnerId}`
  );

  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to fetch learner details');
  }

  // Backend returns learner in snake_case, transform to camelCase
  return toCamelCase<LearnerDetail>((response.data as any).learner);
}
/**
 * Get global learner profile with cross-programme history and stats
 * @param learnerId - Learner ID
 * @returns Global learner profile
 */
export async function getGlobalLearnerProfile(
  learnerId: string
): Promise<GlobalLearnerProfile> {
  const response = await apiClient.get<ApiResponse<GlobalLearnerProfile>>(
    `/v1/api/convener/learners/${learnerId}/profile`
  );

  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to fetch global learner profile');
  }

  return toCamelCase<GlobalLearnerProfile>((response.data as any).profile || response.data.data);
}

/**
 * Get learner activity timeline
 * @param learnerId - Learner ID
 * @param filters - Optional filters (programme_id, date range, etc.)
 * @returns Array of learner activities
 */
export async function getLearnerActivity(
  learnerId: string,
  params?: { programme_id?: string; limit?: number }
): Promise<LearnerActivity[]> {
  const response = await apiClient.get<ApiResponse<LearnerActivity[]>>(
    `/v1/api/convener/learners/${learnerId}/activity`,
    { params }
  );

  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to fetch learner activity');
  }

  return toCamelCase<LearnerActivity[]>((response.data as any).activities || response.data.data || []);
}

/**
 * Get a specific learner's payments and installment plan for a cohort
 * @param cohortId - Cohort ID
 * @param learnerId - Learner ID
 */
export async function getLearnerPayments(
  cohortId: string,
  learnerId: string
): Promise<LearnerPaymentDetails> {
  const response = await apiClient.get<ApiResponse<LearnerPaymentDetails>>(
    `/v1/api/cohorts/${cohortId}/learners/${learnerId}/payments`
  );

  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to fetch learner payment details');
  }

  return toCamelCase<LearnerPaymentDetails>((response.data as any));
>>>>>>> c1a9f69 (Wire cohort learner page to real cohort metadata and expose payment details)
export async function getLearnerPayments(
  cohortId: string,
  learnerId: string
): Promise<LearnerPaymentDetails> {
  const response = await apiClient.get<ApiResponse<LearnerPaymentDetails>>(
    `/v1/api/cohorts/${cohortId}/learners/${learnerId}/payments`
  );

  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to fetch learner payment details');
  }

  return toCamelCase<LearnerPaymentDetails>((response.data as any));
>>>>>>> c1a9f69 (Wire cohort learner page to real cohort metadata and expose payment details)
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface WeekAnalytics {
  weekId: string;
  weekNumber: number;
  weekTitle: string;
  totalLessons: number;
  totalCompletions: number;
  completionRate: number;
}

export interface LessonAnalytics {
  lessonId: string;
  lessonTitle: string;
  contentType: string;
  orderIndex: number;
  weekId: string;
  weekNumber: number;
  weekTitle: string;
  completedCount: number;
  completionRate: number;
}

export interface CohortAnalytics {
  memberCount: number;
  totalLessons: number;
  totalCompletions: number;
  overallCompletionRate: number;
  weeks: WeekAnalytics[];
  lessons: LessonAnalytics[];
}

/**
 * Get detailed analytics for a cohort
 * @param cohortId - Cohort ID
 * @returns Analytics data with per-week and per-lesson breakdowns
 */
export async function getCohortAnalytics(cohortId: string): Promise<CohortAnalytics> {
  const response = await apiClient.get<{ error: boolean; message: string; data: any }>(
    `/v1/api/cohorts/${cohortId}/analytics`
  );

  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to fetch analytics');
  }

  return toCamelCase<CohortAnalytics>(response.data.data);
}

export interface CohortHealth {
  cohortId: string;
  totalLearners: number;
  overallScore: number;
  healthDistribution: {
    healthy: number;
    monitor: number;
    atRisk: number;
    critical: number;
  };
  engagementScore: number;
  completionRate: number;
  onTimeRate: number;
  progressVelocity: string;
  trend: 'up' | 'stable' | 'down';
  topIssues: Array<{ issue: string; count: number }>;
  calculatedAt: string;
}

export interface AtRiskLearner {
  enrollmentId: number;
  learnerName: string;
  riskScore: number;
  healthStatus: string;
  primaryIssues: string[];
  scoreBreakdown: Record<string, number>;
  metrics?: Record<string, any>;
  actionRecommended: string;
}

export interface AtRiskLearnerResponse {
  learners: AtRiskLearner[];
  count: number;
  threshold: number;
}

export interface AlertReport {
  enrollmentId: number;
  learnerName: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  suggestedAction: string;
  details: Record<string, any>;
  createdAt: string;
}

export interface CohortAlertsResponse {
  cohortId: string;
  alerts: AlertReport[];
  statistics: {
    totalAlerts: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    criticalCount: number;
    highCount: number;
    topAlertType: string;
  };
  timeWindow: string;
}

export interface LearnerProgressAnalytics {
  enrollmentId: string;
  learnerName: string;
  weekNumber: number;
  expectedProgress: number;
  actualProgress: number;
  progressDifference: number;
  velocity: string;
  onTrack: boolean;
  daysSinceEnrollment: number;
  predictedCompletionDate: string;
  status: string;
  completionPercentage: number;
}

export interface CohortEngagementAnalytics {
  cohortId: string;
  learners: Array<{
    enrollmentId: number;
    learnerName: string;
    engagementScore: number;
    activityFrequency: number;
    participationDepth: number;
    consistency: number;
    lastActivityAt: string | null;
    sessionsAttended: number;
    notesCount: number;
  }>;
  statistics: {
    averageEngagementScore: number;
    totalLearners: number;
    distribution: {
      high: number;
      medium: number;
      low: number;
    };
    mostActive: {
      enrollmentId: number;
      learnerName: string;
      engagementScore: number;
    };
    leastActive: {
      enrollmentId: number;
      learnerName: string;
      engagementScore: number;
    };
  };
}

export interface CohortCommunicationReport {
  cohortId: string;
  statistics: {
    totalMessagesSent: number;
    averageMessagesPerLearner: number;
    deliveryRate: number;
    readRate: number;
    actionRate: number;
    byChannel: Record<string, {
      sent: number;
      deliveryRate: number;
      openRate: number;
    }>;
  };
  periodAnalyzed: {
    startDate: string;
    endDate: string;
    days: number;
  };
}

export interface CohortAttendanceReport {
  cohortId: string;
  summary: {
    totalEvents: number;
    totalAttended: number;
    totalAbsent: number;
    attendanceRate: number;
  };
  eventTypes: Record<string, {
    attended: number;
    absent: number;
    excused: number;
    total: number;
  }>;
  learners: Array<{
    enrollmentId: number;
    learnerName: string;
    attended: number;
    absent: number;
    excused: number;
    total: number;
    attendanceRate: number;
  }>;
}

export interface CohortBenchmarkReport {
  cohortId: string;
  targets: {
    completionRate: number;
    averageScore: number;
    engagementScore: number;
    assignmentSubmission: number;
    onTimeCompletion: number;
    attendanceRate: number;
    learnerSatisfaction: number;
  };
  actuals: {
    completionRate: number;
    averageScore: number;
    engagementScore: number;
    assignmentSubmission: number;
    onTimeCompletion: number;
    attendanceRate: number;
    learnerSatisfaction: number;
  };
  performance: {
    completionRate: { actual: number; target: number; variance: number };
    onTimeCompletion: { actual: number; target: number; variance: number };
  };
  areasOfConcern: string[];
}

export async function getCohortHealth(cohortId: string): Promise<CohortHealth> {
  const response = await apiClient.get<{ success: boolean; data: any }>(
    `/v1/api/analytics/cohorts/${cohortId}/health`
  );

  if (!response.data.success) {
    throw new Error('Failed to fetch cohort health');
  }

  return toCamelCase<CohortHealth>(response.data.data);
}

export async function getAtRiskLearners(
  cohortId: string,
  threshold = 51,
  limit = 100
): Promise<AtRiskLearnerResponse> {
  const response = await apiClient.get<{ success: boolean; data: any }>(
    `/v1/api/analytics/cohorts/${cohortId}/at-risk?threshold=${threshold}&limit=${limit}`
  );

  if (!response.data.success) {
    throw new Error('Failed to fetch at-risk learners');
  }

  return toCamelCase<AtRiskLearnerResponse>(response.data.data);
}

export async function getLearnerProgressAnalytics(
  enrollmentId: string
): Promise<LearnerProgressAnalytics> {
  const response = await apiClient.get<{ success: boolean; data: any }>(
    `/v1/api/analytics/enrollments/${enrollmentId}/progress`
  );

  if (!response.data.success) {
    throw new Error('Failed to fetch learner progress analytics');
  }

  return toCamelCase<LearnerProgressAnalytics>(response.data.data);
}

export async function getCohortEngagementReport(
  cohortId: string
): Promise<CohortEngagementAnalytics> {
  const response = await apiClient.get<{ success: boolean; data: any }>(
    `/v1/api/analytics/cohorts/${cohortId}/engagement`
  );

  if (!response.data.success) {
    throw new Error('Failed to fetch cohort engagement analytics');
  }

  return toCamelCase<CohortEngagementAnalytics>(response.data.data);
}

export async function getCohortCommunicationReport(
  cohortId: string
): Promise<CohortCommunicationReport> {
  const response = await apiClient.get<{ success: boolean; data: any }>(
    `/v1/api/analytics/cohorts/${cohortId}/communication`
  );

  if (!response.data.success) {
    throw new Error('Failed to fetch communication report');
  }

  return toCamelCase<CohortCommunicationReport>(response.data.data);
}

export async function getCohortAttendanceReport(
  cohortId: string
): Promise<CohortAttendanceReport> {
  const response = await apiClient.get<{ success: boolean; data: any }>(
    `/v1/api/analytics/cohorts/${cohortId}/attendance`
  );

  if (!response.data.success) {
    throw new Error('Failed to fetch attendance report');
  }

  return toCamelCase<CohortAttendanceReport>(response.data.data);
}

export async function getCohortAlerts(
  cohortId: string,
  hours = 48
): Promise<CohortAlertsResponse> {
  const response = await apiClient.get<{ success: boolean; data: any }>(
    `/v1/api/analytics/cohorts/${cohortId}/alerts?hours=${hours}`
  );

  if (!response.data.success) {
    throw new Error('Failed to fetch cohort alerts');
  }

  return toCamelCase<CohortAlertsResponse>(response.data.data);
}

export async function getLearnerAlerts(
  enrollmentId: string
): Promise<{ alerts: AlertReport[]; alertCount: number; criticalCount: number }> {
  const response = await apiClient.get<{ success: boolean; data: any }>(
    `/v1/api/analytics/enrollments/${enrollmentId}/alerts`
  );

  if (!response.data.success) {
    throw new Error('Failed to fetch learner alerts');
  }

  return toCamelCase<{ alerts: AlertReport[]; alertCount: number; criticalCount: number }>(
    response.data.data
  );
}

export async function getCohortBenchmark(
  cohortId: string
): Promise<CohortBenchmarkReport> {
  const response = await apiClient.get<{ success: boolean; data: any }>(
    `/v1/api/analytics/cohorts/${cohortId}/benchmark`
  );

  if (!response.data.success) {
    throw new Error('Failed to fetch cohort benchmark report');
  }

  return toCamelCase<CohortBenchmarkReport>(response.data.data);
}

// ── Organisation Stats ──

export interface OrgStats {
  total_learners: number;
  programmes_completed: number;
  success_rate: number;
  years_experience: number;
}

export async function getOrgStats(): Promise<OrgStats> {
  const res = await apiClient.get<{ error: boolean; stats: OrgStats }>('/v1/api/convener/org/stats');
  if (res.data.error) throw new Error('Failed to fetch stats');
  return res.data.stats;
}

export async function updateOrgStats(stats: OrgStats): Promise<OrgStats> {
  const res = await apiClient.put<{ error: boolean; stats: OrgStats }>('/v1/api/convener/org/stats', stats);
  if (res.data.error) throw new Error('Failed to update stats');
  return res.data.stats;
}

// ── Testimonials ──

export interface Testimonial {
  id?: number;
  learner_name: string;
  learner_avatar?: string;
  programme_name?: string;
  quote: string;
  rating: number;
  is_featured: boolean;
}

export async function getTestimonials(): Promise<Testimonial[]> {
  const res = await apiClient.get<{ error: boolean; testimonials: Testimonial[] }>('/v1/api/convener/org/testimonials');
  if (res.data.error) throw new Error('Failed to fetch testimonials');
  return res.data.testimonials;
}

export async function createTestimonial(t: Testimonial): Promise<Testimonial> {
  const res = await apiClient.post<{ error: boolean; testimonial: Testimonial }>('/v1/api/convener/org/testimonials', t);
  if (res.data.error) throw new Error('Failed to create testimonial');
  return res.data.testimonial;
}

export async function updateTestimonial(id: number, t: Partial<Testimonial>): Promise<Testimonial> {
  const res = await apiClient.put<{ error: boolean; testimonial: Testimonial }>(`/v1/api/convener/org/testimonials/${id}`, t);
  if (res.data.error) throw new Error('Failed to update testimonial');
  return res.data.testimonial;
}

export async function deleteTestimonial(id: number): Promise<void> {
  await apiClient.delete(`/v1/api/convener/org/testimonials/${id}`);
}

// ── FAQs ──

export interface OrgFaq {
  id?: number;
  question: string;
  answer: string;
  order_index: number;
}

export async function getOrgFaqs(): Promise<OrgFaq[]> {
  const res = await apiClient.get<{ error: boolean; faqs: OrgFaq[] }>('/v1/api/convener/org/faqs');
  if (res.data.error) throw new Error('Failed to fetch FAQs');
  return res.data.faqs;
}

export async function createOrgFaq(faq: OrgFaq): Promise<OrgFaq> {
  const res = await apiClient.post<{ error: boolean; faq: OrgFaq }>('/v1/api/convener/org/faqs', faq);
  if (res.data.error) throw new Error('Failed to create FAQ');
  return res.data.faq;
}

export async function updateOrgFaq(id: number, faq: Partial<OrgFaq>): Promise<OrgFaq> {
  const res = await apiClient.put<{ error: boolean; faq: OrgFaq }>(`/v1/api/convener/org/faqs/${id}`, faq);
  if (res.data.error) throw new Error('Failed to update FAQ');
  return res.data.faq;
}

export async function deleteOrgFaq(id: number): Promise<void> {
  await apiClient.delete(`/v1/api/convener/org/faqs/${id}`);
}

// ── Org Analytics ──

export interface OrgAnalytics {
  total_views: number;
  views_30d: number;
  views_7d: number;
  applications_30d: number;
  conversion_rate: string;
  daily: Array<{ date: string; views: number }>;
}

export async function getOrgAnalytics(): Promise<OrgAnalytics> {
  const res = await apiClient.get<{ error: boolean; analytics: OrgAnalytics }>('/v1/api/convener/org/analytics');
  if (res.data.error) throw new Error('Failed to fetch analytics');
  return res.data.analytics;
}

export async function syncOrgStats(): Promise<OrgStats> {
  const res = await apiClient.post<{ error: boolean; stats: OrgStats }>('/v1/api/convener/org/stats/sync');
  if (res.data.error) throw new Error('Failed to sync stats');
  return res.data.stats;
}

// ─── Testimonial Collection Links ────────────────────────────────────────────

export interface CollectionLink {
  id: string;
  token: string;
  cohortId?: number;
  cohort_id?: number;
  cohortName?: string;
  programmeName?: string;
  autoApprove?: boolean;
  auto_approve?: boolean;
  expiresAt?: string | null;
  expires_at?: string | null;
  revokedAt?: string | null;
  revoked_at?: string | null;
  submissionCount?: number;
  submission_count?: number;
  status?: 'active' | 'expired' | 'revoked';
  url?: string;
}

export async function getCollectionLink(cohortId: number): Promise<CollectionLink | null> {
  try {
    const res = await apiClient.get<{ error: boolean; link: CollectionLink | null; url: string | null }>(
      `/v1/api/cohorts/${cohortId}/collection-link`
    );
    if (res.data.error || !res.data.link) return null;
    return { ...res.data.link, url: res.data.url ?? undefined };
  } catch {
    return null;
  }
}

export async function createCollectionLink(cohortId: number): Promise<{ link: CollectionLink; url: string }> {
  const res = await apiClient.post<{ error: boolean; link: CollectionLink; url: string }>(
    `/v1/api/cohorts/${cohortId}/collection-link`
  );
  if (res.data.error) throw new Error('Failed to create collection link');
  return { link: res.data.link, url: res.data.url };
}

export async function updateCollectionLink(
  cohortId: number,
  settings: { auto_approve?: boolean; expires_at?: string | null }
): Promise<CollectionLink> {
  const res = await apiClient.put<{ error: boolean; link: CollectionLink }>(
    `/v1/api/cohorts/${cohortId}/collection-link`,
    settings
  );
  if (res.data.error) throw new Error('Failed to update collection link');
  return res.data.link;
}

export async function revokeCollectionLink(cohortId: number): Promise<void> {
  await apiClient.delete(`/v1/api/cohorts/${cohortId}/collection-link`);
}

export async function regenerateCollectionLink(cohortId: number): Promise<{ link: CollectionLink; url: string }> {
  const res = await apiClient.post<{ error: boolean; link: CollectionLink; url: string }>(
    `/v1/api/cohorts/${cohortId}/collection-link/regenerate`
  );
  if (res.data.error) throw new Error('Failed to regenerate collection link');
  return { link: res.data.link, url: res.data.url };
}

export async function listCollectionLinks(): Promise<CollectionLink[]> {
  const res = await apiClient.get<{ error: boolean; links: CollectionLink[] }>(
    '/v1/api/convener/collection-links'
  );
  if (res.data.error) throw new Error('Failed to fetch collection links');
  return res.data.links;
}

// ─── Learner Operations ───────────────────────────────────────────────────────

/**
 * Learner note
 */
export interface LearnerNote {
  id: number;
  enrollmentId: number;
  noteType: 'support' | 'intervention' | 'engagement' | 'achievement' | 'issue' | 'follow_up' | 'general';
  content: string;
  createdBy: number;
  createdAt: string;
  linkedEntityType?: string;
  linkedEntityId?: number;
  creator?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

/**
 * Communication event
 */
export interface CommunicationEvent {
  id: number;
  enrollmentId: number;
  channel: 'email' | 'in_app' | 'sms' | 'notification';
  templateId?: number;
  subject?: string;
  bodyPreview?: string;
  createdBy: number;
  createdAt: string;
  deliveryStatus: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  deliveryTimestamp?: string;
  readAt?: string;
}

/**
 * Attendance record
 */
export interface AttendanceRecord {
  id: number;
  enrollmentId: number;
  cohortId: number;
  eventType: 'live_session' | 'workshop' | 'office_hours' | 'group_activity' | 'milestone_check_in';
  eventDate: string;
  status: 'attended' | 'absent' | 'late' | 'excused' | 'pending';
  recordedBy?: number;
  recordedAt: string;
  notes?: string;
}

/**
 * Suspend a learner with a reason
 * @param enrollmentId - Enrollment ID
 * @param reason - Reason for suspension
 * @returns Updated enrollment
 */
export async function suspendLearner(
  enrollmentId: number,
  reason: string
): Promise<any> {
  const response = await apiClient.patch<{ error: boolean; message: string; enrollment: any }>(
    `/v1/api/enrollments/${enrollmentId}/suspend`,
    { reason }
  );

  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to suspend learner');
  }

  return toCamelCase(response.data.enrollment);
}

/**
 * Reactivate a suspended learner
 * @param enrollmentId - Enrollment ID
 * @param reason - Optional reason for reactivation
 * @returns Updated enrollment
 */
export async function reactivateLearner(
  enrollmentId: number,
  reason?: string
): Promise<any> {
  const response = await apiClient.patch<{ error: boolean; message: string; enrollment: any }>(
    `/v1/api/enrollments/${enrollmentId}/reactivate`,
    { reason }
  );

  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to reactivate learner');
  }

  return toCamelCase(response.data.enrollment);
}

/**
 * Remove a learner permanently
 * @param enrollmentId - Enrollment ID
 * @param reason - Reason for removal
 * @returns Updated enrollment
 */
export async function removeLearner(
  enrollmentId: number,
  reason: string
): Promise<any> {
  const response = await apiClient.patch<{ error: boolean; message: string; enrollment: any }>(
    `/v1/api/enrollments/${enrollmentId}/remove`,
    { reason }
  );

  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to remove learner');
  }

  return toCamelCase(response.data.enrollment);
}

/**
 * Add a note for a learner
 * @param enrollmentId - Enrollment ID
 * @param noteType - Type of note (support, intervention, etc.)
 * @param content - Note content
 * @param linkedEntityType - Optional entity type this note relates to
 * @param linkedEntityId - Optional entity ID this note relates to
 * @returns Created note
 */
export async function addLearnerNote(
  enrollmentId: number,
  noteType: string,
  content: string,
  linkedEntityType?: string,
  linkedEntityId?: number
): Promise<LearnerNote> {
  const response = await apiClient.post<{ error: boolean; message: string; note: any }>(
    `/v1/api/enrollments/${enrollmentId}/notes`,
    {
      note_type: noteType,
      content,
      linked_entity_type: linkedEntityType,
      linked_entity_id: linkedEntityId
    }
  );

  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to add note');
  }

  return toCamelCase<LearnerNote>(response.data.note);
}

/**
 * Get notes for a learner
 * @param enrollmentId - Enrollment ID
 * @param noteType - Optional filter by note type
 * @param limit - Number of notes to fetch
 * @param offset - Pagination offset
 * @returns Notes and total count
 */
export async function getLearnerNotes(
  enrollmentId: number,
  noteType?: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ notes: LearnerNote[]; total: number }> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString()
  });

  if (noteType) {
    params.append('note_type', noteType);
  }

  const response = await apiClient.get<{ error: boolean; notes: any[]; total: number }>(
    `/v1/api/enrollments/${enrollmentId}/notes?${params.toString()}`
  );

  if (response.data.error) {
    throw new Error('Failed to fetch notes');
  }

  return {
    notes: toCamelCase<LearnerNote[]>(response.data.notes || []),
    total: response.data.total || 0
  };
}

/**
 * Send communication to a learner
 * @param enrollmentId - Enrollment ID
 * @param channel - Communication channel (email, in_app, sms, notification)
 * @param subject - Email subject or notification title
 * @param bodyPreview - Message preview/content
 * @param templateId - Optional template ID
 * @returns Created communication event
 */
export async function sendCommunicationToLearner(
  enrollmentId: number,
  channel: string,
  subject: string,
  bodyPreview: string,
  templateId?: number
): Promise<CommunicationEvent> {
  const response = await apiClient.post<{ error: boolean; message: string; communication: any }>(
    `/v1/api/enrollments/${enrollmentId}/communicate`,
    {
      channel,
      subject,
      body_preview: bodyPreview,
      template_id: templateId
    }
  );

  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to send communication');
  }

  return toCamelCase<CommunicationEvent>(response.data.communication);
}

/**
 * Record attendance for a learner
 * @param enrollmentId - Enrollment ID
 * @param eventType - Type of event
 * @param eventDate - Date of the event
 * @param status - Attendance status (attended, absent, late, excused, pending)
 * @param notes - Optional notes about attendance
 * @returns Created attendance record
 */
export async function recordLearnerAttendance(
  enrollmentId: number,
  eventType: string,
  eventDate: string,
  status: string,
  notes?: string
): Promise<AttendanceRecord> {
  const response = await apiClient.post<{ error: boolean; message: string; attendance: any }>(
    `/v1/api/enrollments/${enrollmentId}/attendance`,
    {
      event_type: eventType,
      event_date: eventDate,
      status,
      notes
    }
  );

  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to record attendance');
  }

  return toCamelCase<AttendanceRecord>(response.data.attendance);
}
