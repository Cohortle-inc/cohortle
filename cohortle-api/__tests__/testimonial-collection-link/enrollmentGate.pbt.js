/**
 * Property-Based Test: Enrollment Gate
 * Feature: testimonial-collection-link
 * Property 5: Enrollment gate
 *
 * **Validates: Requirements 3.4**
 *
 * For any learner who is not enrolled in the cohort associated with a
 * collection link, submitting via that link SHALL throw with code NOT_ENROLLED (403).
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

describe('Feature: testimonial-collection-link, Property 5: Enrollment gate', () => {
  beforeEach(() => {
    Object.values(mockDb).forEach(m => {
      if (m && typeof m === 'object') {
        Object.values(m).forEach(fn => { if (fn && fn.mockReset) fn.mockReset(); });
      }
    });
  });

  it('unenrolled learner submission throws NOT_ENROLLED (403)', async () => {
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

          const cohort = {
            id: cohortId,
            programme: { name: 'Test Programme' },
          };

          // Token is valid
          mockDb.testimonial_collection_links.findOne.mockResolvedValueOnce(activeLink);
          mockDb.cohorts.findByPk.mockResolvedValueOnce(cohort);
          // Learner is NOT enrolled
          mockDb.enrollments.findOne.mockResolvedValueOnce(null);

          let threw = false;
          let errorCode = null;
          let errorStatus = null;

          try {
            await CollectionLinkService.submitTestimonial(token, learnerUserId, {
              quote: 'This is a valid quote with enough characters',
              rating: 5,
            });
          } catch (err) {
            threw = true;
            errorCode = err.code;
            errorStatus = err.status;
          }

          expect(threw).toBe(true);
          expect(errorCode).toBe('NOT_ENROLLED');
          expect(errorStatus).toBe(403);

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
