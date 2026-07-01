/**
 * Programme and Module API functions
 * Handles fetching modules and lessons for communities
 * Also handles programme discovery and enrollment
 */

import apiClient from './client';

// ============================================================================
// Programme Discovery Types
// ============================================================================

/**
 * Public programme data for catalogue display
 */
export interface PublicProgramme {
  id: number;
  name: string;
  description: string;
  thumbnail?: string;
  weekCount: number;
  lessonCount: number;
  duration: string; // e.g., "8 weeks"
}

export interface DiscoverProgramme {
  id: number;
  name: string;
  description: string | null;
  application_deadline: string | null;
  application_form_slug: string | null;
  onboarding_mode: 'application' | 'hybrid';
  lifecycle_status: 'recruiting';
  format: 'online' | 'in-person' | 'hybrid' | null;
  duration: string | null;
  highlights: string[] | null;
  learning_outcomes: string[] | null;
  prerequisites: string | null;
  price_info: string | null;
  thumbnail_url: string | null;
  organisation_slug: string | null;
  organisation_name: string;
  organisation_url: string | null;
  apply_url: string | null;
}

export interface DiscoverProgrammesResponse {
  error: boolean;
  message: string;
  programmes: DiscoverProgramme[];
}

/**
 * Week summary for programme details
 */
export interface WeekSummary {
  weekNumber: number;
  title: string;
  lessonCount: number;
}

/**
 * Detailed programme information for public view
 */
export interface ProgrammeDetail {
  id: number;
  name: string;
  description: string;
  thumbnail?: string;
  weeks: WeekSummary[];
  prerequisites?: string;
  totalLessons: number;
  estimatedDuration: string;
}

/**
 * Public programmes response
 */
export interface PublicProgrammesResponse {
  error: boolean;
  message: string;
  programmes: PublicProgramme[];
}

/**
 * Programme detail response
 */
export interface ProgrammeDetailResponse {
  error: boolean;
  message: string;
  programme: ProgrammeDetail;
}

// ============================================================================
// Module and Lesson Types (Existing)
// ============================================================================

/**
 * Module data
 */
export interface Module {
  id: string;
  name: string;
  description: string;
  lessonCount: number;
  completedLessons: number;
  order: number;
  communityId: string;
}

/**
 * Lesson data
 */
export interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'text' | 'pdf' | 'quiz' | 'link' | 'live_session';
  duration?: number;
  isCompleted: boolean;
  order: number;
  moduleId: string;
}

/**
 * Community modules response
 */
export interface CommunityModulesResponse {
  programme: {
    id: string;
    name: string;
    description: string;
  };
  data: Module[];
}

/**
 * Module lessons response
 */
export interface ModuleLessonsResponse {
  module: {
    id: string;
    name: string;
    description: string;
  };
  data: Lesson[];
}

/**
 * Get modules for a community/programme
 * @param communityId - ID of the community
 * @returns Community modules data
 */
export async function getCommunityModules(
  communityId: string
): Promise<CommunityModulesResponse> {
  const response = await apiClient.get<CommunityModulesResponse>(
    `/api/communities/${communityId}/modules`
  );
  return response.data;
}

/**
 * Get lessons for a module
 * @param moduleId - ID of the module
 * @returns Module lessons data
 */
export async function getModuleLessons(
  moduleId: string
): Promise<ModuleLessonsResponse> {
  const response = await apiClient.get<ModuleLessonsResponse>(
    `/api/modules/${moduleId}/lessons`
  );
  return response.data;
}

// ============================================================================
// Programme Discovery Functions
// ============================================================================

/**
 * Get all public programmes for the catalogue
 * No authentication required
 * @returns Array of public programmes
 * @throws Error if request fails
 */
export async function getPublicProgrammes(): Promise<PublicProgramme[]> {
  const response = await apiClient.get<PublicProgrammesResponse>(
    '/v1/api/programmes/public'
  );
  
  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to fetch public programmes');
  }
  
  return response.data.programmes;
}

export async function getDiscoverProgrammes(params: Record<string, string> = {}): Promise<DiscoverProgramme[]> {
  const response = await apiClient.get<DiscoverProgrammesResponse>(
    '/v1/api/programmes/discover',
    { params }
  );

  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to fetch discoverable programmes');
  }

  return response.data.programmes;
}

/**
 * Get detailed information about a specific programme
 * No authentication required
 * @param id - Programme ID
 * @returns Detailed programme information including weeks and lesson counts
 * @throws Error if programme not found or request fails
 */
export async function getProgrammeDetail(id: number): Promise<ProgrammeDetail> {
  const response = await apiClient.get<ProgrammeDetailResponse>(
    `/v1/api/programmes/${id}/public`
  );
  
  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to fetch programme details');
  }
  
  return response.data.programme;
}

// ============================================================================
// Enrollment Functions (Existing)
// ============================================================================

/**
 * Enrollment response from the API
 */
export interface EnrollmentResponse {
  success: boolean;
  programme_id: string;
  programme_name: string;
  cohort_id: string;
}

/**
 * Enrolled programme data
 */
export interface EnrolledProgramme {
  id: number;
  name: string;
  description: string;
  currentWeek: number;
  totalWeeks: number;
  cohortId: number;
  cohortName: string;
  enrolledAt: string;
}

/**
 * Enrolled programmes response
 */
export interface EnrolledProgrammesResponse {
  error: boolean;
  message: string;
  programmes: EnrolledProgramme[];
}

