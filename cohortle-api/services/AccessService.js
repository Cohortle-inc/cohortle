/**
 * Access Control Service
 *
 * Centralizes permission checks for content, community, and management actions.
 */

const db = require('../models');

class AccessService {
  /**
   * Check if a learner can access a programme/cohort
   */
  async canAccessProgramme(userId, cohortId) {
    try {
      const enrollment = await db.enrollments.findOne({
        where: {
          user_id: userId,
          cohort_id: cohortId
        }
      });

      if (!enrollment) return false;

      // ENFORCEMENT: Block access if status is not 'active' or 'completed'
      const allowedStatuses = ['active', 'completed'];
      return allowedStatuses.includes(enrollment.status);
    } catch (error) {
      console.error('Access check failed:', error);
      return false;
    }
  }

  /**
   * Check if a learner can submit an assignment
   */
  async canSubmitAssignment(userId, cohortId) {
    try {
      const enrollment = await db.enrollments.findOne({
        where: { user_id: userId, cohort_id: cohortId }
      });

      if (!enrollment) return false;

      // ENFORCEMENT: Only 'active' learners can submit
      return enrollment.status === 'active';
    } catch (error) {
      return false;
    }
  }
}

module.exports = new AccessService();
