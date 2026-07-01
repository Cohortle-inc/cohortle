/**
 * Logger service for access control events
 * Handles logging of access violations, validation errors, and security events
 */
class AccessControlLogger {
  /**
   * Log an access control violation
   * @param {number} userId - User ID attempting access
   * @param {number} postId - Post ID being accessed
   * @param {string} reason - Reason for access denial
   * @param {Object} context - Additional context (optional)
   */
  logAccessViolation(userId, postId, reason, context = {}) {
    const logEntry = {
      type: 'ACCESS_VIOLATION',
      userId,
      postId,
      reason,
      context,
      timestamp: new Date().toISOString(),
    };

    console.error('[ACCESS_VIOLATION]', JSON.stringify(logEntry));
  }

  /**
   * Log a validation error
   * @param {number} userId - User ID making the request
   * @param {string} endpoint - API endpoint where validation failed
   * @param {Object} validationErrors - Validation error details
   * @param {Object} context - Additional context (optional)
   */
  logValidationError(userId, endpoint, validationErrors, context = {}) {
    const logEntry = {
      type: 'VALIDATION_ERROR',
      userId,
      endpoint,
      errors: validationErrors,
      context,
      timestamp: new Date().toISOString(),
    };

    console.warn('[VALIDATION_ERROR]', JSON.stringify(logEntry));
  }

  /**
   * Log a successful access control check
   * @param {number} userId - User ID
   * @param {number} postId - Post ID
   * @param {string} action - Action performed (e.g., 'view', 'comment')
   */
  logAccessGranted(userId, postId, action) {
    const logEntry = {
      type: 'ACCESS_GRANTED',
      userId,
      postId,
      action,
      timestamp: new Date().toISOString(),
    };

    console.info('[ACCESS_GRANTED]', JSON.stringify(logEntry));
  }

  /**
   * Log a database error during access control
   * @param {string} operation - Operation being performed
   * @param {Error} error - Error object
   * @param {Object} context - Additional context
   */
  logDatabaseError(operation, error, context = {}) {
    const logEntry = {
      type: 'DATABASE_ERROR',
      operation,
      error: {
        message: error.message,
        stack: error.stack,
      },
      context,
      timestamp: new Date().toISOString(),
    };

    console.error('[DATABASE_ERROR]', JSON.stringify(logEntry));
  }

  /**
   * Log post creation with visibility scope
   * @param {number} userId - User creating the post
   * @param {number} postId - Created post ID
   * @param {string} visibilityScope - Visibility scope ('community' or 'cohort')
   * @param {number} communityId - Community ID
   * @param {number|null} cohortId - Cohort ID (if cohort-scoped)
   */
  logPostCreation(userId, postId, visibilityScope, communityId, cohortId = null) {
    const logEntry = {
      type: 'POST_CREATED',
      userId,
      postId,
      visibilityScope,
      communityId,
      cohortId,
      timestamp: new Date().toISOString(),
    };

    console.info('[POST_CREATED]', JSON.stringify(logEntry));
  }
}

module.exports = new AccessControlLogger();
