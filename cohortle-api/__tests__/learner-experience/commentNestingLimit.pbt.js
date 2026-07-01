/**
 * Property-Based Test: Comment Nesting Limit
 * Feature: learner-experience-complete
 * Property 21: Comment nesting limit
 * 
 * **Validates: Requirements 5.9**
 * 
 * For any comment thread, replies should be limited to a maximum depth of 2 levels
 */

const fc = require('fast-check');
const BackendSDK = require('../../core/BackendSDK');
const CommentService = require('../../services/CommentService');
const {
  setupTestDatabase,
  teardownTestDatabase,
  cleanupTestData,
  createTestCommunity,
  createTestUser,
} = require('../helpers/testSetup');

describe('Feature: learner-experience-complete, Property 21: Comment nesting limit', () => {
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

  it('should allow replies to root comments (depth 1) but reject replies to replies (depth 2)', async () => {
    const commentTextArb = fc.string({ minLength: 1, maxLength: 500 });

    const createdProgrammeIds = [];
    const createdWeekIds = [];
    const createdLessonIds = [];
    const createdCommentIds = [];
    const createdUserIds = [];

    await fc.assert(
      fc.asyncProperty(
        commentTextArb,
        commentTextArb,
        commentTextArb,
        async (rootCommentText, replyText, nestedReplyText) => {
          const sdk = new BackendSDK();

          sdk.setTable('users');
          const userId = await sdk.insert({
            username: `testuser_${Date.now()}_${Math.random()}`,
            email: `test_${Date.now()}_${Math.random()}@example.com`,
            password: 'test_password_hash',
            role: 'learner',
          });
          createdUserIds.push(userId);

          sdk.setTable('programmes');
          const programmeId = await sdk.insert({
            community_id: testCommunityId,
            name: `Test Programme ${Date.now()}`,
            description: 'Test programme for comment nesting',
            start_date: new Date('2025-01-01'),
            type: 'structured',
            created_by: testUserId,
            status: 'active',
          });
          createdProgrammeIds.push(programmeId);

          sdk.setTable('weeks');
          const weekId = await sdk.insert({
            programme_id: programmeId,
            week_number: 1,
            title: 'Test Week',
            start_date: new Date('2025-01-01'),
          });
          createdWeekIds.push(weekId);

          sdk.setTable('lessons');
          const lessonId = await sdk.insert({
            week_id: weekId,
            title: 'Test Lesson',
            type: 'text',
            content_text: 'Test lesson content',
            order_index: 1,
          });
          createdLessonIds.push(lessonId);

          try {
            const rootComment = await CommentService.createComment(
              lessonId,
              userId,
              rootCommentText.trim() || 'Root comment',
              null
            );
            createdCommentIds.push(rootComment.id);

            const reply = await CommentService.createComment(
              lessonId,
              userId,
              replyText.trim() || 'Reply to root',
              rootComment.id
            );
            createdCommentIds.push(reply.id);

            let nestedReplyFailed = false;
            try {
              await CommentService.createComment(
                lessonId,
                userId,
                nestedReplyText.trim() || 'Nested reply',
                reply.id
              );
            } catch (error) {
              if (error.message.includes('Maximum nesting depth')) {
                nestedReplyFailed = true;
              }
            }

            if (!nestedReplyFailed) {
              throw new Error('Expected nested reply to be rejected but it was allowed');
            }

            return true;
          } finally {
            for (const commentId of createdCommentIds.reverse()) {
              await cleanupTestData('lesson_comments', { id: commentId });
            }
            createdCommentIds.length = 0;

            for (const id of createdLessonIds.reverse()) {
              await cleanupTestData('lessons', { id: id });
            }
            createdLessonIds.length = 0;

            for (const id of createdWeekIds.reverse()) {
              await cleanupTestData('weeks', { id: id });
            }
            createdWeekIds.length = 0;

            for (const id of createdProgrammeIds.reverse()) {
              await cleanupTestData('programmes', { id: id });
            }
            createdProgrammeIds.length = 0;

            for (const id of createdUserIds.reverse()) {
              await cleanupTestData('users', { id: id });
            }
            createdUserIds.length = 0;
          }
        }
      ),
      {
        numRuns: 10,
        timeout: 30000,
      }
    );
  });
});
