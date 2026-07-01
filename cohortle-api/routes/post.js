const { token } = require("morgan");
const BackendSDK = require("../core/BackendSDK");
const TokenMiddleware = require("../middleware/TokenMiddleware");
const UrlMiddleware = require("../middleware/UrlMiddleware");
const ValidationService = require("../services/ValidationService");
const AccessControlService = require("../services/AccessControlService");
const AccessControlLogger = require("../services/AccessControlLogger");
const { POST_STATUSES, POST_REPLY } = require("../utils/mappings");

module.exports = function (app) {
  // create post
  /**
   * @swagger
   * /v1/api/posts:
   *   post:
   *     summary: Create a new post
   *     tags: [Posts]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - text
   *               - can_reply
   *             properties:
   *               text:
   *                 type: string
   *               media_1:
   *                 type: string
   *               media_2:
   *                 type: string
   *               media_3:
   *                 type: string
   *               media_4:
   *                 type: string
   *               community_ids:
   *                 type: string
   *                 description: Comma-separated list of community IDs
   *               mentioned_ids:
   *                 type: string
   *                 description: Comma-separated list of user IDs
   *               can_reply:
   *                 type: string
   *                 enum: [everyone, nobody, people_mentioned]
   *     responses:
   *       200:
   *         description: Post created successfully
   *       400:
   *         description: Validation error
   *       500:
   *         description: Internal server error
   */
  app.post(
    "/v1/api/posts",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const {
          text,
          media_1,
          media_2,
          media_3,
          media_4,
          community_ids,
          visibility_scope,
          community_id,
          cohort_id,
          mentioned_ids,
          can_reply,
        } = req.body;

        // Backward compatibility: use community_ids if community_id not provided
        const finalCommunityId = community_id || (community_ids ? community_ids.split(',')[0] : null);
        
        // Backward compatibility: default to 'community' scope if not provided
        const finalVisibilityScope = visibility_scope || 'community';

        // Build validation rules dynamically based on visibility_scope
        const validationRules = {
          text: "required|string",
          media_1: "url",
          media_2: "url",
          media_3: "url",
          media_4: "url",
          mentioned_ids: "commaInt",
          can_reply: `required|in:${Object.values(POST_REPLY).join(",")}`,
        };

        // Validate community_id if provided or extracted from community_ids
        if (finalCommunityId) {
          validationRules.community_id = "integer";
        }

        // Validate visibility_scope if provided
        if (visibility_scope) {
          validationRules.visibility_scope = "in:community,cohort";
        }

        // Add cohort_id validation if visibility_scope is 'cohort'
        if (finalVisibilityScope === 'cohort') {
          validationRules.cohort_id = "required|integer";
        }

        const validationResult = await ValidationService.validateObject(
          validationRules,
          {
            text,
            media_1,
            media_2,
            media_3,
            media_4,
            visibility_scope: finalVisibilityScope,
            community_id: finalCommunityId,
            cohort_id,
            mentioned_ids,
            can_reply,
          },
        );
        if (validationResult.error) {
          AccessControlLogger.logValidationError(
            req.user_id,
            '/v1/api/posts',
            validationResult,
            { method: 'POST' }
          );
          return res.status(400).json(validationResult);
        }

        // Verify cohort belongs to community if cohort-scoped
        if (finalVisibilityScope === 'cohort') {
          const sdk = new BackendSDK();
          
          // Check if cohort exists and belongs to a programme in the specified community
          const cohortCheck = await sdk.rawQuery(`
            SELECT c.id 
            FROM cohorts c
            JOIN programmes p ON c.programme_id = p.id
            WHERE c.id = ${cohort_id} AND p.community_id = ${finalCommunityId}
          `);
          
          if (cohortCheck.length === 0) {
            AccessControlLogger.logValidationError(
              req.user_id,
              '/v1/api/posts',
              { cohort_id, community_id: finalCommunityId, error: 'Cohort does not belong to community' },
              { method: 'POST' }
            );
            return res.status(400).json({
              error: true,
              message: "Cohort does not belong to the specified community"
            });
          }
        }

        // Create post with new visibility fields
        const sdk = new BackendSDK();
        sdk.setTable("posts");
        const post_id = await sdk.insert({
          text,
          media_1,
          media_2,
          media_3,
          media_4,
          community_ids: finalCommunityId ? finalCommunityId.toString() : (community_ids || ''), // Backward compatibility
          visibility_scope: finalVisibilityScope,
          cohort_id: finalVisibilityScope === 'cohort' ? cohort_id : null,
          mentioned_ids,
          posted_by: req.user_id,
          can_reply,
          status: POST_STATUSES.PUBLISHED,
        });

        // Log post creation
        AccessControlLogger.logPostCreation(
          req.user_id,
          post_id,
          finalVisibilityScope,
          finalCommunityId,
          finalVisibilityScope === 'cohort' ? cohort_id : null
        );

        // TODO: might need to notify the learners that a new post has been added

        return res.status(200).json({
          error: false,
          message: "post created successfully",
          post_id,
        });
      } catch (err) {
        AccessControlLogger.logDatabaseError('createPost', err, { 
          userId: req.user_id,
          endpoint: '/v1/api/posts'
        });
        res.status(500);
        res.json({
          error: true,
          message: "Internal server error",
        });
      }
    },
  );

  /**
   * @swagger
   * /v1/api/posts:
   *   get:
   *     summary: Get all posts
   *     tags: [Posts]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of posts with user data
   *       500:
   *         description: Internal server error
   */
  app.get(
    "/v1/api/posts",
    [UrlMiddleware, TokenMiddleware({ role: "convener|student" })],
    async function (req, res) {
      try {
        // Build access control filter for the user
        const filterClause = await AccessControlService.buildPostFilterClause(req.user_id);
        
        const sdk = new BackendSDK();
        
        // Fetch posts with access control filtering
        const posts = await sdk.rawQuery(`
          SELECT p.* FROM posts p
          WHERE p.status = '${POST_STATUSES.PUBLISHED}' AND (${filterClause})
          ORDER BY p.created_at DESC
          LIMIT 100
        `);

        const userSdk = new BackendSDK();
        userSdk.setTable("users");

        // Collect all community IDs from all posts
        const allCommunityIds = new Set();
        posts.forEach(post => {
          if (post.community_ids) {
            const ids = post.community_ids.toString().split(',').map(id => id.trim());
            ids.forEach(id => allCommunityIds.add(id));
          }
        });

        // Fetch all relevant communities in one go
        const communitySdk = new BackendSDK();
        let communityMap = {};
        if (allCommunityIds.size > 0) {
          const idsArray = Array.from(allCommunityIds);
          const communities = await communitySdk.rawQuery(`
                SELECT id, name FROM communities WHERE id IN (${idsArray.join(',')})
            `);
          communityMap = communities.reduce((acc, comm) => {
            acc[comm.id] = comm.name;
            return acc;
          }, {});
        }

        // Collect all user IDs
        const allUserIds = new Set();
        posts.forEach(post => {
          if (post.posted_by) allUserIds.add(post.posted_by);
        });

        // Fetch all relevant users in one go
        let userMap = {};
        if (allUserIds.size > 0) {
          const idsArray = Array.from(allUserIds);
          const users = await userSdk.rawQuery(`
                SELECT id, first_name, last_name, email, role FROM users WHERE id IN (${idsArray.join(',')})
            `);
          userMap = users.reduce((acc, user) => {
            acc[user.id] = {
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
              role: user.role,
            };
            return acc;
          }, {});
        }

        const postsWithDetails = posts.map((post) => {
          const userData = userMap[post.posted_by] || null;

          // Map community IDs to names
          let communityNames = [];
          if (post.community_ids) {
            const ids = post.community_ids.toString().split(',').map(id => id.trim());
            communityNames = ids.map(id => communityMap[id]).filter(Boolean);
          }

          const { community_ids, ...postData } = post; // Remove community_ids

          return {
            ...postData,
            community_names: communityNames,
            posted_by: userData,
          };
        });

        return res.status(200).json({
          error: false,
          message: "posts fetched successfully",
          posts: postsWithDetails,
        });
      } catch (err) {
        AccessControlLogger.logDatabaseError('getPosts', err, { 
          userId: req.user_id,
          endpoint: '/v1/api/posts'
        });
        res.status(500);
        res.json({
          error: true,
          message: "Internal server error",
        });
      }
    },
  );

  /**
   * @swagger
   * /v1/posts/{post_id}:
   *   get:
   *     summary: Get a single post by ID
   *     tags: [Posts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: post_id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Post retrieved successfully
   *       404:
   *         description: Post not found
   *       500:
   *         description: Internal server error
   */
  app.get(
    "/v1/posts/:post_id",
    [UrlMiddleware, TokenMiddleware({ role: "convener|student" })],
    async function (req, res) {
      try {
        const { post_id } = req.params;
        console.log(`Fetching post with ID: ${post_id}`);

        // ✅ Validate post_id
        const validationResult = await ValidationService.validateObject(
          { post_id: "required|integer" },
          { post_id },
        );

        if (validationResult.error) {
          AccessControlLogger.logValidationError(
            req.user_id,
            `/v1/posts/${post_id}`,
            validationResult,
            { method: 'GET' }
          );
          console.log("Validation failed:", validationResult);
          return res.status(400).json(validationResult);
        }

        // ✅ Fetch post
        const sdk = new BackendSDK();
        sdk.setTable("posts");
        const posts = await sdk.get({ id: post_id });

        // sdk.get might return an array or a single object depending on implementation
        const post = Array.isArray(posts) ? posts[0] : posts;

        console.log("Found post:", post);

        if (!post) {
          console.log(`Post not found for ID: ${post_id}`);
          return res.status(404).json({
            error: true,
            message: "Post not found",
          });
        }

        // ✅ Check access control
        const hasAccess = await AccessControlService.canAccessPost(req.user_id, post);

        if (!hasAccess) {
          // Return 404 to avoid leaking post existence
          console.log(`User ${req.user_id} does not have access to post ${post_id}`);
          return res.status(404).json({
            error: true,
            message: "Post not found",
          });
        }

        // ✅ Fetch user details
        const userSdk = new BackendSDK();
        userSdk.setTable("users");

        const users = await userSdk.get({ id: post.posted_by });
        const user = Array.isArray(users) ? users[0] : users;

        const userData = user
          ? {
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
          }
          : null;

        // ✅ Fetch Community Names
        let communityNames = [];
        if (post.community_ids) {
          const ids = post.community_ids.toString().split(',').map(id => id.trim());
          if (ids.length > 0) {
            const communitySdk = new BackendSDK();
            const communities = await communitySdk.rawQuery(`
                    SELECT id, name FROM communities WHERE id IN (${ids.join(',')})
                `);

            const communityMap = communities.reduce((acc, comm) => {
              acc[comm.id] = comm.name;
              return acc;
            }, {});

            communityNames = ids.map(id => communityMap[id]).filter(Boolean);
          }
        }

        const { community_ids, ...postData } = post; // Remove community_ids

        // ✅ Prevent caching
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("Pragma", "no-cache");

        // ✅ Final response (single post object)
        return res.status(200).json({
          error: false,
          message: "Post retrieved successfully",
          post: {
            ...postData,
            community_names: communityNames,
            posted_by: userData,
          },
        });
      } catch (err) {
        AccessControlLogger.logDatabaseError('getPostById', err, { 
          userId: req.user_id,
          postId: req.params.post_id,
          endpoint: `/v1/posts/${req.params.post_id}`
        });
        console.error("Error retrieving post:", err);
        return res.status(500).json({
          error: true,
          message: "Internal server error",
        });
      }
    },
  );

  /**
   * @swagger
   * /v1/post/{post_id}/comments:
   *   post:
   *     summary: Add a comment to a post
   *     tags: [Posts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: post_id
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - text
   *             properties:
   *               text:
   *                 type: string
   *               media_1:
   *                 type: string
   *     responses:
   *       200:
   *         description: Comment added successfully
   *       400:
   *         description: Validation error
   *       500:
   *         description: Internal server error
   */
  app.post(
    "/v1/post/:post_id/comments",
    [UrlMiddleware, TokenMiddleware({ role: "convener" })],
    async function (req, res) {
      try {
        const { post_id } = req.params;
        const { text, media_1 } = req.body;
        const validationResult = await ValidationService.validateObject(
          {
            text: "required|string",
            media_1: "url",
            post_id: "required|integer",
          },
          {
            text,
            media_1,
            post_id,
          },
        );
        if (validationResult.error) {
          AccessControlLogger.logValidationError(
            req.user_id,
            `/v1/post/${post_id}/comments`,
            validationResult,
            { method: 'POST' }
          );
          return res.status(400).json(validationResult);
        }

        // Fetch post to check access
        const postSdk = new BackendSDK();
        postSdk.setTable("posts");
        const posts = await postSdk.get({ id: post_id });
        const post = Array.isArray(posts) ? posts[0] : posts;

        if (!post) {
          return res.status(404).json({
            error: true,
            message: "Post not found",
          });
        }

        // Check if user has access to the parent post
        const hasAccess = await AccessControlService.canAccessPost(req.user_id, post);

        if (!hasAccess) {
          // Return 404 to avoid leaking post existence
          return res.status(404).json({
            error: true,
            message: "Post not found",
          });
        }

        const sdk = new BackendSDK();
        sdk.setTable("comments");
        const comment_id = await sdk.insert({
          text,
          media_1,
          post_id,
          commented_by: req.user_id,
        });
        return res.status(200).json({
          error: false,
          message: "comment added successfully",
          comment_id,
        });
      } catch (err) {
        AccessControlLogger.logDatabaseError('createComment', err, { 
          userId: req.user_id,
          postId: req.params.post_id,
          endpoint: `/v1/post/${req.params.post_id}/comments`
        });
        console.error(err);
        res.status(500);
        res.json({
          error: true,
          message: "Internal server error",
        });
      }
    },
  );

  /**
   * @swagger
   * /v1/post/{post_id}/comments:
   *   get:
   *     summary: Get all comments for a post
   *     tags: [Posts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: post_id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: List of comments with user data
   *       400:
   *         description: Validation error
   *       500:
   *         description: Internal server error
   */
  app.get(
    "/v1/post/:post_id/comments",
    [UrlMiddleware, TokenMiddleware({ role: "convener|student" })],
    async function (req, res) {
      try {
        const { post_id } = req.params;

        // Validate
        const validationResult = await ValidationService.validateObject(
          { post_id: "required|integer" },
          { post_id },
        );
        if (validationResult.error) {
          AccessControlLogger.logValidationError(
            req.user_id,
            `/v1/post/${post_id}/comments`,
            validationResult,
            { method: 'GET' }
          );
          return res.status(400).json(validationResult);
        }

        // Fetch post to check access
        const postSdk = new BackendSDK();
        postSdk.setTable("posts");
        const posts = await postSdk.get({ id: post_id });
        const post = Array.isArray(posts) ? posts[0] : posts;

        if (!post) {
          return res.status(404).json({
            error: true,
            message: "Post not found",
          });
        }

        // Check if user has access to the parent post
        const hasAccess = await AccessControlService.canAccessPost(req.user_id, post);

        if (!hasAccess) {
          // Return 404 to avoid leaking post existence
          return res.status(404).json({
            error: true,
            message: "Post not found",
          });
        }

        // Fetch comments
        const sdk = new BackendSDK();
        sdk.setTable("comments");
        const comments = await sdk.get({ post_id });

        // Collect user IDs
        const userIds = [...new Set(comments.map((c) => c.commented_by))];

        // Fetch users in one query
        const userSdk = new BackendSDK();
        userSdk.setTable("users");
        const users = [];
        for (const id of userIds) {
          const [user] = await userSdk.get({ id });
          if (user) users.push(user);
        }
        const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

        // Merge users with comments
        const commentWithUser = comments.map((comment) => ({
          ...comment,
          user: userMap[comment.commented_by]
            ? {
              first_name: userMap[comment.commented_by].first_name,
              last_name: userMap[comment.commented_by].last_name,
            }
            : null,
        }));
        console.log(commentWithUser);
        return res.status(200).json({
          error: false,
          message: "Comments fetched successfully",
          comments: commentWithUser,
        });
      } catch (err) {
        AccessControlLogger.logDatabaseError('getComments', err, { 
          userId: req.user_id,
          postId: req.params.post_id,
          endpoint: `/v1/post/${req.params.post_id}/comments`
        });
        console.error(err);
        return res.status(500).json({
          error: true,
          message: "Internal server error",
        });
      }
    },
  );

  /**
   * @swagger
   * /v1/post/{post_id}/comment/{comment_id}:
   *   delete:
   *     summary: Delete a comment
   *     tags: [Posts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: post_id
   *         required: true
   *         schema:
   *           type: integer
   *       - in: path
   *         name: comment_id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Comment deleted successfully
   *       400:
   *         description: Validation error
   *       500:
   *         description: Internal server error
   */
  app.delete(
    "/v1/post/:post_id/comment/:comment_id",
    [UrlMiddleware],
    async function (req, res) {
      try {
        const { post_id, comment_id } = req.params;
        const validationResult = await ValidationService.validateObject(
          {
            post_id: "required|integer",
            comment_id: "required|integer",
          },
          {
            post_id,
            comment_id,
          },
        );
        if (validationResult.error) {
          AccessControlLogger.logValidationError(
            req.user_id || 'unknown',
            `/v1/post/${post_id}/comment/${comment_id}`,
            validationResult,
            { method: 'DELETE' }
          );
          return res.status(400).json(validationResult);
        }
        const sdk = new BackendSDK();
        sdk.setTable("comments");
        const deleted = await sdk.delete({ post_id }, comment_id);
        return res.status(200).json({
          error: false,
          message: "comment deleted successfully",
          deleted,
        });
      } catch (err) {
        AccessControlLogger.logDatabaseError('deleteComment', err, { 
          userId: req.user_id || 'unknown',
          postId: req.params.post_id,
          commentId: req.params.comment_id,
          endpoint: `/v1/post/${req.params.post_id}/comment/${req.params.comment_id}`
        });
        console.error(err);
        res.status(500);
        res.json({
          error: true,
          message: "Internal server error",
        });
      }
    },
  );
};
