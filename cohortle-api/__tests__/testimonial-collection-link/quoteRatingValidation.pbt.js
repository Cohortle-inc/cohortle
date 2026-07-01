/**
 * Property-Based Test: Quote and Rating Validation
 * Feature: testimonial-collection-link
 * Property 9: Quote and rating validation
 *
 * **Validates: Requirements 4.5, 4.6**
 *
 * For any submission with a quote shorter than 10 characters or a rating
 * outside 1–5, the API SHALL return a 400 response and no testimonial
 * record SHALL be created.
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

function setupValidLink(token, cohortId, learnerUserId) {
  const activeLink = {
    id: 'link-uuid', token, cohort_id: cohortId,
    convener_user_id: 1, auto_approve: false, expires_at: null, revoked_at: null,
  };
  mockDb.testimonial_collection_links.findOne.mockResolvedValueOnce(activeLink);
  mockDb.cohorts.findByPk.mockResolvedValueOnce({ id: cohortId, programme: { name: 'Prog' } });
  mockDb.enrollments.findOne.mockResolvedValueOnce({ user_id: learnerUserId, cohort_id: cohortId });
  mockDb.testimonial_submissions.findOne.mockResolvedValueOnce(null);
  mockDb.users.findByPk.mockResolvedValueOnce({ id: learnerUserId, name: 'Learner', email: 'l@e.com' });
}

function resetMocks() {
  Object.values(mockDb).forEach(m => {
    if (m && typeof m === 'object') {
      Object.values(m).forEach(fn => { if (fn && fn.mockReset) fn.mockReset(); });
    }
  });
}

describe('Feature: testimonial-collection-link, Property 9: Quote and rating validation', () => {
  beforeEach(resetMocks);

  // ── Quote validation ──────────────────────────────────────────────────────

  it('quote shorter than 10 chars throws VALIDATION_ERROR (400)', async () => {
    await fc.assert(
      fc.asyncProperty(
        tokenArb,
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 1, max: 10000 }),
        fc.string({ maxLength: 9 }), // short quote
        fc.integer({ min: 1, max: 5 }),
        async (token, cohortId, learnerUserId, shortQuote, rating) => {
          setupValidLink(token, cohortId, learnerUserId);

          let threw = false;
          let errorCode = null;
          let errorStatus = null;

          try {
            await CollectionLinkService.submitTestimonial(token, learnerUserId, {
              quote: shortQuote,
              rating,
            });
          } catch (err) {
            threw = true;
            errorCode = err.code;
            errorStatus = err.status;
          }

          expect(threw).toBe(true);
          expect(errorCode).toBe('VALIDATION_ERROR');
          expect(errorStatus).toBe(400);
          // No testimonial created
          expect(mockDb.testimonials.create).not.toHaveBeenCalled();

          resetMocks();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('quote of exactly 10 chars is accepted', async () => {
    await fc.assert(
      fc.asyncProperty(
        tokenArb,
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 1, max: 10000 }),
        async (token, cohortId, learnerUserId) => {
          setupValidLink(token, cohortId, learnerUserId);
          mockDb.testimonials.create.mockResolvedValueOnce({ id: 1 });
          mockDb.testimonial_submissions.create.mockResolvedValueOnce({ id: 'sub' });

          let validationError = false;
          try {
            await CollectionLinkService.submitTestimonial(token, learnerUserId, {
              quote: '1234567890', // exactly 10 chars
              rating: 3,
            });
          } catch (err) {
            if (err.code === 'VALIDATION_ERROR') validationError = true;
          }

          expect(validationError).toBe(false);
          resetMocks();
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── Rating validation ─────────────────────────────────────────────────────

  it('rating outside 1-5 throws VALIDATION_ERROR (400)', async () => {
    const invalidRatingArb = fc.oneof(
      fc.integer({ min: -100, max: 0 }),
      fc.integer({ min: 6, max: 100 }),
      fc.double({ min: 1.1, max: 4.9 }).filter(n => !Number.isInteger(n))
    );

    await fc.assert(
      fc.asyncProperty(
        tokenArb,
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 1, max: 10000 }),
        invalidRatingArb,
        async (token, cohortId, learnerUserId, invalidRating) => {
          setupValidLink(token, cohortId, learnerUserId);

          let threw = false;
          let errorCode = null;

          try {
            await CollectionLinkService.submitTestimonial(token, learnerUserId, {
              quote: 'This is a valid quote with enough characters',
              rating: invalidRating,
            });
          } catch (err) {
            threw = true;
            errorCode = err.code;
          }

          expect(threw).toBe(true);
          expect(errorCode).toBe('VALIDATION_ERROR');
          expect(mockDb.testimonials.create).not.toHaveBeenCalled();

          resetMocks();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('valid ratings 1-5 are accepted', async () => {
    await fc.assert(
      fc.asyncProperty(
        tokenArb,
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 1, max: 5 }),
        async (token, cohortId, learnerUserId, validRating) => {
          setupValidLink(token, cohortId, learnerUserId);
          mockDb.testimonials.create.mockResolvedValueOnce({ id: 1 });
          mockDb.testimonial_submissions.create.mockResolvedValueOnce({ id: 'sub' });

          let validationError = false;
          try {
            await CollectionLinkService.submitTestimonial(token, learnerUserId, {
              quote: 'This is a valid quote with enough characters',
              rating: validRating,
            });
          } catch (err) {
            if (err.code === 'VALIDATION_ERROR') validationError = true;
          }

          expect(validationError).toBe(false);
          resetMocks();
        }
      ),
      { numRuns: 100 }
    );
  });
});
