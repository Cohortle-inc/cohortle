'use strict';

/**
 * AssignmentService
 *
 * Handles assignment data validation, submission persistence, file attachment,
 * convener grading, and completion side-effects.
 *
 * Mirrors the QuizService pattern.
 * Requirements: 1.2, 2.4, 2.6, 3.4, 4.2–4.6, 6.1–6.4, 7.2–7.4
 */

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

class AssignmentService {
  /**
   * Validate the structure of an assignment_data object.
   * Throws ValidationError with a descriptive message on failure.
   *
   * @param {object} data
   */
  validateAssignmentData(data) {
    if (!data || typeof data !== 'object') {
      throw new ValidationError('assignment_data must be a valid JSON object');
    }

    if (!data.instructions || typeof data.instructions !== 'string' || data.instructions.trim() === '') {
      throw new ValidationError('Assignment instructions are required');
    }

    if (data.instructions.length > 5000) {
      throw new ValidationError('Instructions must be 5000 characters or fewer');
    }

    if (data.due_date !== undefined && data.due_date !== null) {
      const d = new Date(data.due_date);
      if (isNaN(d.getTime())) {
        throw new ValidationError('due_date must be a valid ISO date string');
      }
    }

    if (data.allow_text_answer !== undefined && typeof data.allow_text_answer !== 'boolean') {
      throw new ValidationError('allow_text_answer must be a boolean');
    }

    if (data.allow_file_uploads !== undefined && typeof data.allow_file_uploads !== 'boolean') {
      throw new ValidationError('allow_file_uploads must be a boolean');
    }

    if (data.max_file_size_mb !== undefined && data.max_file_size_mb !== null) {
      const mb = Number(data.max_file_size_mb);
      if (!Number.isInteger(mb) || mb <= 0) {
        throw new ValidationError('max_file_size_mb must be a positive integer');
      }
    }

    if (data.allowed_file_types !== undefined && !Array.isArray(data.allowed_file_types)) {
      throw new ValidationError('allowed_file_types must be an array');
    }
  }

  /**
   * Get assignment details + the authenticated learner's own submission.
   *
   * @param {number} lessonId
   * @param {number} userId
   * @param {number} cohortId
   * @returns {Promise<{ lesson_id, assignment_data, submission: object|null }>}
   */
  async getAssignmentForLearner(lessonId, userId, cohortId) {
    const BackendSDK = require('../core/BackendSDK');
    const sdk = new BackendSDK();

    // Fetch lesson
    sdk.setTable('module_lessons');
    const lesson = (await sdk.get({ id: lessonId }))[0];
    if (!lesson) {
      const err = new Error('Lesson not found');
      err.statusCode = 404;
      throw err;
    }
    if (lesson.type !== 'assignment') {
      throw new ValidationError('Lesson is not an assignment');
    }

    // Verify learner is enrolled in this cohort
    sdk.setTable('enrollments');
    const enrollment = (await sdk.get({ user_id: userId, cohort_id: cohortId }))[0];
    if (!enrollment) {
      const err = new Error('You are not enrolled in this cohort');
      err.statusCode = 403;
      throw err;
    }

    let assignmentData;
    try {
      assignmentData = typeof lesson.assignment_data === 'string'
        ? JSON.parse(lesson.assignment_data)
        : lesson.assignment_data;
    } catch {
      assignmentData = null;
    }

    // Fetch learner's submission
    const submissions = await sdk.rawQuery(
      `SELECT s.*, GROUP_CONCAT(
         JSON_OBJECT(
           'id', f.id,
           'file_name', f.file_name,
           'file_url', f.file_url,
           'file_type', f.file_type,
           'file_size', f.file_size,
           'uploaded_at', f.uploaded_at
         )
       ) AS files_json
       FROM assignment_submissions s
       LEFT JOIN assignment_submission_files f ON f.submission_id = s.id
       WHERE s.lesson_id = ${lessonId}
         AND s.user_id = ${userId}
         AND s.cohort_id = ${cohortId}
       GROUP BY s.id
       LIMIT 1`
    );

    let submission = null;
    if (submissions && submissions.length > 0) {
      submission = this._parseSubmission(submissions[0]);
    }

    return {
      lesson_id: lessonId,
      assignment_data: assignmentData,
      submission,
    };
  }

