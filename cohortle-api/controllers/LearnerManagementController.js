'use strict';

const db = require('../models');

/**
 * Controller for Convener Learner Management
 */
class LearnerManagementController {
  /**
   * Get all learners (enrollments) for a convener across all their programmes
   */
  async getLearners(req, res) {
    try {
      const convenerId = req.user.id;
      const { search, programme_id, cohort_id, status } = req.query;

      // Build filters
      const enrollmentWhere = {};
      if (status) {
        enrollmentWhere.status = status;
      } else {
        // By default, don't show removed learners
        enrollmentWhere.status = { [db.Sequelize.Op.ne]: 'removed' };
      }

      const userWhere = {};
      if (search) {
        userWhere[db.Sequelize.Op.or] = [
          { first_name: { [db.Sequelize.Op.like]: `%${search}%` } },
          { last_name: { [db.Sequelize.Op.like]: `%${search}%` } },
          { email: { [db.Sequelize.Op.like]: `%${search}%` } }
        ];
      }

      const programmeWhere = { created_by: convenerId };
      if (programme_id) {
        programmeWhere.id = programme_id;
      }

      const cohortWhere = {};
      if (cohort_id) {
        cohortWhere.id = cohort_id;
      }

      const enrollments = await db.enrollments.findAll({
        where: enrollmentWhere,
        include: [
          {
            model: db.users,
            as: 'user',
            where: userWhere,
            attributes: ['id', 'first_name', 'last_name', 'email', 'profile_image']
          },
          {
            model: db.cohorts,
            as: 'cohort',
            where: cohortWhere,
            include: [
              {
                model: db.programmes,
                as: 'programme',
                where: programmeWhere,
                attributes: ['id', 'name']
              }
            ]
          }
        ],
        order: [['enrolled_at', 'DESC']]
      });

      // Flatten the response for the "Cohort CRM" view
      const flattenedLearners = enrollments.map(e => ({
        enrollment_id: e.id,
        status: e.status,
        enrolled_at: e.enrolled_at,
        user_id: e.user.id,
        name: `${e.user.first_name} ${e.user.last_name}`,
        email: e.user.email,
        profile_image: e.user.profile_image,
        programme_id: e.cohort.programme.id,
        programme_name: e.cohort.programme.name,
        cohort_id: e.cohort.id,
        cohort_name: e.cohort.name
      }));

      return res.status(200).json({
        error: false,
        learners: flattenedLearners
      });
    } catch (error) {
      console.error('Error fetching learners:', error);
      return res.status(500).json({
        error: true,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Update enrollment status
   */
  async updateStatus(req, res) {
    try {
      const convenerId = req.user.id;
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ['active', 'suspended', 'completed', 'withdrawn', 'removed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: true,
          message: 'Invalid status value'
        });
      }

      // Find enrollment and verify ownership via programme
      const enrollment = await db.enrollments.findOne({
        where: { id },
        include: [
          {
            model: db.cohorts,
            as: 'cohort',
            include: [
              {
                model: db.programmes,
                as: 'programme'
              }
            ]
          }
        ]
      });

      if (!enrollment) {
        return res.status(404).json({
          error: true,
          message: 'Enrollment not found'
        });
      }

      if (enrollment.cohort.programme.created_by !== convenerId) {
        return res.status(403).json({
          error: true,
          message: 'Unauthorized: You do not own this programme'
        });
      }

      enrollment.status = status;
      await enrollment.save();

      return res.status(200).json({
        error: false,
        message: `Learner status updated to ${status}`
      });
    } catch (error) {
      console.error('Error updating learner status:', error);
      return res.status(500).json({
        error: true,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new LearnerManagementController();
