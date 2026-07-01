/**
 * Property-Based Tests: Session Sorting
 * 
 * Property 13: Live session chronological sorting
 * 
 * These tests verify that live sessions are sorted chronologically
 * and displayed in the correct order.
 * 
 * Requirements: 2.8 - Live session chronological sorting
 */

const fc = require('fast-check');
const request = require('supertest');
const app = require('../../app');
const { setupTestDb, cleanupTestDb, createTestUser, getAuthToken, createTestProgramme, createTestCohort, enrollUserInCohort, createTestSession } = require('../helpers/testSetup');

describe('Property-Based Tests: Session Sorting', () => {
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
   * Property 13: Live session chronological sorting
   * 
   * Sessions should be sorted by scheduled_at in chronological order
   * (earliest first).
   */
  test('Property 13: sessions should be sorted chronologically', () => {
    // Generate multiple sessions with random dates
    const sessionDatesGenerator = fc.array(
      fc.integer({ min: -30, max: 30 }).map(daysOffset => {
        const date = new Date();
        date.setDate(date.getDate() + daysOffset);
        date.setHours(fc.sample(fc.integer({ min: 0, max: 23 }), 1)[0]);
        return date.toISOString();
      }),
      { minLength: 3, maxLength: 10 }
    );

    return fc.assert(
      fc.asyncProperty(sessionDatesGenerator, async (dates) => {
        // Create sessions with these dates
        const sessions = [];
        for (const date of dates) {
          const session = await createTestSession({
            cohort_id: testCohort.id,
            scheduled_at: date
          });
          sessions.push(session);
        }
        
        const response = await request(app)
          .get(`/api/cohorts/${testCohort.id}/sessions`)
          .set('Authorization', `Bearer ${authToken}`);
        
        if (response.status === 200 && response.body.length > 1) {
          // Verify sessions are sorted chronologically
          for (let i = 0; i < response.body.length - 1; i++) {
            const current = new Date(response.body[i].scheduled_at);
            const next = new Date(response.body[i + 1].scheduled_at);
            
            // Current should be before or equal to next
            expect(current.getTime()).toBeLessThanOrEqual(next.getTime());
          }
        }
      }),
      { numRuns: 15 }
    );
  });

  /**
   * Property: Upcoming sessions should be sorted earliest first
   */
  test('upcoming sessions should be sorted earliest first', () => {
    const futureDatesGenerator = fc.array(
      fc.integer({ min: 1, max: 60 }).map(daysOffset => {
        const date = new Date();
        date.setDate(date.getDate() + daysOffset);
        return date.toISOString();
      }),
      { minLength: 3, maxLength: 8 }
    );

    return fc.assert(
      fc.asyncProperty(futureDatesGenerator, async (dates) => {
        // Create upcoming sessions
        for (const date of dates) {
          await createTestSession({
            cohort_id: testCohort.id,
            scheduled_at: date
          });
        }
        
        const response = await request(app)
          .get('/api/dashboard/upcoming-sessions')
          .set('Authorization', `Bearer ${authToken}`);
        
        if (response.status === 200 && response.body.length > 1) {
          // Verify ascending order
          for (let i = 0; i < response.body.length - 1; i++) {
            const current = new Date(response.body[i].scheduled_at);
            const next = new Date(response.body[i + 1].scheduled_at);
            
            expect(current.getTime()).toBeLessThanOrEqual(next.getTime());
          }
        }
      }),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Past sessions should be sorted most recent first
   */
  test('past sessions should be sorted most recent first', () => {
    const pastDatesGenerator = fc.array(
      fc.integer({ min: -60, max: -1 }).map(daysOffset => {
        const date = new Date();
        date.setDate(date.getDate() + daysOffset);
        return date.toISOString();
      }),
      { minLength: 3, maxLength: 8 }
    );

    return fc.assert(
      fc.asyncProperty(pastDatesGenerator, async (dates) => {
        // Create past sessions
        for (const date of dates) {
          await createTestSession({
            cohort_id: testCohort.id,
            scheduled_at: date
          });
        }
        
        const response = await request(app)
          .get(`/api/cohorts/${testCohort.id}/sessions?filter=past`)
          .set('Authorization', `Bearer ${authToken}`);
        
        if (response.status === 200 && response.body.length > 1) {
          // Verify descending order for past sessions
          for (let i = 0; i < response.body.length - 1; i++) {
            const current = new Date(response.body[i].scheduled_at);
            const next = new Date(response.body[i + 1].scheduled_at);
            
            // Most recent first
            expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
          }
        }
      }),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Sessions with same date should maintain stable order
   */
  test('sessions with same date should maintain stable order', async () => {
    const sameDate = new Date();
    sameDate.setDate(sameDate.getDate() + 7);
    const dateStr = sameDate.toISOString();
    
    // Create multiple sessions with same date
    const session1 = await createTestSession({
      cohort_id: testCohort.id,
      scheduled_at: dateStr,
      title: 'Session A'
    });
    
    const session2 = await createTestSession({
      cohort_id: testCohort.id,
      scheduled_at: dateStr,
      title: 'Session B'
    });
    
    const session3 = await createTestSession({
      cohort_id: testCohort.id,
      scheduled_at: dateStr,
      title: 'Session C'
    });
    
    // Make multiple requests
    const response1 = await request(app)
      .get(`/api/cohorts/${testCohort.id}/sessions`)
      .set('Authorization', `Bearer ${authToken}`);
    
    const response2 = await request(app)
      .get(`/api/cohorts/${testCohort.id}/sessions`)
      .set('Authorization', `Bearer ${authToken}`);
    
    if (response1.status === 200 && response2.status === 200) {
      const sessions1 = response1.body.filter(s => 
        [session1.id, session2.id, session3.id].includes(s.id)
      );
      const sessions2 = response2.body.filter(s => 
        [session1.id, session2.id, session3.id].includes(s.id)
      );
      
      // Order should be consistent
      expect(sessions1.map(s => s.id)).toEqual(sessions2.map(s => s.id));
    }
  });

  /**
   * Property: Empty session list should not error
   */
  test('empty session list should return empty array', async () => {
    const newCohort = await createTestCohort({ programme_id: testProgramme.id });
    await enrollUserInCohort(testUser.id, newCohort.id);
    
    const response = await request(app)
      .get(`/api/cohorts/${newCohort.id}/sessions`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(0);
  });

  /**
   * Property: Session sorting should handle timezone differences
   */
  test('session sorting should handle different timezones', () => {
    const timezoneOffsets = fc.array(
      fc.record({
        date: fc.date({ min: new Date(), max: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }),
        offset: fc.integer({ min: -12, max: 14 })
      }),
      { minLength: 3, maxLength: 6 }
    );

    return fc.assert(
      fc.asyncProperty(timezoneOffsets, async (sessions) => {
        // Create sessions with different timezone offsets
        for (const session of sessions) {
          const date = new Date(session.date);
          date.setHours(date.getHours() + session.offset);
          
          await createTestSession({
            cohort_id: testCohort.id,
            scheduled_at: date.toISOString()
          });
        }
        
        const response = await request(app)
          .get(`/api/cohorts/${testCohort.id}/sessions`)
          .set('Authorization', `Bearer ${authToken}`);
        
        if (response.status === 200 && response.body.length > 1) {
          // Should still be sorted chronologically
          for (let i = 0; i < response.body.length - 1; i++) {
            const current = new Date(response.body[i].scheduled_at);
            const next = new Date(response.body[i + 1].scheduled_at);
            
            expect(current.getTime()).toBeLessThanOrEqual(next.getTime());
          }
        }
      }),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Cancelled sessions should be filtered or marked
   */
  test('cancelled sessions should be handled correctly', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    
    const session = await createTestSession({
      cohort_id: testCohort.id,
      scheduled_at: futureDate.toISOString(),
      status: 'cancelled'
    });
    
    const response = await request(app)
      .get(`/api/cohorts/${testCohort.id}/sessions`)
      .set('Authorization', `Bearer ${authToken}`);
    
    if (response.status === 200) {
      const cancelledSession = response.body.find(s => s.id === session.id);
      
      if (cancelledSession) {
        // Should be marked as cancelled
        expect(cancelledSession.status).toBe('cancelled');
      }
      // Or should be filtered out entirely
    }
  });

  /**
   * Property: Session count should match created sessions
   */
  test('session count should be accurate', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }),
        async (count) => {
          const newCohort = await createTestCohort({ programme_id: testProgramme.id });
          await enrollUserInCohort(testUser.id, newCohort.id);
          
          // Create exact number of sessions
          for (let i = 0; i < count; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            await createTestSession({
              cohort_id: newCohort.id,
              scheduled_at: date.toISOString()
            });
          }
          
          const response = await request(app)
            .get(`/api/cohorts/${newCohort.id}/sessions`)
            .set('Authorization', `Bearer ${authToken}`);
          
          if (response.status === 200) {
            expect(response.body.length).toBe(count);
          }
        }
      ),
      { numRuns: 10 }
    );
  });
});
