/**
 * Property-Based Tests: Application Status State Machine
 * Feature: programme-application-flow
 *
 * **Property 11: Submitted → under_review auto-transition**
 * **Property 14: Acceptance state transition invariants**
 * **Property 18: Rejection requires reason**
 * **Property 19: Rejection state transition invariants**
 * **Property 27: Status transition creates history record**
 * **Property 28: History is chronologically ordered**
 * **Property 29: Invalid state machine transitions are rejected**
 *
 * Tag: Feature: programme-application-flow, Property 11/14/18/19/27/28/29
 * Validates: Requirements 4.3, 5.1, 6.1, 6.2, 8.1, 8.3, 8.5
 */

const fc = require('fast-check');
const ApplicationService = require('../../services/ApplicationService');
const ApplicationHistoryService = require('../../services/ApplicationHistoryService');
const { setupTestDatabase, teardownTestDatabase, cleanupTestData, createTestUser } = require('../helpers/testSetup');
const BackendSDK = require('../../core/BackendSDK');

describe('Feature: programme-application-flow — Status State Machine', () => {
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

  async function createRecruitingProgramme(sdk) {
    sdk.setTable('programmes');
    return sdk.insert({
      name: `PBT Programme ${Date.now()}`,
      description: 'state machine test',
      start_date: new Date('2026-01-01'),
      type: 'structured',
      created_by: convenerUserId,
      status: 'active',
      lifecycle_status: 'recruiting',
      onboarding_mode: 'application',
    });
  }

  async function createSubmittedApplication(programmeId, email) {
    return ApplicationService.submitApplication(programmeId, {
      name: 'Test Applicant',
      email,
      responses: {},
    });
  }

  // ─── Property 11: submitted → under_review auto-transition ───────────────
  it('Property 11: retrieving a submitted application transitions it to under_review', async () => {
    const sdk = new BackendSDK();
    const programmeId = await createRecruitingProgramme(sdk);
    const appIds = [];

    try {
      await fc.assert(
        fc.asyncProperty(fc.emailAddress(), async (email) => {
          const app = await createSubmittedApplication(programmeId, email);
          appIds.push(app.id);

          expect(app.status).toBe('submitted');

          // Retrieve via service (triggers auto-transition)
          const retrieved = await ApplicationService.getApplication(app.id, reviewerUserId);
          expect(retrieved.status).toBe('under_review');
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

  // ─── Property 14: Acceptance state transition invariants ─────────────────
  it('Property 14: accepted application has status=accepted, reviewer_id, decision_at', async () => {
    const sdk = new BackendSDK();
    const programmeId = await createRecruitingProgramme(sdk);

    // Create a cohort for acceptance
    sdk.setTable('cohorts');
    const cohortId = await sdk.insert({
      programme_id: programmeId,
      name: 'Test Cohort',
      enrollment_code: `CODE-${Date.now()}`,
      start_date: new Date('2026-01-01'),
      status: 'active',
    });

    const appIds = [];
    try {
      await fc.assert(
        fc.asyncProperty(fc.emailAddress(), async (email) => {
          const app = await createSubmittedApplication(programmeId, email);
          appIds.push(app.id);

          // Move to under_review first
          await ApplicationService.transitionStatus(app.id, 'under_review', { reviewerId: reviewerUserId });

          // Accept
          await ApplicationService.transitionStatus(app.id, 'accepted', {
            reviewerId: reviewerUserId,
            cohortId,
          });

          const updated = await ApplicationService.getApplication(app.id, reviewerUserId);
          expect(updated.status).toBe('accepted');
          expect(updated.reviewer_id).toBeTruthy();
          expect(updated.decision_at).toBeTruthy();
        }),
        { numRuns: 5 }
      );
    } finally {
      for (const id of appIds) {
        await cleanupTestData('application_history', { application_id: id });
        await cleanupTestData('applications', { id });
      }
      await cleanupTestData('cohorts', { id: cohortId });
      await cleanupTestData('programmes', { id: programmeId });
    }
  });

  // ─── Property 18: Rejection requires reason ──────────────────────────────
  it('Property 18: rejection without rejection_reason SHALL be rejected', async () => {
    const sdk = new BackendSDK();
    const programmeId = await createRecruitingProgramme(sdk);
    const appIds = [];

    try {
      await fc.assert(
        fc.asyncProperty(fc.emailAddress(), async (email) => {
          const app = await createSubmittedApplication(programmeId, email);
          appIds.push(app.id);

          await ApplicationService.transitionStatus(app.id, 'under_review', { reviewerId: reviewerUserId });

          await expect(
            ApplicationService.transitionStatus(app.id, 'rejected', {
              reviewerId: reviewerUserId,
              rejectionReason: '',
            })
          ).rejects.toMatchObject({ code: 'REJECTION_REASON_REQUIRED' });
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

  // ─── Property 19: Rejection state transition invariants ──────────────────
  it('Property 19: rejected application has status=rejected and non-null rejection_reason', async () => {
    const sdk = new BackendSDK();
    const programmeId = await createRecruitingProgramme(sdk);
    const appIds = [];

    try {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 1, maxLength: 200 }),
          async (email, reason) => {
            const app = await createSubmittedApplication(programmeId, email);
            appIds.push(app.id);

            await ApplicationService.transitionStatus(app.id, 'under_review', { reviewerId: reviewerUserId });
            await ApplicationService.transitionStatus(app.id, 'rejected', {
              reviewerId: reviewerUserId,
              rejectionReason: reason,
            });

            const updated = await ApplicationService.getApplication(app.id, reviewerUserId);
            expect(updated.status).toBe('rejected');
            expect(updated.rejection_reason).toBeTruthy();
          }
        ),
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

  // ─── Property 27: Status transition creates history record ───────────────
  it('Property 27: every status transition creates an application_history record', async () => {
    const sdk = new BackendSDK();
    const programmeId = await createRecruitingProgramme(sdk);
    const appIds = [];

    try {
      await fc.assert(
        fc.asyncProperty(fc.emailAddress(), async (email) => {
          const app = await createSubmittedApplication(programmeId, email);
          appIds.push(app.id);

          // submitted → under_review
          await ApplicationService.transitionStatus(app.id, 'under_review', { reviewerId: reviewerUserId });

          const history = await ApplicationHistoryService.getHistory(app.id);
          // At minimum: null→submitted (on create) + submitted→under_review
          expect(history.length).toBeGreaterThanOrEqual(2);

          const lastEntry = history[history.length - 1];
          expect(lastEntry.to_status).toBe('under_review');
          expect(lastEntry.from_status).toBe('submitted');
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

  // ─── Property 28: History is chronologically ordered ─────────────────────
  it('Property 28: getHistory returns records in ascending created_at order', async () => {
    const sdk = new BackendSDK();
    const programmeId = await createRecruitingProgramme(sdk);
    const appIds = [];

    try {
      await fc.assert(
        fc.asyncProperty(fc.emailAddress(), async (email) => {
          const app = await createSubmittedApplication(programmeId, email);
          appIds.push(app.id);

          await ApplicationService.transitionStatus(app.id, 'under_review', { reviewerId: reviewerUserId });
          await ApplicationService.transitionStatus(app.id, 'waitlisted', { reviewerId: reviewerUserId });

          const history = await ApplicationHistoryService.getHistory(app.id);
          expect(history.length).toBeGreaterThanOrEqual(2);

          for (let i = 1; i < history.length; i++) {
            const prev = new Date(history[i - 1].created_at).getTime();
            const curr = new Date(history[i].created_at).getTime();
            expect(curr).toBeGreaterThanOrEqual(prev);
          }
        }),
        { numRuns: 5 }
      );
    } finally {
      for (const id of appIds) {
        await cleanupTestData('application_history', { application_id: id });
        await cleanupTestData('applications', { id });
      }
      await cleanupTestData('programmes', { id: programmeId });
    }
  });

  // ─── Property 29: Invalid state machine transitions are rejected ──────────
  it('Property 29: invalid transitions SHALL be rejected with INVALID_STATUS_TRANSITION', async () => {
    const sdk = new BackendSDK();
    const programmeId = await createRecruitingProgramme(sdk);
    const appIds = [];

    // Invalid transitions per the state machine
    const invalidTransitions = [
      { from: 'submitted', to: 'accepted' },
      { from: 'submitted', to: 'rejected' },
      { from: 'submitted', to: 'waitlisted' },
      { from: 'under_review', to: 'submitted' },
    ];

    try {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...invalidTransitions),
          fc.emailAddress(),
          async ({ from, to }, email) => {
            const app = await createSubmittedApplication(programmeId, email);
            appIds.push(app.id);

            // Move to the 'from' state if needed
            if (from === 'under_review') {
              await ApplicationService.transitionStatus(app.id, 'under_review', { reviewerId: reviewerUserId });
            }

            await expect(
              ApplicationService.transitionStatus(app.id, to, { reviewerId: reviewerUserId })
            ).rejects.toMatchObject({ code: 'INVALID_STATUS_TRANSITION' });
          }
        ),
        { numRuns: 20 }
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
