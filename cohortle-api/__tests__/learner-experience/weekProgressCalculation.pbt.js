/**
 * Property-Based Test: Week Progress Calculation
 * Feature: learner-experience-complete
 * Property 5: Week progress calculation
 * 
 * **Validates: Requirements 3.6, 6.2**
 * 
 * For any week and completion state, the progress percentage should equal
 * (completed lessons in week / total lessons in week) × 100
 */

const fc = require('fast-check');
const BackendSDK = require('../../core/BackendSDK');
const ProgressService = require('../../services/ProgressService');
const {
  setupTestDatabase,
  teardownTestDatabase,
  cleanupTestData,
  createTestCommunity,
  createTestUser,
} = require('../helpers/testSetup');

describe('Feature: learner-experience-complete, Property 5: Week progress calculation', () => {
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

  it('should calculate progress as (completed lessons in week / total lessons in week) × 100', async () => {
    // Arbitraries for test data generation
    const lessonsInWeekArb = fc.integer({ min: 1, max: 20 });
    const completionRatioArb = fc.double({ min: 0, max: 1 });

    const createdProgrammeIds = [];
    const createdCohortIds = [];
    const createdWeekIds = [];
    const createdLessonIds = [];
    const createdCompletionIds = [];
    const createdUserIds = [];

    await fc.assert(
      fc.asyncProperty(
        lessonsInWeekArb,
        completionRatioArb,
        async (lessonsInWeek, completionRatio) => {
          const sdk = new BackendSDK();

          // Create a test user for this property run
          sdk.setTable('users');
          const userId = await sdk.insert({
            username: `testuser_${Date.now()}_${Math.random()}`,
            email: `test_${Date.now()}_${Math.random()}@example.com`,
            password: 'test_password_hash',
            role: 'learner',
          });
          createdUserIds.push(userId);

          // Create a programme
          sdk.setTable('programmes');
          const programmeId = await sdk.insert({
            community_id: testCommunityId,
            name: `Test Programme ${Date.now()}`,
            description: 'Test programme for week progress calculation',
            start_date: new Date('2025-01-01'),
            type: 'structured',
            created_by: testUserId,
            status: 'active',
          });
          createdProgrammeIds.push(programmeId);

          // Create a cohort
          sdk.setTable('cohorts');
          const cohortId = await sdk.insert({
            programme_id: programmeId,
            name: `Test Cohort ${Date.now()}`,
            enrollment_code: `CODE-${Date.now()}`,
            start_date: new Date('2025-01-01'),
            status: 'active',
          });
          createdCohortIds.push(cohortId);

          // Create a week
          sdk.setTable('weeks');
          const weekId = await sdk.insert({
            programme_id: programmeId,
            week_number: 1,
            title: 'Test Week',
            start_date: new Date('2025-01-01'),
          });
          createdWeekIds.push(weekId);

          // Create lessons for this week
          const allLessonIds = [];
          for (let i = 0; i < lessonsInWeek; i++) {
            sdk.setTable('lessons');
            const lessonId = await sdk.insert({
              week_id: weekId,
              title: `Lesson ${i + 1}`,
              type: 'text',
              content_text: 'Test content',
              order_index: i,
            });
            createdLessonIds.push(lessonId);
            allLessonIds.push(lessonId);
          }

          const totalLessons = allLessonIds.length;
          const targetCompletedCount = Math.floor(totalLessons * completionRatio);

          // Mark some lessons as complete
          sdk.setTable('lesson_completions');
          for (let i = 0; i < targetCompletedCount; i++) {
            const completionId = await sdk.insert({
              user_id: userId,
              lesson_id: allLessonIds[i],
              cohort_id: cohortId,
              completed_at: new Date(),
            });
            createdCompletionIds.push(completionId);
          }

          // Calculate progress using the service
          const result = await ProgressService.calculateWeekProgress(
            userId,
            weekId,
            cohortId
          );

          // Calculate expected progress
          const expectedProgress = totalLessons === 0 
            ? 0 
            : Math.round((targetCompletedCount / totalLessons) * 100);

          // Verify the property: progress = (completed / total) × 100
          expect(result.progress).toBe(expectedProgress);
          expect(result.completedLessons).toBe(targetCompletedCount);
          expect(result.totalLessons).toBe(totalLessons);

          // Verify the calculation is correct
          if (totalLessons > 0) {
            const calculatedProgress = Math.round((result.completedLessons / result.totalLessons) * 100);
            expect(result.progress).toBe(calculatedProgress);
          }
        }
      ),
      { numRuns: 100 }
    );

    // Clean up all created data after all property runs
    for (const completionId of createdCompletionIds) {
      await cleanupTestData('lesson_completions', { id: completionId });
    }
    for (const lessonId of createdLessonIds) {
      await cleanupTestData('lessons', { id: lessonId });
    }
    for (const weekId of createdWeekIds) {
      await cleanupTestData('weeks', { id: weekId });
    }
    for (const cohortId of createdCohortIds) {
      await cleanupTestData('cohorts', { id: cohortId });
    }
    for (const programmeId of createdProgrammeIds) {
      await cleanupTestData('programmes', { id: programmeId });
    }
    for (const userId of createdUserIds) {
      await cleanupTestData('users', { id: userId });
    }
  });

  it('should return 0% progress when no lessons exist in week', async () => {
    const createdProgrammeIds = [];
    const createdCohortIds = [];
    const createdWeekIds = [];
    const createdUserIds = [];

    await fc.assert(
      fc.asyncProperty(
        fc.constant(null),
        async () => {
          const sdk = new BackendSDK();

          // Create a test user
          sdk.setTable('users');
          const userId = await sdk.insert({
            username: `testuser_${Date.now()}_${Math.random()}`,
            email: `test_${Date.now()}_${Math.random()}@example.com`,
            password: 'test_password_hash',
            role: 'learner',
          });
          createdUserIds.push(userId);

          // Create a programme
          sdk.setTable('programmes');
          const programmeId = await sdk.insert({
            community_id: testCommunityId,
            name: `Empty Week Programme ${Date.now()}`,
            description: 'Programme with empty week',
            start_date: new Date('2025-01-01'),
            type: 'structured',
            created_by: testUserId,
            status: 'active',
          });
          createdProgrammeIds.push(programmeId);

          // Create a cohort
          sdk.setTable('cohorts');
          const cohortId = await sdk.insert({
            programme_id: programmeId,
            name: `Test Cohort ${Date.now()}`,
            enrollment_code: `CODE-${Date.now()}`,
            start_date: new Date('2025-01-01'),
            status: 'active',
          });
          createdCohortIds.push(cohortId);

          // Create a week with no lessons
          sdk.setTable('weeks');
          const weekId = await sdk.insert({
            programme_id: programmeId,
            week_number: 1,
            title: 'Empty Week',
            start_date: new Date('2025-01-01'),
          });
          createdWeekIds.push(weekId);

          // Calculate progress for empty week
          const result = await ProgressService.calculateWeekProgress(
            userId,
            weekId,
            cohortId
          );

          // Verify edge case: empty week returns 0% progress
          expect(result.progress).toBe(0);
          expect(result.completedLessons).toBe(0);
          expect(result.totalLessons).toBe(0);
        }
      ),
      { numRuns: 10 }
    );

    // Clean up
    for (const weekId of createdWeekIds) {
      await cleanupTestData('weeks', { id: weekId });
    }
    for (const cohortId of createdCohortIds) {
      await cleanupTestData('cohorts', { id: cohortId });
    }
    for (const programmeId of createdProgrammeIds) {
      await cleanupTestData('programmes', { id: programmeId });
    }
    for (const userId of createdUserIds) {
      await cleanupTestData('users', { id: userId });
    }
  });

  it('should return 100% progress when all lessons in week are completed', async () => {
    const lessonCountArb = fc.integer({ min: 1, max: 20 });

    const createdProgrammeIds = [];
    const createdCohortIds = [];
    const createdWeekIds = [];
    const createdLessonIds = [];
    const createdCompletionIds = [];
    const createdUserIds = [];

    await fc.assert(
      fc.asyncProperty(
        lessonCountArb,
        async (lessonCount) => {
          const sdk = new BackendSDK();

          // Create a test user
          sdk.setTable('users');
          const userId = await sdk.insert({
            username: `testuser_${Date.now()}_${Math.random()}`,
            email: `test_${Date.now()}_${Math.random()}@example.com`,
            password: 'test_password_hash',
            role: 'learner',
          });
          createdUserIds.push(userId);

          // Create a programme
          sdk.setTable('programmes');
          const programmeId = await sdk.insert({
            community_id: testCommunityId,
            name: `Test Programme ${Date.now()}`,
            description: 'Test programme for 100% week completion',
            start_date: new Date('2025-01-01'),
            type: 'structured',
            created_by: testUserId,
            status: 'active',
          });
          createdProgrammeIds.push(programmeId);

          // Create a cohort
          sdk.setTable('cohorts');
          const cohortId = await sdk.insert({
            programme_id: programmeId,
            name: `Test Cohort ${Date.now()}`,
            enrollment_code: `CODE-${Date.now()}`,
            start_date: new Date('2025-01-01'),
            status: 'active',
          });
          createdCohortIds.push(cohortId);

          // Create a week
          sdk.setTable('weeks');
          const weekId = await sdk.insert({
            programme_id: programmeId,
            week_number: 1,
            title: 'Test Week',
            start_date: new Date('2025-01-01'),
          });
          createdWeekIds.push(weekId);

          // Create lessons and mark all as complete
          const allLessonIds = [];
          for (let i = 0; i < lessonCount; i++) {
            sdk.setTable('lessons');
            const lessonId = await sdk.insert({
              week_id: weekId,
              title: `Lesson ${i + 1}`,
              type: 'text',
              content_text: 'Test content',
              order_index: i,
            });
            createdLessonIds.push(lessonId);
            allLessonIds.push(lessonId);

            // Mark as complete
            sdk.setTable('lesson_completions');
            const completionId = await sdk.insert({
              user_id: userId,
              lesson_id: lessonId,
              cohort_id: cohortId,
              completed_at: new Date(),
            });
            createdCompletionIds.push(completionId);
          }

          // Calculate progress
          const result = await ProgressService.calculateWeekProgress(
            userId,
            weekId,
            cohortId
          );

          // Verify 100% completion
          expect(result.progress).toBe(100);
          expect(result.completedLessons).toBe(lessonCount);
          expect(result.totalLessons).toBe(lessonCount);
        }
      ),
      { numRuns: 20 }
    );

    // Clean up
    for (const completionId of createdCompletionIds) {
      await cleanupTestData('lesson_completions', { id: completionId });
    }
    for (const lessonId of createdLessonIds) {
      await cleanupTestData('lessons', { id: lessonId });
    }
    for (const weekId of createdWeekIds) {
      await cleanupTestData('weeks', { id: weekId });
    }
    for (const cohortId of createdCohortIds) {
      await cleanupTestData('cohorts', { id: cohortId });
    }
    for (const programmeId of createdProgrammeIds) {
      await cleanupTestData('programmes', { id: programmeId });
    }
    for (const userId of createdUserIds) {
      await cleanupTestData('users', { id: userId });
    }
  });
});