/**
 * Get all programmes the current user is enrolled in
 * @returns Array of enrolled programmes with current week information
 * @throws Error if request fails
 */
export async function getEnrolledProgrammes(): Promise<EnrolledProgramme[]> {
  const response = await apiClient.get<EnrolledProgrammesResponse>(
    '/v1/api/programmes/enrolled'
  );
  
  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to fetch enrolled programmes');
  }
  
  return response.data.programmes;
}

/**
 * Enroll in a programme using an enrollment code
 * @param code - Enrollment code in format PROGRAMME-YEAR (e.g., WLIMP-2026)
 * @returns Enrollment response with programme details
 * @throws Error if code is invalid or enrollment fails
 */
export async function enrollInProgramme(
  code: string
): Promise<EnrollmentResponse> {
  try {
    const response = await apiClient.post<{ 
      error: boolean;
      success: boolean;
      programme_id: string;
      programme_name: string;
      cohort_id: string;
      message?: string;
    }>(
      '/v1/api/programmes/enroll',
      { code }
    );
    
    if (response.data.error) {
      throw new Error(response.data.message || 'Enrollment failed');
    }
    
    return {
      success: response.data.success,
      programme_id: response.data.programme_id,
      programme_name: response.data.programme_name,
      cohort_id: response.data.cohort_id,
    };
  } catch (error: unknown) {
    const apiError = error as {
      response?: {
        data?: {
          message?: string;
          validation?: Record<string, string>;
        };
      };
    };

    // Extract error message from axios error response
    if (apiError.response?.data?.message) {
      throw new Error(apiError.response.data.message);
    }
    
    // Handle validation errors
    if (apiError.response?.data?.validation) {
      const validationErrors = apiError.response.data.validation;
      const firstError = Object.values(validationErrors)[0];
      throw new Error(firstError as string);
    }
    
    // Re-throw if already an Error
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Enrollment failed. Please try again.');
  }
}

/**
 * Lesson data for WLIMP programmes
 */
export interface WLIMPLesson {
  id: string;
  title: string;
  description: string;
  content_type: string;
  content_url: string;
  order_index: number;
  completed?: boolean;
  completed_at?: string | null;
}

/**
 * Week data for WLIMP programmes
 */
export interface WLIMPWeek {
  id: string;
  programme_id: string;
  week_number: number;
  title: string;
  start_date: string;
  isCurrent: boolean;
  isLocked?: boolean;
  locked_until?: string | null;
  lessons: WLIMPLesson[];
}

/**
 * Programme weeks response
 */
export interface ProgrammeWeeksResponse {
  error: boolean;
  message: string;
  weeks: WLIMPWeek[];
}

/**
 * Get weeks for a programme with lessons
 * @param programmeId - ID of the programme
 * @param cohortId - Optional cohort ID for current week calculation
 * @returns Programme weeks with lessons
 * @throws Error if programme not found or request fails
 */
export async function getProgrammeWeeks(
  programmeId: string,
  cohortId?: string
): Promise<WLIMPWeek[]> {
  const url = cohortId 
    ? `/v1/api/programmes/${programmeId}/weeks?cohort_id=${cohortId}`
    : `/v1/api/programmes/${programmeId}/weeks`;
    
  const response = await apiClient.get<ProgrammeWeeksResponse>(url);
  
  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to fetch programme weeks');
  }
  
  return response.data.weeks;
}

/**
 * Lesson detail data for WLIMP programmes
 */
export interface WLIMPLessonDetail {
  id: string;
  title: string;
  description: string;
  content_type: string;
  content_url: string;
  week_number: number;
  week_title: string;
  week_start_date?: string | null;
  programme_id: number;
  programme_name: string;
}

/**
 * Lesson detail response
 */
export interface LessonDetailResponse {
  error: boolean;
  message: string;
  lesson: WLIMPLessonDetail;
}

/**
 * Get a lesson by ID with week and programme metadata
 * @param lessonId - ID of the lesson (UUID)
 * @returns Lesson detail with week and programme information
 * @throws Error if lesson not found or request fails
 */
export async function getLessonById(
  lessonId: string
): Promise<WLIMPLessonDetail> {
  const response = await apiClient.get<LessonDetailResponse>(
    `/v1/api/lessons/${lessonId}`
  );
  
  if (response.data.error) {
    throw new Error(response.data.message || 'Failed to fetch lesson');
  }
  
  return response.data.lesson;
}

/**
 * Lesson navigation data
 */
export interface LessonNavigation {
  hasPrevious: boolean;
  hasNext: boolean;
  previousLessonId: string | null;
  nextLessonId: string | null;
}

/**
 * Get previous/next lesson IDs for a given lesson
 * @param lessonId - UUID of the current lesson
 * @param cohortId - Cohort ID for context
 */
export async function getLessonNavigation(
  lessonId: string,
  cohortId: string
): Promise<LessonNavigation> {
  const response = await apiClient.get<{ error: boolean; navigation: LessonNavigation }>(
    `/v1/api/lessons/${lessonId}/navigation?cohort_id=${cohortId}`
  );
  return response.data.navigation;
}

/**
 * Check if the current user is enrolled in a programme
 * @param programmeId - ID of the programme to check
 * @returns True if enrolled, false otherwise
 */
export async function isEnrolledInProgramme(
  programmeId: string
): Promise<boolean> {
  try {
    const enrolledProgrammes = await getEnrolledProgrammes();
    return enrolledProgrammes.some(p => p.id.toString() === programmeId);
  } catch (error) {
    console.error('Error checking enrollment:', error);
    return false;
  }
}
