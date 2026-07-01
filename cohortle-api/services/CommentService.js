const { Op } = require("sequelize");
const db = require("../models");

/**
 * Service for managing lesson comments and discussions
 * Handles comment creation, retrieval, updates, and deletion with threading support
 * 
 * Requirements: 5.1, 5.2, 5.4, 5.5, 5.6, 5.7, 5.9, 5.10, 5.11, 5.12
 */
class CommentService {
  /**
   * Get comments for a lesson with threaded structure
   * Returns comments with user details and nested replies (max 2 levels)
   * 
   * @param {string} lessonId - The lesson ID
   * @returns {Promise<Array<Comment>>}
   * 
   * Requirements: 5.1, 5.2, 5.3, 5.8
   */
  async getLessonComments(lessonId) {
    try {
      // Get all comments for the lesson
      const comments = await db.lesson_comments.findAll({
        where: { lesson_id: lessonId },
        include: [
          {
            model: db.users,
            as: "user",
            attributes: ["id", "name", "email"],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      // Build threaded structure
      const commentMap = new Map();
      const rootComments = [];

      // First pass: create comment objects
      comments.forEach((comment) => {
        const commentObj = {
          id: comment.id,
          authorId: comment.user_id,
          authorName: comment.user.name,
          authorAvatar: null, // Not implemented yet
          text: comment.comment_text,
          createdAt: comment.createdAt.toISOString(),
          updatedAt: comment.updatedAt ? comment.updatedAt.toISOString() : null,
          isEdited: comment.updatedAt && comment.updatedAt > comment.createdAt,
          replies: [],
          canEdit: false, // Will be set by caller based on current user
          canDelete: false, // Will be set by caller based on current user
        };

        commentMap.set(comment.id, commentObj);

        if (!comment.parent_comment_id) {
          rootComments.push(commentObj);
        }
      });

      // Second pass: build reply relationships
      comments.forEach((comment) => {
        if (comment.parent_comment_id) {
          const parent = commentMap.get(comment.parent_comment_id);
          if (parent) {
            const child = commentMap.get(comment.id);
            parent.replies.push(child);
          }
        }
      });

      // Sort replies chronologically (oldest first for better reading flow)
      rootComments.forEach((comment) => {
        comment.replies.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
      });

      return rootComments;
    } catch (error) {
      console.error("Error getting lesson comments:", error);
      throw error;
    }
  }

  /**
   * Create a comment on a lesson
   * Validates nesting depth (max 2 levels) and text content
   * 
   * @param {string} lessonId - The lesson ID
   * @param {number} userId - The user ID
   * @param {string} text - The comment text
   * @param {string|null} parentId - The parent comment ID (null for root comments)
   * @returns {Promise<Comment>}
   * 
   * Requirements: 5.4, 5.5, 5.6, 5.7, 5.9
   */
  async createComment(lessonId, userId, text, parentId = null) {
    try {
      // Validate text is not empty
      if (!text || text.trim().length === 0) {
        throw new Error("Comment text cannot be empty");
      }

      // Validate nesting depth if this is a reply
      if (parentId) {
        const parentComment = await db.lesson_comments.findByPk(parentId);

        if (!parentComment) {
          throw new Error("Parent comment not found");
        }

        // Check if parent is already a reply (depth 1)
        if (parentComment.parent_comment_id) {
          throw new Error(
            "Cannot reply to a reply. Maximum nesting depth is 2 levels."
          );
        }
      }

      // Create the comment
      const comment = await db.lesson_comments.create({
        lesson_id: lessonId,
        user_id: userId,
        comment_text: text.trim(),
        parent_comment_id: parentId,
      });

      // Fetch the comment with user details
      const createdComment = await db.lesson_comments.findByPk(comment.id, {
        include: [
          {
            model: db.users,
            as: "user",
            attributes: ["id", "name", "email"],
          },
        ],
      });

      return {
        id: createdComment.id,
        authorId: createdComment.user_id,
        authorName: createdComment.user.name,
        authorAvatar: null,
        text: createdComment.comment_text,
        createdAt: createdComment.createdAt.toISOString(),
        updatedAt: null,
        isEdited: false,
        replies: [],
        canEdit: true,
        canDelete: true,
      };
    } catch (error) {
      console.error("Error creating comment:", error);
      throw error;
    }
  }

  /**
   * Update a comment
   * Verifies ownership before allowing update
   * 
   * @param {string} commentId - The comment ID
   * @param {number} userId - The user ID (must be comment author)
   * @param {string} text - The new comment text
   * @returns {Promise<Comment>}
   * 
   * Requirements: 5.10, 5.11
   */
  async updateComment(commentId, userId, text) {
    try {
      // Validate text is not empty
      if (!text || text.trim().length === 0) {
        throw new Error("Comment text cannot be empty");
      }

      // Find the comment
      const comment = await db.lesson_comments.findByPk(commentId);

      if (!comment) {
        throw new Error("Comment not found");
      }

      // Verify ownership
      if (comment.user_id !== userId) {
        throw new Error("You can only edit your own comments");
      }

      // Update the comment
      await comment.update({
        comment_text: text.trim(),
      });

      // Fetch updated comment with user details
      const updatedComment = await db.lesson_comments.findByPk(commentId, {
        include: [
          {
            model: db.users,
            as: "user",
            attributes: ["id", "name", "email"],
          },
        ],
      });

      return {
        id: updatedComment.id,
        authorId: updatedComment.user_id,
        authorName: updatedComment.user.name,
        authorAvatar: null,
        text: updatedComment.comment_text,
        createdAt: updatedComment.createdAt.toISOString(),
        updatedAt: updatedComment.updatedAt.toISOString(),
        isEdited: true,
        replies: [],
        canEdit: true,
        canDelete: true,
      };
    } catch (error) {
      console.error("Error updating comment:", error);
      throw error;
    }
  }

  /**
   * Delete a comment
   * Verifies ownership before allowing deletion
   * Cascades to delete all replies
   * 
   * @param {string} commentId - The comment ID
   * @param {number} userId - The user ID (must be comment author)
   * @returns {Promise<{success: boolean}>}
   * 
   * Requirements: 5.10, 5.12
   */
  async deleteComment(commentId, userId) {
    try {
      // Find the comment
      const comment = await db.lesson_comments.findByPk(commentId);

      if (!comment) {
        throw new Error("Comment not found");
      }

      // Verify ownership
      if (comment.user_id !== userId) {
        throw new Error("You can only delete your own comments");
      }

      // Delete the comment (replies will cascade due to foreign key)
      await comment.destroy();

      return {
        success: true,
      };
    } catch (error) {
      console.error("Error deleting comment:", error);
      throw error;
    }
  }
}

module.exports = new CommentService();
