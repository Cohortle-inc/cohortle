const TokenMiddleware = require('../middleware/TokenMiddleware');
const AssignmentService = require('../services/AssignmentService');
const { upload, uploadToBunny } = require('../config/bunnyStream');

module.exports = function (app) {

  /**
   * @swagger
   * /v1/api/cohorts/{cohort_id}/assignment-statuses:
   *   get:
   *     summary: Get assignment submission statuses for the authenticated learner in a cohort
   *     tags: [Assignments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: cohort_id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       '200':
   *         description: Map of lesson_id to submission status
   */
  app.get(
    '/v1/api/cohorts/:cohort_id/assignment-statuses',
    [TokenMiddleware({ role: 'learner' })],
    async (req, res) => {
      try {
        const { cohort_id } = req.params;
        const userId = req.user.id;

        // Validate cohort_id is a positive integer before interpolating into SQL
        const cohortIdNum = parseInt(cohort_id, 10);
        if (!Number.isInteger(cohortIdNum) || cohortIdNum <= 0) {
          return res.status(400).json({ error: true, message: 'Invalid cohort_id' });
        }

        const BackendSDK = require('../core/BackendSDK');
        const sdk = new BackendSDK();

        const rows = await sdk.rawQuery(`
          SELECT s.lesson_id, s.status, s.grading_status
          FROM assignment_submissions s
          WHERE s.user_id = ${userId}
            AND s.cohort_id = ${cohortIdNum}
        `);

        // Build a map: lesson_id -> status string
        const statuses = {};
        for (const row of (rows || [])) {
          if (row.status === 'graded') {
            statuses[row.lesson_id] = row.grading_status === 'passed' ? 'passed' : 'needs_revision';
          } else {
            statuses[row.lesson_id] = 'submitted';
          }
        }

        return res.status(200).json({ error: false, statuses });
      } catch (err) {
        console.error('[GET /cohorts/:cohort_id/assignment-statuses]', err);
        return res.status(err.statusCode || 500).json({ error: true, message: err.message });
      }
    }
  );

  /**
   * @swagger
   * /v1/api/lessons/{lesson_id}/assignment:
   *   get:
   *     summary: Get assignment details and learner's own submission
   *     tags: [Assignments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: lesson_id
   *         required: true
   *         schema:
   *           type: integer
   *       - in: query
   *         name: cohort_id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       '200':
   *         description: Assignment details with learner submission
   *       '403':
   *         description: Not enrolled in cohort
   *       '404':
   *         description: Lesson not found
   */
  app.get(
    '/v1/api/lessons/:lesson_id/assignment',
    [TokenMiddleware({ role: 'learner' })],
    async (req, res) => {
      try {
        const { lesson_id } = req.params;
        const { cohort_id } = req.query;
        const userId = req.user.id;

        if (!cohort_id) {
          return res.status(400).json({ error: true, message: 'cohort_id query parameter is required' });
        }

        const result = await AssignmentService.getAssignmentForLearner(
          Number(lesson_id),
          userId,
          Number(cohort_id)
        );

        return res.status(200).json({ error: false, ...result });
      } catch (err) {
        console.error('[GET /assignment]', err);
        return res.status(err.statusCode || 500).json({ error: true, message: err.message });
      }
    }
  );

  /**
   * @swagger
   * /v1/api/lessons/{lesson_id}/assignment/submit:
   *   post:
   *     summary: Submit (or re-submit) an assignment
   *     tags: [Assignments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: lesson_id
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
   *               - cohort_id
   *             properties:
   *               cohort_id:
   *                 type: integer
   *               text_answer:
   *                 type: string
   *     responses:
   *       '200':
   *         description: Submission created or updated
   *       '403':
   *         description: Not enrolled in cohort
   *       '404':
   *         description: Lesson not found
   */
  app.post(
    '/v1/api/lessons/:lesson_id/assignment/submit',
    [TokenMiddleware({ role: 'learner' })],
    async (req, res) => {
      try {
        const { lesson_id } = req.params;
        const { cohort_id, text_answer } = req.body;
        const userId = req.user.id;

        if (!cohort_id) {
          return res.status(400).json({ error: true, message: 'cohort_id is required' });
        }

        const submission = await AssignmentService.submitAssignment(
          userId,
          Number(lesson_id),
          Number(cohort_id),
          text_answer || null
        );

        return res.status(200).json({ error: false, message: 'Assignment submitted successfully', submission });
      } catch (err) {
        console.error('[POST /assignment/submit]', err);
        return res.status(err.statusCode || 500).json({ error: true, message: err.message });
      }
    }
  );

  /**
   * @swagger
   * /v1/api/lessons/{lesson_id}/assignment/submit/files:
   *   post:
   *     summary: Upload files for an assignment submission
   *     tags: [Assignments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: lesson_id
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required:
   *               - cohort_id
   *             properties:
   *               cohort_id:
   *                 type: integer
   *     responses:
   *       '200':
   *         description: Files uploaded and attached to submission
   */
  app.post(
    '/v1/api/lessons/:lesson_id/assignment/submit/files',
    [TokenMiddleware({ role: 'learner' }), upload.array('files', 10)],
    async (req, res) => {
      try {
        const { lesson_id } = req.params;
        const { cohort_id } = req.body;
        const userId = req.user.id;
        const uploadedFiles = req.files || [];

        if (!cohort_id) {
          return res.status(400).json({ error: true, message: 'cohort_id is required' });
        }

        if (uploadedFiles.length === 0) {
          return res.status(400).json({ error: true, message: 'No files provided' });
        }

        // Ensure submission exists (create if not)
        const submission = await AssignmentService.submitAssignment(
          userId,
          Number(lesson_id),
          Number(cohort_id),
          null
        );

        // Build file records — use Bunny CDN URL if available, else local path
        const fileRecords = uploadedFiles.map(f => ({
          file_name: f.originalname,
          file_url: f.cdnUrl || f.path || f.filename,
          file_type: f.mimetype,
          file_size: f.size,
        }));

        const files = await AssignmentService.attachFiles(submission.id, fileRecords);

        return res.status(200).json({ error: false, message: 'Files uploaded successfully', files });
      } catch (err) {
        console.error('[POST /assignment/submit/files]', err);
        return res.status(err.statusCode || 500).json({ error: true, message: err.message });
      }
    }
  );

  /**
   * @swagger
   * /v1/api/lessons/{lesson_id}/assignment/submissions:
   *   get:
   *     summary: Get all submissions for a lesson (convener only)
   *     tags: [Assignments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: lesson_id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       '200':
   *         description: List of submissions with learner info and files
   *       '403':
   *         description: Access denied
   */
  app.get(
    '/v1/api/lessons/:lesson_id/assignment/submissions',
    [TokenMiddleware({ role: 'convener' })],
    async (req, res) => {
      try {
        const { lesson_id } = req.params;
        const convenerUserId = req.user.id;

        const submissions = await AssignmentService.getSubmissionsForLesson(
          Number(lesson_id),
          convenerUserId
        );

        return res.status(200).json({ error: false, submissions });
      } catch (err) {
        console.error('[GET /assignment/submissions]', err);
        return res.status(err.statusCode || 500).json({ error: true, message: err.message });
      }
    }
  );

  /**
   * @swagger
   * /v1/api/assignment-submissions/{submission_id}/grade:
   *   post:
   *     summary: Grade an assignment submission (convener only)
   *     tags: [Assignments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: submission_id
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
   *               - status
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [passed, failed]
   *               feedback:
   *                 type: string
   *     responses:
   *       '200':
   *         description: Submission graded
   *       '403':
   *         description: Access denied
   *       '404':
   *         description: Submission not found
   */
  app.post(
    '/v1/api/assignment-submissions/:submission_id/grade',
    [TokenMiddleware({ role: 'convener' })],
    async (req, res) => {
      try {
        const { submission_id } = req.params;
        const { status, feedback } = req.body;
        const convenerUserId = req.user.id;

        if (!status) {
          return res.status(400).json({ error: true, message: 'status is required (passed or failed)' });
        }

        const submission = await AssignmentService.gradeSubmission(
          Number(submission_id),
          convenerUserId,
          status,
          feedback || null
        );

        return res.status(200).json({ error: false, message: 'Submission graded successfully', submission });
      } catch (err) {
        console.error('[POST /assignment-submissions/grade]', err);
        return res.status(err.statusCode || 500).json({ error: true, message: err.message });
      }
    }
  );
};
