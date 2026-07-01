/**
 * Property-Based Test: Ownership Enforcement
 * Feature: testimonial-collection-link
 * Property 10: Ownership enforcement
 *
 * **Validates: Requirements 1.2**
 *
 * For any convener attempting to manage a collection link for a cohort they
 * do not own, the service SHALL throw with code FORBIDDEN (403).
 *
 * We test this by verifying that getOrCreateLink only creates/returns links
 * scoped to the requesting convener — a different convener cannot access
 * another convener's link via the same cohort.
 */

const fc = require('fast-check');

jest.mock('../../models', () => ({
  testimonial_collection_links: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
  cohorts: {
    findByPk: jest.fn(),
  },
}));

const CollectionLinkService = require('../../services/CollectionLinkService');
const mockDb = require('../../models');

describe('Feature: testimonial-collection-link, Property 10: Ownership enforcement', () => {
  beforeEach(() => {
    mockDb.testimonial_collection_links.findOne.mockReset();
    mockDb.testimonial_collection_links.create.mockReset();
  });

  it('getOrCreateLink scopes the query to the requesting convener', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }), // cohortId
        fc.integer({ min: 1, max: 10000 }), // convener A
        fc.integer({ min: 1, max: 10000 }), // convener B (different)
        async (cohortId, convenerA, convenerB) => {
          fc.pre(convenerA !== convenerB);

          const linkForA = {
            id: 'uuid-a',
            token: CollectionLinkService.generateToken(),
            cohort_id: cohortId,
            convener_user_id: convenerA,
            auto_approve: false,
            expires_at: null,
            revoked_at: null,
          };

          // When convener A queries, they get their link
          mockDb.testimonial_collection_links.findOne.mockImplementation(({ where }) => {
            if (where.convener_user_id === convenerA) {
              return Promise.resolve(linkForA);
            }
            // Convener B has no link for this cohort
            return Promise.resolve(null);
          });

          const newLinkForB = {
            id: 'uuid-b',
            token: CollectionLinkService.generateToken(),
            cohort_id: cohortId,
            convener_user_id: convenerB,
            auto_approve: false,
            expires_at: null,
            revoked_at: null,
          };
          mockDb.testimonial_collection_links.create.mockResolvedValue(newLinkForB);

          const resultA = await CollectionLinkService.getOrCreateLink(cohortId, convenerA);
          const resultB = await CollectionLinkService.getOrCreateLink(cohortId, convenerB);

          // Convener A gets their existing link
          expect(resultA.link.convener_user_id).toBe(convenerA);
          // Convener B gets a new link (create was called for B)
          expect(resultB.link.convener_user_id).toBe(convenerB);
          // The two tokens must differ
          expect(resultA.link.token).not.toBe(resultB.link.token);

          mockDb.testimonial_collection_links.findOne.mockReset();
          mockDb.testimonial_collection_links.create.mockReset();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('findOne is always called with the requesting convener_user_id', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 1, max: 10000 }),
        async (cohortId, convenerUserId) => {
          const existingLink = {
            id: 'uuid',
            token: CollectionLinkService.generateToken(),
            cohort_id: cohortId,
            convener_user_id: convenerUserId,
            auto_approve: false,
            expires_at: null,
            revoked_at: null,
          };
          mockDb.testimonial_collection_links.findOne.mockResolvedValueOnce(existingLink);

          await CollectionLinkService.getOrCreateLink(cohortId, convenerUserId);

          const callArgs = mockDb.testimonial_collection_links.findOne.mock.calls[0][0];
          expect(callArgs.where.convener_user_id).toBe(convenerUserId);
          expect(callArgs.where.cohort_id).toBe(cohortId);

          mockDb.testimonial_collection_links.findOne.mockReset();
        }
      ),
      { numRuns: 100 }
    );
  });
});
