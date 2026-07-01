/**
 * Property-Based Test: Like/Unlike Round Trip
 * Feature: learner-experience-complete
 * Property 24: Like/unlike round trip
 * 
 * **Validates: Requirements 7.13**
 * 
 * For any post, liking then immediately unliking should restore the original like count and button state
 */

const fc = require('fast-check');
const CommunityService = require('../../services/CommunityService');
const {
  setupTestDatabase,
  teardownTestDatabase,
} = require('../helpers/testSetup');
const db = require('../../models');

describe('Feature: learner-experience-complete, Property 24: Like/unlike round trip', () => {
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
    // Clean up posts and likes after each test
    await db.post_likes.destroy({ where: {} });
    await db.cohort_posts.destroy({ where: { cohort_id: testCohort.id } });
  });

  it('should restore original like count and button state after like/unlike round trip', async () => {
    // Generator for initial like count (0 to 10 existing likes)
    const initialLikeCountArb = fc.integer({ min: 0, max: 10 });

    await fc.assert(
      fc.asyncProperty(
        initialLikeCountArb,
        async (initialLikeCount) => {
          // Create a post
          const post = await db.cohort_posts.create({
            cohort_id: testCohort.id,
            user_id: testUser.id,
            content: 'Test post for like/unlike round trip',
          });

          // Create initial likes from other users
          const otherUsers = [];
          for (let i = 0; i < initialLikeCount; i++) {
            const otherUser = await db.users.create({
              name: `Other User ${i}`,
              email: `other_${Date.now()}_${i}@example.com`,
              password: 'hashedpassword',
              role: 'learner',
            });
            otherUsers.push(otherUser);

            await db.post_likes.create({
              post_id: post.id,
              user_id: otherUser.id,
            });
          }

          // Get initial state
          const initialState = await CommunityService.getCohortPosts(
            testCohort.id,
            testUser.id,
            1,
            20
          );

          const initialPost = initialState.posts.find(p => p.id === post.id);
          const originalLikeCount = initialPost.likeCount;
          const originalIsLikedByUser = initialPost.isLikedByUser;

          // Verify initial state
          if (originalLikeCount !== initialLikeCount) {
            throw new Error(
              `Initial like count mismatch: expected ${initialLikeCount}, got ${originalLikeCount}`
            );
          }

          if (originalIsLikedByUser !== false) {
            throw new Error('User should not have liked the post initially');
          }

          // Perform like operation
          const likeResult = await CommunityService.likePost(post.id, testUser.id);

          // Verify like was successful
          if (!likeResult.success) {
            throw new Error('Like operation failed');
          }

          if (likeResult.likeCount !== originalLikeCount + 1) {
            throw new Error(
              `Like count after like should be ${originalLikeCount + 1}, got ${likeResult.likeCount}`
            );
          }

          // Get state after like
          const afterLikeState = await CommunityService.getCohortPosts(
            testCohort.id,
            testUser.id,
            1,
            20
          );

          const afterLikePost = afterLikeState.posts.find(p => p.id === post.id);

          if (afterLikePost.likeCount !== originalLikeCount + 1) {
            throw new Error(
              `Like count in feed after like should be ${originalLikeCount + 1}, got ${afterLikePost.likeCount}`
            );
          }

          if (afterLikePost.isLikedByUser !== true) {
            throw new Error('isLikedByUser should be true after liking');
          }

          // Perform unlike operation
          const unlikeResult = await CommunityService.unlikePost(post.id, testUser.id);

          // Verify unlike was successful
          if (!unlikeResult.success) {
            throw new Error('Unlike operation failed');
          }

          if (unlikeResult.likeCount !== originalLikeCount) {
            throw new Error(
              `Like count after unlike should be ${originalLikeCount}, got ${unlikeResult.likeCount}`
            );
          }

          // Get final state after unlike
          const finalState = await CommunityService.getCohortPosts(
            testCohort.id,
            testUser.id,
            1,
            20
          );

          const finalPost = finalState.posts.find(p => p.id === post.id);

          // Verify round trip restored original state
          if (finalPost.likeCount !== originalLikeCount) {
            throw new Error(
              `Final like count should match original (${originalLikeCount}), got ${finalPost.likeCount}`
            );
          }

          if (finalPost.isLikedByUser !== originalIsLikedByUser) {
            throw new Error(
              `Final isLikedByUser should match original (${originalIsLikedByUser}), got ${finalPost.isLikedByUser}`
            );
          }

          // Clean up other users
          for (const otherUser of otherUsers) {
            await db.users.destroy({ where: { id: otherUser.id } });
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

  it('should handle multiple like/unlike round trips idempotently', async () => {
    // Generator for number of round trips (1 to 5)
    const roundTripCountArb = fc.integer({ min: 1, max: 5 });

    await fc.assert(
      fc.asyncProperty(
        roundTripCountArb,
        async (roundTripCount) => {
          // Create a post
          const post = await db.cohort_posts.create({
            cohort_id: testCohort.id,
            user_id: testUser.id,
            content: 'Test post for multiple round trips',
          });

          // Get initial state
          const initialState = await CommunityService.getCohortPosts(
            testCohort.id,
            testUser.id,
            1,
            20
          );

          const initialPost = initialState.posts.find(p => p.id === post.id);
          const originalLikeCount = initialPost.likeCount;
          const originalIsLikedByUser = initialPost.isLikedByUser;

          // Perform multiple like/unlike round trips
          for (let i = 0; i < roundTripCount; i++) {
            // Like
            await CommunityService.likePost(post.id, testUser.id);

            // Unlike
            await CommunityService.unlikePost(post.id, testUser.id);
          }

          // Get final state
          const finalState = await CommunityService.getCohortPosts(
            testCohort.id,
            testUser.id,
            1,
            20
          );

          const finalPost = finalState.posts.find(p => p.id === post.id);

          // Verify state is restored after all round trips
          if (finalPost.likeCount !== originalLikeCount) {
            throw new Error(
              `After ${roundTripCount} round trips, like count should be ${originalLikeCount}, got ${finalPost.likeCount}`
            );
          }

          if (finalPost.isLikedByUser !== originalIsLikedByUser) {
            throw new Error(
              `After ${roundTripCount} round trips, isLikedByUser should be ${originalIsLikedByUser}, got ${finalPost.isLikedByUser}`
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

  it('should handle like/unlike round trip with concurrent likes from other users', async () => {
    // Generator for concurrent operations
    const concurrentScenarioArb = fc.record({
      initialLikes: fc.integer({ min: 0, max: 5 }),
      likesAddedDuringRoundTrip: fc.integer({ min: 0, max: 5 }),
    });

    await fc.assert(
      fc.asyncProperty(
        concurrentScenarioArb,
        async ({ initialLikes, likesAddedDuringRoundTrip }) => {
          // Create a post
          const post = await db.cohort_posts.create({
            cohort_id: testCohort.id,
            user_id: testUser.id,
            content: 'Test post for concurrent likes',
          });

          // Create initial likes
          const initialUsers = [];
          for (let i = 0; i < initialLikes; i++) {
            const user = await db.users.create({
              name: `Initial User ${i}`,
              email: `initial_${Date.now()}_${i}@example.com`,
              password: 'hashedpassword',
              role: 'learner',
            });
            initialUsers.push(user);

            await db.post_likes.create({
              post_id: post.id,
              user_id: user.id,
            });
          }

          // Get initial state for test user
          const initialState = await CommunityService.getCohortPosts(
            testCohort.id,
            testUser.id,
            1,
            20
          );

          const initialPost = initialState.posts.find(p => p.id === post.id);
          const originalIsLikedByUser = initialPost.isLikedByUser;

          // Test user likes the post
          await CommunityService.likePost(post.id, testUser.id);

          // Simulate concurrent likes from other users
          const concurrentUsers = [];
          for (let i = 0; i < likesAddedDuringRoundTrip; i++) {
            const user = await db.users.create({
              name: `Concurrent User ${i}`,
              email: `concurrent_${Date.now()}_${i}@example.com`,
              password: 'hashedpassword',
              role: 'learner',
            });
            concurrentUsers.push(user);

            await db.post_likes.create({
              post_id: post.id,
              user_id: user.id,
            });
          }

          // Test user unlikes the post
          await CommunityService.unlikePost(post.id, testUser.id);

          // Get final state
          const finalState = await CommunityService.getCohortPosts(
            testCohort.id,
            testUser.id,
            1,
            20
          );

          const finalPost = finalState.posts.find(p => p.id === post.id);

          // Verify test user's like status is restored
          if (finalPost.isLikedByUser !== originalIsLikedByUser) {
            throw new Error(
              `Test user's like status should be restored to ${originalIsLikedByUser}, got ${finalPost.isLikedByUser}`
            );
          }

          // Verify like count reflects all operations correctly
          const expectedFinalCount = initialLikes + likesAddedDuringRoundTrip;
          if (finalPost.likeCount !== expectedFinalCount) {
            throw new Error(
              `Final like count should be ${expectedFinalCount} (${initialLikes} initial + ${likesAddedDuringRoundTrip} concurrent), got ${finalPost.likeCount}`
            );
          }

          // Clean up users
          for (const user of [...initialUsers, ...concurrentUsers]) {
            await db.users.destroy({ where: { id: user.id } });
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

  it('should handle unlike operation when post is not liked (idempotent)', async () => {
    // Create a post
    const post = await db.cohort_posts.create({
      cohort_id: testCohort.id,
      user_id: testUser.id,
      content: 'Test post for idempotent unlike',
    });

    // Get initial state
    const initialState = await CommunityService.getCohortPosts(
      testCohort.id,
      testUser.id,
      1,
      20
    );

    const initialPost = initialState.posts.find(p => p.id === post.id);
    const originalLikeCount = initialPost.likeCount;

    // Unlike without liking first (should be idempotent)
    const unlikeResult = await CommunityService.unlikePost(post.id, testUser.id);

    // Verify unlike was successful (idempotent)
    if (!unlikeResult.success) {
      throw new Error('Unlike operation should succeed even when not liked');
    }

    if (unlikeResult.likeCount !== originalLikeCount) {
      throw new Error(
        `Like count should remain ${originalLikeCount}, got ${unlikeResult.likeCount}`
      );
    }

    // Get final state
    const finalState = await CommunityService.getCohortPosts(
      testCohort.id,
      testUser.id,
      1,
      20
    );

    const finalPost = finalState.posts.find(p => p.id === post.id);

    // Verify state unchanged
    if (finalPost.likeCount !== originalLikeCount) {
      throw new Error(
        `Like count should remain ${originalLikeCount}, got ${finalPost.likeCount}`
      );
    }

    if (finalPost.isLikedByUser !== false) {
      throw new Error('isLikedByUser should remain false');
    }
  });

  it('should handle like operation when already liked (idempotent)', async () => {
    // Create a post
    const post = await db.cohort_posts.create({
      cohort_id: testCohort.id,
      user_id: testUser.id,
      content: 'Test post for idempotent like',
    });

    // Like the post
    await CommunityService.likePost(post.id, testUser.id);

    // Get state after first like
    const afterFirstLike = await CommunityService.getCohortPosts(
      testCohort.id,
      testUser.id,
      1,
      20
    );

    const postAfterFirstLike = afterFirstLike.posts.find(p => p.id === post.id);
    const likeCountAfterFirstLike = postAfterFirstLike.likeCount;

    // Like again (should be idempotent)
    const secondLikeResult = await CommunityService.likePost(post.id, testUser.id);

    // Verify like count didn't increase
    if (secondLikeResult.likeCount !== likeCountAfterFirstLike) {
      throw new Error(
        `Like count should remain ${likeCountAfterFirstLike}, got ${secondLikeResult.likeCount}`
      );
    }

    // Get final state
    const finalState = await CommunityService.getCohortPosts(
      testCohort.id,
      testUser.id,
      1,
      20
    );

    const finalPost = finalState.posts.find(p => p.id === post.id);

    // Verify state unchanged
    if (finalPost.likeCount !== likeCountAfterFirstLike) {
      throw new Error(
        `Like count should remain ${likeCountAfterFirstLike}, got ${finalPost.likeCount}`
      );
    }

    if (finalPost.isLikedByUser !== true) {
      throw new Error('isLikedByUser should remain true');
    }
  });
});
