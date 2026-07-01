const { Op } = require("sequelize");
const db = require("../models");

/**
 * Service for managing cohort community feed
 * Handles posts, likes, comments, and engagement features
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10, 7.11, 7.12, 7.13, 7.14, 7.15, 7.16, 7.18
 */
class CommunityService {
  /**
   * Get posts for a cohort with pagination
   * Verifies user is enrolled in cohort before returning posts
   * 
   * @param {number} cohortId - The cohort ID
   * @param {number} userId - The user ID (for enrollment check and like status)
   * @param {number} page - Page number (default 1)
   * @param {number} limit - Posts per page (default 20)
   * @returns {Promise<{posts: Post[], hasMore: boolean, total: number}>}
   * 
   * Requirements: 7.1, 7.2, 7.3, 7.4, 7.18
   */
  async getCohortPosts(cohortId, userId, page = 1, limit = 20) {
    try {
      // Verify user is enrolled in cohort
      const enrollment = await db.enrollments.findOne({
        where: {
          user_id: userId,
          cohort_id: cohortId,
        },
      });

      if (!enrollment) {
        throw new Error("You must be enrolled in this cohort to view posts");
      }

      // Calculate offset for pagination
      const offset = (page - 1) * limit;

      // Get total count
      const total = await db.cohort_posts.count({
        where: { cohort_id: cohortId },
      });

      // Get posts with user details, like count, and comment count
      const posts = await db.cohort_posts.findAll({
        where: { cohort_id: cohortId },
        include: [
          {
            model: db.users,
            as: "user",
            attributes: ["id", "name", "email"],
          },
          {
            model: db.post_likes,
            as: "likes",
            attributes: ["user_id"],
          },
          {
            model: db.post_comments,
            as: "comments",
            attributes: ["id", "user_id", "text", "created_at"],
            include: [
              {
                model: db.users,
                as: "user",
                attributes: ["id", "name", "email"],
              },
            ],
            order: [["created_at", "ASC"]],
          },
        ],
        order: [["created_at", "DESC"]], // Reverse chronological
        limit: limit,
        offset: offset,
      });

      // Transform posts to include engagement metrics
      const transformedPosts = posts.map((post) => {
        const likeCount = post.likes ? post.likes.length : 0;
        const isLikedByUser = post.likes
          ? post.likes.some((like) => like.user_id === userId)
          : false;

        return {
          id: post.id,
          authorId: post.user_id,
          authorName: post.user.name,
          authorAvatar: null, // Not implemented yet
          content: post.content,
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt ? post.updatedAt.toISOString() : null,
          isEdited: post.updatedAt && post.updatedAt > post.createdAt,
          likeCount: likeCount,
          isLikedByUser: isLikedByUser,
          commentCount: post.comments ? post.comments.length : 0,
          comments: post.comments
            ? post.comments.map((comment) => ({
                id: comment.id,
                authorId: comment.user_id,
                authorName: comment.user.name,
                authorAvatar: null,
                text: comment.text,
                createdAt: comment.created_at.toISOString(),
              }))
            : [],
          canEdit: post.user_id === userId,
          canDelete: post.user_id === userId,
        };
      });

      return {
        posts: transformedPosts,
        hasMore: offset + posts.length < total,
        total: total,
      };
    } catch (error) {
      console.error("Error getting cohort posts:", error);
      throw error;
    }
  }

  /**
   * Create a post in a cohort
   * Verifies enrollment and validates content
   * 
   * @param {number} cohortId - The cohort ID
   * @param {number} userId - The user ID
   * @param {string} content - The post content
   * @returns {Promise<Post>}
   * 
   * Requirements: 7.5, 7.6, 7.7, 7.8
   */
  async createPost(cohortId, userId, content) {
    try {
      // Validate content is not empty
      if (!content || content.trim().length === 0) {
        throw new Error("Post content cannot be empty");
      }

      // Validate content length (max 2000 characters)
      if (content.trim().length > 2000) {
        throw new Error("Post content cannot exceed 2000 characters");
      }

      // Verify user is enrolled in cohort
      const enrollment = await db.enrollments.findOne({
        where: {
          user_id: userId,
          cohort_id: cohortId,
        },
      });

      if (!enrollment) {
        throw new Error("You must be enrolled in this cohort to create posts");
      }

      // Create the post
      const post = await db.cohort_posts.create({
        cohort_id: cohortId,
        user_id: userId,
        content: content.trim(),
      });

      // Fetch the post with user details
      const createdPost = await db.cohort_posts.findByPk(post.id, {
        include: [
          {
            model: db.users,
            as: "user",
            attributes: ["id", "name", "email"],
          },
        ],
      });

      return {
        id: createdPost.id,
        authorId: createdPost.user_id,
        authorName: createdPost.user.name,
        authorAvatar: null,
        content: createdPost.content,
        createdAt: createdPost.createdAt.toISOString(),
        updatedAt: null,
        isEdited: false,
        likeCount: 0,
        isLikedByUser: false,
        commentCount: 0,
        comments: [],
        canEdit: true,
        canDelete: true,
      };
    } catch (error) {
      console.error("Error creating post:", error);
      throw error;
    }
  }

