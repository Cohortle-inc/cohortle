'use strict';

/**
 * QuizService
 *
 * Handles quiz data validation, score calculation, attempt persistence,
 * and results retrieval for the native quiz system.
 *
 * Requirements: 1.3, 1.4, 1.5, 1.10, 2.1, 2.2, 4.6, 4.7, 5.1–5.5, 7.1–7.5, 8.1–8.5
 */

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

class QuizService {
  /**
   * Validate the structure of a quiz_data object.
   * Throws ValidationError with a descriptive message on failure.
   *
   * @param {object} quizData
   */
  validateQuizData(quizData) {
    if (!quizData || typeof quizData !== 'object') {
      throw new ValidationError('quiz_data must be valid JSON');
    }

    const { questions, settings } = quizData;

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new ValidationError('Quiz must contain at least one question');
    }

    for (const q of questions) {
      if (!q.id || typeof q.id !== 'string') {
        throw new ValidationError('Each question must have a string id');
      }
      if (!['multiple-choice', 'true-false', 'text-input'].includes(q.type)) {
        throw new ValidationError(`Invalid question type: ${q.type}`);
      }
      if (!q.question || typeof q.question !== 'string') {
        throw new ValidationError('Each question must have a question text');
      }

      if (q.type === 'multiple-choice') {
        if (!Array.isArray(q.options) || q.options.length < 2) {
          throw new ValidationError('Multiple-choice questions require at least 2 options');
        }
        if (q.correctAnswer === undefined || q.correctAnswer === null) {
          throw new ValidationError('Multiple-choice questions require a correct answer');
        }
      }

      if (q.type === 'text-input') {
        if (
          q.correctAnswer === undefined ||
          q.correctAnswer === null ||
          String(q.correctAnswer).trim() === ''
        ) {
          throw new ValidationError('Text-input questions require a correct answer');
        }
      }

      if (q.type === 'true-false') {
        const val = String(q.correctAnswer).toLowerCase();
        if (val !== 'true' && val !== 'false') {
          throw new ValidationError('True/false questions require "true" or "false" as the correct answer');
        }
      }
    }

