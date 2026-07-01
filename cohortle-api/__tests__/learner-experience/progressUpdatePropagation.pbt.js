/**
 * Property-Based Test: Progress Update Propagation
 * Feature: learner-experience-complete
 * Property 6: Progress update propagation
 * 
 * **Validates: Requirements 4.10, 6.4**
 * 
 * For any lesson completion, all affected progress indicators (lesson, week, programme)
 * should update immediately to reflect the new completion state
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

describe('Feature: learner-experience-complete, Property 6: Progress update propagation', () => {
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

  it('should update lesson, week, and programme progress immediately after lesson completion', async () => {
    // Arbitraries for test data generation
    const weekCountArb = fc.integer({ min: 1, max: 3 });
    const lessonsPerWeekArb = fc.integer({ min: 2, max: 5 });
    const targetWeekIndexArb = fc.integer({ min: 0, max: 2 });
    const targetLessonIndexArb = fc.integer({ min: 0, max: 4 });

    const createdProgrammeIds = [];
    const createdCohortIds = [];
    const createdWeekIds = [];
    const createdLessonIds = [];
    const createdCompletionIds = [];
    const createdUserIds = [];

    await fc.assert(
      fc.asyncProperty(
        weekCountArb,
        lessonsPerWeekArb,
        targetWeekIndexArb,
        targetLessonIndexArb,
        async (weekCount, lessonsPerWeek, targetWeekIndex, targetLessonIndex) => {
          // Ensure target indices are within bounds
          fc.pre(targetWeekIndex < weekCount);
          fc.pre(targetLessonIndex < lessonsPerWeek);

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
            description: 'Test programme for progress propagation',
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

          // Create weeks and lessons
          const weekStructure = [];
          for (let w = 0; w < weekCount; w++) {
            sdk.setTable('weeks');
            const weekId = await sdk.insert({
              programme_id: programmeId,
              week_number: w + 1,
              title: `Week ${w + 1}`,
              start_date: new Date('2025-01-01'),
            });
            createdWeekIds.push(weekId);

            const lessonIds = [];
            for (let l = 0; l < lessonsPerWeek; l++) {
              sdk.setTable('lessons');
              const lessonId = await sdk.insert({
                week_id: weekId,
                title: `Week ${w + 1} Lesson ${l + 1}`,
                type: 'text',
                content_text: 'Test content',
                order_index: l,
              });
              createdLessonIds.push(lessonId);
              lessonIds.push(lessonId);
            }

            weekStructure.push({ weekId, lessonIds });
          }

          // Get initial progress (should be 0% everywhere)
          const initialProgrammeProgress = await ProgressService.calculateProgrammeProgress(
            userId,
            programmeId,
            cohortId
          );
          const initialWeekProgress = await ProgressService.calculateWeekProgress(
            userId,
            weekStructure[targetWeekIndex].weekId,
            cohortId
          );

          expect(initialProgrammeProgress.progress).toBe(0);
          expect(initialProgrammeProgress.completedLessons).toBe(0);
          expect(initialWeekProgress.progress).toBe(0);
          expect(initialWeekProgress.completedLessons).toBe(0);

          // Mark the target lesson as complete
          const targetLessonId = weekStructure[targetWeekIndex].lessonIds[targetLessonIndex];
          const completionResult = await ProgressService.markLessonComplete(
            userId,
            targetLessonId,
            cohortId
          );

          // Track completion for cleanup
          sdk.setTable('lesson_completions');
          const completions = await sdk.select({
            user_id: userId,
            lesson_id: targetLessonId,
            cohort_id: cohortId,
          });
          if (completions.length > 0) {
            createdCompletionIds.push(completions[0].id);
          }

          expect(completionResult.success).toBe(true);
          expect(completionResult.completedAt).toBeDefined();

          // Verify immediate propagation to week progress
          const updatedWeekProgress = await ProgressService.calculateWeekProgress(
            userId,
            weekStructure[targetWeekIndex].weekId,
            cohortId
          );

          expect(updatedWeekProgress.completedLessons).toBe(1);
          expect(updatedWeekProgress.totalLessons).toBe(lessonsPerWeek);
          const expectedWeekProgress = Math.round((1 / lessonsPerWeek) * 100);
          expect(updatedWeekProgress.progress).toBe(expectedWeekProgress);

          // Verify immediate propagation to programme progress
          const updatedProgrammeProgress = await ProgressService.calculateProgrammeProgress(
            userId,
            programmeId,
            cohortId
          );

          const totalLessons = weekCount * lessonsPerWeek;
          expect(updatedProgrammeProgress.completedLessons).toBe(1);
          expect(updatedProgrammeProgress.totalLessons).toBe(totalLessons);
          const expectedProgrammeProgress = Math.round((1 / totalLessons) * 100);
          expect(updatedProgrammeProgress.progress).toBe(expectedProgrammeProgress);

          // Verify the property: all progress indicators reflect the new completion state
          expect(updatedWeekProgress.completedLessons).toBeGreaterThan(initialWeekProgress.completedLessons);
          expect(updatedProgrammeProgress.completedLessons).toBeGreaterThan(initialProgrammeProgress.completedLessons);
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

  it('should propagate progress updates when completing multiple lessons', async () => {
    const lessonCountArb = fc.integer({ min: 3, max: 10 });
    const completionCountArb = fc.integer({ min: 1, max: 5 });

    const createdProgrammeIds = [];
    const createdCohortIds = [];
    const createdWeekIds = [];
    const createdLessonIds = [];
    const createdCompletionIds = [];
    const createdUserIds = [];

    await fc.assert(
      fc.asyncProperty(
        lessonCountArb,
        completionCountArb,
        async (lessonCount, completionCount) => {
          // Ensure we don't try to complete more lessons than exist
          fc.pre(completionCount <= lessonCount);

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
            description: 'Test programme for multiple completions',
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

          // Create lessons
          const lessonIds = [];
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
            lessonIds.push(lessonId);
          }

          // Complete lessons one by one and verify progress updates after each
          for (let i = 0; i < completionCount; i++) {
            // Mark lesson as complete
            await ProgressService.markLessonComplete(
              userId,
              lessonIds[i],
              cohortId
            );

            // Track completion for cleanup
            sdk.setTable('lesson_completions');
            const completions = await sdk.select({
              user_id: userId,
              lesson_id: lessonIds[i],
              cohort_id: cohortId,
            });
            if (completions.length > 0) {
              createdCompletionIds.push(completions[0].id);
            }

            // Verify progress reflects the completion immediately
            const weekProgress = await ProgressService.calculateWeekProgress(
              userId,
              weekId,
              cohortId
            );
            const programmeProgress = await ProgressService.calculateProgrammeProgress(
              userId,
              programmeId,
              cohortId
            );

            // Both should show i+1 completed lessons
            expect(weekProgress.completedLessons).toBe(i + 1);
            expect(programmeProgress.completedLessons).toBe(i + 1);

            // Progress percentages should match
            const expectedProgress = Math.round(((i + 1) / lessonCount) * 100);
            expect(weekProgress.progress).toBe(expectedProgress);
            expect(programmeProgress.progress).toBe(expectedProgress);
          }
        }
      ),
      { numRuns: 50 }
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

  it('should propagate progress updates when unmarking lessons as complete', async () => {
    const lessonCountArb = fc.integer({ min: 2, max: 8 });

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
            description: 'Test programme for unmarking completions',
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
          const lessonIds = [];
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
            lessonIds.push(lessonId);

            // Mark as complete
            await ProgressService.markLessonComplete(userId, lessonId, cohortId);

            // Track completion for cleanup
            sdk.setTable('lesson_completions');
            const completions = await sdk.select({
              user_id: userId,
              lesson_id: lessonId,
              cohort_id: cohortId,
            });
            if (completions.length > 0) {
              createdCompletionIds.push(completions[0].id);
            }
          }

          // Verify 100% completion
          const fullProgress = await ProgressService.calculateProgrammeProgress(
            userId,
            programmeId,
            cohortId
          );
          expect(fullProgress.progress).toBe(100);
          expect(fullProgress.completedLessons).toBe(lessonCount);

          // Unmark the first lesson as complete
          await ProgressService.markLessonIncomplete(
            userId,
            lessonIds[0],
            cohortId
          );

          // Verify progress immediately reflects the change
          const updatedWeekProgress = await ProgressService.calculateWeekProgress(
            userId,
            weekId,
            cohortId
          );
          const updatedProgrammeProgress = await ProgressService.calculateProgrammeProgress(
            userId,
            programmeId,
            cohortId
          );

          expect(updatedWeekProgress.completedLessons).toBe(lessonCount - 1);
          expect(updatedProgrammeProgress.completedLessons).toBe(lessonCount - 1);

          const expectedProgress = Math.round(((lessonCount - 1) / lessonCount) * 100);
          expect(updatedWeekProgress.progress).toBe(expectedProgress);
          expect(updatedProgrammeProgress.progress).toBe(expectedProgress);

          // Verify the property: progress updates propagate immediately on unmarking
          expect(updatedProgrammeProgress.progress).toBeLessThan(100);
        }
      ),
      { numRuns: 50 }
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