  /**
   * Submit (or re-submit) an assignment.
   * Uses INSERT ... ON DUPLICATE KEY UPDATE for idempotency.
   * Triggers completion side-effects on success.
   *
   * @param {number} userId
   * @param {number} lessonId
   * @param {number} cohortId
   * @param {string|null} textAnswer
   * @returns {Promise<object>} The submission record
   */
  async submitAssignment(userId, lessonId, cohortId, textAnswer) {
    const BackendSDK = require('../core/BackendSDK');
    const sdk = new BackendSDK();

    // Verify lesson exists and is an assignment
    sdk.setTable('module_lessons');
    const lesson = (await sdk.get({ id: lessonId }))[0];
    if (!lesson) {
      const err = new Error('Lesson not found');
      err.statusCode = 404;
      throw err;
    }
    if (lesson.type !== 'assignment') {
      throw new ValidationError('Lesson is not an assignment');
    }

    // Verify enrollment
    sdk.setTable('enrollments');
    const enrollment = (await sdk.get({ user_id: userId, cohort_id: cohortId }))[0];
    if (!enrollment) {
      const err = new Error('You are not enrolled in this cohort');
      err.statusCode = 403;
      throw err;
    }

    const now = new Date();
    const textAnswerEscaped = textAnswer
      ? textAnswer.replace(/'/g, "''")
      : null;
    const textAnswerSql = textAnswerEscaped !== null
      ? `'${textAnswerEscaped}'`
      : 'NULL';

    // Upsert: insert or update on duplicate (lesson_id, user_id, cohort_id)
    await sdk.rawQuery(`
      INSERT INTO assignment_submissions
        (lesson_id, user_id, cohort_id, text_answer, status, grading_status, submitted_at, created_at, updated_at)
      VALUES
        (${lessonId}, ${userId}, ${cohortId}, ${textAnswerSql}, 'submitted', 'pending', '${now.toISOString().slice(0, 19).replace('T', ' ')}', NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        text_answer = ${textAnswerSql},
        status = 'submitted',
        grading_status = 'pending',
        submitted_at = '${now.toISOString().slice(0, 19).replace('T', ' ')}',
        updated_at = NOW()
    `);

    // Fetch the upserted record
    const rows = await sdk.rawQuery(
      `SELECT * FROM assignment_submissions
       WHERE lesson_id = ${lessonId} AND user_id = ${userId} AND cohort_id = ${cohortId}
       LIMIT 1`
    );
    const submission = rows[0];

    // Trigger completion side-effects
    try {
      const ProgressService = require('./ProgressService');
      await ProgressService.markLessonComplete(userId, String(lessonId), cohortId);

      const StreakService = require('./StreakService');
      await StreakService.recalculateStreak(userId);

      const AchievementService = require('./AchievementService');
      await AchievementService.evaluateAchievements(userId);
    } catch (err) {
      console.error('[AssignmentService] Post-submission side effects failed:', err);
    }

    return { ...submission, files: [] };
  }

  /**
   * Attach uploaded files to an existing submission.
   *
   * @param {number} submissionId
   * @param {Array<{ file_name, file_url, file_type, file_size }>} files
   * @returns {Promise<Array>} Inserted file records
   */
  async attachFiles(submissionId, files) {
    if (!files || files.length === 0) return [];

    const BackendSDK = require('../core/BackendSDK');
    const sdk = new BackendSDK();

    const inserted = [];
    for (const file of files) {
      const fileNameEscaped = file.file_name.replace(/'/g, "''");
      const fileUrlEscaped = file.file_url.replace(/'/g, "''");
      const fileType = file.file_type ? `'${file.file_type.replace(/'/g, "''")}'` : 'NULL';
      const fileSize = file.file_size ? Number(file.file_size) : 'NULL';

      await sdk.rawQuery(`
        INSERT INTO assignment_submission_files
          (submission_id, file_name, file_url, file_type, file_size, uploaded_at)
        VALUES
          (${submissionId}, '${fileNameEscaped}', '${fileUrlEscaped}', ${fileType}, ${fileSize}, NOW())
      `);
      inserted.push(file);
    }

    return inserted;
  }

  /**
   * Get all submissions for a lesson (convener view).
   * Verifies the convener owns the programme containing this lesson.
   *
   * @param {number} lessonId
   * @param {number} convenerUserId
   * @returns {Promise<Array>}
   */
  async getSubmissionsForLesson(lessonId, convenerUserId) {
    const BackendSDK = require('../core/BackendSDK');
    const sdk = new BackendSDK();

    // Verify ownership
    const ownershipCheck = await sdk.rawQuery(`
      SELECT ml.id
      FROM module_lessons ml
      JOIN programme_modules pm ON ml.module_id = pm.id
      JOIN programmes p ON pm.programme_id = p.id
      WHERE ml.id = ${lessonId}
        AND p.created_by = ${convenerUserId}
      LIMIT 1
    `);

    if (!ownershipCheck || ownershipCheck.length === 0) {
      const err = new Error('Lesson not found or access denied');
      err.statusCode = 403;
      throw err;
    }

    const rows = await sdk.rawQuery(`
      SELECT
        s.id AS submission_id,
        s.user_id AS learner_id,
        CONCAT(u.first_name, ' ', u.last_name) AS learner_name,
        u.email AS learner_email,
        s.status,
        s.grading_status,
        s.text_answer,
        s.feedback,
        s.submitted_at,
        s.graded_at,
        GROUP_CONCAT(
          JSON_OBJECT(
            'id', f.id,
            'file_name', f.file_name,
            'file_url', f.file_url,
            'file_type', f.file_type,
            'file_size', f.file_size,
            'uploaded_at', f.uploaded_at
          )
        ) AS files_json
      FROM assignment_submissions s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN assignment_submission_files f ON f.submission_id = s.id
      WHERE s.lesson_id = ${lessonId}
      GROUP BY s.id
      ORDER BY s.submitted_at DESC
    `);

    return (rows || []).map(row => ({
      submission_id: row.submission_id,
      learner_id: row.learner_id,
      learner_name: row.learner_name,
      learner_email: row.learner_email,
      status: row.status,
      grading_status: row.grading_status,
      text_answer: row.text_answer,
      feedback: row.feedback,
      submitted_at: row.submitted_at,
      graded_at: row.graded_at,
      files: this._parseFilesJson(row.files_json),
    }));
  }

  /**
   * Grade a submission (convener only).
   * Verifies the convener owns the programme via the submission's lesson.
   *
   * @param {number} submissionId
   * @param {number} convenerUserId
   * @param {'passed'|'failed'} gradingStatus
   * @param {string|null} feedback
   * @returns {Promise<object>} Updated submission
   */
  async gradeSubmission(submissionId, convenerUserId, gradingStatus, feedback) {
    if (!['passed', 'failed'].includes(gradingStatus)) {
      throw new ValidationError('grading_status must be "passed" or "failed"');
    }

    const BackendSDK = require('../core/BackendSDK');
    const sdk = new BackendSDK();

    // Verify submission exists and convener owns the programme
    const ownershipCheck = await sdk.rawQuery(`
      SELECT s.id
      FROM assignment_submissions s
      JOIN module_lessons ml ON s.lesson_id = ml.id
      JOIN programme_modules pm ON ml.module_id = pm.id
      JOIN programmes p ON pm.programme_id = p.id
      WHERE s.id = ${submissionId}
        AND p.created_by = ${convenerUserId}
      LIMIT 1
    `);

    if (!ownershipCheck || ownershipCheck.length === 0) {
      const err = new Error('Submission not found or access denied');
      err.statusCode = 403;
      throw err;
    }

    const feedbackEscaped = feedback ? feedback.replace(/'/g, "''") : null;
    const feedbackSql = feedbackEscaped !== null ? `'${feedbackEscaped}'` : 'NULL';

    await sdk.rawQuery(`
      UPDATE assignment_submissions
      SET
        grading_status = '${gradingStatus}',
        status = 'graded',
        feedback = ${feedbackSql},
        graded_at = NOW(),
        updated_at = NOW()
      WHERE id = ${submissionId}
    `);

    const rows = await sdk.rawQuery(
      `SELECT * FROM assignment_submissions WHERE id = ${submissionId} LIMIT 1`
    );

    return rows[0] || null;
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  _parseSubmission(row) {
    if (!row) return null;
    return {
      id: row.id,
      lesson_id: row.lesson_id,
      user_id: row.user_id,
      cohort_id: row.cohort_id,
      text_answer: row.text_answer,
      status: row.status,
      grading_status: row.grading_status,
      feedback: row.feedback,
      submitted_at: row.submitted_at,
      graded_at: row.graded_at,
      files: this._parseFilesJson(row.files_json),
    };
  }

  _parseFilesJson(filesJson) {
    if (!filesJson) return [];
    try {
      // GROUP_CONCAT produces a comma-separated list of JSON objects
      // Wrap in array brackets to parse
      const parsed = JSON.parse(`[${filesJson}]`);
      // Filter out null entries (from LEFT JOIN with no files)
      return parsed.filter(f => f && f.id !== null);
    } catch {
      return [];
    }
  }
}

module.exports = new AssignmentService();
module.exports.AssignmentService = AssignmentService;
module.exports.ValidationError = ValidationError;
