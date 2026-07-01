/**
 * Property-Based Test: Invalid Code Rejection
 * Feature: wlimp-programme-rollout
 * Property 8: Invalid Code Rejection
 * 
 * **Validates: Requirements 2.4, 2.6**
 * 
 * For any enrollment code that doesn't match the format WORD-YEAR or doesn't exist
 * in the database, enrollment attempts should fail with a clear error message and
 * no enrollment record should be created.
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

describe('Feature: wlimp-programme-rollout, Property 8: Invalid Code Rejection', () => {
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

  it('should reject enrollment codes with invalid format and provide clear error messages', async () => {
    // Generate invalid enrollment codes that don't match WORD-YEAR format
    const invalidCodeArb = fc.oneof(
      // Empty string
      fc.constant(''),
      // Only whitespace
      fc.constant('   '),
      // Missing hyphen
      fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes('-')),
      // Multiple hyphens
      fc.tuple(
        fc.string({ minLength: 1, maxLength: 10 }),
        fc.string({ minLength: 1, maxLength: 10 }),
        fc.string({ minLength: 1, maxLength: 10 })
      ).map(([a, b, c]) => `${a}-${b}-${c}`),
      // Year not 4 digits
      fc.tuple(
        fc.string({ minLength: 1, maxLength: 10 }),
        fc.integer({ min: 0, max: 999 })
      ).map(([word, year]) => `${word}-${year}`),
      // Year with 5+ digits
      fc.tuple(
        fc.string({ minLength: 1, maxLength: 10 }),
        fc.integer({ min: 10000, max: 99999 })
      ).map(([word, year]) => `${word}-${year}`),
      // Special characters in word part
      fc.tuple(
        fc.string({ minLength: 1, maxLength: 10 }),
        fc.integer({ min: 2020, max: 2030 })
      ).map(([word, year]) => `${word}@#$-${year}`),
      // No word part
      fc.integer({ min: 2020, max: 2030 }).map(year => `-${year}`),
      // No year part
      fc.string({ minLength: 1, maxLength: 10 }).map(word => `${word}-`),
      // Just a hyphen
      fc.constant('-'),
      // Numbers only (no hyphen)
      fc.integer({ min: 1000, max: 9999 }).map(n => n.toString()),
      // Valid format but with lowercase (should still work per regex, but testing edge case)
      // Actually the regex is case-insensitive, so we'll test truly invalid formats
      fc.tuple(
        fc.string({ minLength: 0, maxLength: 0 }),
        fc.integer({ min: 2020, max: 2030 })
      ).map(([word, year]) => `-${year}`)
    );

    const createdUserIds = [];

    await fc.assert(
      fc.asyncProperty(
        invalidCodeArb,
        async (invalidCode) => {
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

          // Count enrollments before attempt
          sdk.setTable('enrollments');
          const enrollmentsBefore = await sdk.get({ user_id: userId });
          const countBefore = enrollmentsBefore.length;

          // Attempt to enroll with invalid code
          let errorThrown = false;
          let errorMessage = '';
          let errorStatusCode = null;

          try {
            await EnrollmentService.enrollWithCode(userId, invalidCode);
          } catch (error) {
            errorThrown = true;
            errorMessage = error.message;
            errorStatusCode = error.statusCode;
          }

          // Verify error was thrown
          expect(errorThrown).toBe(true);
          
          // Verify error message is clear and helpful
          expect(errorMessage).toBeDefined();
          expect(errorMessage.length).toBeGreaterThan(0);
          expect(errorMessage).toMatch(/Invalid code format|Use format: PROGRAMME-YEAR/i);
          
          // Verify appropriate status code
          expect(errorStatusCode).toBe(400);

          // Verify no enrollment record was created
          const enrollmentsAfter = await sdk.get({ user_id: userId });
          const countAfter = enrollmentsAfter.length;
          
          expect(countAfter).toBe(countBefore);
        }
      ),
      { numRuns: 20 }
    );

    // Clean up all created users after all property runs
    for (const userId of createdUserIds) {
      await cleanupTestData('users', { id: userId });
    }
  });

  it('should reject enrollment codes that do not exist in the database', async () => {
    // Generate valid format codes that don't exist in database
    const nonExistentCodeArb = fc.tuple(
      fc.string({ minLength: 3, maxLength: 10 })
        .filter(s => /^[A-Z0-9]+$/i.test(s)),
      fc.integer({ min: 2020, max: 2030 })
    ).map(([word, year]) => `NONEXISTENT${word.toUpperCase()}-${year}`);

    const createdUserIds = [];

    await fc.assert(
      fc.asyncProperty(
        nonExistentCodeArb,
        async (nonExistentCode) => {
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

          // Verify the code doesn't exist in database
          sdk.setTable('cohorts');
          const existingCohort = await sdk.get({ enrollment_code: nonExistentCode });
          expect(existingCohort.length).toBe(0);

          // Count enrollments before attempt
          sdk.setTable('enrollments');
          const enrollmentsBefore = await sdk.get({ user_id: userId });
          const countBefore = enrollmentsBefore.length;

          // Attempt to enroll with non-existent code
          let errorThrown = false;
          let errorMessage = '';
          let errorStatusCode = null;

          try {
            await EnrollmentService.enrollWithCode(userId, nonExistentCode);
          } catch (error) {
            errorThrown = true;
            errorMessage = error.message;
            errorStatusCode = error.statusCode;
          }

          // Verify error was thrown
          expect(errorThrown).toBe(true);
          
          // Verify error message is clear and helpful
          expect(errorMessage).toBeDefined();
          expect(errorMessage.length).toBeGreaterThan(0);
          expect(errorMessage).toMatch(/Enrollment code not found|Please check the code/i);
          
          // Verify appropriate status code (404 for not found)
          expect(errorStatusCode).toBe(404);

          // Verify no enrollment record was created
          const enrollmentsAfter = await sdk.get({ user_id: userId });
          const countAfter = enrollmentsAfter.length;
          
          expect(countAfter).toBe(countBefore);
        }
      ),
      { numRuns: 20 }
    );

    // Clean up all created users after all property runs
    for (const userId of createdUserIds) {
      await cleanupTestData('users', { id: userId });
    }
  });

  it('should reject null, undefined, and non-string enrollment codes', async () => {
    // Test edge cases: null, undefined, numbers, objects, arrays
    const invalidTypeCodeArb = fc.oneof(
      fc.constant(null),
      fc.constant(undefined),
      fc.integer(),
      fc.float(),
      fc.boolean(),
      fc.array(fc.string()),
      fc.object()
    );

    const createdUserIds = [];

    await fc.assert(
      fc.asyncProperty(
        invalidTypeCodeArb,
        async (invalidTypeCode) => {
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

          // Count enrollments before attempt
          sdk.setTable('enrollments');
          const enrollmentsBefore = await sdk.get({ user_id: userId });
          const countBefore = enrollmentsBefore.length;

          // Attempt to enroll with invalid type code
          let errorThrown = false;
          let errorMessage = '';

          try {
            await EnrollmentService.enrollWithCode(userId, invalidTypeCode);
          } catch (error) {
            errorThrown = true;
            errorMessage = error.message;
          }

          // Verify error was thrown
          expect(errorThrown).toBe(true);
          
          // Verify error message mentions invalid format
          expect(errorMessage).toBeDefined();
          expect(errorMessage).toMatch(/Invalid code format/i);

          // Verify no enrollment record was created
          const enrollmentsAfter = await sdk.get({ user_id: userId });
          const countAfter = enrollmentsAfter.length;
          
          expect(countAfter).toBe(countBefore);
        }
      ),
      { numRuns: 20 }
    );

    // Clean up all created users after all property runs
    for (const userId of createdUserIds) {
      await cleanupTestData('users', { id: userId });
    }
  });
});
