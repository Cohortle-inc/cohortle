/**
 * Property-Based Tests: Access Control Enforcement
 * Feature: programme-application-flow
 *
 * **Property 32: Public submission requires no authentication**
 * **Property 33: Only programme owner or admin can review**
 *
 * Tag: Feature: programme-application-flow, Property 32/33
 * Validates: Requirements 10.1, 10.2
 */

const fc = require('fast-check');
const ApplicationService = require('../../services/ApplicationService');
const { setupTestDatabase, teardownTestDatabase, cleanupTestData, createTestUser } = require('../helpers/testSetup');
const BackendSDK = require('../../core/BackendSDK');

describe('Feature: programme-application-flow — Access Control Enforcement', () => {
  let ownerUserId;
  let otherConvenerId;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await setupTestDatabase();
    ownerUserId = await createTestUser();
    otherConvenerId = await createTestUser();
  });

  afterAll(async () => {
    await cleanupTestData('users', { id: ownerUserId });
    await cleanupTestData('users', { id: otherConvenerId });
    await teardownTestDatabase();
  });

  async function createRecruitingProgramme(sdk, ownerId) {
    sdk.setTable('programmes');
    return sdk.insert({
      name: `Access Test ${Date.now()}`,
      description: 'PBT',
      start_date: new Date('2026-01-01'),
      type: 'structured',
      created_by: ownerId,
      status: 'active',
      lifecycle_status: 'recruiting',
      onboarding_mode: 'application',
    });
  }

  // ─── Property 32: Public submission requires no authentication ────────────
  it('Property 32: valid submission to recruiting programme succeeds without auth (userId=null)', async () => {
    const sdk = new BackendSDK();
    const programmeId = await createRecruitingProgramme(sdk, ownerUserId);
    const appIds = [];

    try {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 1, maxLength: 100 }),
          async (email, name) => {
            // submitApplication does not require a userId — it's public
            const app = await ApplicationService.submitApplication(programmeId, {
              name,
              email,
              responses: {},
            });
            appIds.push(app.id);
            expect(app.id).toBeTruthy();
            expect(app.status).toBe('submitted');
          }
        ),
        { numRuns: 15 }
      );
    } finally {
      for (const id of appIds) {
        await cleanupTestData('application_history', { application_id: id });
        await cleanupTestData('applications', { id });
      }
      await cleanupTestData('programmes', { id: programmeId });
    }
  });

  // ─── Property 33: Only programme owner or admin can review ───────────────
  it('Property 33: non-owner convener attempting to review SHALL be rejected with FORBIDDEN', async () => {
    const sdk = new BackendSDK();
    // Programme owned by ownerUserId
    const programmeId = await createRecruitingProgramme(sdk, ownerUserId);
    const appIds = [];

    try {
      await fc.assert(
        fc.asyncProperty(fc.emailAddress(), async (email) => {
          const app = await ApplicationService.submitApplication(programmeId, {
            name: 'Test',
            email,
            responses: {},
          });
          appIds.push(app.id);

          // otherConvenerId does NOT own this programme — should be forbidden
          await expect(
            ApplicationService.transitionStatus(app.id, 'under_review', {
              reviewerId: otherConvenerId,
            })
          ).rejects.toMatchObject({ code: 'FORBIDDEN' });
        }),
        { numRuns: 10 }
      );
    } finally {
      for (const id of appIds) {
        await cleanupTestData('application_history', { application_id: id });
        await cleanupTestData('applications', { id });
      }
      await cleanupTestData('programmes', { id: programmeId });
    }
  });
});
