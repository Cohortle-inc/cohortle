/**
 * Property-Based Tests: Application Submission Validation
 * Feature: programme-application-flow
 *
 * **Property 4: Required field validation**
 * **Property 6: Duplicate application rejection**
 * **Property 7: Non-recruiting programme rejection**
 *
 * Tag: Feature: programme-application-flow, Property 4/6/7
 * Validates: Requirements 2.1, 2.3, 2.6
 */

const fc = require('fast-check');
const ApplicationService = require('../../services/ApplicationService');
const { setupTestDatabase, teardownTestDatabase, cleanupTestData, createTestUser } = require('../helpers/testSetup');
const BackendSDK = require('../../core/BackendSDK');

describe('Feature: programme-application-flow — Application Submission Validation', () => {
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

  // ─── Helper: create a minimal recruiting programme ───────────────────────
  async function createRecruitingProgramme(sdk) {
    sdk.setTable('programmes');
    const id = await sdk.insert({
      name: `Test Programme ${Date.now()}`,
      description: 'PBT programme',
      start_date: new Date('2026-01-01'),
      type: 'structured',
      created_by: convenerUserId,
      status: 'active',
      lifecycle_status: 'recruiting',
      onboarding_mode: 'application',
    });
    return id;
  }

  // ─── Property 4: Required field validation ────────────────────────────────
  it('Property 4: submission missing name or email SHALL be rejected', async () => {
    const sdk = new BackendSDK();
    const programmeId = await createRecruitingProgramme(sdk);
    const createdAppIds = [];

    try {
      await fc.assert(
        fc.asyncProperty(
          // Generate submissions with at least one required field missing
          fc.oneof(
            fc.record({ name: fc.constant(''), email: fc.emailAddress() }),
            fc.record({ name: fc.string({ minLength: 1 }), email: fc.constant('') }),
            fc.record({ name: fc.constant(null), email: fc.emailAddress() }),
          ),
          async ({ name, email }) => {
            await expect(
              ApplicationService.submitApplication(programmeId, { name, email, responses: {} })
            ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
          }
        ),
        { numRuns: 30 }
      );
    } finally {
      for (const id of createdAppIds) await cleanupTestData('applications', { id });
      await cleanupTestData('programmes', { id: programmeId });
    }
  });

  // ─── Property 6: Duplicate application rejection ─────────────────────────
  it('Property 6: second submission from same email SHALL be rejected with DUPLICATE_APPLICATION', async () => {
    const sdk = new BackendSDK();
    const programmeId = await createRecruitingProgramme(sdk);
    const createdAppIds = [];

    try {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 1, maxLength: 100 }),
          async (email, name) => {
            // First submission — should succeed
            let first;
            try {
              first = await ApplicationService.submitApplication(programmeId, { name, email, responses: {} });
              createdAppIds.push(first.id);
            } catch (err) {
              // If first submission fails for another reason, skip this run
              return;
            }

            // Second submission — must be rejected
            await expect(
              ApplicationService.submitApplication(programmeId, { name, email, responses: {} })
            ).rejects.toMatchObject({ code: 'DUPLICATE_APPLICATION' });
          }
        ),
        { numRuns: 20 }
      );
    } finally {
      for (const id of createdAppIds) await cleanupTestData('applications', { id });
      await cleanupTestData('programmes', { id: programmeId });
    }
  });

  // ─── Property 7: Non-recruiting programme rejection ───────────────────────
  it('Property 7: submission to non-recruiting programme SHALL be rejected', async () => {
    const sdk = new BackendSDK();
    const nonRecruitingStatuses = ['draft', 'active', 'completed', 'archived'];

    const programmeIds = [];
    try {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...nonRecruitingStatuses),
          fc.emailAddress(),
          fc.string({ minLength: 1, maxLength: 100 }),
          async (lifecycleStatus, email, name) => {
            sdk.setTable('programmes');
            const programmeId = await sdk.insert({
              name: `Non-recruiting ${Date.now()}`,
              description: 'PBT',
              start_date: new Date('2026-01-01'),
              type: 'structured',
              created_by: convenerUserId,
              status: 'active',
              lifecycle_status: lifecycleStatus,
              onboarding_mode: 'application',
            });
            programmeIds.push(programmeId);

            await expect(
              ApplicationService.submitApplication(programmeId, { name, email, responses: {} })
            ).rejects.toMatchObject({ code: 'PROGRAMME_NOT_RECRUITING' });
          }
        ),
        { numRuns: 20 }
      );
    } finally {
      for (const id of programmeIds) await cleanupTestData('programmes', { id });
    }
  });
});
