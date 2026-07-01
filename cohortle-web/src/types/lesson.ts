/**
 * TypeScript interfaces for the Student Lesson Viewer Web
 */

/**
 * Lesson unit type enum - supports all 6 lesson types
 */
export type LessonUnitType = 'text' | 'video' | 'pdf' | 'link' | 'quiz' | 'live-session';

/**
 * Quiz types — re-exported from the canonical quiz types module for backward compatibility.
 * New code should import directly from '@/types/quiz'.
 */
export type { QuizQuestion, QuizData, QuizSettings, QuizAttempt } from './quiz';
export type { QuestionType as QuizQuestionType } from './quiz';

/**
 * Live session status type
 */
export type LiveSessionStatus = 'upcoming' | 'live' | 'completed';

/**
 * Live session data interface
 */
export interface LiveSessionData {
  scheduled_date: string;
  duration: number; // in minutes
  join_url?: string;
  meeting_id?: string;
  passcode?: string;
  description?: string;
  status?: LiveSessionStatus;
}

/**
 * Main lesson interface
 */
export interface Lesson {
  id: number;
  name: string;
  description?: string;
  text?: string;           // HTML content
  media?: string;          // URL to video/pdf/link
  module_id: number;
  order_number: number;
  lesson_type?: LessonUnitType;
  created_at: string;
  updated_at: string;
  
  // Enhanced lesson type data
  quiz_data?: import('./quiz').QuizData;
  live_session_data?: LiveSessionData;
  estimated_duration?: number; // in minutes
  
  // Video accessibility fields
  caption_url?: string;    // URL to caption/subtitle file (.vtt, .srt)
  transcript_url?: string; // URL to transcript document
  has_captions?: boolean;  // Indicates if video has captions available
}

/**
 * Lesson completion status interface
 */
export interface LessonCompletion {
  lesson_id: number;
  cohort_id: number;
  user_id: number;
  completed: boolean;
  completed_at?: string;
}

/**
 * Lesson comment interface
 */
export interface LessonComment {
  id: number;
  lesson_id: number;
  cohort_id: number;
  user_id: number;
  author_name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

/**
 * Module lesson interface (simplified for navigation)
 */
export interface ModuleLesson {
  id: number;
  name: string;
  order_number: number;
  module_id: number;
}
