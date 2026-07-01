const CommentService = require("../services/CommentService");
const TokenMiddleware = require("../middleware/TokenMiddleware");
const UrlMiddleware = require("../middleware/UrlMiddleware");
const ValidationService = require("../services/ValidationService");

module.exports = function (app) {
    /**
     * @swagger
     * /v1/api/lessons/{lesson_id}/comments:
     *   post:
     *     summary: Add a comment to a lesson
     *     tags: [Lesson Comments]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: lesson_id
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
     *               parent_id:
     *                 type: string
     *     responses:
     *       '201':
     *         description: Comment added successfully
     *       '400':
     *         description: Validation error
     *       '500':
     *         description: Server error
     */
    app.post(
        "/v1/api/lessons/:lesson_id/comments",
        [UrlMiddleware, TokenMiddleware({ role: "convener|student" })],
        async function (req, res) {
            try {
                const { lesson_id } = req.params;
                const { text, parent_id } = req.body;

                const validationResult = await ValidationService.validateObject(
                    {
                        lesson_id: "required|string",
                        text: "required|string",
                        parent_id: "string",
                    },
                    { lesson_id, text, parent_id }
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                const comment = await CommentService.createComment(
                    lesson_id,
                    req.user_id,
                    text,
                    parent_id || null
                );

                return res.status(201).json({
                    error: false,
                    message: "Comment added successfully",
                    comment,
                });
            } catch (err) {
                console.error("Error creating comment:", err);
                
                // Handle specific error cases
                if (err.message.includes("empty") || err.message.includes("nesting")) {
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
                    message: "Failed to create comment",
                });
            }
        }
    );


    /**
     * @swagger
     * /v1/api/lessons/{lesson_id}/comments:
     *   get:
     *     summary: Get all comments for a lesson
     *     tags: [Lesson Comments]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: lesson_id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       '200':
     *         description: Comments fetched successfully
     *       '400':
     *         description: Validation error
     *       '500':
     *         description: Server error
     */
    app.get(
        "/v1/api/lessons/:lesson_id/comments",
        [UrlMiddleware, TokenMiddleware({ role: "convener|student" })],
        async function (req, res) {
            try {
                const { lesson_id } = req.params;

                const validationResult = await ValidationService.validateObject(
                    {
                        lesson_id: "required|string",
                    },
                    { lesson_id }
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                const comments = await CommentService.getLessonComments(lesson_id);

                // Set canEdit and canDelete flags based on current user
                const enrichedComments = comments.map((comment) => {
                    const enrichComment = (c) => ({
                        ...c,
                        canEdit: c.authorId === req.user_id,
                        canDelete: c.authorId === req.user_id || req.role === "convener",
                        replies: c.replies.map(enrichComment),
                    });
                    return enrichComment(comment);
                });

                return res.status(200).json({
                    error: false,
                    message: "Comments fetched successfully",
                    comments: enrichedComments,
                });
            } catch (err) {
                console.error("Error fetching comments:", err);
                res.status(500).json({
                    error: true,
                    message: "Failed to fetch comments",
                });
            }
        }
    );

    /**
     * @swagger
     * /v1/api/comments/{comment_id}:
     *   put:
     *     summary: Update a lesson comment
     *     tags: [Lesson Comments]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: comment_id
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
     *       '200':
     *         description: Comment updated successfully
     *       '400':
     *         description: Validation error
     *       '403':
     *         description: Unauthorized to update this comment
     *       '404':
     *         description: Comment not found
     *       '500':
     *         description: Server error
     */
    app.put(
        "/v1/api/comments/:comment_id",
        [UrlMiddleware, TokenMiddleware()],
        async function (req, res) {
            try {
                const { comment_id } = req.params;
                const { text } = req.body;

                const validationResult = await ValidationService.validateObject(
                    {
                        comment_id: "required|string",
                        text: "required|string",
                    },
                    { comment_id, text }
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                const comment = await CommentService.updateComment(
                    comment_id,
                    req.user_id,
                    text
                );

                return res.status(200).json({
                    error: false,
                    message: "Comment updated successfully",
                    comment,
                });
            } catch (err) {
                console.error("Error updating comment:", err);
                
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
                
                if (err.message.includes("only edit your own")) {
                    return res.status(403).json({
                        error: true,
                        message: "Unauthorized to update this comment",
                    });
                }
                
                res.status(500).json({
                    error: true,
                    message: "Failed to update comment",
                });
            }
        }
    );

    /**
     * @swagger
     * /v1/api/comments/{comment_id}:
     *   delete:
     *     summary: Delete a lesson comment
     *     tags: [Lesson Comments]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: comment_id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       '200':
     *         description: Comment deleted successfully
     *       '400':
     *         description: Validation error
     *       '403':
     *         description: Unauthorized to delete this comment
     *       '404':
     *         description: Comment not found
     *       '500':
     *         description: Server error
     */
    app.delete(
        "/v1/api/comments/:comment_id",
        [UrlMiddleware, TokenMiddleware()],
        async function (req, res) {
            try {
                const { comment_id } = req.params;

                const validationResult = await ValidationService.validateObject(
                    { comment_id: "required|string" },
                    { comment_id }
                );

                if (validationResult.error) {
                    return res.status(400).json(validationResult);
                }

                const result = await CommentService.deleteComment(
                    comment_id,
                    req.user_id
                );

                return res.status(200).json({
                    error: false,
                    message: "Comment deleted successfully",
                    success: result.success,
                });
            } catch (err) {
                console.error("Error deleting comment:", err);
                
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
                        message: "Unauthorized to delete this comment",
                    });
                }
                
                res.status(500).json({
                    error: true,
                    message: "Failed to delete comment",
                });
            }
        }
    );

    return [];
};
