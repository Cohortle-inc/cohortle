/**
 * Property-Based Test: Testimonial Field Population
 * Feature: testimonial-collection-link
 * Property 8: Testimonial field population
 *
 * **Validates: Requirements 4.4**
 *
 * For any valid submission, the created testimonial record SHALL have
 * learner_name equal to the submitting learner's profile name and
 * programme_name equal to the programme associated with the cohort.
 */

const fc = require('fast-check');

jest.mock('../../models', () => ({
  testimonial_collection_links: { findOne: jest.fn() },
  cohorts: { findByPk: jest.fn() },
  enrollments: { findOne: jest.fn() },
  testimonial_submissions: { findOne: jest.fn(), create: jest.fn() },
  testimonials: { create: jest.fn() },
  users: { findByPk: jest.fn() },
}));

const CollectionLinkService = require('../../services/CollectionLinkService');
const mockDb = require('../../models');

const tokenArb = fc.stringMatching(/^[0-9a-f]{64}$/);
const nameArb = fc.string({ minLength: 1, maxLength: 50 });

function resetMocks() {
  Object.values(mockDb).forEach(m => {
    if (m && typeof m === 'object') {
      Object.values(m).forEach(fn => { if (fn && fn.mockReset) fn.mockReset(); });
    }
  });
}

describe('Feature: testimonial-collection-link, Property 8: Testimonial field population', () => {
  beforeEach(resetMocks);

  it('learner_name is populated from learner profile name', async () => {
    await fc.assert(
      fc.asyncProperty(
        tokenArb,
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 1, max: 10000 }),
        nameArb, // learner name
        nameArb, // programme name
        async (token, cohortId, learnerUserId, learnerName, programmeName) => {
          const activeLink = {
            id: 'link-uuid', token, cohort_id: cohortId,
            convener_user_id: 1, auto_approve: false, expires_at: null, revoked_at: null,
          };

          mockDb.testimonial_collection_links.findOne.mockResolvedValueOnce(activeLink);
          mockDb.cohorts.findByPk.mockResolvedValueOnce({
            id: cohortId,
            programme: { name: programmeName },
          });
          mockDb.enrollments.findOne.mockResolvedValueOnce({ user_id: learnerUserId, cohort_id: cohortId });
          mockDb.testimonial_submissions.findOne.mockResolvedValueOnce(null);
          mockDb.users.findByPk.mockResolvedValueOnce({ id: learnerUserId, name: learnerName, email: 'test@example.com' });
          mockDb.testimonials.create.mockResolvedValueOnce({ id: 1 });
          mockDb.testimonial_submissions.create.mockResolvedValueOnce({ id: 'sub' });

          await CollectionLinkService.submitTestimonial(token, learnerUserId, {
            quote: 'This is a valid quote with enough characters',
            rating: 4,
          });

          const createCall = mockDb.testimonials.create.mock.calls[0][0];
          expect(createCall.learner_name).toBe(learnerName);
          expect(createCall.programme_name).toBe(programmeName);

          resetMocks();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('display_name override takes precedence over profile name', async () => {
    await fc.assert(
      fc.asyncProperty(
        tokenArb,
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 1, max: 10000 }),
        nameArb, // profile name
        nameArb, // display name override
        async (token, cohortId, learnerUserId, profileName, displayName) => {
          fc.pre(profileName !== displayName);

          const activeLink = {
            id: 'link-uuid', token, cohort_id: cohortId,
            convener_user_id: 1, auto_approve: false, expires_at: null, revoked_at: null,
          };

          mockDb.testimonial_collection_links.findOne.mockResolvedValueOnce(activeLink);
          mockDb.cohorts.findByPk.mockResolvedValueOnce({ id: cohortId, programme: { name: 'Prog' } });
          mockDb.enrollments.findOne.mockResolvedValueOnce({ user_id: learnerUserId, cohort_id: cohortId });
          mockDb.testimonial_submissions.findOne.mockResolvedValueOnce(null);
          mockDb.users.findByPk.mockResolvedValueOnce({ id: learnerUserId, name: profileName, email: 'test@example.com' });
          mockDb.testimonials.create.mockResolvedValueOnce({ id: 1 });
          mockDb.testimonial_submissions.create.mockResolvedValueOnce({ id: 'sub' });

          await CollectionLinkService.submitTestimonial(token, learnerUserId, {
            quote: 'This is a valid quote with enough characters',
            rating: 4,
            display_name: displayName,
          });

          const createCall = mockDb.testimonials.create.mock.calls[0][0];
          expect(createCall.learner_name).toBe(displayName);

          resetMocks();
        }
      ),
      { numRuns: 100 }
    );
  });
});
