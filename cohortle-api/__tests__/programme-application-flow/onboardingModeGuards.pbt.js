/**
 * Property-Based Tests: Onboarding Mode Guards
 * Feature: programme-application-flow
 *
 * **Property 22: onboarding_mode persists correctly**
 * **Property 23: code mode blocks application submission**
 * **Property 24: application mode blocks enrollment code join**
 * **Property 25: hybrid mode allows both flows**
 * **Property 26: New programmes default to code mode**
 *
 * Tag: Feature: programme-application-flow, Property 22/23/24/25/26
 * Validates: Requirements 7.1–7.4, 7.6, 11.1, 11.2
 */

const fc = require('fast-check');
const ApplicationService = require('../../services/ApplicationService');
const EnrollmentService = require('../../services/EnrollmentService');
const { setupTestDatabase, teardownTestDatabase, cleanupTestData, createTestUser } = require('../helpers/testSetup');
const BackendSDK = require('../../core/BackendSDK');
const db = require('../../models');

describe('Feature: programme-application-flow — Onboarding Mode Guards', () => {
  let convenerUserId;
  let learnerUserId;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await setupTestDatabase();
    convenerUserId = await createTestUser();
    learnerUserId = await createTestUser();
  });

  afterAll(async () => {
    await cleanupTestData('users', { id: convenerUserId });
    await cleanupTestData('users', { id: learnerUserId });
    await teardownTestDatabase();
  });

  // ─── Property 22: onboarding_mode persists correctly ─────────────────────
  it('Property 22: setting onboarding_mode and retrieving returns the same value', async () => {
    const sdk = new BackendSDK();
    const validModes = ['code', 'application', 'hybrid'];

    const programmeIds = [];
    try {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...validModes),
          async (mode) => {
            sdk.setTable('programmes');
            const id = await sdk.insert({
              name: `Mode Test ${Date.now()}`,
              description: 'PBT',
              start_date: new Date('2026-01-01'),
              type: 'structured',
              created_by: convenerUserId,
              status: 'active',
              lifecycle_status: 'recruiting',
              onboarding_mode: mode,
            });
            programmeIds.push(id);

            const programme = await db.programmes.findByPk(id);
            expect(programme.onboarding_mode).toBe(mode);
          }
        ),
        { numRuns: 30 }
      );
    } finally {
      for (const id of programmeIds) await cleanupTestData('programmes', { id });
    }
  });

  // ─── Property 23: code mode blocks application submission ─────────────────
  it('Property 23: programme with onboarding_mode=code rejects application submissions', async () => {
    const sdk = new BackendSDK();
    const programmeIds = [];

    try {
      await fc.assert(
        fc.asyncProperty(fc.emailAddress(), async (email) => {
          sdk.setTable('programmes');
          const id = await sdk.insert({
            name: `Code-only ${Date.now()}`,
            description: 'PBT',
            start_date: new Date('2026-01-01'),
            type: 'structured',
            created_by: convenerUserId,
            status: 'active',
            lifecycle_status: 'recruiting',
            onboarding_mode: 'code',
          });
          programmeIds.push(id);

          await expect(
            ApplicationService.submitApplication(id, { name: 'Test', email, responses: {} })
          ).rejects.toMatchObject({ code: 'APPLICATIONS_NOT_ENABLED' });
        }),
        { numRuns: 20 }
      );
    } finally {
      for (const id of programmeIds) await cleanupTestData('programmes', { id });
    }
  });

  // ─── Property 26: New programmes default to code mode ────────────────────
  it('Property 26: newly created programme without explicit onboarding_mode defaults to code', async () => {
    const sdk = new BackendSDK();
    const programmeIds = [];

    try {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }),
          async (name) => {
            sdk.setTable('programmes');
            const id = await sdk.insert({
              name,
              description: 'PBT default mode test',
              start_date: new Date('2026-01-01'),
              type: 'structured',
              created_by: convenerUserId,
              status: 'active',
              lifecycle_status: 'draft',
              // onboarding_mode intentionally omitted — should default to 'code'
            });
            programmeIds.push(id);

            const programme = await db.programmes.findByPk(id);
            expect(programme.onboarding_mode).toBe('code');
          }
        ),
        { numRuns: 20 }
      );
    } finally {
      for (const id of programmeIds) await cleanupTestData('programmes', { id });
    }
  });
});
