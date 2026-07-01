/**
 * Property-Based Test: External Content URL Storage
 * Feature: wlimp-programme-rollout
 * Property 5: External Content URL Storage
 * 
 * **Validates: Requirements 1.5**
 * 
 * For any valid URL (YouTube, Drive, PDF, Zoom), creating a lesson with that URL
 * should preserve the exact URL string when retrieved.
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

describe('Feature: wlimp-programme-rollout, Property 5: External Content URL Storage', () => {
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

  it('should preserve exact URL string for any valid URL', async () => {
    // Generate various types of URLs
    const urlArb = fc.oneof(
      // YouTube URLs
      fc.tuple(
        fc.constant('https://www.youtube.com/watch?v='),
        fc.stringOf(
          fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_'),
          { minLength: 11, maxLength: 11 }
        )
      ).map(([prefix, id]) => prefix + id),
      
      // YouTube short URLs
      fc.tuple(
        fc.constant('https://youtu.be/'),
        fc.stringOf(
          fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_'),
          { minLength: 11, maxLength: 11 }
        )
      ).map(([prefix, id]) => prefix + id),
      
      // Google Drive URLs
      fc.tuple(
        fc.constant('https://drive.google.com/file/d/'),
        fc.stringOf(
          fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_'),
          { minLength: 20, maxLength: 40 }
        ),
        fc.constant('/view')
      ).map(([prefix, id, suffix]) => prefix + id + suffix),
      
      // PDF URLs
      fc.webUrl().map(url => url + '/document.pdf'),
      
      // Zoom URLs
      fc.tuple(
        fc.constant('https://zoom.us/rec/share/'),
        fc.stringOf(
          fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_'),
          { minLength: 20, maxLength: 40 }
        )
      ).map(([prefix, id]) => prefix + id),
      
      // Generic HTTPS URLs
      fc.webUrl({ validSchemes: ['https'] })
    );

    const createdProgrammeIds = [];
    const createdWeekIds = [];
    const createdLessonIds = [];

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          url: urlArb,
          content_type: fc.constantFrom('video', 'link', 'pdf'),
        }),
        async ({ url, content_type }) => {
          const sdk = new BackendSDK();

          // Create a programme
          sdk.setTable('programmes');
          const programmeId = await sdk.insert({
            community_id: testCommunityId,
            name: `Test Programme ${Date.now()}_${Math.random()}`,
            description: 'Test programme for URL storage',
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

          // Create a lesson with the URL
          const lessonData = {
            title: `Test Lesson ${Date.now()}`,
            description: 'Test lesson for URL preservation',
            content_type,
            content_url: url,
            order_index: 0,
          };

          const createdLesson = await ContentService.createLesson(weekId, lessonData);
          createdLessonIds.push(createdLesson.id);

          // Property 1: Created lesson should have the exact URL
          expect(createdLesson.content_url).toBe(url);

          // Property 2: Retrieved lesson by ID should have the exact URL
          const lessonById = await ContentService.getLessonById(createdLesson.id);
          expect(lessonById.content_url).toBe(url);

          // Property 3: Retrieved lesson via week should have the exact URL
          const weekLessons = await ContentService.getWeekLessons(weekId);
          const foundLesson = weekLessons.find(l => l.id === createdLesson.id);
          expect(foundLesson.content_url).toBe(url);

          // Property 4: URL should not be modified or truncated
          expect(foundLesson.content_url.length).toBe(url.length);
          expect(foundLesson.content_url).toEqual(url);
        }
      ),
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

  it('should preserve URLs with special characters and query parameters', async () => {
    // Generate URLs with query parameters and special characters
    const urlWithParamsArb = fc.tuple(
      fc.webUrl({ validSchemes: ['https'] }),
      fc.record({
        param1: fc.string({ minLength: 1, maxLength: 20 }),
        param2: fc.integer({ min: 0, max: 1000 }),
      })
    ).map(([baseUrl, params]) => {
      const url = new URL(baseUrl);
      url.searchParams.set('param1', params.param1);
      url.searchParams.set('param2', params.param2.toString());
      return url.toString();
    });

    const createdProgrammeIds = [];
    const createdWeekIds = [];
    const createdLessonIds = [];

    await fc.assert(
      fc.asyncProperty(urlWithParamsArb, async (url) => {
        const sdk = new BackendSDK();

        // Create a programme
        sdk.setTable('programmes');
        const programmeId = await sdk.insert({
          community_id: testCommunityId,
          name: `Test Programme Params ${Date.now()}_${Math.random()}`,
          description: 'Test programme for URL with params',
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

        // Create a lesson with the URL
        const lessonData = {
          title: `Test Lesson Params ${Date.now()}`,
          description: 'Test lesson for URL with parameters',
          content_type: 'link',
          content_url: url,
          order_index: 0,
        };

        const createdLesson = await ContentService.createLesson(weekId, lessonData);
        createdLessonIds.push(createdLesson.id);

        // Property: URL with query parameters should be preserved exactly
        const lessonById = await ContentService.getLessonById(createdLesson.id);
        expect(lessonById.content_url).toBe(url);

        // Verify query parameters are intact
        const retrievedUrl = new URL(lessonById.content_url);
        const originalUrl = new URL(url);
        
        // Check that all query parameters are preserved
        for (const [key, value] of originalUrl.searchParams) {
          expect(retrievedUrl.searchParams.get(key)).toBe(value);
        }
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

  it('should preserve very long URLs', async () => {
    // Generate long URLs (up to 2000 characters)
    const longUrlArb = fc.tuple(
      fc.constant('https://example.com/'),
      fc.stringOf(
        fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_/'),
        { minLength: 100, maxLength: 500 }
      )
    ).map(([prefix, path]) => prefix + path);

    const createdProgrammeIds = [];
    const createdWeekIds = [];
    const createdLessonIds = [];

    await fc.assert(
      fc.asyncProperty(longUrlArb, async (url) => {
        const sdk = new BackendSDK();

        // Create a programme
        sdk.setTable('programmes');
        const programmeId = await sdk.insert({
          community_id: testCommunityId,
          name: `Test Programme Long ${Date.now()}_${Math.random()}`,
          description: 'Test programme for long URLs',
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

        // Create a lesson with the long URL
        const lessonData = {
          title: `Test Lesson Long ${Date.now()}`,
          description: 'Test lesson for long URL',
          content_type: 'link',
          content_url: url,
          order_index: 0,
        };

        const createdLesson = await ContentService.createLesson(weekId, lessonData);
        createdLessonIds.push(createdLesson.id);

        // Property: Long URL should be preserved without truncation
        const lessonById = await ContentService.getLessonById(createdLesson.id);
        expect(lessonById.content_url).toBe(url);
        expect(lessonById.content_url.length).toBe(url.length);
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

  it('should handle URL updates while preserving exact string', async () => {
    const sdk = new BackendSDK();

    // Create a programme
    sdk.setTable('programmes');
    const programmeId = await sdk.insert({
      community_id: testCommunityId,
      name: `Test Programme Update ${Date.now()}`,
      description: 'Test programme for URL updates',
      start_date: new Date(),
      type: 'structured',
      created_by: testUserId,
      status: 'active',
    });

    // Create a week
    sdk.setTable('weeks');
    const weekId = await sdk.insert({
      programme_id: programmeId,
      week_number: 1,
      title: 'Week 1',
      start_date: new Date(),
    });

    // Create a lesson with initial URL
    const initialUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const lesson = await ContentService.createLesson(weekId, {
      title: 'Test Lesson Update',
      description: 'Test lesson for URL update',
      content_type: 'video',
      content_url: initialUrl,
      order_index: 0,
    });

    // Update the URL
    const newUrl = 'https://drive.google.com/file/d/1234567890abcdefghij/view';
    await ContentService.updateLesson(lesson.id, {
      content_url: newUrl,
    });

    // Property: Updated URL should be preserved exactly
    const updatedLesson = await ContentService.getLessonById(lesson.id);
    expect(updatedLesson.content_url).toBe(newUrl);
    expect(updatedLesson.content_url).not.toBe(initialUrl);

    // Clean up
    await cleanupTestData('lessons', { id: lesson.id });
    await cleanupTestData('weeks', { id: weekId });
    await cleanupTestData('programmes', { id: programmeId });
  });
});
