/**
 * TypeScript interfaces for WLIMP Programme Rollout
 * 
 * These interfaces define the data structures for the WLIMP feature,
 * matching the database schema and providing type safety for API operations.
 */

/**
 * Programme interface
 * Represents a structured learning programme with weeks and lessons
 */
export interface Programme {
  id: number;
  community_id: number;
  name: string;
  description: string | null;
  start_date: Date | null;
  end_date: Date | null;
  metadata: Record<string, any> | null;
  status: string;
  type: 'scheduled' | 'structured' | 'self_paced';
  settings: Record<string, any> | null;
  created_by: number | null;
  thumbnail: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Cohort interface
 * Represents a specific group of learners going through a programme together
 */
export interface Cohort {
  id: number;
  programme_id: number;
  name: string;
  enrollment_code: string | null;
  start_date: string | null; // DATEONLY format (YYYY-MM-DD)
  end_date: string | null; // DATEONLY format (YYYY-MM-DD)
  status: string;
  max_members: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Week interface
 * Represents a weekly grouping of lessons within a programme
 */
export interface Week {
  id: string; // UUID
  programme_id: number;
  week_number: number;
  title: string;
  start_date: string; // DATEONLY format (YYYY-MM-DD)
  created_at: Date;
  updated_at: Date;
}

/**
 * Lesson interface
 * Represents a single learning unit with external content
 */
export interface Lesson {
  id: string; // UUID
  week_id: string; // UUID
  title: string;
  description: string | null;
  content_type: 'video' | 'link' | 'pdf';
  content_url: string;
  order_index: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Enrollment interface
 * Represents a learner's enrollment in a programme cohort
 */
export interface Enrollment {
  id: string; // UUID
  user_id: number;
  cohort_id: number;
  enrolled_at: Date;
}

/**
 * Input validation types for creating/updating entities
 */

/**
 * Input data for creating a programme
 */
export interface CreateProgrammeInput {
  community_id: number;
  name: string;
  description?: string;
  start_date?: Date;
  end_date?: Date;
  metadata?: Record<string, any>;
  status?: string;
  type?: 'scheduled' | 'structured' | 'self_paced';
  settings?: Record<string, any>;
  created_by?: number;
  thumbnail?: string;
}

/**
 * Input data for creating a cohort
 */
export interface CreateCohortInput {
  programme_id: number;
  name: string;
  enrollment_code?: string;
  start_date?: string; // YYYY-MM-DD format
  end_date?: string; // YYYY-MM-DD format
  status?: string;
  max_members?: number;
}

/**
 * Input data for creating a week
 */
export interface CreateWeekInput {
  programme_id: number;
  week_number: number;
  title: string;
  start_date: string; // YYYY-MM-DD format
}

/**
 * Input data for creating a lesson
 */
export interface CreateLessonInput {
  week_id: string;
  title: string;
  description?: string;
  content_type: 'video' | 'link' | 'pdf';
  content_url: string;
  order_index: number;
}

/**
 * Input data for updating a lesson
 */
export interface UpdateLessonInput {
  title?: string;
  description?: string;
  content_url?: string;
  content_type?: 'video' | 'link' | 'pdf';
  order_index?: number;
}

/**
 * Input data for enrollment
 */
export interface EnrollmentInput {
  code: string; // Format: WORD-YEAR (e.g., WLIMP-2026)
}

/**
 * Input data for reordering lessons
 */
export interface ReorderLessonsInput {
  lesson_ids: string[]; // Array of lesson UUIDs in new order
}

/**
 * API response types
 */

/**
 * Response for successful enrollment
 */
export interface EnrollmentResponse {
  success: boolean;
  programme_id: number;
  programme_name: string;
  cohort_id: number;
}

/**
 * Programme metadata with current week information
 */
export interface ProgrammeMetadata {
  id: number;
  name: string;
  description: string | null;
  start_date: string | null;
  current_week: number;
  total_weeks: number;
}

/**
 * Week with lessons for programme page
 */
export interface WeekWithLessons {
  week_number: number;
  title: string;
  start_date: string;
  is_current: boolean;
  lessons: LessonSummary[];
}

/**
 * Lesson summary for programme page
 */
export interface LessonSummary {
  id: string;
  title: string;
  description: string | null;
  content_type: 'video' | 'link' | 'pdf';
  order_index: number;
}

/**
 * Full lesson data for lesson page
 */
export interface LessonDetail {
  id: string;
  title: string;
  description: string | null;
  content_type: 'video' | 'link' | 'pdf';
  content_url: string;
  week_number: number;
  programme_id: number;
  programme_name: string;
}

/**
 * Programme card for dashboard
 */
export interface ProgrammeCard {
  id: number;
  name: string;
  description: string | null;
  current_week: number;
  total_weeks: number;
}

/**
 * Validation error response
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Error response
 */
export interface ErrorResponse {
  success: false;
  error: string;
  validation_errors?: ValidationError[];
}
