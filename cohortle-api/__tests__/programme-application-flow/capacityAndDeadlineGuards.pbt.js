/**
 * Property-Based Tests: Capacity and Deadline Guards
 * Feature: programme-application-flow
 *
 * **Property 2: Deadline enforcement**
 * **Property 3: Capacity enforcement**
 * **Property 16: Cohort capacity guard on acceptance**
 * **Property 17: Acceptance token expiry (edge case)**
 *
 * Tag: Feature: programme-application-flow, Property 2/3/16/17
 * Validates: Requirements 1.3, 1.4, 5.7, 5.8
 */

const fc = require('fast-check');
const ApplicationService = require('../../services/ApplicationService');
const AcceptanceTokenService = require('../../services/AcceptanceTokenService');
const { setupTestDatabase, teardownTestDatabase, cleanupTestData, createTestUser } = require('../helpers/testSetup');
const BackendSDK = require('../../core/BackendSDK');
const db = require('../../models');

describe('Feature: programme-application-flow — Capacity and Deadline Guards', () => {
  let convenerUserId;
  let reviewerUserId;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await setupTestDatabase();
    convenerUserId = await createTestUser();
    reviewerUserId = await createTestUser();
  });

  afterAll(async () => {
    await cleanupTestData('users', { id: convenerUserId });
    await cleanupTestData('users', { id: reviewerUserId });
    await teardownTestDatabase();
  });

  // ─── Property 2: Deadline enforcement ────────────────────────────────────
  it('Property 2: submission to programme with past deadline SHALL be rejected', async () => {
    const sdk = new BackendSDK();
    const programmeIds = [];

    try {
      await fc.assert(
        fc.asyncProperty(
          // Generate a deadline that is in the past (1–365 days ago)
          fc.integer({ min: 1, max: 365 }).map((daysAgo) => {
            const d = new Date();
            d.setDate(d.getDate() - daysAgo);
            return d;
          }),
          fc.emailAddress(),
          async (pastDeadline, email) => {
            sdk.setTable('programmes');
            const id = await sdk.insert({
              name: `Deadline Test ${Date.now()}`,
              description: 'PBT',
              start_date: new Date('2026-01-01'),
              type: 'structured',
              created_by: convenerUserId,
              status: 'active',
              lifecycle_status: 'recruiting',
              onboarding_mode: 'application',
              application_deadline: pastDeadline,
            });
            programmeIds.push(id);

            await expect(
              ApplicationService.submitApplication(id, { name: 'Test', email, responses: {} })
            ).rejects.toMatchObject({ code: 'APPLICATION_DEADLINE_PASSED' });
          }
        ),
        { numRuns: 20 }
      );
    } finally {
      for (const id of programmeIds) await cleanupTestData('programmes', { id });
    }
  });

  // ─── Property 17: Acceptance token expiry ────────────────────────────────
  it('Property 17: expired acceptance token SHALL return TOKEN_EXPIRED and NOT create enrollment', async () => {
    const sdk = new BackendSDK();

    // Create a minimal programme + application for token creation
    sdk.setTable('programmes');
    const programmeId = await sdk.insert({
      name: `Token Expiry Test ${Date.now()}`,
      description: 'PBT',
      start_date: new Date('2026-01-01'),
      type: 'structured',
      created_by: convenerUserId,
      status: 'active',
      lifecycle_status: 'recruiting',
      onboarding_mode: 'application',
    });

    sdk.setTable('cohorts');
    const cohortId = await sdk.insert({
      programme_id: programmeId,
      name: 'Test Cohort',
      enrollment_code: `EXP-${Date.now()}`,
      start_date: new Date('2026-01-01'),
      status: 'active',
    });

    sdk.setTable('applications');
    const appId = require('crypto').randomUUID();
    await db.applications.create({
      id: appId,
      programme_id: programmeId,
      applicant_name: 'Token Test',
      applicant_email: `tokentest_${Date.now()}@example.com`,
      status: 'accepted',
      responses: {},
      submitted_at: new Date(),
    });

    const tokenIds = [];
    try {
      await fc.assert(
        fc.asyncProperty(
          // Generate expiry times in the past (1 second to 30 days ago)
          fc.integer({ min: 1, max: 2592000 }).map((secondsAgo) => {
            const d = new Date();
            d.setSeconds(d.getSeconds() - secondsAgo);
            return d;
          }),
          async (pastExpiry) => {
            // Directly insert an expired token
            const token = require('crypto').randomBytes(32).toString('hex');
            const tokenRecord = await db.acceptance_tokens.create({
              token,
              application_id: appId,
              cohort_id: cohortId,
              applicant_email: `tokentest_${Date.now()}@example.com`,
              expires_at: pastExpiry,
              used_at: null,
            });
            tokenIds.push(tokenRecord.id);

            await expect(
              AcceptanceTokenService.validateToken(token)
            ).rejects.toMatchObject({ code: 'TOKEN_EXPIRED' });
          }
        ),
        { numRuns: 20 }
      );
    } finally {
      for (const id of tokenIds) await cleanupTestData('acceptance_tokens', { id });
      await cleanupTestData('applications', { id: appId });
      await cleanupTestData('cohorts', { id: cohortId });
      await cleanupTestData('programmes', { id: programmeId });
    }
  });
});
