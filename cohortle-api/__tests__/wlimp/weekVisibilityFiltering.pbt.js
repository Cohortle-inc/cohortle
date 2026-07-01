/**
 * Property-Based Test: Week Visibility Filtering
 * Feature: wlimp-programme-rollout
 * Property 11: Week Visibility Filtering
 * 
 * **Validates: Requirements 3.5**
 * 
 * For any programme, only weeks where week_number <= current_week should be included
 * in the programme page response, ensuring future weeks are not displayed.
 */

const fc = require('fast-check');
const BackendSDK = require('../../core/BackendSDK');
const ProgrammeService = require('../../services/ProgrammeService');
const {
  setupTestDatabase,
  teardownTestDatabase,
  cleanupTestData,
  createTestCommunity,
  createTestUser,
} = require('../helpers/testSetup');

describe('Feature: wlimp-programme-rollout, Property 11: Week Visibility Filtering', () => {
  let testUserId;
  let testCommunityId;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    
    await setupTestDatabase();
    testUserId = await createTestUser();
    testCommunityId = await createTestCommunity(testUserId);
  });

  afterAll(async () => {
    await cleanupTestData('communities', { id: testCommunityId });
    await cleanupTestData('users', { id: testUserId });
    
    await teardownTestDatabase();
  });

  it('should only include weeks where week_number <= current_week', async () => {
    // Generate arbitrary number of weeks (between 5 and 15)
    const totalWeeksArb = fc.integer({ min: 5, max: 15 });
    
    // Generate a start date that puts us somewhere in the middle of the programme
    // This ensures we have both past and future weeks
    const startDateArb = fc.date({
      min: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 180 days ago
      max: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago (at least week 2)
    });

    const createdProgrammeIds = [];
    const createdCohortIds = [];
    const createdWeekIds = [];

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          totalWeeks: totalWeeksArb,
          startDate: startDateArb,
        }),
        async ({ totalWeeks, startDate }) => {
          const sdk = new BackendSDK();

          // Create a programme
          sdk.setTable('programmes');
          const programmeId = await sdk.insert({
            community_id: testCommunityId,
            name: `Test Programme ${Date.now()}_${Math.random()}`,
            description: 'Test programme for week visibility filtering',
            start_date: startDate,
            type: 'structured',
            created_by: testUserId,
            status: 'active',
          });
          createdProgrammeIds.push(programmeId);

          // Create a cohort with the start date
          sdk.setTable('cohorts');
          const cohortId = await sdk.insert({
            programme_id: programmeId,
            name: `Test Cohort ${Date.now()}_${Math.random()}`,
            enrollment_code: `TEST-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            start_date: startDate,
            status: 'active',
          });
          createdCohortIds.push(cohortId);

          // Calculate current week
          const now = new Date();
          const cohortStartDate = new Date(startDate);
          const daysSinceStart = Math.floor(
            (now.getTime() - cohortStartDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          const currentWeek = Math.max(1, Math.floor(daysSinceStart / 7) + 1);

          // Create weeks (some past, some current, some future)
          sdk.setTable('weeks');
          for (let weekNum = 1; weekNum <= totalWeeks; weekNum++) {
            const weekStartDate = new Date(cohortStartDate);
            weekStartDate.setDate(weekStartDate.getDate() + (weekNum - 1) * 7);

            const weekId = await sdk.insert({
              programme_id: programmeId,
              week_number: weekNum,
              title: `Week ${weekNum}`,
              start_date: weekStartDate,
            });
            createdWeekIds.push(weekId);
          }

          // Get programme weeks using the service
          const visibleWeeks = await ProgrammeService.getProgrammeWeeks(programmeId, cohortId);

          // Property: All visible weeks should have week_number <= current_week
          visibleWeeks.forEach(week => {
            expect(week.week_number).toBeLessThanOrEqual(currentWeek);
          });

          // Property: No future weeks should be visible
          const futureWeeks = visibleWeeks.filter(week => week.week_number > currentWeek);
          expect(futureWeeks).toHaveLength(0);

          // Property: All past and current weeks should be visible
          const expectedVisibleWeekCount = Math.min(currentWeek, totalWeeks);
          expect(visibleWeeks).toHaveLength(expectedVisibleWeekCount);

          // Property: Weeks should be in order
          for (let i = 0; i < visibleWeeks.length - 1; i++) {
            expect(visibleWeeks[i].week_number).toBeLessThan(visibleWeeks[i + 1].week_number);
          }

          // Property: If current week exists, it should be included
          if (currentWeek <= totalWeeks) {
            const currentWeekInList = visibleWeeks.find(w => w.week_number === currentWeek);
            expect(currentWeekInList).toBeDefined();
            expect(currentWeekInList.isCurrent).toBe(true);
          }
        }
      ),
      { numRuns: 20 }
    );

    // Clean up all created data
    for (const weekId of createdWeekIds) {
      await cleanupTestData('weeks', { id: weekId });
    }
    for (const cohortId of createdCohortIds) {
      await cleanupTestData('cohorts', { id: cohortId });
    }
    for (const programmeId of createdProgrammeIds) {
      await cleanupTestData('programmes', { id: programmeId });
    }
  });

  it('should handle edge case: programme just started (week 1)', async () => {
    const sdk = new BackendSDK();

    // Create a programme that started today
    sdk.setTable('programmes');
    const programmeId = await sdk.insert({
      community_id: testCommunityId,
      name: `Test Programme Week 1 ${Date.now()}`,
      description: 'Test programme starting today',
      start_date: new Date(),
      type: 'structured',
      created_by: testUserId,
      status: 'active',
    });

    // Create a cohort
    sdk.setTable('cohorts');
    const cohortId = await sdk.insert({
      programme_id: programmeId,
      name: `Test Cohort Week 1 ${Date.now()}`,
      enrollment_code: `WEEK1-${Date.now()}`,
      start_date: new Date(),
      status: 'active',
    });

    // Create 5 weeks
    sdk.setTable('weeks');
    const weekIds = [];
    for (let weekNum = 1; weekNum <= 5; weekNum++) {
      const weekStartDate = new Date();
      weekStartDate.setDate(weekStartDate.getDate() + (weekNum - 1) * 7);

      const weekId = await sdk.insert({
        programme_id: programmeId,
        week_number: weekNum,
        title: `Week ${weekNum}`,
        start_date: weekStartDate,
      });
      weekIds.push(weekId);
    }

    // Get visible weeks
    const visibleWeeks = await ProgrammeService.getProgrammeWeeks(programmeId, cohortId);

    // Should only show week 1
    expect(visibleWeeks).toHaveLength(1);
    expect(visibleWeeks[0].week_number).toBe(1);
    expect(visibleWeeks[0].isCurrent).toBe(true);

    // Clean up
    for (const weekId of weekIds) {
      await cleanupTestData('weeks', { id: weekId });
    }
    await cleanupTestData('cohorts', { id: cohortId });
    await cleanupTestData('programmes', { id: programmeId });
  });

  it('should handle edge case: programme with no future weeks', async () => {
    const sdk = new BackendSDK();

    // Create a programme that started 30 days ago (week 5)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    sdk.setTable('programmes');
    const programmeId = await sdk.insert({
      community_id: testCommunityId,
      name: `Test Programme No Future ${Date.now()}`,
      description: 'Test programme with no future weeks',
      start_date: startDate,
      type: 'structured',
      created_by: testUserId,
      status: 'active',
    });

    // Create a cohort
    sdk.setTable('cohorts');
    const cohortId = await sdk.insert({
      programme_id: programmeId,
      name: `Test Cohort No Future ${Date.now()}`,
      enrollment_code: `NOFUTURE-${Date.now()}`,
      start_date: startDate,
      status: 'active',
    });

    // Create only 3 weeks (all in the past)
    sdk.setTable('weeks');
    const weekIds = [];
    for (let weekNum = 1; weekNum <= 3; weekNum++) {
      const weekStartDate = new Date(startDate);
      weekStartDate.setDate(weekStartDate.getDate() + (weekNum - 1) * 7);

      const weekId = await sdk.insert({
        programme_id: programmeId,
        week_number: weekNum,
        title: `Week ${weekNum}`,
        start_date: weekStartDate,
      });
      weekIds.push(weekId);
    }

    // Get visible weeks
    const visibleWeeks = await ProgrammeService.getProgrammeWeeks(programmeId, cohortId);

    // Should show all 3 weeks (all are in the past)
    expect(visibleWeeks).toHaveLength(3);
    expect(visibleWeeks.map(w => w.week_number)).toEqual([1, 2, 3]);

    // Clean up
    for (const weekId of weekIds) {
      await cleanupTestData('weeks', { id: weekId });
    }
    await cleanupTestData('cohorts', { id: cohortId });
    await cleanupTestData('programmes', { id: programmeId });
  });
});
