/**
 * Property-Based Test: Idempotent Link Creation
 * Feature: testimonial-collection-link
 * Property 2: Idempotent link creation
 *
 * **Validates: Requirements 1.3**
 *
 * For any cohort that already has a non-revoked collection link, calling
 * getOrCreateLink again SHALL return the same token without creating a new record.
 */

const fc = require('fast-check');

// Use jest.createMockFromModule or manual mocks with jest.fn() via __mocks__
// jest.fn() IS available inside jest.mock factory — it's a special case Jest handles
jest.mock('../../models', () => {
  return {
    testimonial_collection_links: {
      findOne: jest.fn(),
      create: jest.fn(),
    },
  };
});

const CollectionLinkService = require('../../services/CollectionLinkService');
const mockDb = require('../../models');

describe('Feature: testimonial-collection-link, Property 2: Idempotent link creation', () => {
  beforeEach(() => {
    mockDb.testimonial_collection_links.findOne.mockReset();
    mockDb.testimonial_collection_links.create.mockReset();
  });

  it('returns the existing token when a non-revoked link already exists', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 1, max: 10000 }),
        async (cohortId, convenerUserId) => {
          const existingToken = CollectionLinkService.generateToken();
          const existingLink = {
            id: 'some-uuid',
            token: existingToken,
            cohort_id: cohortId,
            convener_user_id: convenerUserId,
            auto_approve: false,
            expires_at: null,
            revoked_at: null,
          };

          mockDb.testimonial_collection_links.findOne.mockResolvedValueOnce(existingLink);

          const result = await CollectionLinkService.getOrCreateLink(cohortId, convenerUserId);

          expect(result.link.token).toBe(existingToken);
          expect(mockDb.testimonial_collection_links.create).not.toHaveBeenCalled();

          mockDb.testimonial_collection_links.findOne.mockReset();
          mockDb.testimonial_collection_links.create.mockReset();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('creates a new link when no non-revoked link exists', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 1, max: 10000 }),
        async (cohortId, convenerUserId) => {
          const newToken = CollectionLinkService.generateToken();
          const createdLink = {
            id: 'new-uuid',
            token: newToken,
            cohort_id: cohortId,
            convener_user_id: convenerUserId,
            auto_approve: false,
            expires_at: null,
            revoked_at: null,
          };

          mockDb.testimonial_collection_links.findOne.mockResolvedValueOnce(null);
          mockDb.testimonial_collection_links.create.mockResolvedValueOnce(createdLink);

          const result = await CollectionLinkService.getOrCreateLink(cohortId, convenerUserId);

          expect(mockDb.testimonial_collection_links.create).toHaveBeenCalledTimes(1);
          expect(typeof result.link.token).toBe('string');
          expect(result.link.token.length).toBe(64);

          mockDb.testimonial_collection_links.findOne.mockReset();
          mockDb.testimonial_collection_links.create.mockReset();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returned URL always contains the token', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 1, max: 10000 }),
        async (cohortId, convenerUserId) => {
          const existingToken = CollectionLinkService.generateToken();
          const existingLink = {
            id: 'some-uuid',
            token: existingToken,
            cohort_id: cohortId,
            convener_user_id: convenerUserId,
            auto_approve: false,
            expires_at: null,
            revoked_at: null,
          };

          mockDb.testimonial_collection_links.findOne.mockResolvedValueOnce(existingLink);

          const result = await CollectionLinkService.getOrCreateLink(cohortId, convenerUserId);

          expect(result.url).toContain(existingToken);
          expect(result.url).toContain('/testimonial/');

          mockDb.testimonial_collection_links.findOne.mockReset();
        }
      ),
      { numRuns: 100 }
    );
  });
});
