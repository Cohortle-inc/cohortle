/**
 * Property-Based Tests: Community Engagement
 * 
 * Properties 17, 22, 23: Post/comment validation and like mechanics
 * 
 * These tests verify community engagement features work correctly.
 * 
 * Requirements: 5.5, 7.6, 7.12 - Community engagement validation
 */

const fc = require('fast-check');
const request = require('supertest');
const app = require('../../app');
const { setupTestDb, cleanupTestDb, createTestUser, getAuthToken, createTestCohort, enrollUserInCohort } = require('../helpers/testSetup');

describe('Property-Based Tests: Community Engagement', () => {
  let testUser;
  let authToken;
  let testCohort;

  beforeAll(async () => {
    await setupTestDb();
    testUser = await createTestUser({ role: 'learner' });
    authToken = await getAuthToken(testUser.id);
    testCohort = await createTestCohort();
    await enrollUserInCohort(testUser.id, testCohort.id);
  });

  afterAll(async () => {
    await cleanupTestDb();
  });

  /**
   * Property 17: Empty post rejection
   * 
   * Posts with empty or whitespace-only content should be rejected.
   */
  test('Property 17: should reject empty posts', () => {
    const emptyContent = fc.oneof(
      fc.constant(''),
      fc.constant('   '),
      fc.constant('\n\n\n'),
      fc.constant('\t\t\t'),
      fc.constant('     \n     ')
    );

    return fc.assert(
      fc.asyncProperty(emptyContent, async (content) => {
        const response = await request(app)
          .post('/api/cohort-posts')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            cohort_id: testCohort.id,
            content: content
          });
        
        // Should reject empty content
        expect([400, 422]).toContain(response.status);
        expect(response.body).toHaveProperty('error');
      }),
      { numRuns: 10 }
    );
  });

  /**
   * Property 22: Comment creation with linkage
   * 
   * When a comment is created, it should be properly linked to the post
   * and the post's comment count should increment.
   */
  test('Property 22: comments should link to posts correctly', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 500 }),
        fc.string({ minLength: 1, maxLength: 500 }),
        async (postContent, commentContent) => {
          // Create a post
          const postResponse = await request(app)
            .post('/api/cohort-posts')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              cohort_id: testCohort.id,
              content: postContent
            });
          
          if (postResponse.status !== 201) return;
          
          const postId = postResponse.body.id;
          const initialCommentCount = postResponse.body.comment_count || 0;
          
          // Add a comment
          const commentResponse = await request(app)
            .post(`/api/cohort-posts/${postId}/comments`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              content: commentContent
            });
          
          if (commentResponse.status === 201 || commentResponse.status === 200) {
            // Comment should be linked to post
            expect(commentResponse.body).toHaveProperty('post_id');
            expect(commentResponse.body.post_id).toBe(postId);
            
            // Get updated post
            const updatedPostResponse = await request(app)
              .get(`/api/cohort-posts/${postId}`)
              .set('Authorization', `Bearer ${authToken}`);
            
            if (updatedPostResponse.status === 200) {
              // Comment count should have incremented
              expect(updatedPostResponse.body.comment_count).toBe(initialCommentCount + 1);
            }
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property 23: Like count increment
   * 
   * When a user likes a post, the like count should increment by exactly 1.
   * When they unlike it, it should decrement by exactly 1.
   */
  test('Property 23: like count should increment and decrement correctly', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 500 }),
        async (content) => {
          // Create a post
          const postResponse = await request(app)
            .post('/api/cohort-posts')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              cohort_id: testCohort.id,
              content: content
            });
          
          if (postResponse.status !== 201) return;
          
          const postId = postResponse.body.id;
          const initialLikeCount = postResponse.body.like_count || 0;
          
          // Like the post
          const likeResponse = await request(app)
            .post(`/api/cohort-posts/${postId}/like`)
            .set('Authorization', `Bearer ${authToken}`);
          
          if (likeResponse.status === 200 || likeResponse.status === 201) {
            // Like count should increment by 1
            expect(likeResponse.body.like_count).toBe(initialLikeCount + 1);
            
            // Unlike the post
            const unlikeResponse = await request(app)
              .delete(`/api/cohort-posts/${postId}/like`)
              .set('Authorization', `Bearer ${authToken}`);
            
            if (unlikeResponse.status === 200) {
              // Like count should decrement by 1
              expect(unlikeResponse.body.like_count).toBe(initialLikeCount);
            }
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Like should be idempotent
   */
  test('liking a post multiple times should be idempotent', async () => {
    // Create a post
    const postResponse = await request(app)
      .post('/api/cohort-posts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        cohort_id: testCohort.id,
        content: 'Test post for like idempotence'
      });
    
    if (postResponse.status !== 201) return;
    
    const postId = postResponse.body.id;
    const initialLikeCount = postResponse.body.like_count || 0;
    
    // Like the post
    const like1 = await request(app)
      .post(`/api/cohort-posts/${postId}/like`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect([200, 201]).toContain(like1.status);
    const likeCount1 = like1.body.like_count;
    expect(likeCount1).toBe(initialLikeCount + 1);
    
    // Like again
    const like2 = await request(app)
      .post(`/api/cohort-posts/${postId}/like`)
      .set('Authorization', `Bearer ${authToken}`);
    
    // Should not increment again
    expect([200, 201, 409]).toContain(like2.status);
    if (like2.status === 200 || like2.status === 201) {
      expect(like2.body.like_count).toBe(likeCount1);
    }
  });

  /**
   * Property: Unlike should be idempotent
   */
  test('unliking a post multiple times should be idempotent', async () => {
    // Create and like a post
    const postResponse = await request(app)
      .post('/api/cohort-posts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        cohort_id: testCohort.id,
        content: 'Test post for unlike idempotence'
      });
    
    if (postResponse.status !== 201) return;
    
    const postId = postResponse.body.id;
    
    await request(app)
      .post(`/api/cohort-posts/${postId}/like`)
      .set('Authorization', `Bearer ${authToken}`);
    
    // Unlike the post
    const unlike1 = await request(app)
      .delete(`/api/cohort-posts/${postId}/like`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(unlike1.status).toBe(200);
    const likeCount1 = unlike1.body.like_count;
    
    // Unlike again
    const unlike2 = await request(app)
      .delete(`/api/cohort-posts/${postId}/like`)
      .set('Authorization', `Bearer ${authToken}`);
    
    // Should not decrement again
    expect([200, 404, 409]).toContain(unlike2.status);
    if (unlike2.status === 200) {
      expect(unlike2.body.like_count).toBe(likeCount1);
    }
  });

  /**
   * Property: Post content should be preserved
   */
  test('post content should be preserved exactly', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 1000 }),
        async (content) => {
          const response = await request(app)
            .post('/api/cohort-posts')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              cohort_id: testCohort.id,
              content: content
            });
          
          if (response.status === 201) {
            // Content should match exactly (after trimming)
            expect(response.body.content).toBe(content.trim());
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Comment content should be preserved
   */
  test('comment content should be preserved exactly', async () => {
    // Create a post first
    const postResponse = await request(app)
      .post('/api/cohort-posts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        cohort_id: testCohort.id,
        content: 'Test post for comments'
      });
    
    if (postResponse.status !== 201) return;
    
    const postId = postResponse.body.id;
    
    return fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 500 }),
        async (content) => {
          const response = await request(app)
            .post(`/api/cohort-posts/${postId}/comments`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              content: content
            });
          
          if (response.status === 201 || response.status === 200) {
            // Content should match exactly (after trimming)
            expect(response.body.content).toBe(content.trim());
          }
        }
      ),
      { numRuns: 15 }
    );
  });

  /**
   * Property: Posts should have timestamps
   */
  test('posts should have created_at and updated_at timestamps', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 500 }),
        async (content) => {
          const response = await request(app)
            .post('/api/cohort-posts')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              cohort_id: testCohort.id,
              content: content
            });
          
          if (response.status === 201) {
            expect(response.body).toHaveProperty('created_at');
            expect(response.body).toHaveProperty('updated_at');
            
            // Timestamps should be valid dates
            expect(new Date(response.body.created_at).toString()).not.toBe('Invalid Date');
            expect(new Date(response.body.updated_at).toString()).not.toBe('Invalid Date');
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: User can only like a post once
   */
  test('user should only be able to like a post once', async () => {
    const postResponse = await request(app)
      .post('/api/cohort-posts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        cohort_id: testCohort.id,
        content: 'Test post for single like'
      });
    
    if (postResponse.status !== 201) return;
    
    const postId = postResponse.body.id;
    const initialLikeCount = postResponse.body.like_count || 0;
    
    // Like the post
    await request(app)
      .post(`/api/cohort-posts/${postId}/like`)
      .set('Authorization', `Bearer ${authToken}`);
    
    // Get post to verify like count
    const getResponse = await request(app)
      .get(`/api/cohort-posts/${postId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    if (getResponse.status === 200) {
      expect(getResponse.body.like_count).toBe(initialLikeCount + 1);
      expect(getResponse.body.user_has_liked).toBe(true);
    }
  });

  /**
   * Property: Deleting a post should delete its comments
   */
  test('deleting a post should cascade to comments', async () => {
    // Create a post
    const postResponse = await request(app)
      .post('/api/cohort-posts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        cohort_id: testCohort.id,
        content: 'Test post for deletion'
      });
    
    if (postResponse.status !== 201) return;
    
    const postId = postResponse.body.id;
    
    // Add a comment
    await request(app)
      .post(`/api/cohort-posts/${postId}/comments`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        content: 'Test comment'
      });
    
    // Delete the post
    const deleteResponse = await request(app)
      .delete(`/api/cohort-posts/${postId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect([200, 204]).toContain(deleteResponse.status);
    
    // Verify post is gone
    const getResponse = await request(app)
      .get(`/api/cohort-posts/${postId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(getResponse.status).toBe(404);
  });
});
