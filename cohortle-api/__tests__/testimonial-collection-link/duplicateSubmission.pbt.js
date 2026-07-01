/**
 * Property-Based Test: Duplicate Submission Rejection
 * Feature: testimonial-collection-link
 * Property 6: Duplicate submission rejection
 *
 * **Validates: Requirements 3.5**
 *
 * For any learner who has already submitted a testimonial via a given
 * collection link, a second submission attempt SHALL throw with code
 * ALREADY_SUBMITTED (409).
 */

const fc = require('fast-check');

jest.mock('../../models', () => ({
  testimonial_collection_links: { findOne: jest.fn() },
  cohorts: { findByPk: jest.fn() },
  enrollments: { findOne: jest.fn() },
  testimonial_submissions: { findOne: jest.fn() },
  testimonials: { create: jest.fn() },
  users: { findByPk: jest.fn() },
}));

const CollectionLinkService = require('../../services/CollectionLinkService');
const mockDb = require('../../models');

const tokenArb = fc.stringMatching(/^[0-9a-f]{64}$/);

describe('Feature: testimonial-collection-link, Property 6: Duplicate submission rejection', () => {
  beforeEach(() => {
    Object.values(mockDb).forEach(m => {
      if (m && typeof m === 'object') {
        Object.values(m).forEach(fn => { if (fn && fn.mockReset) fn.mockReset(); });
      }
    });
  });

  it('second submission by same learner throws ALREADY_SUBMITTED (409)', async () => {
    await fc.assert(
      fc.asyncProperty(
        tokenArb,
        fc.integer({ min: 1, max: 10000 }), // learnerUserId
        fc.integer({ min: 1, max: 10000 }), // cohortId
        async (token, learnerUserId, cohortId) => {
          const activeLink = {
            id: 'link-uuid',
            token,
            cohort_id: cohortId,
            convener_user_id: 1,
            auto_approve: false,
            expires_at: null,
            revoked_at: null,
          };

          const cohort = { id: cohortId, programme: { name: 'Test Programme' } };
          const enrollment = { user_id: learnerUserId, cohort_id: cohortId };
          const existingSubmission = { id: 'sub-uuid', learner_user_id: learnerUserId };

          mockDb.testimonial_collection_links.findOne.mockResolvedValueOnce(activeLink);
          mockDb.cohorts.findByPk.mockResolvedValueOnce(cohort);
          mockDb.enrollments.findOne.mockResolvedValueOnce(enrollment);
          // Already submitted
          mockDb.testimonial_submissions.findOne.mockResolvedValueOnce(existingSubmission);

          let threw = false;
          let errorCode = null;
          let errorStatus = null;

          try {
            await CollectionLinkService.submitTestimonial(token, learnerUserId, {
              quote: 'This is a valid quote with enough characters',
              rating: 4,
            });
          } catch (err) {
            threw = true;
            errorCode = err.code;
            errorStatus = err.status;
          }

          expect(threw).toBe(true);
          expect(errorCode).toBe('ALREADY_SUBMITTED');
          expect(errorStatus).toBe(409);

          Object.values(mockDb).forEach(m => {
            if (m && typeof m === 'object') {
              Object.values(m).forEach(fn => { if (fn && fn.mockReset) fn.mockReset(); });
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
