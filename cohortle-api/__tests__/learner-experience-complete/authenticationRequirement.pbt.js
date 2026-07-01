/**
 * Property-Based Test: Authentication Requirement
 * 
 * Property 28: All protected endpoints require valid authentication
 * 
 * This test verifies that the system properly enforces authentication
 * on all protected routes and API endpoints.
 * 
 * Requirements: 13.1, 13.2 - Authentication requirement and session management
 */

const fc = require('fast-check');
const request = require('supertest');
const app = require('../../app');
const { setupTestDb, cleanupTestDb, createTestUser, getAuthToken } = require('../helpers/testSetup');

describe('Property 28: Authentication Requirement', () => {
  let testUser;
  let validToken;

  beforeAll(async () => {
    await setupTestDb();
    testUser = await createTestUser({ role: 'learner' });
    validToken = await getAuthToken(testUser.id);
  });

  afterAll(async () => {
    await cleanupTestDb();
  });

  /**
   * Protected endpoints that should require authentication
   */
  const protectedEndpoints = [
    { method: 'get', path: '/api/profile' },
    { method: 'put', path: '/api/profile' },
    { method: 'get', path: '/api/dashboard' },
    { method: 'get', path: '/api/programmes/1/progress' },
    { method: 'post', path: '/api/lesson-completions' },
    { method: 'get', path: '/api/cohort-posts' },
    { method: 'post', path: '/api/cohort-posts' },
    { method: 'get', path: '/api/lesson-comments' },
    { method: 'post', path: '/api/lesson-comments' },
  ];

  /**
   * Property: All protected endpoints should reject requests without authentication
   */
  test('should reject unauthenticated requests to protected endpoints', async () => {
    for (const endpoint of protectedEndpoints) {
      const response = await request(app)[endpoint.method](endpoint.path);
      
      // Should return 401 Unauthorized
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    }
  });

  /**
   * Property: All protected endpoints should reject requests with invalid tokens
   */
  test('should reject requests with invalid authentication tokens', () => {
    const invalidTokens = fc.oneof(
      fc.constant('invalid-token'),
      fc.constant('Bearer invalid'),
      fc.constant(''),
      fc.constant('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature'),
      fc.string({ minLength: 10, maxLength: 100 })
    );

    return fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...protectedEndpoints),
        invalidTokens,
        async (endpoint, invalidToken) => {
          const response = await request(app)
            [endpoint.method](endpoint.path)
            .set('Authorization', `Bearer ${invalidToken}`);
          
          // Should return 401 Unauthorized
          expect(response.status).toBe(401);
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property: All protected endpoints should accept requests with valid tokens
   */
  test('should accept requests with valid authentication tokens', async () => {
    for (const endpoint of protectedEndpoints) {
      const response = await request(app)
        [endpoint.method](endpoint.path)
        .set('Authorization', `Bearer ${validToken}`)
        .send({}); // Send empty body for POST requests
      
      // Should not return 401 (may return other errors like 400, 404, but not 401)
      expect(response.status).not.toBe(401);
    }
  });

  /**
   * Property: Expired tokens should be rejected
   */
  test('should reject expired authentication tokens', async () => {
    // Create a token that expired 1 hour ago
    const jwt = require('jsonwebtoken');
    const expiredToken = jwt.sign(
      { userId: testUser.id, role: 'learner' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '-1h' }
    );

    for (const endpoint of protectedEndpoints.slice(0, 3)) {
      const response = await request(app)
        [endpoint.method](endpoint.path)
        .set('Authorization', `Bearer ${expiredToken}`);
      
      // Should return 401 Unauthorized
      expect(response.status).toBe(401);
      expect(response.body.error).toMatch(/expired|invalid/i);
    }
  });

  /**
   * Property: Missing Authorization header should be rejected
   */
  test('should reject requests without Authorization header', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...protectedEndpoints),
        async (endpoint) => {
          const response = await request(app)
            [endpoint.method](endpoint.path)
            .send({});
          
          expect(response.status).toBe(401);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Malformed Authorization headers should be rejected
   */
  test('should reject malformed Authorization headers', () => {
    const malformedHeaders = fc.oneof(
      fc.constant('InvalidFormat token'),
      fc.constant('Bearer'),
      fc.constant('token-without-bearer'),
      fc.constant('Bearer  '), // Bearer with only spaces
      fc.constant('Basic dXNlcjpwYXNz') // Wrong auth type
    );

    return fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...protectedEndpoints.slice(0, 3)),
        malformedHeaders,
        async (endpoint, header) => {
          const response = await request(app)
            [endpoint.method](endpoint.path)
            .set('Authorization', header);
          
          expect(response.status).toBe(401);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Tokens for different users should not grant access to other users' data
   */
  test('should not allow access to other users data', async () => {
    // Create another user
    const otherUser = await createTestUser({ 
      email: 'other@example.com',
      role: 'learner' 
    });
    const otherToken = await getAuthToken(otherUser.id);

    // Try to access first user's profile with second user's token
    const response = await request(app)
      .get(`/api/profile/${testUser.id}`)
      .set('Authorization', `Bearer ${otherToken}`);
    
    // Should either return 403 Forbidden or 404 Not Found
    expect([403, 404]).toContain(response.status);
  });

  /**
   * Property: Authentication should be consistent across all HTTP methods
   */
  test('should require authentication for all HTTP methods', async () => {
    const methods = ['get', 'post', 'put', 'delete'];
    const testPath = '/api/profile';

    for (const method of methods) {
      if (method === 'delete') continue; // Skip if endpoint doesn't support DELETE
      
      const response = await request(app)[method](testPath);
      
      expect(response.status).toBe(401);
    }
  });

  /**
   * Property: Token tampering should be detected
   */
  test('should detect tampered authentication tokens', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...protectedEndpoints.slice(0, 3)),
        fc.integer({ min: 0, max: validToken.length - 1 }),
        fc.char(),
        async (endpoint, position, char) => {
          // Tamper with the token by replacing a character
          const tamperedToken = 
            validToken.substring(0, position) + 
            char + 
            validToken.substring(position + 1);
          
          const response = await request(app)
            [endpoint.method](endpoint.path)
            .set('Authorization', `Bearer ${tamperedToken}`);
          
          // Should reject tampered token
          expect(response.status).toBe(401);
        }
      ),
      { numRuns: 20 }
    );
  });
});
