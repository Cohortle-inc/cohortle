/**
 * Property-Based Test: Current Week Calculation
 * Feature: wlimp-programme-rollout
 * Property 9: Current Week Calculation
 * 
 * **Validates: Requirements 3.2**
 * 
 * For any cohort with a start date, the current week number should be calculated as:
 * floor((days since start) / 7) + 1, with a minimum value of 1, regardless of how far
 * in the past or future the start date is.
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

describe('Feature: wlimp-programme-rollout, Property 9: Current Week Calculation', () => {
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

  it('should calculate current week as floor((days since start) / 7) + 1 with minimum of 1', async () => {
    // Custom arbitraries for date testing
    // Generate dates from 5 years in the past to 2 years in the future
    const startDateArb = fc.date({
      min: new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000), // 5 years ago
      max: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000), // 2 years from now
    });

    const createdProgrammeIds = [];
    const createdCohortIds = [];

    await fc.assert(
      fc.asyncProperty(startDateArb, async (startDate) => {
        const sdk = new BackendSDK();

        // Create a programme
        sdk.setTable('programmes');
        const programmeId = await sdk.insert({
          community_id: testCommunityId,
          name: `Test Programme ${Date.now()}_${Math.random()}`,
          description: 'Test programme for current week calculation',
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

        // Calculate expected week number using the same logic as the service
        const now = new Date();
        const cohortStartDate = new Date(startDate);
        
        const daysSinceStart = Math.floor(
          (now.getTime() - cohortStartDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        const expectedWeekNumber = Math.max(1, Math.floor(daysSinceStart / 7) + 1);

        // Get current week from service
        const actualWeekNumber = await ProgrammeService.getCurrentWeek(programmeId, cohortId);

        // Verify the calculation matches the expected formula
        expect(actualWeekNumber).toBe(expectedWeekNumber);
        
        // Verify minimum value of 1
        expect(actualWeekNumber).toBeGreaterThanOrEqual(1);
        
        // Additional verification: if start date is in the future, should return 1
        if (cohortStartDate > now) {
          expect(actualWeekNumber).toBe(1);
        }
        
        // Additional verification: if start date is today, should return 1
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startDateOnly = new Date(cohortStartDate);
        startDateOnly.setHours(0, 0, 0, 0);
        
        if (startDateOnly.getTime() === today.getTime()) {
          expect(actualWeekNumber).toBe(1);
        }
        
        // Additional verification: if start date is 7 days ago, should return 2
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        
        if (Math.abs(startDateOnly.getTime() - sevenDaysAgo.getTime()) < 24 * 60 * 60 * 1000) {
          expect(actualWeekNumber).toBeGreaterThanOrEqual(2);
        }
      }),
      { numRuns: 20 }
    );

    // Clean up all created data after all property runs
    for (const cohortId of createdCohortIds) {
      await cleanupTestData('cohorts', { id: cohortId });
    }
    for (const programmeId of createdProgrammeIds) {
      await cleanupTestData('programmes', { id: programmeId });
    }
  });

  it('should handle edge cases: same day, exactly 7 days, exactly 14 days', async () => {
    // Test specific edge cases with precise date calculations
    const edgeCaseDatesArb = fc.constantFrom(
      new Date(), // Today (should be week 1)
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Exactly 7 days ago (should be week 2)
      new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // Exactly 14 days ago (should be week 3)
      new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago (should be week 1)
      new Date(Date.now() - 13 * 24 * 60 * 60 * 1000), // 13 days ago (should be week 2)
      new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow (should be week 1)
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now (should be week 1)
    );

    const createdProgrammeIds = [];
    const createdCohortIds = [];

    await fc.assert(
      fc.asyncProperty(edgeCaseDatesArb, async (startDate) => {
        const sdk = new BackendSDK();

        // Create a programme
        sdk.setTable('programmes');
        const programmeId = await sdk.insert({
          community_id: testCommunityId,
          name: `Test Programme ${Date.now()}_${Math.random()}`,
          description: 'Test programme for edge case week calculation',
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
          enrollment_code: `EDGE-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          start_date: startDate,
          status: 'active',
        });
        createdCohortIds.push(cohortId);

        // Calculate expected week number
        const now = new Date();
        const cohortStartDate = new Date(startDate);
        
        const daysSinceStart = Math.floor(
          (now.getTime() - cohortStartDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        const expectedWeekNumber = Math.max(1, Math.floor(daysSinceStart / 7) + 1);

        // Get current week from service
        const actualWeekNumber = await ProgrammeService.getCurrentWeek(programmeId, cohortId);

        // Verify the calculation
        expect(actualWeekNumber).toBe(expectedWeekNumber);
        expect(actualWeekNumber).toBeGreaterThanOrEqual(1);
      }),
      { numRuns: 10 }
    );

    // Clean up all created data after all property runs
    for (const cohortId of createdCohortIds) {
      await cleanupTestData('cohorts', { id: cohortId });
    }
    for (const programmeId of createdProgrammeIds) {
      await cleanupTestData('programmes', { id: programmeId });
    }
  });

  it('should return 1 when no cohort exists for the programme', async () => {
    const sdk = new BackendSDK();

    // Create a programme without any cohorts
    sdk.setTable('programmes');
    const programmeId = await sdk.insert({
      community_id: testCommunityId,
      name: `Test Programme No Cohort ${Date.now()}`,
      description: 'Test programme with no cohorts',
      start_date: new Date(),
      type: 'structured',
      created_by: testUserId,
      status: 'active',
    });

    // Get current week (should default to 1)
    const weekNumber = await ProgrammeService.getCurrentWeek(programmeId);

    // Verify default value
    expect(weekNumber).toBe(1);

    // Clean up
    await cleanupTestData('programmes', { id: programmeId });
  });

  it('should use the first cohort when cohortId is not provided', async () => {
    const sdk = new BackendSDK();

    // Create a programme
    sdk.setTable('programmes');
    const programmeId = await sdk.insert({
      community_id: testCommunityId,
      name: `Test Programme Multiple Cohorts ${Date.now()}`,
      description: 'Test programme with multiple cohorts',
      start_date: new Date('2025-01-01'),
      type: 'structured',
      created_by: testUserId,
      status: 'active',
    });

    // Create first cohort (earlier start date)
    sdk.setTable('cohorts');
    const firstCohortId = await sdk.insert({
      programme_id: programmeId,
      name: 'First Cohort',
      enrollment_code: `FIRST-${Date.now()}`,
      start_date: new Date('2025-01-01'),
      status: 'active',
    });

    // Create second cohort (later start date)
    const secondCohortId = await sdk.insert({
      programme_id: programmeId,
      name: 'Second Cohort',
      enrollment_code: `SECOND-${Date.now()}`,
      start_date: new Date('2025-02-01'),
      status: 'active',
    });

    // Get current week without specifying cohortId (should use first cohort)
    const weekNumber = await ProgrammeService.getCurrentWeek(programmeId);

    // Calculate expected week based on first cohort
    const now = new Date();
    const firstCohortStartDate = new Date('2025-01-01');
    const daysSinceStart = Math.floor(
      (now.getTime() - firstCohortStartDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const expectedWeekNumber = Math.max(1, Math.floor(daysSinceStart / 7) + 1);

    // Verify it uses the first cohort's start date
    expect(weekNumber).toBe(expectedWeekNumber);

    // Clean up
    await cleanupTestData('cohorts', { id: firstCohortId });
    await cleanupTestData('cohorts', { id: secondCohortId });
    await cleanupTestData('programmes', { id: programmeId });
  });
});