  /**
   * Update a post
   * Verifies ownership before allowing update
   * 
   * @param {string} postId - The post ID
   * @param {number} userId - The user ID (must be post author)
   * @param {string} content - The new post content
   * @returns {Promise<Post>}
   * 
   * Requirements: 7.14, 7.15
   */
  async updatePost(postId, userId, content) {
    try {
      // Validate content is not empty
      if (!content || content.trim().length === 0) {
        throw new Error("Post content cannot be empty");
      }

      // Validate content length (max 2000 characters)
      if (content.trim().length > 2000) {
        throw new Error("Post content cannot exceed 2000 characters");
      }

      // Find the post
      const post = await db.cohort_posts.findByPk(postId);

      if (!post) {
        throw new Error("Post not found");
      }

      // Verify ownership
      if (post.user_id !== userId) {
        throw new Error("You can only edit your own posts");
      }

      // Update the post
      await post.update({
        content: content.trim(),
      });

      // Fetch updated post with user details and engagement metrics
      const updatedPost = await db.cohort_posts.findByPk(postId, {
        include: [
          {
            model: db.users,
            as: "user",
            attributes: ["id", "name", "email"],
          },
          {
            model: db.post_likes,
            as: "likes",
            attributes: ["user_id"],
          },
          {
            model: db.post_comments,
            as: "comments",
            attributes: ["id"],
          },
        ],
      });

      const likeCount = updatedPost.likes ? updatedPost.likes.length : 0;
      const isLikedByUser = updatedPost.likes
        ? updatedPost.likes.some((like) => like.user_id === userId)
        : false;

      return {
        id: updatedPost.id,
        authorId: updatedPost.user_id,
        authorName: updatedPost.user.name,
        authorAvatar: null,
        content: updatedPost.content,
        createdAt: updatedPost.createdAt.toISOString(),
        updatedAt: updatedPost.updatedAt.toISOString(),
        isEdited: true,
        likeCount: likeCount,
        isLikedByUser: isLikedByUser,
        commentCount: updatedPost.comments ? updatedPost.comments.length : 0,
        comments: [],
        canEdit: true,
        canDelete: true,
      };
    } catch (error) {
      console.error("Error updating post:", error);
      throw error;
    }
  }

  /**
   * Delete a post
   * Verifies ownership before allowing deletion
   * Cascades to delete all likes and comments
   * 
   * @param {string} postId - The post ID
   * @param {number} userId - The user ID (must be post author)
   * @returns {Promise<{success: boolean}>}
   * 
   * Requirements: 7.14, 7.16
   */
  async deletePost(postId, userId) {
    try {
      // Find the post
      const post = await db.cohort_posts.findByPk(postId);

      if (!post) {
        throw new Error("Post not found");
      }

      // Verify ownership
      if (post.user_id !== userId) {
        throw new Error("You can only delete your own posts");
      }

      // Delete the post (likes and comments will cascade due to foreign key)
      await post.destroy();

      return {
        success: true,
      };
    } catch (error) {
      console.error("Error deleting post:", error);
      throw error;
    }
  }

  /**
   * Like a post
   * Creates a like record if it doesn't exist (idempotent)
   * 
   * @param {string} postId - The post ID
   * @param {number} userId - The user ID
   * @returns {Promise<{success: boolean, likeCount: number}>}
   * 
   * Requirements: 7.11, 7.12
   */
  async likePost(postId, userId) {
    try {
      // Verify post exists
      const post = await db.cohort_posts.findByPk(postId);

      if (!post) {
        throw new Error("Post not found");
      }

      // Create like (ignore if already exists due to unique constraint)
      await db.post_likes.findOrCreate({
        where: {
          post_id: postId,
          user_id: userId,
        },
        defaults: {
          post_id: postId,
          user_id: userId,
        },
      });

      // Get updated like count
      const likeCount = await db.post_likes.count({
        where: { post_id: postId },
      });

      return {
        success: true,
        likeCount: likeCount,
      };
    } catch (error) {
      console.error("Error liking post:", error);
      throw error;
    }
  }

  /**
   * Unlike a post
   * Removes the like record
   * 
   * @param {string} postId - The post ID
   * @param {number} userId - The user ID
   * @returns {Promise<{success: boolean, likeCount: number}>}
   * 
   * Requirements: 7.13
   */
  async unlikePost(postId, userId) {
    try {
      // Delete the like
      await db.post_likes.destroy({
        where: {
          post_id: postId,
          user_id: userId,
        },
      });

      // Get updated like count
      const likeCount = await db.post_likes.count({
        where: { post_id: postId },
      });

      return {
        success: true,
        likeCount: likeCount,
      };
    } catch (error) {
      console.error("Error unliking post:", error);
      throw error;
    }
  }

  /**
   * Add a comment to a post
   * Validates text content
   * 
   * @param {string} postId - The post ID
   * @param {number} userId - The user ID
   * @param {string} text - The comment text
   * @returns {Promise<PostComment>}
   * 
   * Requirements: 7.9, 7.10
   */
  async addPostComment(postId, userId, text) {
    try {
      // Validate text is not empty
      if (!text || text.trim().length === 0) {
        throw new Error("Comment text cannot be empty");
      }

      // Verify post exists
      const post = await db.cohort_posts.findByPk(postId);

      if (!post) {
        throw new Error("Post not found");
      }

      // Create the comment
      const comment = await db.post_comments.create({
        post_id: postId,
        user_id: userId,
        text: text.trim(),
      });

      // Fetch the comment with user details
      const createdComment = await db.post_comments.findByPk(comment.id, {
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
        text: createdComment.text,
        createdAt: createdComment.created_at.toISOString(),
      };
    } catch (error) {
      console.error("Error adding post comment:", error);
      throw error;
    }
  }
}

module.exports = new CommunityService();
