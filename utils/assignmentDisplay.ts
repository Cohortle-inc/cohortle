/**
 * Assignment Display Utilities
 * Logic for displaying assignment information to students
 */

import { Assignment } from '@/types/assignments';

export interface AssignmentDisplayData {
  title: string;
  instructions: string;
  dueDate: string;
  submissionStatus: string;
  isOverdue: boolean;
  hasGrade: boolean;
  hasFeedback: boolean;
}

/**
 * Extracts display data from an assignment
 * @param assignment - Assignment object
 * @returns Display data with all required fields
 */
export function getAssignmentDisplayData(assignment: Assignment): AssignmentDisplayData {
  const mySubmission = assignment.mySubmission;
  const dueDate = new Date(assignment.dueDate);
  const now = new Date();

  // Determine if overdue (only if not submitted or graded)
  const isOverdue =
    (!mySubmission || (mySubmission.status !== 'submitted' && mySubmission.status !== 'graded')) &&
    dueDate < now;

  // Determine submission status
  let submissionStatus = 'Not Submitted';
  if (mySubmission) {
    if (mySubmission.status === 'draft') {
      submissionStatus = 'Draft Saved';
    } else if (mySubmission.status === 'submitted') {
      if (mySubmission.gradingStatus === 'pending') {
        submissionStatus = 'Pending Review';
      } else if (mySubmission.gradingStatus === 'passed') {
        submissionStatus = 'Passed';
      } else if (mySubmission.gradingStatus === 'failed') {
        submissionStatus = 'Failed';
      }
    } else if (mySubmission.status === 'graded') {
      if (mySubmission.gradingStatus === 'passed') {
        submissionStatus = 'Passed';
      } else if (mySubmission.gradingStatus === 'failed') {
        submissionStatus = 'Failed';
      }
    }
  }

  // Check if has grade
  const hasGrade =
    mySubmission?.gradingStatus === 'passed' || mySubmission?.gradingStatus === 'failed';

  // Check if has feedback
  const hasFeedback = hasGrade && !!mySubmission?.feedback;

  return {
    title: assignment.title,
    instructions: assignment.instructions,
    dueDate: assignment.dueDate,
    submissionStatus,
    isOverdue,
    hasGrade,
    hasFeedback,
  };
}

/**
 * Checks if assignment display data contains all required fields
 * @param displayData - Display data to validate
 * @returns True if all required fields are present
 */
export function hasAllRequiredFields(displayData: AssignmentDisplayData): boolean {
  return !!(
    displayData.title &&
    displayData.instructions &&
    displayData.dueDate &&
    displayData.submissionStatus &&
    typeof displayData.isOverdue === 'boolean' &&
    typeof displayData.hasGrade === 'boolean' &&
    typeof displayData.hasFeedback === 'boolean'
  );
}

/**
 * Formats due date for display
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export function formatDueDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
  } else if (diffDays === 0) {
    return 'Due today';
  } else if (diffDays === 1) {
    return 'Due tomorrow';
  } else if (diffDays <= 7) {
    return `Due in ${diffDays} days`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }
}

/**
 * Truncates text to specified length
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}
