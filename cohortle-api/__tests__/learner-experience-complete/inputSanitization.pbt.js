/**
 * Property-Based Test: Input Sanitization
 * 
 * Property 19: All user inputs are validated and sanitized before processing
 * 
 * This test verifies that the system properly validates and rejects malicious
 * or invalid inputs across all API endpoints.
 * 
 * Requirements: 13.5 - Input validation to prevent injection attacks
 */

const fc = require('fast-check');
const request = require('supertest');
const app = require('../../app');
const { setupTestDb, cleanupTestDb, createTestUser, getAuthToken } = require('../helpers/testSetup');

describe('Property 19: Input Sanitization', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    await setupTestDb();
    testUser = await createTestUser({ role: 'learner' });
    authToken = await getAuthToken(testUser.id);
  });

  afterAll(async () => {
    await cleanupTestDb();
  });

  /**
   * Property: SQL injection attempts in any text field should be rejected or escaped
   */
  test('should prevent SQL injection in comment content', () => {
    const sqlInjectionPatterns = fc.oneof(
      fc.constant("'; DROP TABLE users; --"),
      fc.constant("1' OR '1'='1"),
      fc.constant("admin'--"),
      fc.constant("' UNION SELECT * FROM users--"),
      fc.constant("1; DELETE FROM lesson_comments WHERE 1=1--")
    );

    return fc.assert(
      fc.asyncProperty(sqlInjectionPatterns, async (maliciousInput) => {
        const response = await request(app)
          .post('/api/lesson-comments')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            lesson_id: 1,
            cohort_id: 1,
            content: maliciousInput
          });

        // Should either reject (400/422) or accept but escape the content
        if (response.status === 201) {
          // If accepted, verify the content is escaped/sanitized
          expect(response.body.content).not.toContain('DROP TABLE');
          expect(response.body.content).not.toContain('DELETE FROM');
          expect(response.body.content).not.toContain('UNION SELECT');
        } else {
          // Should be rejected with appropriate error
          expect([400, 422]).toContain(response.status);
        }
      }),
      { numRuns: 20 }
    );
  });

  /**
   * Property: XSS attempts in any text field should be rejected or escaped
   */
  test('should prevent XSS in post content', () => {
    const xssPatterns = fc.oneof(
      fc.constant('<script>alert("XSS")</script>'),
      fc.constant('<img src=x onerror=alert("XSS")>'),
      fc.constant('<svg onload=alert("XSS")>'),
      fc.constant('javascript:alert("XSS")'),
      fc.constant('<iframe src="javascript:alert(\'XSS\')"></iframe>')
    );

    return fc.assert(
      fc.asyncProperty(xssPatterns, async (maliciousInput) => {
        const response = await request(app)
          .post('/api/cohort-posts')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            cohort_id: 1,
            content: maliciousInput
          });

        // Should either reject or accept but sanitize
        if (response.status === 201) {
          // Content should be sanitized
          expect(response.body.content).not.toContain('<script>');
          expect(response.body.content).not.toContain('onerror=');
          expect(response.body.content).not.toContain('onload=');
          expect(response.body.content).not.toContain('javascript:');
        } else {
          expect([400, 422]).toContain(response.status);
        }
      }),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Invalid data types should be rejected
   */
  test('should reject invalid data types in profile updates', () => {
    const invalidInputs = fc.record({
      name: fc.oneof(
        fc.constant(null),
        fc.constant(undefined),
        fc.constant(123),
        fc.constant({}),
        fc.constant([])
      ),
      email: fc.oneof(
        fc.constant('not-an-email'),
        fc.constant(''),
        fc.constant(null),
        fc.constant(123)
      )
    });

    return fc.assert(
      fc.asyncProperty(invalidInputs, async (invalidData) => {
        const response = await request(app)
          .put('/api/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidData);

        // Should reject invalid inputs
        expect([400, 422]).toContain(response.status);
        expect(response.body).toHaveProperty('error');
      }),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Excessively long inputs should be rejected
   */
  test('should reject excessively long comment content', () => {
    const longStrings = fc.string({ minLength: 10001, maxLength: 20000 });

    return fc.assert(
      fc.asyncProperty(longStrings, async (longContent) => {
        const response = await request(app)
          .post('/api/lesson-comments')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            lesson_id: 1,
            cohort_id: 1,
            content: longContent
          });

        // Should reject content that's too long
        expect([400, 422, 413]).toContain(response.status);
      }),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Empty or whitespace-only required fields should be rejected
   */
  test('should reject empty or whitespace-only content', () => {
    const emptyInputs = fc.oneof(
      fc.constant(''),
      fc.constant('   '),
      fc.constant('\n\n\n'),
      fc.constant('\t\t\t')
    );

    return fc.assert(
      fc.asyncProperty(emptyInputs, async (emptyContent) => {
        const response = await request(app)
          .post('/api/cohort-posts')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            cohort_id: 1,
            content: emptyContent
          });

        // Should reject empty content
        expect([400, 422]).toContain(response.status);
      }),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Special characters should be properly escaped
   */
  test('should properly handle special characters in content', () => {
    const specialChars = fc.string({
      minLength: 1,
      maxLength: 100
    }).filter(s => /[<>&"']/.test(s));

    return fc.assert(
      fc.asyncProperty(specialChars, async (content) => {
        const response = await request(app)
          .post('/api/lesson-comments')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            lesson_id: 1,
            cohort_id: 1,
            content: content
          });

        if (response.status === 201) {
          // Special characters should be present but escaped
          expect(response.body.content).toBeDefined();
          // Content should not contain unescaped HTML
          expect(response.body.content).not.toMatch(/<script|<iframe|onerror=/i);
        }
      }),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Invalid IDs should be rejected
   */
  test('should reject invalid resource IDs', () => {
    const invalidIds = fc.oneof(
      fc.constant(-1),
      fc.constant(0),
      fc.constant(999999999),
      fc.constant('abc'),
      fc.constant(null),
      fc.constant(undefined)
    );

    return fc.assert(
      fc.asyncProperty(invalidIds, async (invalidId) => {
        const response = await request(app)
          .get(`/api/lessons/${invalidId}`)
          .set('Authorization', `Bearer ${authToken}`);

        // Should reject invalid IDs
        expect([400, 404, 422]).toContain(response.status);
      }),
      { numRuns: 15 }
    );
  });
});
