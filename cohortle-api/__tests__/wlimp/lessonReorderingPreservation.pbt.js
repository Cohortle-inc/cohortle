/**
 * Property-Based Test: Lesson Reordering Preservation
 * Feature: wlimp-programme-rollout
 * Property 6: Lesson Reordering Preservation
 * 
 * **Validates: Requirements 1.6**
 * 
 * For any week with multiple lessons, reordering the lessons should result in the new
 * order being preserved when lessons are retrieved, with no lessons lost or duplicated.
 */

const fc = require('fast-check');
const BackendSDK = require('../../core/BackendSDK');
const ContentService = require('../../services/ContentService');
const {
  setupTestDatabase,
  teardownTestDatabase,
  cleanupTestData,
  createTestCommunity,
  createTestUser,
} = require('../helpers/testSetup');

describe('Feature: wlimp-programme-rollout, Property 6: Lesson Reordering Preservation', () => {
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

  it('should preserve lesson order after reordering with no duplicates or losses', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 3, max: 10 }), // Number of lessons
        async (lessonCount) => {
          // Create a programme
          const sdk = new BackendSDK();
          sdk.setTable('programmes');
          const programmeId = await sdk.insert({
            name: 'Test Programme',
            start_date: '2026-03-01',
            created_by: testUserId,
            type: 'structured',
            status: 'active',
          });

          // Create a week
          const week = await ContentService.createWeek(programmeId, {
            week_number: 1,
            title: 'Test Week',
            start_date: '2026-03-01',
          });

          // Create lessons with initial order
          const lessonIds = [];
          for (let i = 0; i < lessonCount; i++) {
            const lesson = await ContentService.createLesson(week.id, {
              title: `Lesson ${i + 1}`,
              description: `Description ${i + 1}`,
              content_type: 'video',
              content_url: `https://example.com/video${i + 1}`,
              order_index: i,
            });
            lessonIds.push(lesson.id);
          }

          // Generate a new random order
          const newOrder = [...lessonIds].sort(() => Math.random() - 0.5);

          // Reorder lessons
          await ContentService.reorderLessons(week.id, newOrder);

          // Retrieve lessons
          const retrievedLessons = await ContentService.getWeekLessons(week.id);

          // Verify: Same count (no losses or duplicates)
          expect(retrievedLessons.length).toBe(lessonCount);

          // Verify: All original lessons present (no losses)
          const retrievedIds = retrievedLessons.map(l => l.id);
          lessonIds.forEach(id => {
            expect(retrievedIds).toContain(id);
          });

          // Verify: No duplicates
          const uniqueIds = new Set(retrievedIds);
          expect(uniqueIds.size).toBe(lessonCount);

          // Verify: Order preserved
          retrievedLessons.forEach((lesson, index) => {
            expect(lesson.id).toBe(newOrder[index]);
            expect(lesson.order_index).toBe(index);
          });

          // Cleanup
          await cleanupTestData('lessons', { week_id: week.id });
          await cleanupTestData('weeks', { id: week.id });
          await cleanupTestData('programmes', { id: programmeId });
        }
      ),
      { numRuns: 10 }
    );
  });
});
