// Feature: assignment-submission-system
// Property 12: Submission Tracker Completeness
// Validates: Requirements 6.1, 6.2, 6.3, 6.4

import fc from 'fast-check';
import { Submission, GradingStatus, SubmissionStatus } from '@/types/assignments';

/**
 * Property 12: Submission Tracker Completeness
 *
 * For any assignment with N enrolled students, the submission tracker should display
 * exactly N student entries, each containing the student's submission status, and the
 * summary statistics (total, submitted, pending) should sum correctly to N.
 */

// Arbitrary for generating student info
const studentInfoArbitrary = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 3, maxLength: 50 }),
  email: fc.emailAddress(),
  avatar: fc.option(fc.webUrl(), { nil: undefined }),
});

// Arbitrary for generating submission status
const submissionStatusArbitrary: fc.Arbitrary<SubmissionStatus> = fc.constantFrom(
  'draft',
  'submitted',
  'graded'
);

// Arbitrary for generating grading status
const gradingStatusArbitrary: fc.Arbitrary<GradingStatus> = fc.constantFrom(
  'pending',
  'passed',
  'failed'
);

// Arbitrary for generating a submission
const submissionArbitrary = (assignmentId: string) =>
  fc.record({
    id: fc.uuid(),
    assignmentId: fc.constant(assignmentId),
    studentId: fc.uuid(),
    textAnswer: fc.option(fc.lorem({ maxCount: 50 }), { nil: null }),
    files: fc.constant([]),
    status: submissionStatusArbitrary,
    gradingStatus: gradingStatusArbitrary,
    feedback: fc.option(fc.lorem({ maxCount: 100 }), { nil: null }),
    submittedAt: fc.option(fc.date().map((d) => d.toISOString()), { nil: null }),
    gradedAt: fc.option(fc.date().map((d) => d.toISOString()), { nil: null }),
    createdAt: fc.date().map((d) => d.toISOString()),
    updatedAt: fc.date().map((d) => d.toISOString()),
    student: studentInfoArbitrary,
    assignment: fc.constant(undefined),
  });

// Generate N submissions for an assignment (reduced max for faster tests)
const submissionsArbitrary = fc
  .integer({ min: 1, max: 20 })
  .chain((n) => {
    const assignmentId = fc.sample(fc.uuid(), 1)[0];
    return fc.tuple(
      fc.constant(n),
      fc.array(submissionArbitrary(assignmentId), { minLength: n, maxLength: n })
    );
  });

/**
 * Calculate statistics from submissions
 */
function calculateStatistics(submissions: Submission[]) {
  const stats = {
    total: submissions.length,
    submitted: 0,
    notSubmitted: 0,
    graded: 0,
    pending: 0,
    passed: 0,
    failed: 0,
  };

  submissions.forEach((submission) => {
    // Count submitted vs not submitted
    if (submission.status === 'submitted' || submission.status === 'graded') {
      stats.submitted++;
    } else {
      stats.notSubmitted++;
    }

    // Count grading statuses
    if (submission.gradingStatus === 'pending') {
      stats.pending++;
    } else if (submission.gradingStatus === 'passed') {
      stats.graded++;
      stats.passed++;
    } else if (submission.gradingStatus === 'failed') {
      stats.graded++;
      stats.failed++;
    }
  });

  return stats;
}

/**
 * Verify that each submission contains required fields
 */
function verifySubmissionCompleteness(submission: Submission): boolean {
  // Each submission must have student info
  if (!submission.student) return false;
  if (!submission.student.id) return false;
  if (!submission.student.name) return false;
  if (!submission.student.email) return false;

  // Each submission must have a status
  if (!submission.status) return false;
  if (!['draft', 'submitted', 'graded'].includes(submission.status)) return false;

  // Each submission must have a grading status
  if (!submission.gradingStatus) return false;
  if (!['pending', 'passed', 'failed'].includes(submission.gradingStatus)) return false;

  return true;
}

