'use strict';

const db = require('../models');

/**
 * Records and retrieves application status transition history.
 * Requirements: 8.1, 8.3
 */

/**
 * Record a status transition for an application.
 * @param {string} applicationId - UUID of the application
 * @param {Object} opts
 * @param {string|null} opts.fromStatus - Previous status (null for initial submission)
 * @param {string} opts.toStatus - New status
 * @param {number|null} opts.changedBy - User ID who triggered the transition
 * @param {string|null} opts.notes - Optional notes
 * @returns {Promise<Object>} Created history record
 */
async function recordTransition(applicationId, { fromStatus, toStatus, changedBy, notes }) {
  return db.application_history.create({
    application_id: applicationId,
    from_status: fromStatus || null,
    to_status: toStatus,
    changed_by: changedBy || null,
    notes: notes || null,
    created_at: new Date(),
  });
}

/**
 * Get the full status history for an application in chronological order.
 * @param {string} applicationId - UUID of the application
 * @returns {Promise<Array>} History records ordered by created_at ASC
 */
async function getHistory(applicationId) {
  return db.application_history.findAll({
    where: { application_id: applicationId },
    order: [['created_at', 'ASC']],
  });
}

module.exports = { recordTransition, getHistory };
