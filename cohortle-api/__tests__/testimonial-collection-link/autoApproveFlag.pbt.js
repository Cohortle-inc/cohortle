/**
 * Property-Based Test: Auto-Approve Flag Propagation
 * Feature: testimonial-collection-link
 * Property 7: Auto-approve flag propagation
 *
 * **Validates: Requirements 4.2, 4.3**
 *
 * For any collection link with auto_approve = true, every testimonial created
 * through that link SHALL have is_featured = true.
 * For any collection link with auto_approve = false, every testimonial created
 * through that link SHALL have is_featured = false.
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

function setupMocks(token, cohortId, learnerUserId, autoApprove) {
  const activeLink = {
    id: 'link-uuid',
    token,
    cohort_id: cohortId,
    convener_user_id: 1,
    auto_approve: autoApprove,
    expires_at: null,
    revoked_at: null,
  };

  mockDb.testimonial_collection_links.findOne.mockResolvedValueOnce(activeLink);
  mockDb.cohorts.findByPk.mockResolvedValueOnce({
    id: cohortId,
    programme: { name: 'Test Programme' },
  });
  mockDb.enrollments.findOne.mockResolvedValueOnce({ user_id: learnerUserId, cohort_id: cohortId });
  mockDb.testimonial_submissions.findOne.mockResolvedValueOnce(null); // no duplicate
  mockDb.users.findByPk.mockResolvedValueOnce({ id: learnerUserId, name: 'Test Learner', email: 'test@example.com' });
  mockDb.testimonials.create.mockResolvedValueOnce({ id: 42, is_featured: autoApprove });
  mockDb.testimonial_submissions.create.mockResolvedValueOnce({ id: 'sub-uuid' });
}

function resetMocks() {
  Object.values(mockDb).forEach(m => {
    if (m && typeof m === 'object') {
      Object.values(m).forEach(fn => { if (fn && fn.mockReset) fn.mockReset(); });
    }
  });
}

describe('Feature: testimonial-collection-link, Property 7: Auto-approve flag propagation', () => {
  beforeEach(resetMocks);

  it('auto_approve=true creates testimonial with is_featured=true', async () => {
    await fc.assert(
      fc.asyncProperty(
        tokenArb,
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 1, max: 10000 }),
        async (token, cohortId, learnerUserId) => {
          setupMocks(token, cohortId, learnerUserId, true);

          await CollectionLinkService.submitTestimonial(token, learnerUserId, {
            quote: 'This is a valid quote with enough characters',
            rating: 5,
          });

          const createCall = mockDb.testimonials.create.mock.calls[0][0];
          expect(createCall.is_featured).toBe(true);

          resetMocks();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('auto_approve=false creates testimonial with is_featured=false', async () => {
    await fc.assert(
      fc.asyncProperty(
        tokenArb,
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 1, max: 10000 }),
        async (token, cohortId, learnerUserId) => {
          setupMocks(token, cohortId, learnerUserId, false);

          await CollectionLinkService.submitTestimonial(token, learnerUserId, {
            quote: 'This is a valid quote with enough characters',
            rating: 3,
          });

          const createCall = mockDb.testimonials.create.mock.calls[0][0];
          expect(createCall.is_featured).toBe(false);

          resetMocks();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('is_featured always equals auto_approve for any boolean value', async () => {
    await fc.assert(
      fc.asyncProperty(
        tokenArb,
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 1, max: 10000 }),
        fc.boolean(), // auto_approve
        async (token, cohortId, learnerUserId, autoApprove) => {
          setupMocks(token, cohortId, learnerUserId, autoApprove);

          await CollectionLinkService.submitTestimonial(token, learnerUserId, {
            quote: 'This is a valid quote with enough characters',
            rating: 4,
          });

          const createCall = mockDb.testimonials.create.mock.calls[0][0];
          expect(createCall.is_featured).toBe(autoApprove);

          resetMocks();
        }
      ),
      { numRuns: 100 }
    );
  });
});
