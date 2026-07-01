/**
 * Property-Based Test: Feed Pagination
 * Feature: learner-experience-complete
 * Property 25: Feed pagination
 * 
 * **Validates: Requirements 7.18**
 * 
 * For any community feed with more than 20 posts, the system should paginate results showing 20 posts per page
 */

const fc = require('fast-check');
const CommunityService = require('../../services/CommunityService');
const {
  setupTestDatabase,
  teardownTestDatabase,
} = require('../helpers/testSetup');
const db = require('../../models');

describe('Feature: learner-experience-complete, Property 25: Feed pagination', () => {
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

  it('should paginate feeds with more than 20 posts showing 20 posts per page', async () => {
    // Generator for total post count (21 to 100 posts to test pagination)
    const totalPostCountArb = fc.integer({ min: 21, max: 100 });

    await fc.assert(
      fc.asyncProperty(
        totalPostCountArb,
        async (totalPostCount) => {
          // Create posts
          const createdPosts = [];
          for (let i = 0; i < totalPostCount; i++) {
            const post = await db.cohort_posts.create({
              cohort_id: testCohort.id,
              user_id: testUser.id,
              content: `Test post ${i + 1}`,
              createdAt: new Date(Date.now() - (totalPostCount - i) * 1000), // Ensure chronological order
            });
            createdPosts.push(post);
          }

          // Get first page
          const page1 = await CommunityService.getCohortPosts(
            testCohort.id,
            testUser.id,
            1,
            20
          );

          // Verify first page has exactly 20 posts
          if (page1.posts.length !== 20) {
            throw new Error(
              `First page should have 20 posts, but got ${page1.posts.length}`
            );
          }

          // Verify hasMore is true when there are more posts
          if (page1.hasMore !== true) {
            throw new Error(
              `hasMore should be true when total posts (${totalPostCount}) > 20`
            );
          }

          // Verify total count is accurate
          if (page1.total !== totalPostCount) {
            throw new Error(
              `Total count should be ${totalPostCount}, but got ${page1.total}`
            );
          }

          // Calculate expected number of pages
          const expectedPages = Math.ceil(totalPostCount / 20);

          // Test all pages
          let allPostsRetrieved = [];
          for (let pageNum = 1; pageNum <= expectedPages; pageNum++) {
            const page = await CommunityService.getCohortPosts(
              testCohort.id,
              testUser.id,
              pageNum,
              20
            );

            // Verify page size
            const expectedPageSize = pageNum === expectedPages
              ? totalPostCount - (expectedPages - 1) * 20
              : 20;

            if (page.posts.length !== expectedPageSize) {
              throw new Error(
                `Page ${pageNum} should have ${expectedPageSize} posts, but got ${page.posts.length}`
              );
            }

            // Verify hasMore flag
            const expectedHasMore = pageNum < expectedPages;
            if (page.hasMore !== expectedHasMore) {
              throw new Error(
                `Page ${pageNum} hasMore should be ${expectedHasMore}, but got ${page.hasMore}`
              );
            }

            // Verify total count is consistent across pages
            if (page.total !== totalPostCount) {
              throw new Error(
                `Page ${pageNum} total count should be ${totalPostCount}, but got ${page.total}`
              );
            }

            // Collect posts
            allPostsRetrieved.push(...page.posts);
          }

          // Verify all posts were retrieved exactly once
          if (allPostsRetrieved.length !== totalPostCount) {
            throw new Error(
              `Should retrieve ${totalPostCount} posts total, but got ${allPostsRetrieved.length}`
            );
          }

          // Verify no duplicate posts across pages
          const postIds = allPostsRetrieved.map(p => p.id);
          const uniquePostIds = new Set(postIds);
          if (uniquePostIds.size !== totalPostCount) {
            throw new Error(
              `Found duplicate posts across pages: ${postIds.length} posts but only ${uniquePostIds.size} unique IDs`
            );
          }

          return true;
        }
      ),
      {
        numRuns: 100,
        timeout: 60000,
      }
    );
  });

  it('should handle feeds with exactly 20 posts (no pagination needed)', async () => {
    // Create exactly 20 posts
    for (let i = 0; i < 20; i++) {
      await db.cohort_posts.create({
        cohort_id: testCohort.id,
        user_id: testUser.id,
        content: `Test post ${i + 1}`,
      });
    }

    // Get first page
    const page1 = await CommunityService.getCohortPosts(
      testCohort.id,
      testUser.id,
      1,
      20
    );

    // Verify page has exactly 20 posts
    if (page1.posts.length !== 20) {
      throw new Error(
        `Page should have 20 posts, but got ${page1.posts.length}`
      );
    }

    // Verify hasMore is false (no more pages)
    if (page1.hasMore !== false) {
      throw new Error('hasMore should be false when total posts equals page size');
    }

    // Verify total count
    if (page1.total !== 20) {
      throw new Error(`Total count should be 20, but got ${page1.total}`);
    }
  });

  it('should handle feeds with fewer than 20 posts (no pagination)', async () => {
    // Generator for post count less than 20
    const postCountArb = fc.integer({ min: 1, max: 19 });

    await fc.assert(
      fc.asyncProperty(
        postCountArb,
        async (postCount) => {
          // Create posts
          for (let i = 0; i < postCount; i++) {
            await db.cohort_posts.create({
              cohort_id: testCohort.id,
              user_id: testUser.id,
              content: `Test post ${i + 1}`,
            });
          }

          // Get first page
          const page1 = await CommunityService.getCohortPosts(
            testCohort.id,
            testUser.id,
            1,
            20
          );

          // Verify page has all posts
          if (page1.posts.length !== postCount) {
            throw new Error(
              `Page should have ${postCount} posts, but got ${page1.posts.length}`
            );
          }

          // Verify hasMore is false
          if (page1.hasMore !== false) {
            throw new Error(
              `hasMore should be false when total posts (${postCount}) < 20`
            );
          }

          // Verify total count
          if (page1.total !== postCount) {
            throw new Error(
              `Total count should be ${postCount}, but got ${page1.total}`
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

  it('should handle empty feed correctly', async () => {
    // No posts created
    const result = await CommunityService.getCohortPosts(
      testCohort.id,
      testUser.id,
      1,
      20
    );

    // Verify empty results
    if (result.posts.length !== 0) {
      throw new Error(`Expected 0 posts, but got ${result.posts.length}`);
    }

    if (result.hasMore !== false) {
      throw new Error('hasMore should be false for empty feed');
    }

    if (result.total !== 0) {
      throw new Error(`Total count should be 0, but got ${result.total}`);
    }
  });

  it('should maintain consistent pagination with custom page sizes', async () => {
    // Generator for scenarios with different page sizes
    const paginationScenarioArb = fc.record({
      totalPosts: fc.integer({ min: 25, max: 60 }),
      pageSize: fc.integer({ min: 5, max: 15 }),
    });

    await fc.assert(
      fc.asyncProperty(
        paginationScenarioArb,
        async ({ totalPosts, pageSize }) => {
          // Create posts
          for (let i = 0; i < totalPosts; i++) {
            await db.cohort_posts.create({
              cohort_id: testCohort.id,
              user_id: testUser.id,
              content: `Test post ${i + 1}`,
              createdAt: new Date(Date.now() - (totalPosts - i) * 1000),
            });
          }

          // Calculate expected pages
          const expectedPages = Math.ceil(totalPosts / pageSize);

          // Retrieve all pages
          let allPosts = [];
          for (let pageNum = 1; pageNum <= expectedPages; pageNum++) {
            const page = await CommunityService.getCohortPosts(
              testCohort.id,
              testUser.id,
              pageNum,
              pageSize
            );

            // Verify page size
            const expectedPageSize = pageNum === expectedPages
              ? totalPosts - (expectedPages - 1) * pageSize
              : pageSize;

            if (page.posts.length !== expectedPageSize) {
              throw new Error(
                `Page ${pageNum} with page size ${pageSize} should have ${expectedPageSize} posts, but got ${page.posts.length}`
              );
            }

            // Verify hasMore
            const expectedHasMore = pageNum < expectedPages;
            if (page.hasMore !== expectedHasMore) {
              throw new Error(
                `Page ${pageNum} hasMore should be ${expectedHasMore}, but got ${page.hasMore}`
              );
            }

            allPosts.push(...page.posts);
          }

          // Verify all posts retrieved
          if (allPosts.length !== totalPosts) {
            throw new Error(
              `Should retrieve ${totalPosts} posts, but got ${allPosts.length}`
            );
          }

          // Verify no duplicates
          const uniqueIds = new Set(allPosts.map(p => p.id));
          if (uniqueIds.size !== totalPosts) {
            throw new Error('Found duplicate posts across pages');
          }

          return true;
        }
      ),
      {
        numRuns: 100,
        timeout: 60000,
      }
    );
  });

  it('should handle requesting page beyond available pages', async () => {
    // Create 25 posts (2 pages with page size 20)
    for (let i = 0; i < 25; i++) {
      await db.cohort_posts.create({
        cohort_id: testCohort.id,
        user_id: testUser.id,
        content: `Test post ${i + 1}`,
      });
    }

    // Request page 3 (beyond available pages)
    const page3 = await CommunityService.getCohortPosts(
      testCohort.id,
      testUser.id,
      3,
      20
    );

    // Verify empty results
    if (page3.posts.length !== 0) {
      throw new Error(
        `Page beyond available pages should have 0 posts, but got ${page3.posts.length}`
      );
    }

    // Verify hasMore is false
    if (page3.hasMore !== false) {
      throw new Error('hasMore should be false for page beyond available pages');
    }

    // Verify total count is still accurate
    if (page3.total !== 25) {
      throw new Error(`Total count should be 25, but got ${page3.total}`);
    }
  });

  it('should maintain reverse chronological order across all pages', async () => {
    // Create 45 posts with specific timestamps
    const posts = [];
    for (let i = 0; i < 45; i++) {
      const post = await db.cohort_posts.create({
        cohort_id: testCohort.id,
        user_id: testUser.id,
        content: `Test post ${i + 1}`,
        createdAt: new Date(Date.now() - (45 - i) * 1000), // Older posts have earlier timestamps
      });
      posts.push(post);
    }

    // Get all pages
    const page1 = await CommunityService.getCohortPosts(
      testCohort.id,
      testUser.id,
      1,
      20
    );

    const page2 = await CommunityService.getCohortPosts(
      testCohort.id,
      testUser.id,
      2,
      20
    );

    const page3 = await CommunityService.getCohortPosts(
      testCohort.id,
      testUser.id,
      3,
      20
    );

    // Combine all posts
    const allRetrievedPosts = [...page1.posts, ...page2.posts, ...page3.posts];

    // Verify reverse chronological order
    for (let i = 0; i < allRetrievedPosts.length - 1; i++) {
      const currentTime = new Date(allRetrievedPosts[i].createdAt).getTime();
      const nextTime = new Date(allRetrievedPosts[i + 1].createdAt).getTime();

      if (currentTime < nextTime) {
        throw new Error(
          `Posts not in reverse chronological order across pages: ` +
          `Post at index ${i} (${allRetrievedPosts[i].createdAt}) is older than ` +
          `post at index ${i + 1} (${allRetrievedPosts[i + 1].createdAt})`
        );
      }
    }

    // Verify page boundaries maintain order
    if (page1.posts.length > 0 && page2.posts.length > 0) {
      const lastPage1Time = new Date(page1.posts[page1.posts.length - 1].createdAt).getTime();
      const firstPage2Time = new Date(page2.posts[0].createdAt).getTime();

      if (lastPage1Time < firstPage2Time) {
        throw new Error('Pagination breaks chronological order between page 1 and 2');
      }
    }

    if (page2.posts.length > 0 && page3.posts.length > 0) {
      const lastPage2Time = new Date(page2.posts[page2.posts.length - 1].createdAt).getTime();
      const firstPage3Time = new Date(page3.posts[0].createdAt).getTime();

      if (lastPage2Time < firstPage3Time) {
        throw new Error('Pagination breaks chronological order between page 2 and 3');
      }
    }
  });
});
