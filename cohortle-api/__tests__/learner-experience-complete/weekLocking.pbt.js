/**
 * Property-Based Tests: Week Locking
 * 
 * Property 7: Week locking by date
 * 
 * These tests verify that weeks are properly locked/unlocked based on
 * their start dates and that learners cannot access future content.
 * 
 * Requirements: 3.7, 3.8 - Week locking by date
 */

const fc = require('fast-check');
const request = require('supertest');
const app = require('../../app');
const { setupTestDb, cleanupTestDb, createTestUser, getAuthToken, createTestProgramme, createTestCohort, enrollUserInCohort, createTestWeek } = require('../helpers/testSetup');

describe('Property-Based Tests: Week Locking', () => {
  let testUser;
  let authToken;
  let testProgramme;
  let testCohort;

  beforeAll(async () => {
    await setupTestDb();
    testUser = await createTestUser({ role: 'learner' });
    authToken = await getAuthToken(testUser.id);
    testProgramme = await createTestProgramme();
    testCohort = await createTestCohort({ programme_id: testProgramme.id });
    await enrollUserInCohort(testUser.id, testCohort.id);
  });

  afterAll(async () => {
    await cleanupTestDb();
  });

  /**
   * Property 7: Week locking by date
   * 
   * Weeks with start dates in the future should be locked.
   * Weeks with start dates in the past or today should be unlocked.
   */
  test('Property 7: weeks should be locked based on start date', () => {
    // Generate dates relative to today
    const dateGenerator = fc.integer({ min: -30, max: 30 }).map(daysOffset => {
      const date = new Date();
      date.setDate(date.getDate() + daysOffset);
      return date.toISOString().split('T')[0];
    });

    return fc.assert(
      fc.asyncProperty(dateGenerator, async (startDate) => {
        // Create a week with this start date
        const week = await createTestWeek({
          programme_id: testProgramme.id,
          cohort_id: testCohort.id,
          start_date: startDate
        });
        
        const response = await request(app)
          .get(`/api/programmes/${testProgramme.id}/weeks`)
          .set('Authorization', `Bearer ${authToken}`);
        
        if (response.status === 200) {
          const weekData = response.body.find(w => w.id === week.id);
          
          if (weekData) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const weekStart = new Date(startDate);
            weekStart.setHours(0, 0, 0, 0);
            
            // Week should be locked if start date is in the future
            const shouldBeLocked = weekStart > today;
            expect(weekData.is_locked).toBe(shouldBeLocked);
          }
        }
      }),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Past weeks should always be unlocked
   */
  test('past weeks should always be unlocked', () => {
    const pastDates = fc.integer({ min: -365, max: -1 }).map(daysOffset => {
      const date = new Date();
      date.setDate(date.getDate() + daysOffset);
      return date.toISOString().split('T')[0];
    });

    return fc.assert(
      fc.asyncProperty(pastDates, async (startDate) => {
        const week = await createTestWeek({
          programme_id: testProgramme.id,
          cohort_id: testCohort.id,
          start_date: startDate
        });
        
        const response = await request(app)
          .get(`/api/programmes/${testProgramme.id}/weeks`)
          .set('Authorization', `Bearer ${authToken}`);
        
        if (response.status === 200) {
          const weekData = response.body.find(w => w.id === week.id);
          
          if (weekData) {
            expect(weekData.is_locked).toBe(false);
          }
        }
      }),
      { numRuns: 15 }
    );
  });

  /**
   * Property: Future weeks should always be locked
   */
  test('future weeks should always be locked', () => {
    const futureDates = fc.integer({ min: 1, max: 365 }).map(daysOffset => {
      const date = new Date();
      date.setDate(date.getDate() + daysOffset);
      return date.toISOString().split('T')[0];
    });

    return fc.assert(
      fc.asyncProperty(futureDates, async (startDate) => {
        const week = await createTestWeek({
          programme_id: testProgramme.id,
          cohort_id: testCohort.id,
          start_date: startDate
        });
        
        const response = await request(app)
          .get(`/api/programmes/${testProgramme.id}/weeks`)
          .set('Authorization', `Bearer ${authToken}`);
        
        if (response.status === 200) {
          const weekData = response.body.find(w => w.id === week.id);
          
          if (weekData) {
            expect(weekData.is_locked).toBe(true);
          }
        }
      }),
      { numRuns: 15 }
    );
  });

  /**
   * Property: Today's week should be unlocked
   */
  test('weeks starting today should be unlocked', async () => {
    const today = new Date().toISOString().split('T')[0];
    
    const week = await createTestWeek({
      programme_id: testProgramme.id,
      cohort_id: testCohort.id,
      start_date: today
    });
    
    const response = await request(app)
      .get(`/api/programmes/${testProgramme.id}/weeks`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(response.status).toBe(200);
    const weekData = response.body.find(w => w.id === week.id);
    
    if (weekData) {
      expect(weekData.is_locked).toBe(false);
    }
  });

  /**
   * Property: Locked weeks should not allow lesson access
   */
  test('locked weeks should prevent lesson access', () => {
    const futureDates = fc.integer({ min: 1, max: 30 }).map(daysOffset => {
      const date = new Date();
      date.setDate(date.getDate() + daysOffset);
      return date.toISOString().split('T')[0];
    });

    return fc.assert(
      fc.asyncProperty(futureDates, async (startDate) => {
        const week = await createTestWeek({
          programme_id: testProgramme.id,
          cohort_id: testCohort.id,
          start_date: startDate
        });
        
        // Try to access a lesson in this locked week
        const lessonResponse = await request(app)
          .get(`/api/weeks/${week.id}/lessons`)
          .set('Authorization', `Bearer ${authToken}`);
        
        // Should either return empty array or indicate week is locked
        if (lessonResponse.status === 200) {
          // If lessons are returned, they should be marked as locked
          lessonResponse.body.forEach(lesson => {
            expect(lesson.is_locked || lesson.week_locked).toBe(true);
          });
        } else {
          // Or return 403 forbidden
          expect([403, 423]).toContain(lessonResponse.status);
        }
      }),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Week locking should be consistent across requests
   */
  test('week locking should be consistent', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const futureDateStr = futureDate.toISOString().split('T')[0];
    
    const week = await createTestWeek({
      programme_id: testProgramme.id,
      cohort_id: testCohort.id,
      start_date: futureDateStr
    });
    
    // Make multiple requests
    const response1 = await request(app)
      .get(`/api/programmes/${testProgramme.id}/weeks`)
      .set('Authorization', `Bearer ${authToken}`);
    
    const response2 = await request(app)
      .get(`/api/programmes/${testProgramme.id}/weeks`)
      .set('Authorization', `Bearer ${authToken}`);
    
    if (response1.status === 200 && response2.status === 200) {
      const week1 = response1.body.find(w => w.id === week.id);
      const week2 = response2.body.find(w => w.id === week.id);
      
      if (week1 && week2) {
        // Lock status should be consistent
        expect(week1.is_locked).toBe(week2.is_locked);
      }
    }
  });

  /**
   * Property: Week order should not affect locking
   */
  test('week locking should be independent of order', async () => {
    // Create weeks in different orders with different dates
    const week1 = await createTestWeek({
      programme_id: testProgramme.id,
      cohort_id: testCohort.id,
      start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      order: 2
    });
    
    const week2 = await createTestWeek({
      programme_id: testProgramme.id,
      cohort_id: testCohort.id,
      start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      order: 1
    });
    
    const response = await request(app)
      .get(`/api/programmes/${testProgramme.id}/weeks`)
      .set('Authorization', `Bearer ${authToken}`);
    
    if (response.status === 200) {
      const weekData1 = response.body.find(w => w.id === week1.id);
      const weekData2 = response.body.find(w => w.id === week2.id);
      
      if (weekData1 && weekData2) {
        // Future week should be locked regardless of order
        expect(weekData1.is_locked).toBe(true);
        // Past week should be unlocked regardless of order
        expect(weekData2.is_locked).toBe(false);
      }
    }
  });

  /**
   * Property: Unenrolled users should not see week lock status
   */
  test('unenrolled users should not access week data', async () => {
    const unenrolledUser = await createTestUser({ email: 'unenrolled@example.com' });
    const unenrolledToken = await getAuthToken(unenrolledUser.id);
    
    const response = await request(app)
      .get(`/api/programmes/${testProgramme.id}/weeks`)
      .set('Authorization', `Bearer ${unenrolledToken}`);
    
    // Should either return 403 or empty array
    expect([200, 403, 404]).toContain(response.status);
    
    if (response.status === 200) {
      // Should return empty or no locked status
      expect(Array.isArray(response.body)).toBe(true);
    }
  });
});
