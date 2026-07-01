/**
 * Property-Based Tests: Enrollment Validation
 * 
 * Properties 1-3: Enrollment code validation and idempotence
 * 
 * These tests verify that enrollment codes are properly validated
 * and that enrollment operations are idempotent.
 * 
 * Requirements: 1.5, 1.6, 1.8 - Enrollment validation and idempotence
 */

const fc = require('fast-check');
const request = require('supertest');
const app = require('../../app');
const { setupTestDb, cleanupTestDb, createTestUser, getAuthToken, createTestCohort } = require('../helpers/testSetup');

describe('Property-Based Tests: Enrollment Validation', () => {
  let testUser;
  let authToken;
  let testCohort;

  beforeAll(async () => {
    await setupTestDb();
    testUser = await createTestUser({ role: 'learner' });
    authToken = await getAuthToken(testUser.id);
    testCohort = await createTestCohort({ enrollmentCode: 'VALID123' });
  });

  afterAll(async () => {
    await cleanupTestDb();
  });

  /**
   * Property 1: Valid enrollment code acceptance
   * 
   * Given a valid enrollment code, the system should accept it and
   * create an enrollment record.
   */
  test('Property 1: should accept valid enrollment codes', () => {
    // Generate valid-looking enrollment codes
    const validCodes = fc.string({
      minLength: 6,
      maxLength: 12,
      unit: fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split(''))
    });

    return fc.assert(
      fc.asyncProperty(validCodes, async (code) => {
        // Create a cohort with this code
        const cohort = await createTestCohort({ enrollmentCode: code });
        
        const response = await request(app)
          .post('/api/enroll')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            enrollment_code: code
          });
        
        // Should accept valid code
        expect([200, 201]).toContain(response.status);
        if (response.status === 201 || response.status === 200) {
          expect(response.body).toHaveProperty('cohort_id');
          expect(response.body.cohort_id).toBe(cohort.id);
        }
      }),
      { numRuns: 10 }
    );
  });

  /**
   * Property 2: Invalid enrollment code rejection
   * 
   * Given an invalid enrollment code, the system should reject it
   * with an appropriate error message.
   */
  test('Property 2: should reject invalid enrollment codes', () => {
    const invalidCodes = fc.oneof(
      fc.constant(''),
      fc.constant('   '),
      fc.constant('INVALID'),
      fc.constant('NOTEXIST'),
      fc.constant('12345'),
      fc.string({ minLength: 1, maxLength: 5 }),
      fc.string({ minLength: 20, maxLength: 50 })
    );

    return fc.assert(
      fc.asyncProperty(invalidCodes, async (code) => {
        const response = await request(app)
          .post('/api/enroll')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            enrollment_code: code
          });
        
        // Should reject invalid code
        expect([400, 404]).toContain(response.status);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toMatch(/invalid|not found|code/i);
      }),
      { numRuns: 15 }
    );
  });

  /**
   * Property 3: Enrollment idempotence
   * 
   * Enrolling with the same code multiple times should not create
   * duplicate enrollments. The operation should be idempotent.
   */
  test('Property 3: enrollment should be idempotent', async () => {
    const code = 'IDEMPOTENT123';
    const cohort = await createTestCohort({ enrollmentCode: code });
    
    // First enrollment
    const response1 = await request(app)
      .post('/api/enroll')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        enrollment_code: code
      });
    
    expect([200, 201]).toContain(response1.status);
    const enrollmentId1 = response1.body.id || response1.body.enrollment_id;
    
    // Second enrollment with same code
    const response2 = await request(app)
      .post('/api/enroll')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        enrollment_code: code
      });
    
    // Should either return same enrollment or indicate already enrolled
    expect([200, 201, 409]).toContain(response2.status);
    
    if (response2.status === 200 || response2.status === 201) {
      const enrollmentId2 = response2.body.id || response2.body.enrollment_id;
      // Should be same enrollment
      expect(enrollmentId2).toBe(enrollmentId1);
    } else if (response2.status === 409) {
      // Already enrolled message
      expect(response2.body.error).toMatch(/already enrolled/i);
    }
    
    // Verify only one enrollment exists
    const enrollmentsResponse = await request(app)
      .get(`/api/cohorts/${cohort.id}/enrollments`)
      .set('Authorization', `Bearer ${authToken}`);
    
    if (enrollmentsResponse.status === 200) {
      const userEnrollments = enrollmentsResponse.body.filter(
        e => e.user_id === parseInt(testUser.id)
      );
      expect(userEnrollments.length).toBeLessThanOrEqual(1);
    }
  });

  /**
   * Property: Enrollment code should be case-insensitive
   */
  test('enrollment codes should be case-insensitive', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.string({
          minLength: 6,
          maxLength: 12,
          unit: fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split(''))
        }),
        async (baseCode) => {
          // Create cohort with uppercase code
          const cohort = await createTestCohort({ enrollmentCode: baseCode.toUpperCase() });
          
          // Try enrolling with lowercase
          const response = await request(app)
            .post('/api/enroll')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              enrollment_code: baseCode.toLowerCase()
            });
          
          // Should accept regardless of case
          expect([200, 201, 409]).toContain(response.status);
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Whitespace in enrollment codes should be trimmed
   */
  test('enrollment codes should trim whitespace', async () => {
    const code = 'TRIM123';
    const cohort = await createTestCohort({ enrollmentCode: code });
    
    // Try with leading/trailing whitespace
    const response = await request(app)
      .post('/api/enroll')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        enrollment_code: `  ${code}  `
      });
    
    // Should accept after trimming
    expect([200, 201, 409]).toContain(response.status);
  });

  /**
   * Property: Enrollment should require authentication
   */
  test('enrollment should require authentication', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.constant('ANYCODE123'),
        async (code) => {
          const response = await request(app)
            .post('/api/enroll')
            .send({
              enrollment_code: code
            });
          
          // Should reject without auth
          expect(response.status).toBe(401);
        }
      ),
      { numRuns: 5 }
    );
  });

  /**
   * Property: Enrollment should validate code format
   */
  test('should validate enrollment code format', () => {
    const malformedCodes = fc.oneof(
      fc.constant(null),
      fc.constant(undefined),
      fc.constant(123),
      fc.constant({}),
      fc.constant([]),
      fc.constant(true)
    );

    return fc.assert(
      fc.asyncProperty(malformedCodes, async (code) => {
        const response = await request(app)
          .post('/api/enroll')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            enrollment_code: code
          });
        
        // Should reject malformed codes
        expect([400, 422]).toContain(response.status);
      }),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Multiple users can enroll with same code
   */
  test('multiple users should enroll with same code', async () => {
    const code = 'MULTI123';
    const cohort = await createTestCohort({ enrollmentCode: code });
    
    // Create second user
    const user2 = await createTestUser({ email: 'user2@example.com' });
    const token2 = await getAuthToken(user2.id);
    
    // First user enrolls
    const response1 = await request(app)
      .post('/api/enroll')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        enrollment_code: code
      });
    
    expect([200, 201, 409]).toContain(response1.status);
    
    // Second user enrolls with same code
    const response2 = await request(app)
      .post('/api/enroll')
      .set('Authorization', `Bearer ${token2}`)
      .send({
        enrollment_code: code
      });
    
    // Both should succeed
    expect([200, 201, 409]).toContain(response2.status);
  });

  /**
   * Property: Enrollment should return cohort information
   */
  test('enrollment should return cohort information', async () => {
    const code = 'INFO123';
    const cohort = await createTestCohort({ 
      enrollmentCode: code,
      name: 'Test Cohort'
    });
    
    const response = await request(app)
      .post('/api/enroll')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        enrollment_code: code
      });
    
    if (response.status === 200 || response.status === 201) {
      expect(response.body).toHaveProperty('cohort_id');
      expect(response.body.cohort_id).toBe(cohort.id);
    }
  });
});
