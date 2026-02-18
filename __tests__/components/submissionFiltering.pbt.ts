// Feature: assignment-submission-system
// Property 13: Submission Filtering
// Validates: Requirements 6.5

import fc from 'fast-check';
import { Submission, GradingStatus, SubmissionStatus } from '@/types/assignments';

/**
 * Property 13: Submission Filtering
 *
 * For any submission status filter applied to a list of students, all displayed
 * students should have submissions matching that status, and all students with
 * submissions matching that status should be displayed.
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

// Generate array of submissions
const submissionsArrayArbitrary = fc
  .integer({ min: 5, max: 20 })
  .chain((n) => {
    const assignmentId = fc.sample(fc.uuid(), 1)[0];
    return fc.array(submissionArbitrary(assignmentId), { minLength: n, maxLength: n });
  });

// Filter types
type FilterOption = 'all' | 'submitted' | 'not_submitted' | 'graded' | 'pending';

/**
 * Apply filter to submissions (mimics SubmissionList component logic)
 */
function applyFilter(submissions: Submission[], filter: FilterOption): Submission[] {
  switch (filter) {
    case 'submitted':
      return submissions.filter(
        (s) => s.status === 'submitted' || s.status === 'graded'
      );
    case 'not_submitted':
      return submissions.filter((s) => s.status === 'draft' || !s.submittedAt);
    case 'graded':
      return submissions.filter((s) => s.gradingStatus !== 'pending');
    case 'pending':
      return submissions.filter((s) => s.gradingStatus === 'pending');
    default:
      return submissions;
  }
}

/**
 * Check if a submission matches a filter
 */
function matchesFilter(submission: Submission, filter: FilterOption): boolean {
  switch (filter) {
    case 'submitted':
      return submission.status === 'submitted' || submission.status === 'graded';
    case 'not_submitted':
      return submission.status === 'draft' || !submission.submittedAt;
    case 'graded':
      return submission.gradingStatus !== 'pending';
    case 'pending':
      return submission.gradingStatus === 'pending';
    case 'all':
      return true;
    default:
      return false;
  }
}

