/**
 * AuditService
 * Central logging service for all learner operational actions
 * Tracks who did what, when, and why for compliance and accountability
 */

const db = require('../models');

class AuditService {
  /**
   * Log an operational action
   * @param {Object} params
   * @param {number} params.actorId - User ID who performed the action
   * @param {string} params.targetType - Type of target (enrollment, payment, etc.)
   * @param {number} params.targetId - ID of the target
   * @param {string} params.action - Action name (suspend, remove, create_note, etc.)
   * @param {Object} params.beforeValue - State before action
   * @param {Object} params.afterValue - State after action
   * @param {string} params.reason - Why the action was taken
   * @param {Object} params.metadata - Additional context
   * @param {string} params.ipAddress - IP address of actor
   * @param {string} params.userAgent - User agent of actor
   * @returns {Promise<Object>} Created audit event
   */
  static async logAction({
    actorId,
    targetType,
    targetId,
    action,
    beforeValue = null,
    afterValue = null,
    reason = null,
    metadata = null,
    ipAddress = null,
    userAgent = null
  }) {
    try {
      const auditEvent = await db.audit_events.create({
        actor_id: actorId,
        target_type: targetType,
        target_id: targetId,
        action,
        before_value: beforeValue,
        after_value: afterValue,
        reason,
        metadata,
        ip_address: ipAddress,
        user_agent: userAgent
      });

      return auditEvent;
    } catch (error) {
      console.error('Error logging audit event:', error);
      throw error;
    }
  }

  /**
   * Get audit trail for a specific enrollment
   * @param {number} enrollmentId
   * @param {Object} options
   * @param {number} options.limit - Number of records to return
   * @param {number} options.offset - Pagination offset
   * @returns {Promise<Object>} Audit events and total count
   */
  static async getEnrollmentAuditTrail(enrollmentId, { limit = 50, offset = 0 } = {}) {
    try {
      const { rows, count } = await db.audit_events.findAndCountAll({
        where: {
          target_type: 'enrollment',
          target_id: enrollmentId
        },
        order: [['created_at', 'DESC']],
        limit,
        offset,
        include: [
          {
            model: db.users,
            as: 'actor',
            attributes: ['id', 'email', 'first_name', 'last_name']
          }
        ]
      });

      return { data: rows, total: count };
    } catch (error) {
      console.error('Error fetching audit trail:', error);
      throw error;
    }
  }

  /**
   * Get all actions by an actor within a date range
   * @param {number} actorId
   * @param {Object} options
   * @param {Date} options.startDate
   * @param {Date} options.endDate
   * @param {number} options.limit
   * @returns {Promise<Array>} Audit events
   */
  static async getActorActions(actorId, { startDate, endDate, limit = 100 } = {}) {
    try {
      const where = { actor_id: actorId };

      if (startDate || endDate) {
        where.created_at = {};
        if (startDate) where.created_at[db.Sequelize.Op.gte] = startDate;
        if (endDate) where.created_at[db.Sequelize.Op.lte] = endDate;
      }

      return await db.audit_events.findAll({
        where,
        order: [['created_at', 'DESC']],
        limit
      });
    } catch (error) {
      console.error('Error fetching actor actions:', error);
      throw error;
    }
  }

  /**
   * Get specific action history
   * @param {string} action - Action name to filter
   * @param {Object} options
   * @param {number} options.limit
   * @param {Date} options.since - Only actions after this date
   * @returns {Promise<Array>} Audit events
   */
  static async getActionHistory(action, { limit = 100, since = null } = {}) {
    try {
      const where = { action };

      if (since) {
        where.created_at = {
          [db.Sequelize.Op.gte]: since
        };
      }

      return await db.audit_events.findAll({
        where,
        order: [['created_at', 'DESC']],
        limit,
        include: [
          {
            model: db.users,
            as: 'actor',
            attributes: ['id', 'email', 'first_name', 'last_name']
          }
        ]
      });
    } catch (error) {
      console.error('Error fetching action history:', error);
      throw error;
    }
  }
}

module.exports = AuditService;
