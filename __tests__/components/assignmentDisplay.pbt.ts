/**
 * Property-Based Tests for Assignment Display Completeness
 * Feature: assignment-submission-system
 * Property 5: Assignment Display Completeness
 * Validates: Requirements 2.2
 * 
 * For any assignment, when rendered for a student, the output should contain
 * the title, instructions, due date, and submission status fields.
 */

import fc from 'fast-check';
import {
  getAssignmentDisplayData,
  hasAllRequiredFields,
  formatDueDate,
  truncateText,
} from '@/utils/assignmentDisplay';
import { Assignment, Submission, GradingStatus, SubmissionStatus } from '@/types/assignments';

// Arbitraries for generating test data
const gradingStatusArb = fc.constantFrom<GradingStatus>('pending', 'passed', 'failed');
const submissionStatusArb = fc.constantFrom<SubmissionStatus>('draft', 'submitted', 'graded');

const submissionArb = fc.record({
  id: fc.string({ minLength: 1 }),
  assignmentId: fc.string({ minLength: 1 }),
  studentId: fc.string({ minLength: 1 }),
  textAnswer: fc.option(fc.string(), { nil: null }),
  files: fc.constant([]),
  status: submissionStatusArb,
  gradingStatus: gradingStatusArb,
  feedback: fc.option(fc.string(), { nil: null }),
  submittedAt: fc.option(fc.date().map((d) => d.toISOString()), { nil: null }),
  gradedAt: fc.option(fc.date().map((d) => d.toISOString()), { nil: null }),
  createdAt: fc.date().map((d) => d.toISOString()),
  updatedAt: fc.date().map((d) => d.toISOString()),
}) as fc.Arbitrary<Submission>;

const assignmentArb = fc.record({
  id: fc.string({ minLength: 1 }),
  lessonId: fc.string({ minLength: 1 }),
  title: fc.string({ minLength: 1, maxLength: 200 }),
  instructions: fc.string({ minLength: 1, maxLength: 1000 }),
  dueDate: fc.date().map((d) => d.toISOString()),
  createdAt: fc.date().map((d) => d.toISOString()),
  updatedAt: fc.date().map((d) => d.toISOString()),
  mySubmission: fc.option(submissionArb, { nil: undefined }),
}) as fc.Arbitrary<Assignment>;

describe('Property 5: Assignment Display Completeness', () => {
  it('should always include title, instructions, due date, and submission status', () => {
    fc.assert(
      fc.property(assignmentArb, (assignment) => {
        const displayData = getAssignmentDisplayData(assignment);

        // Verify all required fields are present
        expect(displayData.title).toBe(assignment.title);
        expect(displayData.instructions).toBe(assignment.instructions);
        expect(displayData.dueDate).toBe(assignment.dueDate);
        expect(displayData.submissionStatus).toBeDefined();
        expect(typeof displayData.submissionStatus).toBe('string');
        expect(displayData.submissionStatus.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should have all required fields for any assignment', () => {
    fc.assert(
      fc.property(assignmentArb, (assignment) => {
        const displayData = getAssignmentDisplayData(assignment);
        expect(hasAllRequiredFields(displayData)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should correctly determine overdue status', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.string({ minLength: 1, maxLength: 1000 }),
        fc.date({ min: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }), // Past year to future
        (id, lessonId, title, instructions, dueDate) => {
          const assignment: Assignment = {
            id,
            lessonId,
            title,
            instructions,
            dueDate: dueDate.toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const displayData = getAssignmentDisplayData(assignment);
          const isPast = dueDate < new Date();

          // If no submission and due date is past, should be overdue
          if (isPast) {
            expect(displayData.isOverdue).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not mark submitted assignments as overdue', () => {
    fc.assert(
      fc.property(
        assignmentArb,
        fc.constantFrom<SubmissionStatus>('submitted', 'graded'),
        (assignment, status) => {
          // Create assignment with submitted/graded submission
          const assignmentWithSubmission: Assignment = {
            ...assignment,
            mySubmission: {
              id: 'sub-1',
              assignmentId: assignment.id,
              studentId: 'student-1',
              textAnswer: 'Test answer',
              files: [],
              status,
              gradingStatus: 'pending',
              feedback: null,
              submittedAt: new Date().toISOString(),
              gradedAt: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          };

          const displayData = getAssignmentDisplayData(assignmentWithSubmission);

          // Submitted/graded assignments should never be marked as overdue
          expect(displayData.isOverdue).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly identify graded assignments', () => {
    fc.assert(
      fc.property(
        assignmentArb,
        fc.constantFrom<GradingStatus>('passed', 'failed'),
        (assignment, gradingStatus) => {
          const assignmentWithGrade: Assignment = {
            ...assignment,
            mySubmission: {
              id: 'sub-1',
              assignmentId: assignment.id,
              studentId: 'student-1',
              textAnswer: 'Test answer',
              files: [],
              status: 'graded',
              gradingStatus,
              feedback: null,
              submittedAt: new Date().toISOString(),
              gradedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          };

          const displayData = getAssignmentDisplayData(assignmentWithGrade);

          expect(displayData.hasGrade).toBe(true);
          expect(displayData.submissionStatus).toMatch(/Passed|Failed/);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly identify feedback presence', () => {
    fc.assert(
      fc.property(
        assignmentArb,
        fc.constantFrom<GradingStatus>('passed', 'failed'),
        fc.string({ minLength: 1 }),
        (assignment, gradingStatus, feedback) => {
          const assignmentWithFeedback: Assignment = {
            ...assignment,
            mySubmission: {
              id: 'sub-1',
              assignmentId: assignment.id,
              studentId: 'student-1',
              textAnswer: 'Test answer',
              files: [],
              status: 'graded',
              gradingStatus,
              feedback,
              submittedAt: new Date().toISOString(),
              gradedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          };

          const displayData = getAssignmentDisplayData(assignmentWithFeedback);

          expect(displayData.hasFeedback).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Assignment Display - Date Formatting', () => {
  it('should format any valid date without errors', () => {
    fc.assert(
      fc.property(fc.date(), (date) => {
        const formatted = formatDueDate(date.toISOString());
        expect(typeof formatted).toBe('string');
        expect(formatted.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should indicate overdue for past dates', () => {
    fc.assert(
      fc.property(
        fc.date({ max: new Date(Date.now() - 24 * 60 * 60 * 1000) }), // At least 1 day ago
        (pastDate) => {
          const formatted = formatDueDate(pastDate.toISOString());
          expect(formatted).toContain('Overdue');
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Assignment Display - Text Truncation', () => {
  it('should truncate text longer than max length', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 101 }), // Longer than default max
        fc.integer({ min: 10, max: 200 }),
        (text, maxLength) => {
          const truncated = truncateText(text, maxLength);
          expect(truncated.length).toBeLessThanOrEqual(maxLength + 3); // +3 for '...'
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not truncate text shorter than max length', () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 50 }),
        (text) => {
          const truncated = truncateText(text, 100);
          expect(truncated).toBe(text);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should always return a string', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.integer({ min: 1, max: 1000 }),
        (text, maxLength) => {
          const truncated = truncateText(text, maxLength);
          expect(typeof truncated).toBe('string');
        }
      ),
      { numRuns: 100 }
    );
  });
});
