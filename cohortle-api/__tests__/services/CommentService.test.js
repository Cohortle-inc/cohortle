const CommentService = require("../../services/CommentService");
const db = require("../../models");

describe("CommentService", () => {
  let testUser1, testUser2, testLesson;

  beforeAll(async () => {
    // Create test users
    testUser1 = await db.users.create({
      name: "Test User 1",
      email: "testuser1@example.com",
      password: "hashedpassword",
      role: "learner",
    });

    testUser2 = await db.users.create({
      name: "Test User 2",
      email: "testuser2@example.com",
      password: "hashedpassword",
      role: "learner",
    });

    // Create test programme, cohort, week, and lesson
    const programme = await db.programmes.create({
      name: "Test Programme",
      description: "Test Description",
    });

    const cohort = await db.cohorts.create({
      programme_id: programme.id,
      name: "Test Cohort",
      start_date: "2024-01-01",
      end_date: "2024-12-31",
    });

    const week = await db.weeks.create({
      programme_id: programme.id,
      week_number: 1,
      title: "Test Week",
      start_date: "2024-01-01",
    });

    testLesson = await db.lessons.create({
      week_id: week.id,
      title: "Test Lesson",
      type: "text",
      order_index: 1,
    });
  });

  afterAll(async () => {
    // Clean up test data
    await db.lesson_comments.destroy({ where: {} });
    await db.lessons.destroy({ where: {} });
    await db.weeks.destroy({ where: {} });
    await db.cohorts.destroy({ where: {} });
    await db.programmes.destroy({ where: {} });
    await db.users.destroy({ where: { email: { [db.Sequelize.Op.like]: "testuser%@example.com" } } });
  });

  afterEach(async () => {
    // Clean up comments after each test
    await db.lesson_comments.destroy({ where: {} });
  });

  describe("createComment", () => {
    it("should create a root comment", async () => {
      const comment = await CommentService.createComment(
        testLesson.id,
        testUser1.id,
        "This is a test comment"
      );

      expect(comment).toBeDefined();
      expect(comment.text).toBe("This is a test comment");
      expect(comment.authorId).toBe(testUser1.id);
      expect(comment.authorName).toBe("Test User 1");
      expect(comment.isEdited).toBe(false);
      expect(comment.replies).toEqual([]);
    });

    it("should create a reply to a root comment", async () => {
      // Create root comment
      const rootComment = await CommentService.createComment(
        testLesson.id,
        testUser1.id,
        "Root comment"
      );

      // Create reply
      const reply = await CommentService.createComment(
        testLesson.id,
        testUser2.id,
        "Reply to root",
        rootComment.id
      );

      expect(reply).toBeDefined();
      expect(reply.text).toBe("Reply to root");
      expect(reply.authorId).toBe(testUser2.id);
    });

    it("should reject empty comment text", async () => {
      await expect(
        CommentService.createComment(testLesson.id, testUser1.id, "")
      ).rejects.toThrow("Comment text cannot be empty");

      await expect(
        CommentService.createComment(testLesson.id, testUser1.id, "   ")
      ).rejects.toThrow("Comment text cannot be empty");
    });

    it("should reject replies to replies (max 2 levels)", async () => {
      // Create root comment
      const rootComment = await CommentService.createComment(
        testLesson.id,
        testUser1.id,
        "Root comment"
      );

      // Create first-level reply
      const reply = await CommentService.createComment(
        testLesson.id,
        testUser2.id,
        "First level reply",
        rootComment.id
      );

      // Try to create second-level reply (should fail)
      await expect(
        CommentService.createComment(
          testLesson.id,
          testUser1.id,
          "Second level reply",
          reply.id
        )
      ).rejects.toThrow("Cannot reply to a reply");
    });

    it("should trim whitespace from comment text", async () => {
      const comment = await CommentService.createComment(
        testLesson.id,
        testUser1.id,
        "  Trimmed comment  "
      );

      expect(comment.text).toBe("Trimmed comment");
    });

    it("should reject reply to non-existent parent", async () => {
      await expect(
        CommentService.createComment(
          testLesson.id,
          testUser1.id,
          "Reply to nothing",
          99999
        )
      ).rejects.toThrow("Parent comment not found");
    });
  });

  describe("getLessonComments", () => {
    it("should return empty array for lesson with no comments", async () => {
      const comments = await CommentService.getLessonComments(testLesson.id);
      expect(comments).toEqual([]);
    });

    it("should return root comments sorted by newest first", async () => {
      // Create comments with slight delay to ensure different timestamps
      const comment1 = await CommentService.createComment(
        testLesson.id,
        testUser1.id,
        "First comment"
      );

      await new Promise((resolve) => setTimeout(resolve, 10));

      const comment2 = await CommentService.createComment(
        testLesson.id,
        testUser2.id,
        "Second comment"
      );

      const comments = await CommentService.getLessonComments(testLesson.id);

      expect(comments).toHaveLength(2);
      expect(comments[0].text).toBe("Second comment"); // Newest first
      expect(comments[1].text).toBe("First comment");
    });

    it("should build threaded structure with replies", async () => {
      // Create root comment
      const rootComment = await CommentService.createComment(
        testLesson.id,
        testUser1.id,
        "Root comment"
      );

      // Create two replies
      await CommentService.createComment(
        testLesson.id,
        testUser2.id,
        "Reply 1",
        rootComment.id
      );

      await CommentService.createComment(
        testLesson.id,
        testUser1.id,
        "Reply 2",
        rootComment.id
      );

      const comments = await CommentService.getLessonComments(testLesson.id);

      expect(comments).toHaveLength(1);
      expect(comments[0].text).toBe("Root comment");
      expect(comments[0].replies).toHaveLength(2);
      expect(comments[0].replies[0].text).toBe("Reply 1");
      expect(comments[0].replies[1].text).toBe("Reply 2");
    });

    it("should include user details in comments", async () => {
      await CommentService.createComment(
        testLesson.id,
        testUser1.id,
        "Test comment"
      );

      const comments = await CommentService.getLessonComments(testLesson.id);

      expect(comments[0].authorId).toBe(testUser1.id);
      expect(comments[0].authorName).toBe("Test User 1");
    });
  });

  describe("updateComment", () => {
    it("should update comment text", async () => {
      const comment = await CommentService.createComment(
        testLesson.id,
        testUser1.id,
        "Original text"
      );

      const updated = await CommentService.updateComment(
        comment.id,
        testUser1.id,
        "Updated text"
      );

      expect(updated.text).toBe("Updated text");
      expect(updated.isEdited).toBe(true);
    });

    it("should reject update by non-owner", async () => {
      const comment = await CommentService.createComment(
        testLesson.id,
        testUser1.id,
        "Original text"
      );

      await expect(
        CommentService.updateComment(comment.id, testUser2.id, "Hacked text")
      ).rejects.toThrow("You can only edit your own comments");
    });

    it("should reject empty update text", async () => {
      const comment = await CommentService.createComment(
        testLesson.id,
        testUser1.id,
        "Original text"
      );

      await expect(
        CommentService.updateComment(comment.id, testUser1.id, "")
      ).rejects.toThrow("Comment text cannot be empty");
    });

    it("should reject update of non-existent comment", async () => {
      await expect(
        CommentService.updateComment(99999, testUser1.id, "New text")
      ).rejects.toThrow("Comment not found");
    });

    it("should trim whitespace from updated text", async () => {
      const comment = await CommentService.createComment(
        testLesson.id,
        testUser1.id,
        "Original text"
      );

      const updated = await CommentService.updateComment(
        comment.id,
        testUser1.id,
        "  Updated text  "
      );

      expect(updated.text).toBe("Updated text");
    });
  });

  describe("deleteComment", () => {
    it("should delete a comment", async () => {
      const comment = await CommentService.createComment(
        testLesson.id,
        testUser1.id,
        "To be deleted"
      );

      const result = await CommentService.deleteComment(
        comment.id,
        testUser1.id
      );

      expect(result.success).toBe(true);

      // Verify comment is deleted
      const comments = await CommentService.getLessonComments(testLesson.id);
      expect(comments).toHaveLength(0);
    });

    it("should reject deletion by non-owner", async () => {
      const comment = await CommentService.createComment(
        testLesson.id,
        testUser1.id,
        "Protected comment"
      );

      await expect(
        CommentService.deleteComment(comment.id, testUser2.id)
      ).rejects.toThrow("You can only delete your own comments");
    });

    it("should reject deletion of non-existent comment", async () => {
      await expect(
        CommentService.deleteComment(99999, testUser1.id)
      ).rejects.toThrow("Comment not found");
    });

    it("should cascade delete replies when root comment is deleted", async () => {
      // Create root comment
      const rootComment = await CommentService.createComment(
        testLesson.id,
        testUser1.id,
        "Root comment"
      );

      // Create reply
      await CommentService.createComment(
        testLesson.id,
        testUser2.id,
        "Reply",
        rootComment.id
      );

      // Delete root comment
      await CommentService.deleteComment(rootComment.id, testUser1.id);

      // Verify all comments are deleted
      const comments = await CommentService.getLessonComments(testLesson.id);
      expect(comments).toHaveLength(0);
    });
  });
});
