const CommunityService = require("../services/CommunityService");
const TokenMiddleware = require("../middleware/TokenMiddleware");
const UrlMiddleware = require("../middleware/UrlMiddleware");
const ValidationService = require("../services/ValidationService");

module.exports = function (app) {
    /**
     * @swagger
     * /v1/api/cohorts/{cohort_id}/posts:
     *   get:
     *     summary: Get posts for a cohort
     *     tags: [Community Feed]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: cohort_id
     *         required: true
     *         schema:
     *           type: integer
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           default: 1
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 20
     *     responses:
     *       '200':
     *         description: Posts fetched successfully
     *       '400':
     *         description: Validation error
     *       '403':
     *         description: Not enrolled in cohort
     *       '500':
     *         description: Server error
     */
    app.get(
        "/v1/api/cohorts/:cohort_id/posts",
        [UrlMiddleware, TokenMiddleware({ role: "convener|student" })],
        async function (req, res) {
            try {
                const { cohort_id } = req.params;
                const { page = 1, limit = 20 } = req.query;

                const validationResult = await ValidationService.validateObject(
                    {
                        cohort_id: "required|integer",
                        page: "integer",
                        limit: "integer",
                    },
                    { cohort_id, page, limit }
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                const result = await CommunityService.getCohortPosts(
                    parseInt(cohort_id),
                    req.user_id,
                    parseInt(page),
                    parseInt(limit)
                );

                return res.status(200).json({
                    error: false,
                    message: "Posts fetched successfully",
                    ...result,
                });
            } catch (err) {
                console.error("Error fetching cohort posts:", err);
                
                // Handle specific error cases
                if (err.message.includes("enrolled")) {
                    return res.status(403).json({
                        error: true,
                        message: err.message,
                    });
                }
                
                res.status(500).json({
                    error: true,
                    message: "Failed to fetch posts",
                });
            }
        }
    );

    /**
     * @swagger
     * /v1/api/cohorts/{cohort_id}/posts:
     *   post:
     *     summary: Create a post in a cohort
     *     tags: [Community Feed]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: cohort_id
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
     *               - content
     *             properties:
     *               content:
     *                 type: string
     *                 maxLength: 2000
     *     responses:
     *       '201':
     *         description: Post created successfully
     *       '400':
     *         description: Validation error
     *       '403':
     *         description: Not enrolled in cohort
     *       '500':
     *         description: Server error
     */
    app.post(
        "/v1/api/cohorts/:cohort_id/posts",
        [UrlMiddleware, TokenMiddleware({ role: "convener|student" })],
        async function (req, res) {
            try {
                const { cohort_id } = req.params;
                const { content } = req.body;

                const validationResult = await ValidationService.validateObject(
                    {
                        cohort_id: "required|integer",
                        content: "required|string",
                    },
                    { cohort_id, content }
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                const post = await CommunityService.createPost(
                    parseInt(cohort_id),
                    req.user_id,
                    content
                );

                return res.status(201).json({
                    error: false,
                    message: "Post created successfully",
                    post,
                });
            } catch (err) {
                console.error("Error creating post:", err);
                
                // Handle specific error cases
                if (err.message.includes("empty") || err.message.includes("exceed")) {
                    return res.status(400).json({
                        error: true,
                        message: err.message,
                    });
                }
                
                if (err.message.includes("enrolled")) {
                    return res.status(403).json({
                        error: true,
                        message: err.message,
                    });
                }
                
                res.status(500).json({
                    error: true,
                    message: "Failed to create post",
                });
            }
        }
    );

    /**
     * @swagger
     * /v1/api/posts/{post_id}:
     *   put:
     *     summary: Update a post
     *     tags: [Community Feed]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: post_id
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - content
     *             properties:
     *               content:
     *                 type: string
     *                 maxLength: 2000
     *     responses:
     *       '200':
     *         description: Post updated successfully
     *       '400':
     *         description: Validation error
     *       '403':
     *         description: Unauthorized to update this post
     *       '404':
     *         description: Post not found
     *       '500':
     *         description: Server error
     */
    app.put(
        "/v1/api/posts/:post_id",
        [UrlMiddleware, TokenMiddleware()],
        async function (req, res) {
            try {
                const { post_id } = req.params;
                const { content } = req.body;

                const validationResult = await ValidationService.validateObject(
                    {
                        post_id: "required|string",
                        content: "required|string",
                    },
                    { post_id, content }
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                const post = await CommunityService.updatePost(
                    post_id,
                    req.user_id,
                    content
                );

                return res.status(200).json({
                    error: false,
                    message: "Post updated successfully",
                    post,
                });
            } catch (err) {
                console.error("Error updating post:", err);
                
                // Handle specific error cases
                if (err.message.includes("empty") || err.message.includes("exceed")) {
                    return res.status(400).json({
                        error: true,
                        message: err.message,
                    });
                }
                
                if (err.message.includes("not found")) {
                    return res.status(404).json({
                        error: true,
                        message: err.message,
                    });
                }
                
                if (err.message.includes("only edit your own")) {
                    return res.status(403).json({
                        error: true,
                        message: "Unauthorized to update this post",
                    });
                }
                
                res.status(500).json({
                    error: true,
                    message: "Failed to update post",
                });
            }
        }
    );

    /**
     * @swagger
     * /v1/api/posts/{post_id}:
     *   delete:
     *     summary: Delete a post
     *     tags: [Community Feed]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: post_id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       '200':
     *         description: Post deleted successfully
     *       '400':
     *         description: Validation error
     *       '403':
     *         description: Unauthorized to delete this post
     *       '404':
     *         description: Post not found
     *       '500':
     *         description: Server error
     */
    app.delete(
        "/v1/api/posts/:post_id",
        [UrlMiddleware, TokenMiddleware()],
        async function (req, res) {
            try {
                const { post_id } = req.params;

                const validationResult = await ValidationService.validateObject(
                    { post_id: "required|string" },
                    { post_id }
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                const result = await CommunityService.deletePost(
                    post_id,
                    req.user_id
                );

                return res.status(200).json({
                    error: false,
                    message: "Post deleted successfully",
                    success: result.success,
                });
            } catch (err) {
                console.error("Error deleting post:", err);
                
                // Handle specific error cases
                if (err.message.includes("not found")) {
                    return res.status(404).json({
                        error: true,
                        message: err.message,
                    });
                }
                
                if (err.message.includes("only delete your own")) {
                    return res.status(403).json({
                        error: true,
                        message: "Unauthorized to delete this post",
                    });
                }
                
                res.status(500).json({
                    error: true,
                    message: "Failed to delete post",
                });
            }
        }
    );

    /**
     * @swagger
     * /v1/api/posts/{post_id}/like:
     *   post:
     *     summary: Like a post
     *     tags: [Community Feed]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: post_id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       '200':
     *         description: Post liked successfully
     *       '400':
     *         description: Validation error
     *       '404':
     *         description: Post not found
     *       '500':
     *         description: Server error
     */
    app.post(
        "/v1/api/posts/:post_id/like",
        [UrlMiddleware, TokenMiddleware()],
        async function (req, res) {
            try {
                const { post_id } = req.params;

                const validationResult = await ValidationService.validateObject(
                    { post_id: "required|string" },
                    { post_id }
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                const result = await CommunityService.likePost(
                    post_id,
                    req.user_id
                );

                return res.status(200).json({
                    error: false,
                    message: "Post liked successfully",
                    ...result,
                });
            } catch (err) {
                console.error("Error liking post:", err);
                
                // Handle specific error cases
                if (err.message.includes("not found")) {
                    return res.status(404).json({
                        error: true,
                        message: err.message,
                    });
                }
                
                res.status(500).json({
                    error: true,
                    message: "Failed to like post",
                });
            }
        }
    );

    /**
     * @swagger
     * /v1/api/posts/{post_id}/like:
     *   delete:
     *     summary: Unlike a post
     *     tags: [Community Feed]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: post_id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       '200':
     *         description: Post unliked successfully
     *       '400':
     *         description: Validation error
     *       '500':
     *         description: Server error
     */
    app.delete(
        "/v1/api/posts/:post_id/like",
        [UrlMiddleware, TokenMiddleware()],
        async function (req, res) {
            try {
                const { post_id } = req.params;

                const validationResult = await ValidationService.validateObject(
                    { post_id: "required|string" },
                    { post_id }
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                const result = await CommunityService.unlikePost(
                    post_id,
                    req.user_id
                );

                return res.status(200).json({
                    error: false,
                    message: "Post unliked successfully",
                    ...result,
                });
            } catch (err) {
                console.error("Error unliking post:", err);
                
                res.status(500).json({
                    error: true,
                    message: "Failed to unlike post",
                });
            }
        }
    );

    /**
     * @swagger
     * /v1/api/posts/{post_id}/comments:
     *   post:
     *     summary: Add a comment to a post
     *     tags: [Community Feed]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: post_id
     *         required: true
     *         schema:
     *           type: string
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
     *     responses:
     *       '201':
     *         description: Comment added successfully
     *       '400':
     *         description: Validation error
     *       '404':
     *         description: Post not found
     *       '500':
     *         description: Server error
     */
    app.post(
        "/v1/api/posts/:post_id/comments",
        [UrlMiddleware, TokenMiddleware()],
        async function (req, res) {
            try {
                const { post_id } = req.params;
                const { text } = req.body;

                const validationResult = await ValidationService.validateObject(
                    {
                        post_id: "required|string",
                        text: "required|string",
                    },
                    { post_id, text }
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                const comment = await CommunityService.addPostComment(
                    post_id,
                    req.user_id,
                    text
                );

                return res.status(201).json({
                    error: false,
                    message: "Comment added successfully",
                    comment,
                });
            } catch (err) {
                console.error("Error adding comment to post:", err);
                
                // Handle specific error cases
                if (err.message.includes("empty")) {
                    return res.status(400).json({
                        error: true,
                        message: err.message,
                    });
                }
                
                if (err.message.includes("not found")) {
                    return res.status(404).json({
                        error: true,
                        message: err.message,
                    });
                }
                
                res.status(500).json({
                    error: true,
                    message: "Failed to add comment",
                });
            }
        }
    );

    return [];
};
