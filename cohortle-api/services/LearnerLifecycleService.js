/**
 * LearnerLifecycleService
 * Manages learner lifecycle state transitions and access control
 * Ensures only valid state transitions occur and applies business rules
 */

const db = require('../models');
const AuditService = require('./AuditService');

// Valid state transitions
const VALID_TRANSITIONS = {
  'onboarding': ['active', 'withdrawn', 'removed'],
  'active': ['at_risk', 'suspended', 'completed', 'withdrawn', 'removed'],
  'at_risk': ['active', 'suspended', 'withdrawn', 'removed'],
  'suspended': ['active', 'removed', 'withdrawn'],
  'completed': ['alumni'],
  'withdrawn': ['removed'],
  'removed': ['alumni'],
  'alumni': []
};

// Access restrictions by lifecycle stage
const ACCESS_BY_STAGE = {
  'onboarding': { can_access_content: false, can_submit_work: false, can_communicate: true },
  'active': { can_access_content: true, can_submit_work: true, can_communicate: true },
  'at_risk': { can_access_content: true, can_submit_work: true, can_communicate: true },
  'suspended': { can_access_content: false, can_submit_work: false, can_communicate: true },
  'completed': { can_access_content: false, can_submit_work: false, can_communicate: true },
  'withdrawn': { can_access_content: false, can_submit_work: false, can_communicate: false },
  'removed': { can_access_content: false, can_submit_work: false, can_communicate: false },
  'alumni': { can_access_content: true, can_submit_work: false, can_communicate: true }
};

class LearnerLifecycleService {
  /**
   * Check if a transition from one stage to another is valid
   * @param {string} fromStage
   * @param {string} toStage
   * @returns {boolean}
   */
  static isValidTransition(fromStage, toStage) {
    if (!VALID_TRANSITIONS[fromStage]) return false;
    return VALID_TRANSITIONS[fromStage].includes(toStage);
  }

  /**
   * Get valid next stages from current stage
   * @param {string} currentStage
   * @returns {Array<string>}
   */
  static getValidNextStages(currentStage) {
    return VALID_TRANSITIONS[currentStage] || [];
  }

  /**
   * Get access permissions for a lifecycle stage
   * @param {string} stage
   * @returns {Object}
   */
  static getAccessPermissions(stage) {
    return ACCESS_BY_STAGE[stage] || {};
  }

