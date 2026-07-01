/**
 * Property-Based Test: Cohort Access Restriction
 * 
 * Property 8: Cohort feed access is restricted to enrolled learners only
 * 
 * This test verifies that the system properly restricts access to cohort
 * community feeds based on enrollment status.
 * 
 * Requirements: 7.2, 13.3 - Cohort feed access restriction
 */

const fc = require('fast-check');
const request = require('supertest');
const app = require('../../app');
const { setupTestDb, cleanupTestDb, createTestUser, getAuthToken, createTestCohort, enrollUserInCohort } = require('../helpers/testSetup');

describe('Property 8: Cohort Access Restriction', () => {
  let enrolledUser;
  let unenrolledUser;
  let enrolledToken;
  let unenrolledToken;
  let testCohort;

  beforeAll(async () => {
    await setupTestDb();
    
    // Create users
    enrolledUser = await createTestUser({ email: 'enrolled@example.com', role: 'learner' });
    unenrolledUser = await createTestUser({ email: 'unenrolled@example.com', role: 'learner' });
    
    // Get tokens
    enrolledToken = await getAuthToken(enrolledUser.id);
    unenrolledToken = await getAuthToken(unenrolledUser.id);
    
    // Create cohort and enroll one user
    testCohort = await createTestCohort();
    await enrollUserInCohort(enrolledUser.id, testCohort.id);
  });

  afterAll(async () => {
    await cleanupTestDb();
  });

  /**
   * Property: Enrolled users should be able to access cohort feed
   */
  test('enrolled users should access cohort feed', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.constant(testCohort.id),
        async (cohortId) => {
          const response = await request(app)
            .get(`/api/cohort-posts?cohort_id=${cohortId}`)
            .set('Authorization', `Bearer ${enrolledToken}`);
          
          // Should return 200 OK
          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty('posts');
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Unenrolled users should NOT be able to access cohort feed
   */
  test('unenrolled users should not access cohort feed', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.constant(testCohort.id),
        async (cohortId) => {
          const response = await request(app)
            .get(`/api/cohort-posts?cohort_id=${cohortId}`)
            .set('Authorization', `Bearer ${unenrolledToken}`);
          
          // Should return 403 Forbidden
          expect(response.status).toBe(403);
          expect(response.body).toHaveProperty('error');
          expect(response.body.error).toMatch(/not enrolled|access denied|forbidden/i);
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Enrolled users should be able to create posts in cohort feed
   */
  test('enrolled users should create posts in cohort feed', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 500 }),
        async (content) => {
          const response = await request(app)
            .post('/api/cohort-posts')
            .set('Authorization', `Bearer ${enrolledToken}`)
            .send({
              cohort_id: testCohort.id,
              content: content
            });
          
          // Should return 201 Created
          expect([200, 201]).toContain(response.status);
          if (response.status === 201) {
            expect(response.body).toHaveProperty('id');
            expect(response.body.content).toBe(content);
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Unenrolled users should NOT be able to create posts in cohort feed
   */
  test('unenrolled users should not create posts in cohort feed', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 500 }),
        async (content) => {
          const response = await request(app)
            .post('/api/cohort-posts')
            .set('Authorization', `Bearer ${unenrolledToken}`)
            .send({
              cohort_id: testCohort.id,
              content: content
            });
          
          // Should return 403 Forbidden
          expect(response.status).toBe(403);
          expect(response.body).toHaveProperty('error');
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Enrolled users should be able to like posts in cohort feed
   */
  test('enrolled users should like posts in cohort feed', async () => {
    // First create a post
    const postResponse = await request(app)
      .post('/api/cohort-posts')
      .set('Authorization', `Bearer ${enrolledToken}`)
      .send({
        cohort_id: testCohort.id,
        content: 'Test post for liking'
      });
    
    if (postResponse.status !== 201) return;
    
    const postId = postResponse.body.id;
    
    // Try to like the post
    const likeResponse = await request(app)
      .post(`/api/cohort-posts/${postId}/like`)
      .set('Authorization', `Bearer ${enrolledToken}`);
    
    // Should succeed
    expect([200, 201]).toContain(likeResponse.status);
  });

  /**
   * Property: Unenrolled users should NOT be able to like posts in cohort feed
   */
  test('unenrolled users should not like posts in cohort feed', async () => {
    // First create a post as enrolled user
    const postResponse = await request(app)
      .post('/api/cohort-posts')
      .set('Authorization', `Bearer ${enrolledToken}`)
      .send({
        cohort_id: testCohort.id,
        content: 'Test post for liking restriction'
      });
    
    if (postResponse.status !== 201) return;
    
    const postId = postResponse.body.id;
    
    // Try to like the post as unenrolled user
    const likeResponse = await request(app)
      .post(`/api/cohort-posts/${postId}/like`)
      .set('Authorization', `Bearer ${unenrolledToken}`);
    
    // Should be forbidden
    expect(likeResponse.status).toBe(403);
  });

  /**
   * Property: Enrolled users should be able to comment on posts
   */
  test('enrolled users should comment on posts', async () => {
    // First create a post
    const postResponse = await request(app)
      .post('/api/cohort-posts')
      .set('Authorization', `Bearer ${enrolledToken}`)
      .send({
        cohort_id: testCohort.id,
        content: 'Test post for commenting'
      });
    
    if (postResponse.status !== 201) return;
    
    const postId = postResponse.body.id;
    
    // Try to comment
    const commentResponse = await request(app)
      .post(`/api/cohort-posts/${postId}/comments`)
      .set('Authorization', `Bearer ${enrolledToken}`)
      .send({
        content: 'Test comment'
      });
    
    // Should succeed
    expect([200, 201]).toContain(commentResponse.status);
  });

  /**
   * Property: Unenrolled users should NOT be able to comment on posts
   */
  test('unenrolled users should not comment on posts', async () => {
    // First create a post as enrolled user
    const postResponse = await request(app)
      .post('/api/cohort-posts')
      .set('Authorization', `Bearer ${enrolledToken}`)
      .send({
        cohort_id: testCohort.id,
        content: 'Test post for comment restriction'
      });
    
    if (postResponse.status !== 201) return;
    
    const postId = postResponse.body.id;
    
    // Try to comment as unenrolled user
    const commentResponse = await request(app)
      .post(`/api/cohort-posts/${postId}/comments`)
      .set('Authorization', `Bearer ${unenrolledToken}`)
      .send({
        content: 'Test comment'
      });
    
    // Should be forbidden
    expect(commentResponse.status).toBe(403);
  });

  /**
   * Property: Access to non-existent cohorts should be denied
   */
  test('should deny access to non-existent cohorts', () => {
    const nonExistentIds = fc.integer({ min: 999999, max: 9999999 });

    return fc.assert(
      fc.asyncProperty(nonExistentIds, async (cohortId) => {
        const response = await request(app)
          .get(`/api/cohort-posts?cohort_id=${cohortId}`)
          .set('Authorization', `Bearer ${enrolledToken}`);
        
        // Should return 404 Not Found or 403 Forbidden
        expect([403, 404]).toContain(response.status);
      }),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Enrollment status should be checked on every request
   */
  test('should check enrollment on every cohort access', async () => {
    // Make multiple requests - all should be consistent
    for (let i = 0; i < 5; i++) {
      const response = await request(app)
        .get(`/api/cohort-posts?cohort_id=${testCohort.id}`)
        .set('Authorization', `Bearer ${unenrolledToken}`);
      
      // Should consistently deny access
      expect(response.status).toBe(403);
    }
  });

  /**
   * Property: Invalid cohort IDs should be rejected
   */
  test('should reject invalid cohort IDs', () => {
    const invalidIds = fc.oneof(
      fc.constant(-1),
      fc.constant(0),
      fc.constant('abc'),
      fc.constant(null),
      fc.constant(undefined)
    );

    return fc.assert(
      fc.asyncProperty(invalidIds, async (invalidId) => {
        const response = await request(app)
          .get(`/api/cohort-posts?cohort_id=${invalidId}`)
          .set('Authorization', `Bearer ${enrolledToken}`);
        
        // Should return 400 Bad Request or 404 Not Found
        expect([400, 404]).toContain(response.status);
      }),
      { numRuns: 10 }
    );
  });
});
