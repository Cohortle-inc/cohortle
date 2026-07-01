/**
 * Native Quiz System — shared TypeScript types
 *
 * These are the canonical types for the native quiz feature.
 * QuizData and QuizQuestion are also re-exported from @/types/lesson
 * for backward compatibility with existing components.
 *
 * Requirements: 3.1, 4.7
 */

export type QuestionType = 'multiple-choice' | 'true-false' | 'text-input';

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  /** Required for multiple-choice questions (min 2 items) */
  options?: string[];
  /**
   * For multiple-choice: zero-based index of the correct option (integer).
   * For true-false: "true" or "false".
   * For text-input: expected answer string (case-insensitive comparison).
   */
  correctAnswer: string | number;
  /** Optional explanation shown after submission */
  explanation?: string;
}

export interface QuizSettings {
  /** Optional pass threshold (1–100). If null, any submission passes. */
  passing_score: number | null;
  /** Optional time limit in minutes. If null, no limit. */
  time_limit: number | null;
  /** Whether learners can retake the quiz. Defaults to true. */
  allow_retakes: boolean;
}

export interface QuizData {
  questions: QuizQuestion[];
  settings: QuizSettings;
}

export interface QuizAttempt {
  id: number;
  lesson_id: number;
  user_id: number;
  cohort_id: number;
  /** Map of question id → learner's answer */
  answers: Record<string, string | number>;
  score: number;
  passed: boolean;
  submitted_at: string;
}

/** Shape returned by the quiz results endpoint (convener view) */
export interface QuizLearnerResult {
  user_id: number;
  learner_name: string;
  latest_score: number;
  passed: boolean;
  attempt_count: number;
  last_submitted_at: string;
  /** Full answer breakdown for the latest attempt */
  answers: Record<string, string | number>;
}