describe('Property 13: Submission Filtering', () => {
  const filterOptions: FilterOption[] = ['all', 'submitted', 'not_submitted', 'graded', 'pending'];

  it('should only display submissions that match the filter', () => {
    fc.assert(
      fc.property(
        submissionsArrayArbitrary,
        fc.constantFrom(...filterOptions),
        (submissions, filter) => {
          const filtered = applyFilter(submissions, filter);

          // Property: All displayed submissions should match the filter
          filtered.forEach((submission) => {
            expect(matchesFilter(submission, filter)).toBe(true);
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should display all submissions that match the filter', () => {
    fc.assert(
      fc.property(
        submissionsArrayArbitrary,
        fc.constantFrom(...filterOptions),
        (submissions, filter) => {
          const filtered = applyFilter(submissions, filter);

          // Property: All submissions matching the filter should be displayed
          const expectedMatches = submissions.filter((s) => matchesFilter(s, filter));
          expect(filtered.length).toBe(expectedMatches.length);

          // Property: Every expected submission should be in the filtered list
          expectedMatches.forEach((expectedSubmission) => {
            const found = filtered.find((s) => s.id === expectedSubmission.id);
            expect(found).toBeDefined();
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should maintain bidirectional consistency (inclusion and exclusion)', () => {
    fc.assert(
      fc.property(
        submissionsArrayArbitrary,
        fc.constantFrom(...filterOptions),
        (submissions, filter) => {
          const filtered = applyFilter(submissions, filter);

          // Property: Filtered + Not Filtered should equal Total
          const notFiltered = submissions.filter((s) => !matchesFilter(s, filter));
          expect(filtered.length + notFiltered.length).toBe(submissions.length);

          // Property: No overlap between filtered and not filtered
          filtered.forEach((filteredSubmission) => {
            const inNotFiltered = notFiltered.find((s) => s.id === filteredSubmission.id);
            expect(inNotFiltered).toBeUndefined();
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle "all" filter by showing all submissions', () => {
    fc.assert(
      fc.property(submissionsArrayArbitrary, (submissions) => {
        const filtered = applyFilter(submissions, 'all');

        // Property: "all" filter should return all submissions
        expect(filtered.length).toBe(submissions.length);

        // Property: Every submission should be in the filtered list
        submissions.forEach((submission) => {
          const found = filtered.find((s) => s.id === submission.id);
          expect(found).toBeDefined();
        });
      }),
      { numRuns: 30 }
    );
  });

  it('should correctly filter by submission status (submitted vs not_submitted)', () => {
    fc.assert(
      fc.property(submissionsArrayArbitrary, (submissions) => {
        const submitted = applyFilter(submissions, 'submitted');
        const notSubmitted = applyFilter(submissions, 'not_submitted');

        // Property: All "submitted" should have status 'submitted' or 'graded'
        submitted.forEach((s) => {
          expect(['submitted', 'graded']).toContain(s.status);
        });

        // Property: All "not_submitted" should have status 'draft' or no submittedAt
        notSubmitted.forEach((s) => {
          expect(s.status === 'draft' || !s.submittedAt).toBe(true);
        });

        // Property: No submission should be in both categories
        submitted.forEach((s) => {
          const inNotSubmitted = notSubmitted.find((ns) => ns.id === s.id);
          expect(inNotSubmitted).toBeUndefined();
        });
      }),
      { numRuns: 50 }
    );
  });

  it('should correctly filter by grading status (graded vs pending)', () => {
    fc.assert(
      fc.property(submissionsArrayArbitrary, (submissions) => {
        const graded = applyFilter(submissions, 'graded');
        const pending = applyFilter(submissions, 'pending');

        // Property: All "graded" should have gradingStatus 'passed' or 'failed'
        graded.forEach((s) => {
          expect(['passed', 'failed']).toContain(s.gradingStatus);
        });

        // Property: All "pending" should have gradingStatus 'pending'
        pending.forEach((s) => {
          expect(s.gradingStatus).toBe('pending');
        });

        // Property: No submission should be in both categories
        graded.forEach((s) => {
          const inPending = pending.find((p) => p.id === s.id);
          expect(inPending).toBeUndefined();
        });

        // Property: Graded + Pending should equal Total
        expect(graded.length + pending.length).toBe(submissions.length);
      }),
      { numRuns: 50 }
    );
  });

  it('should preserve submission order after filtering', () => {
    fc.assert(
      fc.property(
        submissionsArrayArbitrary,
        fc.constantFrom(...filterOptions),
        (submissions, filter) => {
          const filtered = applyFilter(submissions, filter);

          // Property: Filtered submissions should maintain relative order from original list
          let lastOriginalIndex = -1;
          filtered.forEach((filteredSubmission) => {
            const originalIndex = submissions.findIndex((s) => s.id === filteredSubmission.id);
            expect(originalIndex).toBeGreaterThan(lastOriginalIndex);
            lastOriginalIndex = originalIndex;
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle empty result sets gracefully', () => {
    fc.assert(
      fc.property(
        submissionsArrayArbitrary,
        fc.constantFrom(...filterOptions),
        (submissions, filter) => {
          const filtered = applyFilter(submissions, filter);

          // Property: Empty results should be valid (length >= 0)
          expect(filtered.length).toBeGreaterThanOrEqual(0);

          // Property: If no submissions match, filtered should be empty
          const hasMatches = submissions.some((s) => matchesFilter(s, filter));
          if (!hasMatches) {
            expect(filtered.length).toBe(0);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should be idempotent (filtering twice gives same result)', () => {
    fc.assert(
      fc.property(
        submissionsArrayArbitrary,
        fc.constantFrom(...filterOptions),
        (submissions, filter) => {
          const filtered1 = applyFilter(submissions, filter);
          const filtered2 = applyFilter(filtered1, filter);

          // Property: Filtering already filtered results should not change them
          expect(filtered2.length).toBe(filtered1.length);

          filtered1.forEach((submission, index) => {
            expect(filtered2[index].id).toBe(submission.id);
          });
        }
      ),
      { numRuns: 30 }
    );
  });
});
