// Assignment Submission System Type Definitions

/**
 * Assignment Model
 * Represents an assignment attached to a lesson
 */
export interface Assignment {
  id: string;
  lessonId: string;
  title: string;
  instructions: string;
  dueDate: string; // ISO 8601 format
  createdAt: string;
  updatedAt: string;

  // Populated fields (from relations)
  lesson?: {
    id: string;
    title: string;
    moduleId: string;
  };

  // Computed fields (for student view)
  mySubmission?: Submission | null;
  isOverdue?: boolean;

  // Computed fields (for convener view)
  submissionStats?: SubmissionStatistics;
}

/**
 * Submission Model
 * Represents a student's submission for an assignment
 */
export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  textAnswer: string | null;
  files: SubmissionFile[];
  status: SubmissionStatus;
  gradingStatus: GradingStatus;
  feedback: string | null;
  submittedAt: string | null;
  gradedAt: string | null;
  createdAt: string;
  updatedAt: string;

  // Populated fields
  student?: StudentInfo;
  assignment?: Assignment;
}

/**
 * Submission File Model
 * Represents a file attached to a submission
 */
export interface SubmissionFile {
  id: string;
  submissionId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}

/**
 * Student Information
 * Basic student details for display
 */
export interface StudentInfo {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

/**
 * Submission Statistics
 * Aggregated statistics for an assignment's submissions
 */
export interface SubmissionStatistics {
  assignmentId: string;
  totalStudents: number;
  submittedCount: number;
  gradedCount: number;
  pendingCount: number;
  passedCount: number;
  failedCount: number;

  // Breakdown by student
  students: StudentSubmissionStatus[];
}

/**
 * Student Submission Status
 * Individual student's submission status for tracking
 */
export interface StudentSubmissionStatus {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  hasSubmitted: boolean;
  submissionId?: string;
  submittedAt?: string;
  gradingStatus?: GradingStatus;
  gradedAt?: string;
}

/**
 * Submission Status Enum
 * Lifecycle states of a submission
 */
export type SubmissionStatus = 'draft' | 'submitted' | 'graded';

/**
 * Grading Status Enum
 * Evaluation states of a submission
 */
export type GradingStatus = 'pending' | 'passed' | 'failed';

/**
 * Draft Submission
 * Local draft stored in AsyncStorage
 */
export interface DraftSubmission {
  assignmentId: string;
  textAnswer: string;
  files: LocalFile[];
  lastModified: string; // ISO 8601 timestamp
}

/**
 * Local File
 * File selected locally before upload
 */
export interface LocalFile {
  uri: string;
  name: string;
  type: string;
  size: number;
}

/**
 * Create Assignment Payload
 * Data required to create a new assignment
 */
export interface CreateAssignmentPayload {
  title: string;
  instructions: string;
  dueDate: string; // ISO 8601 format
}

/**
 * Submit Assignment Payload
 * Data required to submit an assignment
 */
export interface SubmitAssignmentPayload {
  textAnswer?: string;
  files: LocalFile[];
}

/**
 * Grade Submission Payload
 * Data required to grade a submission
 */
export interface GradeSubmissionPayload {
  status: 'passed' | 'failed';
  feedback?: string;
}

/**
 * File Validation Result
 * Result of file validation checks
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Upload Progress
 * Tracks individual file upload progress
 */
export interface UploadProgress {
  fileIndex: number;
  fileName: string;
  progress: number; // 0-100
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  error?: string;
}
