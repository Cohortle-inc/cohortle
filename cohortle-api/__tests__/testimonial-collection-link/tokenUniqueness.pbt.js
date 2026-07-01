/**
 * Property-Based Test: Token Uniqueness
 * Feature: testimonial-collection-link
 * Property 1: Token uniqueness
 *
 * **Validates: Requirements 1.1, 1.6**
 *
 * For any N calls to generateToken(), all returned tokens SHALL be distinct.
 * This is a pure-function test — no DB required.
 */

const fc = require('fast-check');

// CollectionLinkService.generateToken() is a pure static method; no DB needed.
jest.mock('../../models', () => ({}));

const CollectionLinkService = require('../../services/CollectionLinkService');

describe('Feature: testimonial-collection-link, Property 1: Token uniqueness', () => {
  it('generates distinct tokens across N calls', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 50 }),
        (n) => {
          const tokens = Array.from({ length: n }, () =>
            CollectionLinkService.generateToken()
          );

          // All tokens must be unique
          const unique = new Set(tokens);
          expect(unique.size).toBe(n);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('tokens are 64-character lowercase hex strings', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        (n) => {
          const tokens = Array.from({ length: n }, () =>
            CollectionLinkService.generateToken()
          );

          tokens.forEach((token) => {
            expect(typeof token).toBe('string');
            expect(token).toMatch(/^[0-9a-f]{64}$/);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('regenerated token differs from the previous token', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 30 }),
        (n) => {
          const tokens = Array.from({ length: n + 1 }, () =>
            CollectionLinkService.generateToken()
          );

          // Each consecutive pair must differ (simulates regeneration)
          for (let i = 1; i < tokens.length; i++) {
            expect(tokens[i]).not.toBe(tokens[i - 1]);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
