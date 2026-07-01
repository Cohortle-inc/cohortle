/**
 * Integration Tests: Full Application Lifecycle Flows
 * Feature: programme-application-flow
 *
 * Covers:
 * - Full Apply → Review → Accept → Enroll flow (new user path)
 * - Full Apply → Review → Accept → Enroll flow (existing user path)
 * - Hybrid mode: simultaneous code enrollment and application submission
 * - Bulk accept with history verification
 * - CSV export: column headers and row count
 *
 * Validates: Requirements 5.4, 5.5, 7.4, 4.7, 12.5
 */

const ApplicationService = require('../../services/ApplicationService');
const ApplicationHistoryService = require('../../services/ApplicationHistoryService');
const AcceptanceTokenService = require('../../services/AcceptanceTokenService');
const EnrollmentService = require('../../services/EnrollmentService');
const { setupTestDatabase, teardownTestDatabase, cleanupTestData, createTestUser } = require('../helpers/testSetup');
const BackendSDK = require('../../core/BackendSDK');
const db = require('../../models');

describe('Feature: programme-application-flow — Full Lifecycle Integration', () => {
  let convenerUserId;
  let reviewerUserId;
  let sdk;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await setupTestDatabase();
    convenerUserId = await createTestUser();
    reviewerUserId = await createTestUser();
    sdk = new BackendSDK();
  });

  afterAll(async () => {
    await cleanupTestData('users', { id: convenerUserId });
    await cleanupTestData('users', { id: reviewerUserId });
    await teardownTestDatabase();
  });

  // ─── Helpers ──────────────────────────────────────────────────────────────

  async function createRecruitingProgramme(mode = 'application') {
    sdk.setTable('programmes');
    return sdk.insert({
      name: `Integration Test Programme ${Date.now()}`,
      description: 'lifecycle integration test',
      start_date: new Date('2026-01-01'),
      type: 'structured',
      created_by: convenerUserId,
      status: 'active',
      lifecycle_status: 'recruiting',
      onboarding_mode: mode,
    });
  }

  async function createCohort(programmeId, { maxMembers } = {}) {
    sdk.setTable('cohorts');
    return sdk.insert({
      programme_id: programmeId,
      name: `Test Cohort ${Date.now()}`,
      enrollment_code: `CODE-${Date.now()}`,
      start_date: new Date('2026-01-01'),
      status: 'active',
      ...(maxMembers ? { max_members: maxMembers } : {}),
    });
  }

  async function cleanupApplication(appId) {
    await cleanupTestData('acceptance_tokens', { application_id: appId });
    await cleanupTestData('application_history', { application_id: appId });
    await cleanupTestData('applications', { id: appId });
  }

  // ─── Test 1: Full lifecycle — new user path ───────────────────────────────
  it('Apply → Review → Accept → Enroll: new user path returns prefill data without consuming token', async () => {
    const programmeId = await createRecruitingProgramme();
    const cohortId = await createCohort(programmeId);
    const email = `newuser_${Date.now()}@example.com`;

    let appId;
    try {
      // 1. Submit application (no account)
      const app = await ApplicationService.submitApplication(programmeId, {
        name: 'New User Applicant',
        email,
        responses: {},
      });
      appId = app.id;
      expect(app.status).toBe('submitted');

      // 2. Convener opens application → auto-transitions to under_review
      const reviewed = await ApplicationService.getApplication(app.id, reviewerUserId);
      expect(reviewed.status).toBe('under_review');

      // 3. Accept application
      await ApplicationService.transitionStatus(app.id, 'accepted', {
        reviewerId: reviewerUserId,
        cohortId,
      });

      const accepted = await db.applications.findByPk(app.id);
      expect(accepted.status).toBe('accepted');
      expect(accepted.reviewer_id).toBeTruthy();
      expect(accepted.decision_at).toBeTruthy();

      // 4. Token created — find it
      const tokenRecord = await db.acceptance_tokens.findOne({ where: { application_id: app.id } });
      expect(tokenRecord).toBeTruthy();
      expect(tokenRecord.used_at).toBeNull();

      // 5. Redeem token as new user (userId = null) — should NOT consume token
      const result = await ApplicationService.redeemAcceptanceToken(tokenRecord.token, null);
      expect(result.requiresSignup).toBe(true);
      expect(result.prefill.email).toBe(email);
      expect(result.cohortId).toBe(cohortId);

      // Token must still be unconsumed
      const tokenAfter = await db.acceptance_tokens.findOne({ where: { application_id: app.id } });
      expect(tokenAfter.used_at).toBeNull();
    } finally {
      if (appId) await cleanupApplication(appId);
      await cleanupTestData('cohorts', { id: cohortId });
      await cleanupTestData('programmes', { id: programmeId });
    }
  });

  // ─── Test 2: Full lifecycle — existing user path ──────────────────────────
  it('Apply → Review → Accept → Enroll: existing user path creates enrollment and consumes token', async () => {
    const programmeId = await createRecruitingProgramme();
    const cohortId = await createCohort(programmeId);
    const email = `existinguser_${Date.now()}@example.com`;

    // Create an existing user account
    sdk.setTable('users');
    const existingUserId = await sdk.insert({
      username: `existing_${Date.now()}`,
      email,
      password: 'hash',
      role: 'learner',
    });

    let appId;
    let enrollmentId;
    try {
      // 1. Submit application
      const app = await ApplicationService.submitApplication(programmeId, {
        name: 'Existing User',
        email,
        responses: {},
      });
      appId = app.id;

      // 2. Review
      await ApplicationService.getApplication(app.id, reviewerUserId);

      // 3. Accept
      await ApplicationService.transitionStatus(app.id, 'accepted', {
        reviewerId: reviewerUserId,
        cohortId,
      });

      // 4. Get token
      const tokenRecord = await db.acceptance_tokens.findOne({ where: { application_id: app.id } });
      expect(tokenRecord).toBeTruthy();

      // 5. Redeem as existing user
      const result = await ApplicationService.redeemAcceptanceToken(tokenRecord.token, existingUserId);
      expect(result.enrolled).toBe(true);
      expect(result.cohortId).toBe(cohortId);
      enrollmentId = result.enrollmentId;

      // Enrollment must have correct source fields
      const enrollment = await db.enrollments.findByPk(enrollmentId);
      expect(enrollment).toBeTruthy();
      expect(enrollment.enrollment_source).toBe('application');
      expect(enrollment.application_id).toBe(app.id);

      // Token must be consumed
      const tokenAfter = await db.acceptance_tokens.findOne({ where: { application_id: app.id } });
      expect(tokenAfter.used_at).toBeTruthy();
    } finally {
      if (enrollmentId) await cleanupTestData('enrollments', { id: enrollmentId });
      if (appId) await cleanupApplication(appId);
      await cleanupTestData('cohorts', { id: cohortId });
      await cleanupTestData('programmes', { id: programmeId });
      await cleanupTestData('users', { id: existingUserId });
    }
  });

  // ─── Test 3: Hybrid mode — code enrollment and application simultaneously ─
  it('Hybrid mode: code enrollment and application submission both succeed on same programme', async () => {
    const programmeId = await createRecruitingProgramme('hybrid');
    const cohortId = await createCohort(programmeId);

    // Create a learner for code enrollment
    sdk.setTable('users');
    const learnerId = await sdk.insert({
      username: `hybrid_learner_${Date.now()}`,
      email: `hybrid_${Date.now()}@example.com`,
      password: 'hash',
      role: 'learner',
    });

    // Get the cohort's enrollment code
    const cohort = await db.cohorts.findByPk(cohortId);
    let appId;
    let enrollmentId;

    try {
      // Code enrollment should succeed on hybrid programme
      const enrollment = await EnrollmentService.enrollLearner(learnerId, cohortId);
      enrollmentId = enrollment.id;
      expect(enrollment).toBeTruthy();

      // Application submission should also succeed on hybrid programme
      const app = await ApplicationService.submitApplication(programmeId, {
        name: 'Hybrid Applicant',
        email: `hybrid_app_${Date.now()}@example.com`,
        responses: {},
      });
      appId = app.id;
      expect(app.status).toBe('submitted');
    } finally {
      if (enrollmentId) await cleanupTestData('enrollments', { id: enrollmentId });
      if (appId) await cleanupApplication(appId);
      await cleanupTestData('cohorts', { id: cohortId });
      await cleanupTestData('programmes', { id: programmeId });
      await cleanupTestData('users', { id: learnerId });
    }
  });

  // ─── Test 4: Bulk accept with history verification ────────────────────────
  it('Bulk accept: all selected applications have new status and history records', async () => {
    const programmeId = await createRecruitingProgramme();
    const cohortId = await createCohort(programmeId);
    const appIds = [];

    try {
      // Create 3 applications and move them to under_review
      for (let i = 0; i < 3; i++) {
        const email = `bulk_${Date.now()}_${i}@example.com`;
        const app = await ApplicationService.submitApplication(programmeId, {
          name: `Bulk Applicant ${i}`,
          email,
          responses: {},
        });
        appIds.push(app.id);
        await ApplicationService.transitionStatus(app.id, 'under_review', { reviewerId: reviewerUserId });
      }

      // Bulk accept all 3
      const results = await ApplicationService.bulkTransition(appIds, 'accepted', {
        reviewerId: reviewerUserId,
        cohortId,
      });

      // All should succeed
      expect(results.every((r) => r.success)).toBe(true);

      // Verify each application has correct status, reviewer_id, and history
      for (const appId of appIds) {
        const app = await db.applications.findByPk(appId);
        expect(app.status).toBe('accepted');
        expect(app.reviewer_id).toBe(reviewerUserId);

        const history = await ApplicationHistoryService.getHistory(appId);
        const acceptEntry = history.find((h) => h.to_status === 'accepted');
        expect(acceptEntry).toBeTruthy();
        expect(acceptEntry.changed_by).toBe(reviewerUserId);
      }
    } finally {
      for (const id of appIds) await cleanupApplication(id);
      await cleanupTestData('cohorts', { id: cohortId });
      await cleanupTestData('programmes', { id: programmeId });
    }
  });

  // ─── Test 5: CSV export — headers and row count ───────────────────────────
  it('CSV export: column headers are correct and row count matches application count', async () => {
    const programmeId = await createRecruitingProgramme();
    const appIds = [];
    const count = 4;

    try {
      for (let i = 0; i < count; i++) {
        const app = await ApplicationService.submitApplication(programmeId, {
          name: `CSV Applicant ${i}`,
          email: `csv_${Date.now()}_${i}@example.com`,
          responses: {},
        });
        appIds.push(app.id);
      }

      const csv = await ApplicationService.exportApplicationsCsv(programmeId, reviewerUserId);
      const lines = csv.trim().split('\n');

      // First line is headers
      const headers = lines[0];
      expect(headers).toContain('name');
      expect(headers).toContain('email');
      expect(headers).toContain('status');
      expect(headers).toContain('submitted_at');

      // Remaining lines are data rows
      const dataRows = lines.slice(1);
      expect(dataRows.length).toBe(count);
    } finally {
      for (const id of appIds) await cleanupApplication(id);
      await cleanupTestData('programmes', { id: programmeId });
    }
  });
});
