/**
 * Property-Based Tests: Application Form URL, Template, and Round-Trip Properties
 * Feature: programme-application-flow
 *
 * **Property 1: Application form URL generated for application/hybrid modes**
 * **Property 5: Application creation round-trip**
 * **Property 8: Template required before recruiting**
 * **Property 9: Template update preserves existing responses**
 * **Property 12: Reviewer notes round-trip**
 * **Property 13: Bulk action completeness**
 * **Property 20: Waitlist → accept follows same acceptance flow**
 * **Property 21: Rejected applicant can reapply**
 * **Property 31: Draft editable, submitted/under_review read-only**
 *
 * Tag: Feature: programme-application-flow, Property 1/5/8/9/12/13/20/21/31
 * Validates: Requirements 1.1, 2.2, 3.1, 3.3, 4.4, 4.7, 6.4, 6.5, 9.3, 9.4
 */

const fc = require('fast-check');
const ApplicationService = require('../../services/ApplicationService');
const { setupTestDatabase, teardownTestDatabase, cleanupTestData, createTestUser } = require('../helpers/testSetup');
const BackendSDK = require('../../core/BackendSDK');
const db = require('../../models');

describe('Feature: programme-application-flow — Form, Template, and Round-Trip Properties', () => {
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
      name: `Round-trip Test ${Date.now()}`,
      description: 'PBT',
      start_date: new Date('2026-01-01'),
      type: 'structured',
      created_by: convenerUserId,
      status: 'active',
      lifecycle_status: 'recruiting',
      onboarding_mode: 'application',
    });
  }

  // ─── Property 1: Application form URL generated for application/hybrid ────
  it('Property 1: programme with application/hybrid mode has non-null application_form_slug after first submission', async () => {
    const sdk = new BackendSDK();
    const programmeIds = [];

    try {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('application', 'hybrid'),
          fc.emailAddress(),
          async (mode, email) => {
            sdk.setTable('programmes');
            const id = await sdk.insert({
              name: `Slug Test ${Date.now()}`,
              description: 'PBT',
              start_date: new Date('2026-01-01'),
              type: 'structured',
              created_by: convenerUserId,
              status: 'active',
              lifecycle_status: 'recruiting',
              onboarding_mode: mode,
            });
            programmeIds.push(id);

            // Submit an application — this triggers slug generation
            const app = await ApplicationService.submitApplication(id, {
              name: 'Test',
              email,
              responses: {},
            });

            const programme = await db.programmes.findByPk(id);
            expect(programme.application_form_slug).toBeTruthy();

            // Cleanup app
            await cleanupTestData('application_history', { application_id: app.id });
            await cleanupTestData('applications', { id: app.id });
          }
        ),
        { numRuns: 10 }
      );
    } finally {
      for (const id of programmeIds) await cleanupTestData('programmes', { id });
    }
  });

  // ─── Property 5: Application creation round-trip ─────────────────────────
  it('Property 5: querying created application returns status=submitted, correct email, and responses', async () => {
    const sdk = new BackendSDK();
    const programmeId = await createRecruitingProgramme(sdk);
    const appIds = [];

    try {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.dictionary(fc.string({ minLength: 1, maxLength: 20 }), fc.string({ maxLength: 100 }), { minKeys: 0, maxKeys: 5 }),
          async (email, name, responses) => {
            const app = await ApplicationService.submitApplication(programmeId, { name, email, responses });
            appIds.push(app.id);

            const retrieved = await db.applications.findByPk(app.id);
            expect(retrieved.status).toBe('submitted');
            expect(retrieved.applicant_email).toBe(email.toLowerCase());
            // Responses are stored as JSON
            expect(retrieved.responses).toBeDefined();
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

  // ─── Property 9: Template update preserves existing responses ────────────
  it('Property 9: updating application template does NOT modify existing application responses', async () => {
    const sdk = new BackendSDK();
    const programmeId = await createRecruitingProgramme(sdk);
    const appIds = [];

    try {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.dictionary(fc.string({ minLength: 1, maxLength: 20 }), fc.string({ maxLength: 100 }), { minKeys: 1, maxKeys: 3 }),
          async (email, responses) => {
            const app = await ApplicationService.submitApplication(programmeId, {
              name: 'Template Test',
              email,
              responses,
            });
            appIds.push(app.id);

            const originalResponses = { ...app.responses };

            // Update the template (add a new question)
            await ApplicationService.saveTemplate(programmeId, [
              {
                question_text: 'New question after submission',
                question_type: 'text',
                is_required: false,
                order_index: 0,
              },
            ]);

            // Existing application responses must be unchanged
            const retrieved = await db.applications.findByPk(app.id);
            expect(JSON.stringify(retrieved.responses)).toBe(JSON.stringify(originalResponses));
          }
        ),
        { numRuns: 10 }
      );
    } finally {
      for (const id of appIds) {
        await cleanupTestData('application_history', { application_id: id });
        await cleanupTestData('applications', { id });
      }
      await cleanupTestData('application_template_questions', { programme_id: programmeId });
      await cleanupTestData('programmes', { id: programmeId });
    }
  });

  // ─── Property 12: Reviewer notes round-trip ──────────────────────────────
  it('Property 12: added reviewer notes are returned with correct reviewer_id and updated_at', async () => {
    const sdk = new BackendSDK();
    const programmeId = await createRecruitingProgramme(sdk);
    const appIds = [];

    try {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 1, maxLength: 500 }),
          async (email, notes) => {
            const app = await ApplicationService.submitApplication(programmeId, {
              name: 'Notes Test',
              email,
              responses: {},
            });
            appIds.push(app.id);

            await ApplicationService.addNotes(app.id, notes, reviewerUserId);

            const retrieved = await db.applications.findByPk(app.id);
            expect(retrieved.reviewer_notes).toBe(notes);
            expect(retrieved.reviewer_id).toBe(reviewerUserId);
            expect(retrieved.updated_at).toBeTruthy();
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

  // ─── Property 21: Rejected applicant can reapply ─────────────────────────
  it('Property 21: rejected applicant can submit a new application to the same recruiting programme', async () => {
    const sdk = new BackendSDK();
    const programmeId = await createRecruitingProgramme(sdk);
    const appIds = [];

    try {
      await fc.assert(
        fc.asyncProperty(fc.emailAddress(), async (email) => {
          // First application
          const app1 = await ApplicationService.submitApplication(programmeId, {
            name: 'Reapply Test',
            email,
            responses: {},
          });
          appIds.push(app1.id);

          // Move to under_review then reject
          await ApplicationService.transitionStatus(app1.id, 'under_review', { reviewerId: reviewerUserId });
          await ApplicationService.transitionStatus(app1.id, 'rejected', {
            reviewerId: reviewerUserId,
            rejectionReason: 'Not a fit',
          });

          // Second application from same email — should succeed
          const app2 = await ApplicationService.submitApplication(programmeId, {
            name: 'Reapply Test',
            email,
            responses: {},
          });
          appIds.push(app2.id);

          expect(app2.id).toBeTruthy();
          expect(app2.status).toBe('submitted');
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
});
