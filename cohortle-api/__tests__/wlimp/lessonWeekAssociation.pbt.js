/**
 * Property-Based Test: Lesson-Week Association
 * Feature: wlimp-programme-rollout
 * Property 4: Lesson-Week Association
 * 
 * **Validates: Requirements 1.4**
 * 
 * For any week and lesson data, creating a lesson assigned to that week should result
 * in the lesson being retrievable via the week ID with the correct association.
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

describe('Feature: wlimp-programme-rollout, Property 4: Lesson-Week Association', () => {
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

  it('should preserve lesson-week association after creation and retrieval', async () => {
    // Arbitraries for lesson data
    const lessonDataArb = fc.record({
      title: fc.string({ minLength: 1, maxLength: 255 }),
      description: fc.option(fc.string({ maxLength: 1000 }), { nil: null }),
      content_type: fc.constantFrom('video', 'link', 'pdf'),
      content_url: fc.webUrl(),
      order_index: fc.integer({ min: 0, max: 100 }),
    });

    const createdProgrammeIds = [];
    const createdWeekIds = [];
    const createdLessonIds = [];

    await fc.assert(
      fc.asyncProperty(lessonDataArb, async (lessonData) => {
        const sdk = new BackendSDK();

        // Create a programme
        sdk.setTable('programmes');
        const programmeId = await sdk.insert({
          community_id: testCommunityId,
          name: `Test Programme ${Date.now()}_${Math.random()}`,
          description: 'Test programme for lesson-week association',
          start_date: new Date(),
          type: 'structured',
          created_by: testUserId,
          status: 'active',
        });
        createdProgrammeIds.push(programmeId);

        // Create a week
        sdk.setTable('weeks');
        const weekId = await sdk.insert({
          programme_id: programmeId,
          week_number: 1,
          title: 'Week 1',
          start_date: new Date(),
        });
        createdWeekIds.push(weekId);

        // Create a lesson using ContentService
        const createdLesson = await ContentService.createLesson(weekId, lessonData);
        createdLessonIds.push(createdLesson.id);

        // Property 1: Lesson should have the correct week_id
        expect(createdLesson.week_id).toBe(weekId);

        // Property 2: Lesson should be retrievable via week ID
        const weekLessons = await ContentService.getWeekLessons(weekId);
        const foundLesson = weekLessons.find(l => l.id === createdLesson.id);
        expect(foundLesson).toBeDefined();

        // Property 3: Retrieved lesson should have the same week_id
        expect(foundLesson.week_id).toBe(weekId);

        // Property 4: Lesson data should be preserved
        expect(foundLesson.title).toBe(lessonData.title);
        expect(foundLesson.description).toBe(lessonData.description);
        expect(foundLesson.content_type).toBe(lessonData.content_type);
        expect(foundLesson.content_url).toBe(lessonData.content_url);
        expect(foundLesson.order_index).toBe(lessonData.order_index);

        // Property 5: Lesson should be retrievable by ID with week association
        const lessonById = await ContentService.getLessonById(createdLesson.id);
        expect(lessonById.week_id).toBe(weekId);
        expect(lessonById.week).toBeDefined();
        expect(lessonById.week.id).toBe(weekId);
      }),
      { numRuns: 20 }
    );

    // Clean up all created data
    for (const lessonId of createdLessonIds) {
      await cleanupTestData('lessons', { id: lessonId });
    }
    for (const weekId of createdWeekIds) {
      await cleanupTestData('weeks', { id: weekId });
    }
    for (const programmeId of createdProgrammeIds) {
      await cleanupTestData('programmes', { id: programmeId });
    }
  });

  it('should maintain association when multiple lessons are created for the same week', async () => {
    // Generate multiple lessons for the same week
    const lessonsArb = fc.array(
      fc.record({
        title: fc.string({ minLength: 1, maxLength: 255 }),
        description: fc.option(fc.string({ maxLength: 1000 }), { nil: null }),
        content_type: fc.constantFrom('video', 'link', 'pdf'),
        content_url: fc.webUrl(),
        order_index: fc.integer({ min: 0, max: 100 }),
      }),
      { minLength: 2, maxLength: 10 }
    );

    const createdProgrammeIds = [];
    const createdWeekIds = [];
    const createdLessonIds = [];

    await fc.assert(
      fc.asyncProperty(lessonsArb, async (lessonsData) => {
        const sdk = new BackendSDK();

        // Create a programme
        sdk.setTable('programmes');
        const programmeId = await sdk.insert({
          community_id: testCommunityId,
          name: `Test Programme Multi ${Date.now()}_${Math.random()}`,
          description: 'Test programme for multiple lessons',
          start_date: new Date(),
          type: 'structured',
          created_by: testUserId,
          status: 'active',
        });
        createdProgrammeIds.push(programmeId);

        // Create a week
        sdk.setTable('weeks');
        const weekId = await sdk.insert({
          programme_id: programmeId,
          week_number: 1,
          title: 'Week 1',
          start_date: new Date(),
        });
        createdWeekIds.push(weekId);

        // Create multiple lessons
        const createdLessons = [];
        for (const lessonData of lessonsData) {
          const lesson = await ContentService.createLesson(weekId, lessonData);
          createdLessons.push(lesson);
          createdLessonIds.push(lesson.id);
        }

        // Property: All lessons should have the correct week_id
        createdLessons.forEach(lesson => {
          expect(lesson.week_id).toBe(weekId);
        });

        // Property: All lessons should be retrievable via week ID
        const weekLessons = await ContentService.getWeekLessons(weekId);
        expect(weekLessons.length).toBe(createdLessons.length);

        // Property: Each created lesson should be in the week's lessons
        createdLessons.forEach(createdLesson => {
          const foundLesson = weekLessons.find(l => l.id === createdLesson.id);
          expect(foundLesson).toBeDefined();
          expect(foundLesson.week_id).toBe(weekId);
        });
      }),
      { numRuns: 10 }
    );

    // Clean up all created data
    for (const lessonId of createdLessonIds) {
      await cleanupTestData('lessons', { id: lessonId });
    }
    for (const weekId of createdWeekIds) {
      await cleanupTestData('weeks', { id: weekId });
    }
    for (const programmeId of createdProgrammeIds) {
      await cleanupTestData('programmes', { id: programmeId });
    }
  });

  it('should not retrieve lessons from different weeks', async () => {
    const sdk = new BackendSDK();

    // Create a programme
    sdk.setTable('programmes');
    const programmeId = await sdk.insert({
      community_id: testCommunityId,
      name: `Test Programme Isolation ${Date.now()}`,
      description: 'Test programme for week isolation',
      start_date: new Date(),
      type: 'structured',
      created_by: testUserId,
      status: 'active',
    });

    // Create two weeks
    sdk.setTable('weeks');
    const week1Id = await sdk.insert({
      programme_id: programmeId,
      week_number: 1,
      title: 'Week 1',
      start_date: new Date(),
    });

    const week2Id = await sdk.insert({
      programme_id: programmeId,
      week_number: 2,
      title: 'Week 2',
      start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // Create lessons for week 1
    const lesson1 = await ContentService.createLesson(week1Id, {
      title: 'Lesson 1.1',
      description: 'First lesson of week 1',
      content_type: 'video',
      content_url: 'https://example.com/video1',
      order_index: 0,
    });

    // Create lessons for week 2
    const lesson2 = await ContentService.createLesson(week2Id, {
      title: 'Lesson 2.1',
      description: 'First lesson of week 2',
      content_type: 'video',
      content_url: 'https://example.com/video2',
      order_index: 0,
    });

    // Property: Week 1 lessons should not include week 2 lessons
    const week1Lessons = await ContentService.getWeekLessons(week1Id);
    expect(week1Lessons.find(l => l.id === lesson2.id)).toBeUndefined();
    expect(week1Lessons.find(l => l.id === lesson1.id)).toBeDefined();

    // Property: Week 2 lessons should not include week 1 lessons
    const week2Lessons = await ContentService.getWeekLessons(week2Id);
    expect(week2Lessons.find(l => l.id === lesson1.id)).toBeUndefined();
    expect(week2Lessons.find(l => l.id === lesson2.id)).toBeDefined();

    // Clean up
    await cleanupTestData('lessons', { id: lesson1.id });
    await cleanupTestData('lessons', { id: lesson2.id });
    await cleanupTestData('weeks', { id: week1Id });
    await cleanupTestData('weeks', { id: week2Id });
    await cleanupTestData('programmes', { id: programmeId });
  });
});
