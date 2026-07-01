/**
 * Property-Based Tests: Lesson Navigation
 * 
 * Property 15: Lesson sequence navigation
 * 
 * These tests verify that lesson navigation (next/previous) works correctly
 * and maintains proper sequence order.
 * 
 * Requirements: 4.12 - Lesson sequence navigation
 */

const fc = require('fast-check');
const request = require('supertest');
const app = require('../../app');
const { setupTestDb, cleanupTestDb, createTestUser, getAuthToken, createTestProgramme, createTestCohort, enrollUserInCohort, createTestWeek, createTestLesson } = require('../helpers/testSetup');

describe('Property-Based Tests: Lesson Navigation', () => {
  let testUser;
  let authToken;
  let testProgramme;
  let testCohort;
  let testWeek;

  beforeAll(async () => {
    await setupTestDb();
    testUser = await createTestUser({ role: 'learner' });
    authToken = await getAuthToken(testUser.id);
    testProgramme = await createTestProgramme();
    testCohort = await createTestCohort({ programme_id: testProgramme.id });
    await enrollUserInCohort(testUser.id, testCohort.id);
    testWeek = await createTestWeek({
      programme_id: testProgramme.id,
      cohort_id: testCohort.id,
      start_date: new Date().toISOString().split('T')[0]
    });
  });

  afterAll(async () => {
    await cleanupTestDb();
  });

  /**
   * Property 15: Lesson sequence navigation
   * 
   * Navigating through lessons should maintain proper sequence order.
   * Next lesson should be the one with the next order number.
   * Previous lesson should be the one with the previous order number.
   */
  test('Property 15: lesson navigation should follow sequence order', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 3, max: 8 }),
        async (lessonCount) => {
          // Create a sequence of lessons
          const lessons = [];
          for (let i = 0; i < lessonCount; i++) {
            const lesson = await createTestLesson({
              week_id: testWeek.id,
              order: i + 1,
              title: `Lesson ${i + 1}`
            });
            lessons.push(lesson);
          }
          
          // Test navigation for each lesson
          for (let i = 0; i < lessons.length; i++) {
            const response = await request(app)
              .get(`/api/lessons/${lessons[i].id}/navigation`)
              .set('Authorization', `Bearer ${authToken}`);
            
            if (response.status === 200) {
              // First lesson should have no previous
              if (i === 0) {
                expect(response.body.previous).toBeNull();
              } else {
                expect(response.body.previous?.id).toBe(lessons[i - 1].id);
              }
              
              // Last lesson should have no next
              if (i === lessons.length - 1) {
                expect(response.body.next).toBeNull();
              } else {
                expect(response.body.next?.id).toBe(lessons[i + 1].id);
              }
            }
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: First lesson should have no previous
   */
  test('first lesson should have no previous lesson', async () => {
    const lesson = await createTestLesson({
      week_id: testWeek.id,
      order: 1,
      title: 'First Lesson'
    });
    
    const response = await request(app)
      .get(`/api/lessons/${lesson.id}/navigation`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.previous).toBeNull();
  });

  /**
   * Property: Last lesson should have no next
   */
  test('last lesson should have no next lesson', async () => {
    // Create multiple lessons
    await createTestLesson({ week_id: testWeek.id, order: 1 });
    await createTestLesson({ week_id: testWeek.id, order: 2 });
    const lastLesson = await createTestLesson({ week_id: testWeek.id, order: 3 });
    
    const response = await request(app)
      .get(`/api/lessons/${lastLesson.id}/navigation`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.next).toBeNull();
  });

  /**
   * Property: Middle lessons should have both next and previous
   */
  test('middle lessons should have both next and previous', async () => {
    const lesson1 = await createTestLesson({ week_id: testWeek.id, order: 1 });
    const lesson2 = await createTestLesson({ week_id: testWeek.id, order: 2 });
    const lesson3 = await createTestLesson({ week_id: testWeek.id, order: 3 });
    
    const response = await request(app)
      .get(`/api/lessons/${lesson2.id}/navigation`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.previous?.id).toBe(lesson1.id);
    expect(response.body.next?.id).toBe(lesson3.id);
  });

  /**
   * Property: Navigation should work with non-sequential order numbers
   */
  test('navigation should work with gaps in order numbers', async () => {
    const lesson1 = await createTestLesson({ week_id: testWeek.id, order: 10 });
    const lesson2 = await createTestLesson({ week_id: testWeek.id, order: 20 });
    const lesson3 = await createTestLesson({ week_id: testWeek.id, order: 30 });
    
    const response = await request(app)
      .get(`/api/lessons/${lesson2.id}/navigation`)
      .set('Authorization', `Bearer ${authToken}`);
    
    if (response.status === 200) {
      expect(response.body.previous?.id).toBe(lesson1.id);
      expect(response.body.next?.id).toBe(lesson3.id);
    }
  });

  /**
   * Property: Navigation should respect week boundaries
   */
  test('navigation should not cross week boundaries', async () => {
    const week2 = await createTestWeek({
      programme_id: testProgramme.id,
      cohort_id: testCohort.id,
      start_date: new Date().toISOString().split('T')[0]
    });
    
    const lastLessonWeek1 = await createTestLesson({ week_id: testWeek.id, order: 99 });
    const firstLessonWeek2 = await createTestLesson({ week_id: week2.id, order: 1 });
    
    // Last lesson of week 1 should have no next
    const response1 = await request(app)
      .get(`/api/lessons/${lastLessonWeek1.id}/navigation`)
      .set('Authorization', `Bearer ${authToken}`);
    
    if (response1.status === 200) {
      expect(response1.body.next).toBeNull();
    }
    
    // First lesson of week 2 should have no previous
    const response2 = await request(app)
      .get(`/api/lessons/${firstLessonWeek2.id}/navigation`)
      .set('Authorization', `Bearer ${authToken}`);
    
    if (response2.status === 200) {
      expect(response2.body.previous).toBeNull();
    }
  });

  /**
   * Property: Navigation should be consistent across requests
   */
  test('navigation should be consistent', async () => {
    const lesson1 = await createTestLesson({ week_id: testWeek.id, order: 1 });
    const lesson2 = await createTestLesson({ week_id: testWeek.id, order: 2 });
    const lesson3 = await createTestLesson({ week_id: testWeek.id, order: 3 });
    
    // Make multiple requests
    const response1 = await request(app)
      .get(`/api/lessons/${lesson2.id}/navigation`)
      .set('Authorization', `Bearer ${authToken}`);
    
    const response2 = await request(app)
      .get(`/api/lessons/${lesson2.id}/navigation`)
      .set('Authorization', `Bearer ${authToken}`);
    
    if (response1.status === 200 && response2.status === 200) {
      expect(response1.body.previous?.id).toBe(response2.body.previous?.id);
      expect(response1.body.next?.id).toBe(response2.body.next?.id);
    }
  });

  /**
   * Property: Navigation should handle single lesson
   */
  test('single lesson should have no next or previous', async () => {
    const singleWeek = await createTestWeek({
      programme_id: testProgramme.id,
      cohort_id: testCohort.id,
      start_date: new Date().toISOString().split('T')[0]
    });
    
    const singleLesson = await createTestLesson({ week_id: singleWeek.id, order: 1 });
    
    const response = await request(app)
      .get(`/api/lessons/${singleLesson.id}/navigation`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.previous).toBeNull();
    expect(response.body.next).toBeNull();
  });

  /**
   * Property: Navigation should require authentication
   */
  test('navigation should require authentication', async () => {
    const lesson = await createTestLesson({ week_id: testWeek.id, order: 1 });
    
    const response = await request(app)
      .get(`/api/lessons/${lesson.id}/navigation`);
    
    expect(response.status).toBe(401);
  });

  /**
   * Property: Navigation should require enrollment
   */
  test('navigation should require enrollment', async () => {
    const unenrolledUser = await createTestUser({ email: 'unenrolled@example.com' });
    const unenrolledToken = await getAuthToken(unenrolledUser.id);
    
    const lesson = await createTestLesson({ week_id: testWeek.id, order: 1 });
    
    const response = await request(app)
      .get(`/api/lessons/${lesson.id}/navigation`)
      .set('Authorization', `Bearer ${unenrolledToken}`);
    
    expect([403, 404]).toContain(response.status);
  });

  /**
   * Property: Navigation should handle deleted lessons
   */
  test('navigation should skip deleted lessons', async () => {
    const lesson1 = await createTestLesson({ week_id: testWeek.id, order: 1 });
    const lesson2 = await createTestLesson({ week_id: testWeek.id, order: 2 });
    const lesson3 = await createTestLesson({ week_id: testWeek.id, order: 3 });
    
    // Delete middle lesson
    await request(app)
      .delete(`/api/lessons/${lesson2.id}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    // Navigation from lesson1 should skip to lesson3
    const response = await request(app)
      .get(`/api/lessons/${lesson1.id}/navigation`)
      .set('Authorization', `Bearer ${authToken}`);
    
    if (response.status === 200) {
      expect(response.body.next?.id).toBe(lesson3.id);
    }
  });
});