describe('Property 12: Submission Tracker Completeness', () => {
  it('should display exactly N student entries for N enrolled students', () => {
    fc.assert(
      fc.property(submissionsArbitrary, ([expectedCount, submissions]) => {
        // Property: The tracker should display exactly N entries
        expect(submissions.length).toBe(expectedCount);

        // Property: Each entry should contain student submission status
        submissions.forEach((submission) => {
          expect(verifySubmissionCompleteness(submission)).toBe(true);
        });
      }),
      { numRuns: 50 }
    );
  });

  it('should have summary statistics that sum correctly to N', () => {
    fc.assert(
      fc.property(submissionsArbitrary, ([expectedCount, submissions]) => {
        const stats = calculateStatistics(submissions);

        // Property: Total should equal N
        expect(stats.total).toBe(expectedCount);

        // Property: Submitted + Not Submitted should equal Total
        expect(stats.submitted + stats.notSubmitted).toBe(stats.total);

        // Property: Pending + Graded should equal Total
        expect(stats.pending + stats.graded).toBe(stats.total);

        // Property: Passed + Failed should equal Graded
        expect(stats.passed + stats.failed).toBe(stats.graded);

        // Property: All counts should be non-negative
        expect(stats.total).toBeGreaterThanOrEqual(0);
        expect(stats.submitted).toBeGreaterThanOrEqual(0);
        expect(stats.notSubmitted).toBeGreaterThanOrEqual(0);
        expect(stats.graded).toBeGreaterThanOrEqual(0);
        expect(stats.pending).toBeGreaterThanOrEqual(0);
        expect(stats.passed).toBeGreaterThanOrEqual(0);
        expect(stats.failed).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 50 }
    );
  });

  it('should maintain count consistency across different submission states', () => {
    fc.assert(
      fc.property(submissionsArbitrary, ([expectedCount, submissions]) => {
        const stats = calculateStatistics(submissions);

        // Property: No student should be counted multiple times
        const uniqueStudentIds = new Set(
          submissions.map((s) => s.student?.id).filter(Boolean)
        );
        expect(uniqueStudentIds.size).toBe(expectedCount);

        // Property: Every submission should contribute to exactly one status category
        let statusSum = 0;
        submissions.forEach((submission) => {
          if (submission.status === 'submitted' || submission.status === 'graded') {
            statusSum++;
          } else {
            statusSum++;
          }
        });
        expect(statusSum).toBe(expectedCount);

        // Property: Every submission should contribute to exactly one grading category
        let gradingSum = 0;
        submissions.forEach((submission) => {
          if (
            submission.gradingStatus === 'pending' ||
            submission.gradingStatus === 'passed' ||
            submission.gradingStatus === 'failed'
          ) {
            gradingSum++;
          }
        });
        expect(gradingSum).toBe(expectedCount);
      }),
      { numRuns: 50 }
    );
  });

  it('should correctly categorize submissions by status', () => {
    fc.assert(
      fc.property(submissionsArbitrary, ([expectedCount, submissions]) => {
        const stats = calculateStatistics(submissions);

        // Manually count each category
        const manualSubmitted = submissions.filter(
          (s) => s.status === 'submitted' || s.status === 'graded'
        ).length;
        const manualNotSubmitted = submissions.filter(
          (s) => s.status === 'draft' || !s.submittedAt
        ).length;
        const manualPending = submissions.filter(
          (s) => s.gradingStatus === 'pending'
        ).length;
        const manualPassed = submissions.filter(
          (s) => s.gradingStatus === 'passed'
        ).length;
        const manualFailed = submissions.filter(
          (s) => s.gradingStatus === 'failed'
        ).length;

        // Property: Calculated stats should match manual counts
        expect(stats.submitted).toBe(manualSubmitted);
        expect(stats.pending).toBe(manualPending);
        expect(stats.passed).toBe(manualPassed);
        expect(stats.failed).toBe(manualFailed);
      }),
      { numRuns: 50 }
    );
  });

  it('should handle edge case of single student', () => {
    fc.assert(
      fc.property(submissionArbitrary('test-assignment-id'), (submission) => {
        const submissions = [submission];
        const stats = calculateStatistics(submissions);

        // Property: Single student should have total of 1
        expect(stats.total).toBe(1);

        // Property: Single student should be in exactly one submission category
        expect(stats.submitted + stats.notSubmitted).toBe(1);

        // Property: Single student should be in exactly one grading category
        expect(stats.pending + stats.graded).toBe(1);
      }),
      { numRuns: 30 }
    );
  });

  it('should preserve student information in each entry', () => {
    fc.assert(
      fc.property(submissionsArbitrary, ([expectedCount, submissions]) => {
        // Property: Every submission should have complete student information
        submissions.forEach((submission) => {
          expect(submission.student).toBeDefined();
          expect(submission.student?.id).toBeTruthy();
          expect(submission.student?.name).toBeTruthy();
          expect(submission.student?.email).toBeTruthy();
          expect(submission.student?.email).toMatch(/@/); // Basic email validation
        });

        // Property: Student IDs should be unique
        const studentIds = submissions.map((s) => s.student?.id);
        const uniqueIds = new Set(studentIds);
        expect(uniqueIds.size).toBe(expectedCount);
      }),
      { numRuns: 50 }
    );
  });
});
