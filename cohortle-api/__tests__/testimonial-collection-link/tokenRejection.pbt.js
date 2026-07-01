/**
 * Property-Based Test: Revoked and Expired Token Rejection
 * Feature: testimonial-collection-link
 * Property 3: Revoked token rejection
 * Property 4: Expired token rejection
 *
 * **Validates: Requirements 1.5, 2.4, 3.2, 3.3**
 *
 * Property 3: For any revoked link, validateToken SHALL throw with code LINK_NOT_FOUND (404).
 * Property 4: For any link whose expires_at is in the past, validateToken SHALL throw with
 *             code LINK_EXPIRED (410).
 */

const fc = require('fast-check');

jest.mock('../../models', () => ({
  testimonial_collection_links: {
    findOne: jest.fn(),
  },
}));

// 64-char hex string arbitrary (matches generateToken() output format)
const tokenArb = fc.stringMatching(/^[0-9a-f]{64}$/);

const CollectionLinkService = require('../../services/CollectionLinkService');
const mockDb = require('../../models');

describe('Feature: testimonial-collection-link, Property 3 & 4: Token rejection', () => {
  beforeEach(() => {
    mockDb.testimonial_collection_links.findOne.mockReset();
  });

  // ── Property 3: Revoked token rejection ──────────────────────────────────

  it('Property 3: revoked link throws LINK_NOT_FOUND (404)', async () => {
    await fc.assert(
      fc.asyncProperty(
        tokenArb, // token
        fc.integer({ min: 1, max: 10000 }),              // cohortId
        async (token, cohortId) => {
          const revokedLink = {
            id: 'some-uuid',
            token,
            cohort_id: cohortId,
            convener_user_id: 1,
            auto_approve: false,
            expires_at: null,
            revoked_at: new Date(), // revoked
          };

          mockDb.testimonial_collection_links.findOne.mockResolvedValueOnce(revokedLink);

          let threw = false;
          let errorCode = null;
          let errorStatus = null;

          try {
            await CollectionLinkService.validateToken(token);
          } catch (err) {
            threw = true;
            errorCode = err.code;
            errorStatus = err.status;
          }

          expect(threw).toBe(true);
          expect(errorCode).toBe('LINK_NOT_FOUND');
          expect(errorStatus).toBe(404);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 3: non-existent token throws LINK_NOT_FOUND (404)', async () => {
    await fc.assert(
      fc.asyncProperty(
        tokenArb,
        async (token) => {
          mockDb.testimonial_collection_links.findOne.mockResolvedValueOnce(null);

          let threw = false;
          let errorCode = null;

          try {
            await CollectionLinkService.validateToken(token);
          } catch (err) {
            threw = true;
            errorCode = err.code;
          }

          expect(threw).toBe(true);
          expect(errorCode).toBe('LINK_NOT_FOUND');
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── Property 4: Expired token rejection ──────────────────────────────────

  it('Property 4: expired link throws LINK_EXPIRED (410)', async () => {
    await fc.assert(
      fc.asyncProperty(
        tokenArb,
        fc.integer({ min: 1, max: 365 }), // days in the past
        async (token, daysAgo) => {
          const pastDate = new Date();
          pastDate.setDate(pastDate.getDate() - daysAgo);

          const expiredLink = {
            id: 'some-uuid',
            token,
            cohort_id: 1,
            convener_user_id: 1,
            auto_approve: false,
            expires_at: pastDate, // expired
            revoked_at: null,
          };

          mockDb.testimonial_collection_links.findOne.mockResolvedValueOnce(expiredLink);

          let threw = false;
          let errorCode = null;
          let errorStatus = null;

          try {
            await CollectionLinkService.validateToken(token);
          } catch (err) {
            threw = true;
            errorCode = err.code;
            errorStatus = err.status;
          }

          expect(threw).toBe(true);
          expect(errorCode).toBe('LINK_EXPIRED');
          expect(errorStatus).toBe(410);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 4: future expiry does not reject the token', async () => {
    await fc.assert(
      fc.asyncProperty(
        tokenArb,
        fc.integer({ min: 1, max: 365 }), // days in the future
        async (token, daysAhead) => {
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + daysAhead);

          const activeLink = {
            id: 'some-uuid',
            token,
            cohort_id: 1,
            convener_user_id: 1,
            auto_approve: false,
            expires_at: futureDate,
            revoked_at: null,
          };

          // validateToken also loads cohort — mock that too
          mockDb.testimonial_collection_links.findOne.mockResolvedValueOnce(activeLink);

          // We expect it NOT to throw LINK_EXPIRED; it may throw for other reasons
          // (missing cohort mock), but not for expiry
          let expiredError = false;
          try {
            await CollectionLinkService.validateToken(token);
          } catch (err) {
            if (err.code === 'LINK_EXPIRED') {
              expiredError = true;
            }
          }

          expect(expiredError).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
