/**
 * Property-Based Test: Enrollment Idempotency
 * Feature: wlimp-programme-rollout
 * Property 7: Enrollment Idempotency
 * 
 * **Validates: Requirements 2.1, 2.7**
 * 
 * For any learner and valid enrollment code, enrolling multiple times with the same code
 * should result in exactly one enrollment record, and subsequent enrollment attempts should
 * return the existing enrollment without error.
 */

const fc = require('fast-check');
const BackendSDK = require('../../core/BackendSDK');
const EnrollmentService = require('../../services/EnrollmentService');
const {
  setupTestDatabase,
  teardownTestDatabase,
  cleanupTestData,
  createTestCommunity,
  createTestUser,
} = require('../helpers/testSetup');

describe('Feature: wlimp-programme-rollout, Property 7: Enrollment Idempotency', () => {
  let testUserId;
  let testCommunityId;

  beforeAll(async () => {
    // Set NODE_ENV to test to use test database configuration
    process.env.NODE_ENV = 'test';
    
    await setupTestDatabase();
    testUserId = await createTestUser();
    testCommunityId = await createTestCommunity(testUserId);
  });

  afterAll(async () => {
    // Clean up test community and user
    await cleanupTestData('communities', { id: testCommunityId });
    await cleanupTestData('users', { id: testUserId });
    
    await teardownTestDatabase();
  });

  it('should create exactly one enrollment record when enrolling multiple times with the same code', async () => {
    // Custom arbitraries for enrollment test data
    const enrollmentCodeArb = fc.tuple(
      fc.stringOf(
        fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'),
        { minLength: 3, maxLength: 10 }
      ),
      fc.integer({ min: 2020, max: 2030 })
    ).map(([word, year]) => `${word}-${year}`);

    const enrollmentAttemptsArb = fc.integer({ min: 2, max: 5 });

    const createdProgrammeIds = [];
    const createdCohortIds = [];
    const createdEnrollmentIds = [];
    const createdUserIds = [];

    await fc.assert(
      fc.asyncProperty(
        enrollmentCodeArb,
        enrollmentAttemptsArb,
        async (enrollmentCode, numAttempts) => {
          const sdk = new BackendSDK();

          // Create a test user for this property run
          sdk.setTable('users');
          const userId = await sdk.insert({
            username: `testuser_${Date.now()}_${Math.random()}`,
            email: `test_${Date.now()}_${Math.random()}@example.com`,
            password: 'test_password_hash',
            role: 'learner',
          });
          createdUserIds.push(userId);

          // Create a programme
          sdk.setTable('programmes');
          const programmeId = await sdk.insert({
            community_id: testCommunityId,
            name: `Test Programme ${Date.now()}`,
            description: 'Test programme for enrollment idempotency',
            start_date: new Date('2025-01-01'),
            type: 'structured',
            created_by: testUserId,
            status: 'active',
          });
          createdProgrammeIds.push(programmeId);

          // Create a cohort with the enrollment code
          sdk.setTable('cohorts');
          const cohortId = await sdk.insert({
            programme_id: programmeId,
            name: `Test Cohort ${Date.now()}`,
            enrollment_code: enrollmentCode,
            start_date: new Date('2025-01-01'),
            status: 'active',
          });
          createdCohortIds.push(cohortId);

          // Attempt to enroll multiple times
          const enrollmentResults = [];
          for (let i = 0; i < numAttempts; i++) {
            const result = await EnrollmentService.enrollLearner(userId, cohortId);
            enrollmentResults.push(result);
          }

          // Track enrollment IDs for cleanup
          if (enrollmentResults.length > 0 && enrollmentResults[0]) {
            createdEnrollmentIds.push(enrollmentResults[0].id);
          }

          // Verify all enrollment attempts returned a result
          expect(enrollmentResults.length).toBe(numAttempts);
          enrollmentResults.forEach(result => {
            expect(result).toBeDefined();
            expect(result.id).toBeDefined();
          });

          // Verify all enrollment results have the same ID (idempotency)
          const firstEnrollmentId = enrollmentResults[0].id;
          enrollmentResults.forEach(result => {
            expect(result.id).toBe(firstEnrollmentId);
            expect(result.user_id).toBe(userId);
            expect(result.cohort_id).toBe(cohortId);
          });

          // Verify only one enrollment record exists in the database
          sdk.setTable('enrollments');
          const allEnrollments = await sdk.get({
            user_id: userId,
            cohort_id: cohortId,
          });

          expect(allEnrollments.length).toBe(1);
          expect(allEnrollments[0].id).toBe(firstEnrollmentId);
          expect(allEnrollments[0].user_id).toBe(userId);
          expect(allEnrollments[0].cohort_id).toBe(cohortId);
        }
      ),
      { numRuns: 20 }
    );

    // Clean up all created data after all property runs
    for (const enrollmentId of createdEnrollmentIds) {
      await cleanupTestData('enrollments', { id: enrollmentId });
    }
    for (const cohortId of createdCohortIds) {
      await cleanupTestData('cohorts', { id: cohortId });
    }
    for (const programmeId of createdProgrammeIds) {
      await cleanupTestData('programmes', { id: programmeId });
    }
    for (const userId of createdUserIds) {
      await cleanupTestData('users', { id: userId });
    }
  });

  it('should return the same enrollment when using enrollWithCode multiple times', async () => {
    // Test the full enrollment flow with code validation
    const enrollmentCodeArb = fc.tuple(
      fc.stringOf(
        fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'),
        { minLength: 3, maxLength: 10 }
      ),
      fc.integer({ min: 2020, max: 2030 })
    ).map(([word, year]) => `${word}-${year}`);

    const createdProgrammeIds = [];
    const createdCohortIds = [];
    const createdEnrollmentIds = [];
    const createdUserIds = [];

    await fc.assert(
      fc.asyncProperty(
        enrollmentCodeArb,
        async (enrollmentCode) => {
          const sdk = new BackendSDK();

          // Create a test user for this property run
          sdk.setTable('users');
          const userId = await sdk.insert({
            username: `testuser_${Date.now()}_${Math.random()}`,
            email: `test_${Date.now()}_${Math.random()}@example.com`,
            password: 'test_password_hash',
            role: 'learner',
          });
          createdUserIds.push(userId);

          // Create a programme
          sdk.setTable('programmes');
          const programmeId = await sdk.insert({
            community_id: testCommunityId,
            name: `Test Programme ${Date.now()}`,
            description: 'Test programme for enrollment idempotency',
            start_date: new Date('2025-01-01'),
            type: 'structured',
            created_by: testUserId,
            status: 'active',
          });
          createdProgrammeIds.push(programmeId);

          // Create a cohort with the enrollment code
          sdk.setTable('cohorts');
          const cohortId = await sdk.insert({
            programme_id: programmeId,
            name: `Test Cohort ${Date.now()}`,
            enrollment_code: enrollmentCode,
            start_date: new Date('2025-01-01'),
            status: 'active',
          });
          createdCohortIds.push(cohortId);

          // First enrollment attempt
          const firstResult = await EnrollmentService.enrollWithCode(userId, enrollmentCode);
          
          // Track enrollment ID for cleanup
          if (firstResult && firstResult.enrollment_id) {
            createdEnrollmentIds.push(firstResult.enrollment_id);
          }

          // Verify first enrollment succeeded
          expect(firstResult.success).toBe(true);
          expect(firstResult.programme_id).toBe(programmeId);
          expect(firstResult.cohort_id).toBe(cohortId);
          expect(firstResult.enrollment_id).toBeDefined();

          // Second enrollment attempt (should be idempotent)
          const secondResult = await EnrollmentService.enrollWithCode(userId, enrollmentCode);

          // Verify second enrollment returns the same enrollment
          expect(secondResult.success).toBe(true);
          expect(secondResult.programme_id).toBe(firstResult.programme_id);
          expect(secondResult.cohort_id).toBe(firstResult.cohort_id);
          expect(secondResult.enrollment_id).toBe(firstResult.enrollment_id);

          // Third enrollment attempt (should still be idempotent)
          const thirdResult = await EnrollmentService.enrollWithCode(userId, enrollmentCode);

          // Verify third enrollment returns the same enrollment
          expect(thirdResult.success).toBe(true);
          expect(thirdResult.enrollment_id).toBe(firstResult.enrollment_id);

          // Verify only one enrollment record exists in the database
          sdk.setTable('enrollments');
          const allEnrollments = await sdk.get({
            user_id: userId,
            cohort_id: cohortId,
          });

          expect(allEnrollments.length).toBe(1);
          expect(allEnrollments[0].id).toBe(firstResult.enrollment_id);
        }
      ),
      { numRuns: 20 }
    );

    // Clean up all created data after all property runs
    for (const enrollmentId of createdEnrollmentIds) {
      await cleanupTestData('enrollments', { id: enrollmentId });
    }
    for (const cohortId of createdCohortIds) {
      await cleanupTestData('cohorts', { id: cohortId });
    }
    for (const programmeId of createdProgrammeIds) {
      await cleanupTestData('programmes', { id: programmeId });
    }
    for (const userId of createdUserIds) {
      await cleanupTestData('users', { id: userId });
    }
  });
});