  /**
   * Transition enrollment to a new lifecycle stage
   * @param {Object} params
   * @param {number} params.enrollmentId
   * @param {string} params.newStage - Target lifecycle stage
   * @param {number} params.actorId - User making the change
   * @param {string} params.reason - Reason for transition
   * @param {Object} params.metadata - Additional context
   * @returns {Promise<Object>} Updated enrollment
   */
  static async transitionTo({
    enrollmentId,
    newStage,
    actorId,
    reason = null,
    metadata = {}
  }) {
    const transaction = await db.sequelize.transaction();

    try {
      // Fetch enrollment
      const enrollment = await db.enrollments.findByPk(enrollmentId, { transaction });

      if (!enrollment) {
        throw new Error(`Enrollment ${enrollmentId} not found`);
      }

      const currentStage = enrollment.lifecycle_stage || 'active';

      // Validate transition
      if (!this.isValidTransition(currentStage, newStage)) {
        throw new Error(
          `Invalid transition from ${currentStage} to ${newStage}. Valid transitions: ${VALID_TRANSITIONS[currentStage].join(', ')}`
        );
      }

      // Prepare update data
      const updateData = { lifecycle_stage: newStage };

      // Handle stage-specific updates
      if (newStage === 'onboarding' && !enrollment.onboarding_completed_at) {
        updateData.onboarding_completed_at = new Date();
      }

      if (newStage === 'suspended') {
        updateData.suspended_at = new Date();
        updateData.suspended_by = actorId;
        updateData.access_status_reason = reason;
      }

      if (newStage === 'active' && enrollment.suspended_at) {
        updateData.reactivated_at = new Date();
        updateData.suspended_at = null;
        updateData.suspended_by = null;
      }

      if (newStage === 'removed') {
        updateData.removed_at = new Date();
        updateData.removed_by = actorId;
        updateData.access_status_reason = reason;
      }

      if (newStage === 'completed' || newStage === 'alumni') {
        updateData.graduation_status = 'graduated';
        updateData.graduated_at = new Date();
      }

      // Update enrollment
      const updated = await enrollment.update(updateData, { transaction });

      // Log audit event
      await AuditService.logAction({
        actorId,
        targetType: 'enrollment',
        targetId: enrollmentId,
        action: `transition_to_${newStage}`,
        beforeValue: { lifecycle_stage: currentStage },
        afterValue: { lifecycle_stage: newStage },
        reason,
        metadata: {
          ...metadata,
          previous_stage: currentStage,
          new_stage: newStage
        }
      });

      await transaction.commit();
      return updated;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Suspend a learner with reason
   * @param {Object} params
   * @param {number} params.enrollmentId
   * @param {number} params.actorId
   * @param {string} params.reason
   * @returns {Promise<Object>} Updated enrollment
   */
  static async suspendLearner({ enrollmentId, actorId, reason }) {
    return this.transitionTo({
      enrollmentId,
      newStage: 'suspended',
      actorId,
      reason,
      metadata: { action_type: 'manual_suspension' }
    });
  }

  /**
   * Reactivate a suspended learner
   * @param {Object} params
   * @param {number} params.enrollmentId
   * @param {number} params.actorId
   * @param {string} params.reason
   * @returns {Promise<Object>} Updated enrollment
   */
  static async reactivateLearner({ enrollmentId, actorId, reason }) {
    return this.transitionTo({
      enrollmentId,
      newStage: 'active',
      actorId,
      reason,
      metadata: { action_type: 'reactivation' }
    });
  }

  /**
   * Remove a learner permanently
   * @param {Object} params
   * @param {number} params.enrollmentId
   * @param {number} params.actorId
   * @param {string} params.reason
   * @returns {Promise<Object>} Updated enrollment
   */
  static async removeLearner({ enrollmentId, actorId, reason }) {
    return this.transitionTo({
      enrollmentId,
      newStage: 'removed',
      actorId,
      reason,
      metadata: { action_type: 'removal' }
    });
  }

  /**
   * Mark learner as at risk
   * @param {Object} params
   * @param {number} params.enrollmentId
   * @param {number} params.actorId
   * @param {string} params.reason
   * @returns {Promise<Object>} Updated enrollment
   */
  static async markAtRisk({ enrollmentId, actorId, reason }) {
    return this.transitionTo({
      enrollmentId,
      newStage: 'at_risk',
      actorId,
      reason,
      metadata: { action_type: 'risk_flag' }
    });
  }

  /**
   * Withdraw a learner
   * @param {Object} params
   * @param {number} params.enrollmentId
   * @param {number} params.actorId
   * @param {string} params.reason
   * @returns {Promise<Object>} Updated enrollment
   */
  static async withdrawLearner({ enrollmentId, actorId, reason }) {
    return this.transitionTo({
      enrollmentId,
      newStage: 'withdrawn',
      actorId,
      reason,
      metadata: { action_type: 'withdrawal' }
    });
  }

  /**
   * Graduate a learner to alumni status
   * @param {Object} params
   * @param {number} params.enrollmentId
   * @param {number} params.actorId
   * @returns {Promise<Object>} Updated enrollment
   */
  static async graduateLearner({ enrollmentId, actorId }) {
    return this.transitionTo({
      enrollmentId,
      newStage: 'alumni',
      actorId,
      reason: 'Learner successfully completed programme',
      metadata: { action_type: 'graduation' }
    });
  }

  /**
   * Check if learner can perform specific action based on lifecycle stage
   * @param {Object} enrollment
   * @param {string} action - 'access_content', 'submit_work', 'communicate'
   * @returns {boolean}
   */
  static canPerformAction(enrollment, action) {
    const stage = enrollment.lifecycle_stage || 'active';
    const permissions = this.getAccessPermissions(stage);

    const actionMap = {
      'access_content': 'can_access_content',
      'submit_work': 'can_submit_work',
      'communicate': 'can_communicate'
    };

    return permissions[actionMap[action]] || false;
  }

  /**
   * Get current learner's access status details
   * @param {Object} enrollment
   * @returns {Object}
   */
  static getAccessStatus(enrollment) {
    const stage = enrollment.lifecycle_stage || 'active';
    const permissions = this.getAccessPermissions(stage);

    return {
      stage,
      status: stage === 'suspended' ? 'suspended' : 'active',
      reason: enrollment.access_status_reason,
      suspended_at: enrollment.suspended_at,
      suspended_by: enrollment.suspended_by,
      can_access_content: permissions.can_access_content,
      can_submit_work: permissions.can_submit_work,
      can_communicate: permissions.can_communicate
    };
  }
}

module.exports = LearnerLifecycleService;
