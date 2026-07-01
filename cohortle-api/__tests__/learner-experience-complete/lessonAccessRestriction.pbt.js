/**
 * Property-Based Test: Lesson Content Access Restriction
 * 
 * Property 9: Lesson content access is restricted to enrolled learners only
 * 
 * This test verifies that the system properly restricts access to lesson
 * content based on programme enrollment status.
 * 
 * Requirements: 13.4 - Lesson content access restriction
 */

const fc = require('fast-check');
const request = require('supertest');
const app = require('../../app');
const { setupTestDb, cleanupTestDb, createTestUser, getAuthToken, createTestProgramme, createTestLesson, enrollUserInProgramme } = require('../helpers/testSetup');

describe('Property 9: Lesson Content Access Restriction', () => {
  let enrolledUser;
  let unenrolledUser;
  let enrolledToken;
  let unenrolledToken;
  let testProgramme;
  let testLesson;

  beforeAll(async () => {
    await setupTestDb();
    
    // Create users
    enrolledUser = await createTestUser({ email: 'enrolled@example.com', role: 'learner' });
    unenrolledUser = await createTestUser({ email: 'unenrolled@example.com', role: 'learner' });
    
    // Get tokens
    enrolledToken = await getAuthToken(enrolledUser.id);
    unenrolledToken = await getAuthToken(unenrolledUser.id);
    
    // Create programme, lesson, and enroll one user
    testProgramme = await createTestProgramme();
    testLesson = await createTestLesson(testProgramme.id);
    await enrollUserInProgramme(enrolledUser.id, testProgramme.id);
  });

  afterAll(async () => {
    await cleanupTestDb();
  });

  /**
   * Property: Enrolled users should be able to access lesson content
   */
  test('enrolled users should access lesson content', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.constant(testLesson.id),
        async (lessonId) => {
          const response = await request(app)
            .get(`/api/lessons/${lessonId}`)
            .set('Authorization', `Bearer ${enrolledToken}`);
          
          // Should return 200 OK
          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty('id');
          expect(response.body).toHaveProperty('content');
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Unenrolled users should NOT be able to access lesson content
   */
  test('unenrolled users should not access lesson content', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.constant(testLesson.id),
        async (lessonId) => {
          const response = await request(app)
            .get(`/api/lessons/${lessonId}`)
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
   * Property: Enrolled users should be able to mark lessons as complete
   */
  test('enrolled users should mark lessons as complete', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.constant(testLesson.id),
        async (lessonId) => {
          const response = await request(app)
            .post('/api/lesson-completions')
            .set('Authorization', `Bearer ${enrolledToken}`)
            .send({
              lesson_id: lessonId,
              cohort_id: testProgramme.cohort_id || 1
            });
          
          // Should return 200 or 201
          expect([200, 201]).toContain(response.status);
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Unenrolled users should NOT be able to mark lessons as complete
   */
  test('unenrolled users should not mark lessons as complete', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.constant(testLesson.id),
        async (lessonId) => {
          const response = await request(app)
            .post('/api/lesson-completions')
            .set('Authorization', `Bearer ${unenrolledToken}`)
            .send({
              lesson_id: lessonId,
              cohort_id: testProgramme.cohort_id || 1
            });
          
          // Should return 403 Forbidden
          expect(response.status).toBe(403);
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Enrolled users should be able to comment on lessons
   */
  test('enrolled users should comment on lessons', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 500 }),
        async (content) => {
          const response = await request(app)
            .post('/api/lesson-comments')
            .set('Authorization', `Bearer ${enrolledToken}`)
            .send({
              lesson_id: testLesson.id,
              cohort_id: testProgramme.cohort_id || 1,
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
   * Property: Unenrolled users should NOT be able to comment on lessons
   */
  test('unenrolled users should not comment on lessons', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 500 }),
        async (content) => {
          const response = await request(app)
            .post('/api/lesson-comments')
            .set('Authorization', `Bearer ${unenrolledToken}`)
            .send({
              lesson_id: testLesson.id,
              cohort_id: testProgramme.cohort_id || 1,
              content: content
            });
          
          // Should return 403 Forbidden
          expect(response.status).toBe(403);
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Enrolled users should be able to view lesson comments
   */
  test('enrolled users should view lesson comments', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.constant(testLesson.id),
        async (lessonId) => {
          const response = await request(app)
            .get(`/api/lesson-comments?lesson_id=${lessonId}&cohort_id=${testProgramme.cohort_id || 1}`)
            .set('Authorization', `Bearer ${enrolledToken}`);
          
          // Should return 200 OK
          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty('comments');
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Unenrolled users should NOT be able to view lesson comments
   */
  test('unenrolled users should not view lesson comments', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.constant(testLesson.id),
        async (lessonId) => {
          const response = await request(app)
            .get(`/api/lesson-comments?lesson_id=${lessonId}&cohort_id=${testProgramme.cohort_id || 1}`)
            .set('Authorization', `Bearer ${unenrolledToken}`);
          
          // Should return 403 Forbidden
          expect(response.status).toBe(403);
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Access to non-existent lessons should be denied
   */
  test('should deny access to non-existent lessons', () => {
    const nonExistentIds = fc.integer({ min: 999999, max: 9999999 });

    return fc.assert(
      fc.asyncProperty(nonExistentIds, async (lessonId) => {
        const response = await request(app)
          .get(`/api/lessons/${lessonId}`)
          .set('Authorization', `Bearer ${enrolledToken}`);
        
        // Should return 404 Not Found
        expect(response.status).toBe(404);
      }),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Enrollment status should be checked on every lesson access
   */
  test('should check enrollment on every lesson access', async () => {
    // Make multiple requests - all should be consistent
    for (let i = 0; i < 5; i++) {
      const response = await request(app)
        .get(`/api/lessons/${testLesson.id}`)
        .set('Authorization', `Bearer ${unenrolledToken}`);
      
      // Should consistently deny access
      expect(response.status).toBe(403);
    }
  });

  /**
   * Property: Invalid lesson IDs should be rejected
   */
  test('should reject invalid lesson IDs', () => {
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
          .get(`/api/lessons/${invalidId}`)
          .set('Authorization', `Bearer ${enrolledToken}`);
        
        // Should return 400 Bad Request or 404 Not Found
        expect([400, 404]).toContain(response.status);
      }),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Programme structure should be accessible to enrolled users
   */
  test('enrolled users should access programme structure', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.constant(testProgramme.id),
        async (programmeId) => {
          const response = await request(app)
            .get(`/api/programmes/${programmeId}/structure`)
            .set('Authorization', `Bearer ${enrolledToken}`);
          
          // Should return 200 OK
          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty('weeks');
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Programme progress should be accessible to enrolled users only
   */
  test('enrolled users should access programme progress', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.constant(testProgramme.id),
        async (programmeId) => {
          const response = await request(app)
            .get(`/api/programmes/${programmeId}/progress`)
            .set('Authorization', `Bearer ${enrolledToken}`);
          
          // Should return 200 OK
          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty('progress');
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Unenrolled users should NOT access programme progress
   */
  test('unenrolled users should not access programme progress', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.constant(testProgramme.id),
        async (programmeId) => {
          const response = await request(app)
            .get(`/api/programmes/${programmeId}/progress`)
            .set('Authorization', `Bearer ${unenrolledToken}`);
          
          // Should return 403 Forbidden
          expect(response.status).toBe(403);
        }
      ),
      { numRuns: 10 }
    );
  });
});
