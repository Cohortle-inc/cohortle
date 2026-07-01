/**
 * Property-Based Test: Community Feed Reverse Chronological Order
 * Feature: learner-experience-complete
 * Property 14: Community feed reverse chronological order
 * 
 * **Validates: Requirements 7.3**
 * 
 * For any set of posts in a community feed, they should be displayed in reverse chronological order (newest first)
 */

const fc = require('fast-check');
const CommunityService = require('../../services/CommunityService');
const {
  setupTestDatabase,
  teardownTestDatabase,
} = require('../helpers/testSetup');
const db = require('../../models');

describe('Feature: learner-experience-complete, Property 14: Community feed reverse chronological order', () => {
  let testUser;
  let testCohort;

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

    // Create test programme and cohort
    const programme = await db.programmes.create({
      name: 'Test Programme',
      description: 'Test Description',
    });

    testCohort = await db.cohorts.create({
      programme_id: programme.id,
      name: 'Test Cohort',
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      enrollment_code: 'TEST123',
    });

    // Enroll user in cohort
    await db.enrollments.create({
      user_id: testUser.id,
      cohort_id: testCohort.id,
    });
  });

  afterAll(async () => {
    // Clean up test data
    await db.cohort_posts.destroy({ where: {} });
    await db.enrollments.destroy({ where: {} });
    await db.cohorts.destroy({ where: {} });
    await db.programmes.destroy({ where: {} });
    await db.users.destroy({ where: { id: testUser.id } });
    await teardownTestDatabase();
  });

  afterEach(async () => {
    // Clean up posts after each test
    await db.cohort_posts.destroy({ where: { cohort_id: testCohort.id } });
  });

  it('should return posts in reverse chronological order (newest first)', async () => {
    // Generator for a set of posts with different timestamps
    const postSetArb = fc.array(
      fc.record({
        content: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        // Generate timestamps within a reasonable range (last 30 days)
        timestamp: fc.date({ 
          min: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          max: new Date()
        }),
      }),
      { minLength: 2, maxLength: 10 } // Test with 2-10 posts
    );

    await fc.assert(
      fc.asyncProperty(
        postSetArb,
        async (postSpecs) => {
          // Create posts with specified timestamps
          const createdPosts = [];
          for (const spec of postSpecs) {
            const post = await db.cohort_posts.create({
              cohort_id: testCohort.id,
              user_id: testUser.id,
              content: spec.content.trim(),
              createdAt: spec.timestamp,
              updatedAt: spec.timestamp,
            });
            createdPosts.push({
              id: post.id,
              timestamp: spec.timestamp,
            });
          }

          // Retrieve posts using CommunityService
          const result = await CommunityService.getCohortPosts(
            testCohort.id,
            testUser.id,
            1,
            100 // Get all posts
          );

          // Verify posts are in reverse chronological order
          for (let i = 0; i < result.posts.length - 1; i++) {
            const currentPost = result.posts[i];
            const nextPost = result.posts[i + 1];
            
            const currentTime = new Date(currentPost.createdAt).getTime();
            const nextTime = new Date(nextPost.createdAt).getTime();

            if (currentTime < nextTime) {
              throw new Error(
                `Posts not in reverse chronological order: ` +
                `Post at index ${i} (${currentPost.createdAt}) is older than ` +
                `post at index ${i + 1} (${nextPost.createdAt})`
              );
            }
          }

          // Verify all created posts are returned
          if (result.posts.length !== createdPosts.length) {
            throw new Error(
              `Expected ${createdPosts.length} posts, but got ${result.posts.length}`
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

  it('should handle posts with identical timestamps', async () => {
    // Generator for posts with the same timestamp
    const sameTimestampPostsArb = fc.record({
      timestamp: fc.date({ 
        min: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        max: new Date()
      }),
      postCount: fc.integer({ min: 2, max: 5 }),
    });

    await fc.assert(
      fc.asyncProperty(
        sameTimestampPostsArb,
        async ({ timestamp, postCount }) => {
          // Create multiple posts with the same timestamp
          const createdPosts = [];
          for (let i = 0; i < postCount; i++) {
            const post = await db.cohort_posts.create({
              cohort_id: testCohort.id,
              user_id: testUser.id,
              content: `Post ${i + 1}`,
              createdAt: timestamp,
              updatedAt: timestamp,
            });
            createdPosts.push(post);
          }

          // Retrieve posts using CommunityService
          const result = await CommunityService.getCohortPosts(
            testCohort.id,
            testUser.id,
            1,
            100
          );

          // Verify all posts are returned
          if (result.posts.length !== postCount) {
            throw new Error(
              `Expected ${postCount} posts, but got ${result.posts.length}`
            );
          }

          // Verify all posts have the same timestamp
          const allSameTimestamp = result.posts.every(
            post => new Date(post.createdAt).getTime() === timestamp.getTime()
          );

          if (!allSameTimestamp) {
            throw new Error('Not all posts have the expected timestamp');
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

  it('should maintain reverse chronological order across pagination', async () => {
    // Generator for a larger set of posts to test pagination
    const largePostSetArb = fc.array(
      fc.record({
        content: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        timestamp: fc.date({ 
          min: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          max: new Date()
        }),
      }),
      { minLength: 25, maxLength: 30 } // Create more posts than page size
    );

    await fc.assert(
      fc.asyncProperty(
        largePostSetArb,
        async (postSpecs) => {
          // Create posts with specified timestamps
          for (const spec of postSpecs) {
            await db.cohort_posts.create({
              cohort_id: testCohort.id,
              user_id: testUser.id,
              content: spec.content.trim(),
              createdAt: spec.timestamp,
              updatedAt: spec.timestamp,
            });
          }

          // Retrieve first page
          const page1 = await CommunityService.getCohortPosts(
            testCohort.id,
            testUser.id,
            1,
            20
          );

          // Retrieve second page
          const page2 = await CommunityService.getCohortPosts(
            testCohort.id,
            testUser.id,
            2,
            20
          );

          // Verify first page is sorted
          for (let i = 0; i < page1.posts.length - 1; i++) {
            const currentTime = new Date(page1.posts[i].createdAt).getTime();
            const nextTime = new Date(page1.posts[i + 1].createdAt).getTime();

            if (currentTime < nextTime) {
              throw new Error('Page 1 posts not in reverse chronological order');
            }
          }

          // Verify second page is sorted
          for (let i = 0; i < page2.posts.length - 1; i++) {
            const currentTime = new Date(page2.posts[i].createdAt).getTime();
            const nextTime = new Date(page2.posts[i + 1].createdAt).getTime();

            if (currentTime < nextTime) {
              throw new Error('Page 2 posts not in reverse chronological order');
            }
          }

          // Verify last post of page 1 is newer than or equal to first post of page 2
          if (page1.posts.length > 0 && page2.posts.length > 0) {
            const lastPage1Time = new Date(page1.posts[page1.posts.length - 1].createdAt).getTime();
            const firstPage2Time = new Date(page2.posts[0].createdAt).getTime();

            if (lastPage1Time < firstPage2Time) {
              throw new Error(
                'Pagination breaks chronological order: ' +
                `Last post of page 1 (${page1.posts[page1.posts.length - 1].createdAt}) ` +
                `is older than first post of page 2 (${page2.posts[0].createdAt})`
              );
            }
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

  it('should handle empty feed correctly', async () => {
    // No posts created - feed should be empty
    const result = await CommunityService.getCohortPosts(
      testCohort.id,
      testUser.id,
      1,
      20
    );

    if (result.posts.length !== 0) {
      throw new Error(`Expected empty feed, but got ${result.posts.length} posts`);
    }

    if (result.total !== 0) {
      throw new Error(`Expected total count of 0, but got ${result.total}`);
    }

    if (result.hasMore !== false) {
      throw new Error('Expected hasMore to be false for empty feed');
    }
  });
});