    if (settings) {
      if (settings.passing_score !== null && settings.passing_score !== undefined) {
        const ps = Number(settings.passing_score);
        if (!Number.isInteger(ps) || ps < 1 || ps > 100) {
          throw new ValidationError('Passing score must be between 1 and 100');
        }
      }
      if (settings.time_limit !== null && settings.time_limit !== undefined) {
        const tl = Number(settings.time_limit);
        if (!Number.isInteger(tl) || tl <= 0) {
          throw new ValidationError('Time limit must be a positive integer');
        }
      }
    }
  }

  /**
   * Calculate the score for a set of answers against quiz questions.
   * Pure function — no side effects.
   *
   * Score = round((correct_count / total_questions) * 100)
   *
   * @param {Array} questions  - QuizQuestion[]
   * @param {object} answers   - Record<questionId, answer>
   * @returns {number} score 0–100
   */
  calculateScore(questions, answers) {
    if (!questions || questions.length === 0) return 0;

    let correctCount = 0;

    for (const question of questions) {
      const userAnswer = answers[question.id];
      if (userAnswer === undefined || userAnswer === null) continue;

      const normalizedUser = String(userAnswer).trim().toLowerCase();
      const normalizedCorrect = String(question.correctAnswer).trim().toLowerCase();

      if (normalizedUser === normalizedCorrect) {
        correctCount++;
      }
    }

    return Math.round((correctCount / questions.length) * 100);
  }

  /**
   * Determine whether a score meets the passing threshold.
   *
   * @param {number} score
   * @param {number|null} passingScore - null means no threshold (always passes)
   * @returns {boolean}
   */
  isPassing(score, passingScore) {
    if (passingScore === null || passingScore === undefined) return true;
    return score >= passingScore;
  }

  /**
   * Submit a quiz attempt: calculate score, persist, trigger completion side-effects.
   *
   * @param {number} userId
   * @param {number} lessonId
   * @param {number} cohortId
   * @param {object} answers  - Record<questionId, answer>
   * @returns {Promise<{ attempt: object, lessonMarkedComplete: boolean }>}
   */
  async submitAttempt(userId, lessonId, cohortId, answers) {
    const BackendSDK = require('../core/BackendSDK');
    const sdk = new BackendSDK();

    // Fetch lesson and verify it's a quiz
    sdk.setTable('module_lessons');
    const lesson = (await sdk.get({ id: lessonId }))[0];
    if (!lesson) {
      const err = new Error('Lesson not found');
      err.statusCode = 404;
      throw err;
    }
    if (lesson.type !== 'quiz') {
      throw new ValidationError('Lesson is not a quiz');
    }

    let quizData;
    try {
      quizData = typeof lesson.quiz_data === 'string'
        ? JSON.parse(lesson.quiz_data)
        : lesson.quiz_data;
    } catch {
      throw new ValidationError('quiz_data must be valid JSON');
    }

    if (!quizData || !Array.isArray(quizData.questions)) {
      throw new ValidationError('Quiz must contain at least one question');
    }

    // Validate all questions are answered
    for (const q of quizData.questions) {
      if (answers[q.id] === undefined || answers[q.id] === null) {
        throw new ValidationError('All questions must be answered before submitting');
      }
    }

    const score = this.calculateScore(quizData.questions, answers);
    const passingScore = quizData.settings?.passing_score ?? null;
    const passed = this.isPassing(score, passingScore);

    // Persist attempt
    sdk.setTable('quiz_attempts');
    const attemptId = await sdk.insert({
      lesson_id: lessonId,
      user_id: userId,
      cohort_id: cohortId,
      answers: JSON.stringify(answers),
      score,
      passed: passed ? 1 : 0,
      submitted_at: new Date(),
    });

    const attempt = (await sdk.get({ id: attemptId }))[0];

    // Mark lesson complete if passing
    let lessonMarkedComplete = false;
    if (passed) {
      try {
        const ProgressService = require('./ProgressService');
        await ProgressService.markLessonComplete(userId, String(lessonId), cohortId);
        lessonMarkedComplete = true;

        const StreakService = require('./StreakService');
        await StreakService.recalculateStreak(userId);

        const AchievementService = require('./AchievementService');
        await AchievementService.evaluateAchievements(userId);
      } catch (err) {
        console.error('[QuizService] Post-completion side effects failed:', err);
      }
    }

    return {
      attempt: {
        ...attempt,
        answers: typeof attempt.answers === 'string' ? JSON.parse(attempt.answers) : attempt.answers,
        passed: !!attempt.passed,
      },
      lessonMarkedComplete,
    };
  }

  /**
   * Get the most recent quiz attempt for a learner on a specific lesson/cohort.
   *
   * @param {number} userId
   * @param {number} lessonId
   * @param {number} cohortId
   * @returns {Promise<object|null>}
   */
  async getLatestAttempt(userId, lessonId, cohortId) {
    const BackendSDK = require('../core/BackendSDK');
    const sdk = new BackendSDK();

    const rows = await sdk.rawQuery(
      `SELECT * FROM quiz_attempts
       WHERE lesson_id = ${lessonId}
         AND user_id = ${userId}
         AND cohort_id = ${cohortId}
       ORDER BY submitted_at DESC
       LIMIT 1`
    );

    if (!rows || rows.length === 0) return null;

    const attempt = rows[0];
    return {
      ...attempt,
      answers: typeof attempt.answers === 'string' ? JSON.parse(attempt.answers) : attempt.answers,
      passed: !!attempt.passed,
    };
  }

  /**
   * Get all learner attempts for a lesson (convener view).
   * Returns one row per learner: their latest attempt + total attempt count.
   * Only returns attempts from learners enrolled in cohorts belonging to the
   * convener's programmes.
   *
   * @param {number} lessonId
   * @param {number} convenerUserId
   * @returns {Promise<Array>}
   */
  async getResultsForLesson(lessonId, convenerUserId) {
    const BackendSDK = require('../core/BackendSDK');
    const sdk = new BackendSDK();

    // Verify the lesson belongs to a programme owned by this convener
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

    // Fetch latest attempt per learner + attempt count
    const results = await sdk.rawQuery(`
      SELECT
        qa.user_id,
        CONCAT(u.first_name, ' ', u.last_name) AS learner_name,
        qa.score AS latest_score,
        qa.passed,
        qa.answers,
        qa.submitted_at AS last_submitted_at,
        attempt_counts.attempt_count
      FROM quiz_attempts qa
      JOIN users u ON qa.user_id = u.id
      JOIN (
        SELECT user_id, cohort_id, MAX(submitted_at) AS max_submitted_at, COUNT(*) AS attempt_count
        FROM quiz_attempts
        WHERE lesson_id = ${lessonId}
        GROUP BY user_id, cohort_id
      ) attempt_counts
        ON qa.user_id = attempt_counts.user_id
        AND qa.cohort_id = attempt_counts.cohort_id
        AND qa.submitted_at = attempt_counts.max_submitted_at
      WHERE qa.lesson_id = ${lessonId}
      ORDER BY qa.submitted_at DESC
    `);

    return (results || []).map(row => ({
      ...row,
      answers: typeof row.answers === 'string' ? JSON.parse(row.answers) : row.answers,
      passed: !!row.passed,
    }));
  }
}

module.exports = new QuizService();
module.exports.QuizService = QuizService;
module.exports.ValidationError = ValidationError;
