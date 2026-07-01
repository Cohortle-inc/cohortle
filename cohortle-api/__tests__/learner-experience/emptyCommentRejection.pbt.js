/**
 * Property-Based Test: Empty Comment Rejection
 * Feature: learner-experience-complete
 * Property 16: Empty comment rejection
 * 
 * **Validates: Requirements 5.4**
 * 
 * For any string composed entirely of whitespace or empty, submitting it as a comment should be rejected
 */

const fc = require('fast-check');
const CommentService = require('../../services/CommentService');
const {
  setupTestDatabase,
  teardownTestDatabase,
  cleanupTestData,
  createTestUser,
} = require('../helpers/testSetup');
const db = require('../../models');

describe('Feature: learner-experience-complete, Property 16: Empty comment rejection', () => {
  let testUser;
  let testLesson;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await setupTestDatabase();
    
    // Create test user
    testUser = await db.users.create({
      name: 'Test User',
      email: `test_${Date.now()}@example.com`,
      password: 'hashedpassword',
      role: 'learner',
    });

    // Create test programme, cohort, week, and lesson
    const programme = await db.programmes.create({
      name: 'Test Programme',
      description: 'Test Description',
    });

    const week = await db.weeks.create({
      programme_id: programme.id,
      week_number: 1,
      title: 'Test Week',
      start_date: '2024-01-01',
    });

    testLesson = await db.lessons.create({
      week_id: week.id,
      title: 'Test Lesson',
      type: 'text',
      order_index: 1,
    });
  });

  afterAll(async () => {
    // Clean up test data
    await db.lesson_comments.destroy({ where: {} });
    await db.lessons.destroy({ where: {} });
    await db.weeks.destroy({ where: {} });
    await db.programmes.destroy({ where: {} });
    await db.users.destroy({ where: { id: testUser.id } });
    await teardownTestDatabase();
  });

  afterEach(async () => {
    // Clean up comments after each test
    await db.lesson_comments.destroy({ where: {} });
  });

  it('should reject any string composed entirely of whitespace or empty', async () => {
    // Generator for empty and whitespace-only strings
    const emptyOrWhitespaceArb = fc.oneof(
      fc.constant(''),                                    // Empty string
      fc.constant(' '),                                   // Single space
      fc.constant('  '),                                  // Multiple spaces
      fc.constant('\t'),                                  // Tab
      fc.constant('\n'),                                  // Newline
      fc.constant('\r'),                                  // Carriage return
      fc.constant('   \t\n\r   '),                       // Mixed whitespace
      fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1, maxLength: 20 }) // Random whitespace combinations
    );

    await fc.assert(
      fc.asyncProperty(
        emptyOrWhitespaceArb,
        async (commentText) => {
          // Attempt to create a comment with empty/whitespace text
          let wasRejected = false;
          let errorMessage = '';

          try {
            await CommentService.createComment(
              testLesson.id,
              testUser.id,
              commentText,
              null
            );
          } catch (error) {
            wasRejected = true;
            errorMessage = error.message;
          }

          // Verify the comment was rejected
          if (!wasRejected) {
            throw new Error(
              `Expected comment with text "${JSON.stringify(commentText)}" to be rejected, but it was accepted`
            );
          }

          // Verify appropriate error message
          if (!errorMessage.toLowerCase().includes('empty')) {
            throw new Error(
              `Expected error message to mention "empty", but got: "${errorMessage}"`
            );
          }

          return true;
        }
      ),
      {
        numRuns: 100,
        timeout: 30000,
      }
    );
  });

  it('should accept valid non-empty comments (sanity check)', async () => {
    // Generator for valid comment text (non-empty, contains non-whitespace)
    const validCommentArb = fc.string({ minLength: 1, maxLength: 500 })
      .filter(s => s.trim().length > 0); // Ensure at least one non-whitespace character

    await fc.assert(
      fc.asyncProperty(
        validCommentArb,
        async (commentText) => {
          // Attempt to create a comment with valid text
          let comment;
          try {
            comment = await CommentService.createComment(
              testLesson.id,
              testUser.id,
              commentText,
              null
            );
          } catch (error) {
            throw new Error(
              `Expected valid comment with text "${commentText.substring(0, 50)}..." to be accepted, but got error: ${error.message}`
            );
          }

          // Verify the comment was created
          if (!comment || !comment.id) {
            throw new Error('Expected comment to be created with an ID');
          }

          // Verify the text was trimmed and stored correctly
          if (comment.text !== commentText.trim()) {
            throw new Error(
              `Expected comment text to be trimmed. Expected: "${commentText.trim()}", Got: "${comment.text}"`
            );
          }

          // Clean up the created comment
          await db.lesson_comments.destroy({ where: { id: comment.id } });

          return true;
        }
      ),
      {
        numRuns: 100,
        timeout: 30000,
      }
    );
  });
});
