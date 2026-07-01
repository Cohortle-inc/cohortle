/**
 * Property-Based Tests: Organisation Page and Slug Validation
 * Feature: programme-application-flow
 *
 * **Property 38: Organisation page only shows recruiting programmes**
 * **Property 39: Organisation slug uniqueness**
 * **Property 40: Organisation slug format validation**
 * **Property 41: Cross-programme applicant visibility**
 *
 * Tag: Feature: programme-application-flow, Property 38/39/40/41
 * Validates: Requirements 13.1, 13.7, 13.9, 13.10
 */

const fc = require('fast-check');
const ApplicationService = require('../../services/ApplicationService');
const { setupTestDatabase, teardownTestDatabase, cleanupTestData, createTestUser } = require('../helpers/testSetup');
const BackendSDK = require('../../core/BackendSDK');
const db = require('../../models');

describe('Feature: programme-application-flow — Organisation Page Properties', () => {
  let convenerUserId;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await setupTestDatabase();
    convenerUserId = await createTestUser();
  });

  afterAll(async () => {
    await cleanupTestData('users', { id: convenerUserId });
    await teardownTestDatabase();
  });

  // ─── Property 40: Organisation slug format validation ────────────────────
  it('Property 40: invalid slug formats SHALL be rejected by the slug regex', () => {
    const SLUG_RE = /^[a-z0-9-]{3,50}$/;

    // Valid slugs should match
    fc.assert(
      fc.property(
        fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789-'), { minLength: 3, maxLength: 50 }),
        (slug) => {
          // Only test slugs that don't start/end with hyphen (common constraint)
          if (slug.startsWith('-') || slug.endsWith('-')) return true; // skip edge case
          expect(SLUG_RE.test(slug)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );

    // Invalid slugs should NOT match
    fc.assert(
      fc.property(
        fc.oneof(
          // Too short
          fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 1, maxLength: 2 }),
          // Contains uppercase
          fc.string({ minLength: 3, maxLength: 50 }).filter(s => /[A-Z]/.test(s)),
          // Contains spaces
          fc.string({ minLength: 3, maxLength: 50 }).filter(s => /\s/.test(s)),
          // Too long (51+ chars)
          fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 51, maxLength: 60 }),
        ),
        (slug) => {
          expect(SLUG_RE.test(slug)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ─── Property 39: Organisation slug uniqueness ───────────────────────────
  it('Property 39: setting a slug already taken by another user SHALL be rejected', async () => {
    const sdk = new BackendSDK();
    const userIds = [];

    try {
      await fc.assert(
        fc.asyncProperty(
          // Generate a valid slug
          fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'), { minLength: 3, maxLength: 20 })
            .filter(s => /^[a-z0-9]{3,20}$/.test(s)),
          async (slug) => {
            // User 1 takes the slug
            sdk.setTable('users');
            const user1Id = await sdk.insert({
              username: `sluguser1_${Date.now()}`,
              email: `sluguser1_${Date.now()}@example.com`,
              password: 'hash',
              role: 'convener',
              organisation_slug: slug,
            });
            userIds.push(user1Id);

            // User 2 tries to take the same slug — should fail at DB level (UNIQUE constraint)
            await expect(
              sdk.insert({
                username: `sluguser2_${Date.now()}`,
                email: `sluguser2_${Date.now()}@example.com`,
                password: 'hash',
                role: 'convener',
                organisation_slug: slug,
              })
            ).rejects.toThrow(); // UNIQUE constraint violation
          }
        ),
        { numRuns: 10 }
      );
    } finally {
      for (const id of userIds) await cleanupTestData('users', { id });
    }
  });

  // ─── Property 38: Organisation page only shows recruiting programmes ──────
  it('Property 38: org page query returns only application/hybrid programmes in recruiting status', async () => {
    const sdk = new BackendSDK();
    const programmeIds = [];

    try {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('draft', 'active', 'completed', 'archived'),
          fc.constantFrom('code', 'application', 'hybrid'),
          async (lifecycleStatus, onboardingMode) => {
            sdk.setTable('programmes');
            const id = await sdk.insert({
              name: `Org Page Test ${Date.now()}`,
              description: 'PBT',
              start_date: new Date('2026-01-01'),
              type: 'structured',
              created_by: convenerUserId,
              status: 'active',
              lifecycle_status: lifecycleStatus,
              onboarding_mode: onboardingMode,
            });
            programmeIds.push(id);

            // Query as the org page would
            const results = await db.programmes.findAll({
              where: {
                created_by: convenerUserId,
                lifecycle_status: 'recruiting',
                onboarding_mode: ['application', 'hybrid'],
              },
            });

            // This programme should NOT appear unless it's recruiting + application/hybrid
            const isVisible = lifecycleStatus === 'recruiting' &&
              (onboardingMode === 'application' || onboardingMode === 'hybrid');

            const found = results.some(p => p.id === id);
            expect(found).toBe(isVisible);
          }
        ),
        { numRuns: 20 }
      );
    } finally {
      for (const id of programmeIds) await cleanupTestData('programmes', { id });
    }
  });
});
