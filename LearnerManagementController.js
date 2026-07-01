'use strict';

const db = require('../models');
const ProgressService = require('../services/ProgressService');

/**
 * Controller for Convener Learner Management
 */
class LearnerManagementController {
  /**
   * Get all learners (enrollments) for a convener across all their programmes
   */
  async getLearners(req, res) {
    try {
      const convenerId = req.user_id;
      const { search, programme_id, cohort_id, status } = req.query;

      // Ensure the convener has some programmes
      const ownedProgrammes = await db.programmes.findAll({
        where: { created_by: convenerId },
        attributes: ['id']
      });

      if (ownedProgrammes.length === 0) {
        return res.status(200).json({
          error: false,
          learners: []
        });
      }

      const ownedProgrammeIds = ownedProgrammes.map(p => p.id);

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

      const programmeWhere = {
        id: { [db.Sequelize.Op.in]: ownedProgrammeIds }
      };
      if (programme_id) {
        // Double check ownership if specific programme requested
        if (!ownedProgrammeIds.includes(parseInt(programme_id))) {
          return res.status(403).json({
            error: true,
            message: 'Unauthorized: You do not own the requested programme'
          });
        }
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
            required: true,
            include: [
              {
                model: db.programmes,
                as: 'programme',
                where: programmeWhere,
                required: true,
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
        enrolled_at: e.enrolled_at ? new Date(e.enrolled_at).toISOString() : null,
        user_id: e.user.id,
        name: `${e.user.first_name} ${e.user.last_name}`,
        email: e.user.email,
        profilePicture: e.user.profile_image || null,
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
      const convenerId = req.user_id;
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

  /**
   * Get learner aggregate profile from the perspective of the authenticated convener
   */
  async getLearnerProfile(req, res) {
    try {
      const convenerId = req.user_id;
      const learnerId = req.params.id;

      // Verify the convener has access to this learner (learner is enrolled in at least one programme owned by the convener)
      const ownedProgrammes = await db.programmes.findAll({
        where: { created_by: convenerId },
        attributes: ['id']
      });

      if (ownedProgrammes.length === 0) {
        return res.status(403).json({
          error: true,
          message: 'Unauthorized: You do not have any programmes.'
        });
      }

      const ownedProgrammeIds = ownedProgrammes.map(p => p.id);

      const learnerEnrollments = await db.enrollments.findAll({
        where: {
          user_id: learnerId,
          status: { [db.Sequelize.Op.ne]: 'removed' }
        },
        include: [
          {
            model: db.cohorts,
            as: 'cohort',
            where: { programme_id: { [db.Sequelize.Op.in]: ownedProgrammeIds } },
            include: [
              {
                model: db.programmes,
                as: 'programme',
                attributes: ['id', 'name']
              }
            ]
          }
        ]
      });

      // Fetch learner basic info
      const learner = await db.users.findByPk(learnerId, {
        attributes: ['id', 'first_name', 'last_name', 'email', 'profile_image', 'location', 'joined_at']
      });

      if (!learner) {
        return res.status(404).json({
          error: true,
          message: 'Learner not found'
        });
      }

      if (learnerEnrollments.length === 0) {
        return res.status(403).json({
          error: true,
          message: 'Unauthorized: This learner is not enrolled in any of your programmes.'
        });
      }

      // Calculate progress for each enrollment - optimized to batch where possible
      // (Though calculateProgrammeProgress currently does its own internal queries, we keep it for accuracy)
      const programmeHistory = await Promise.all(learnerEnrollments.map(async (e) => {
        const progressStats = await ProgressService.calculateProgrammeProgress(learnerId, e.cohort.programme_id, e.cohort.id);
        return {
          programme_id: e.cohort.programme_id,
          programme_name: e.cohort.programme.name,
          cohort_id: e.cohort.id,
          cohort_name: e.cohort.name,
          enrolled_at: e.enrolled_at ? new Date(e.enrolled_at).toISOString() : null,
          status: e.status,
          completion_percentage: progressStats.progress || 0,
          completed_lessons: progressStats.completedLessons || 0,
          total_lessons: progressStats.totalLessons || 0
        };
      }));

      // Calculate aggregate stats across owned programmes
      const aggregateStats = await ProgressService.getLearnerAggregateStats(learnerId, ownedProgrammeIds);

      // Fetch last activity timestamp
      const lastActivity = await db.activity_logs.findOne({
        where: {
          user_id: learnerId,
          programme_id: { [db.Sequelize.Op.in]: ownedProgrammeIds }
        },
        order: [['created_at', 'DESC']],
        attributes: ['created_at']
      });

      const profile = {
        id: learner.id,
        name: `${learner.first_name} ${learner.last_name}`,
        email: learner.email,
        profilePicture: learner.profile_image || null,
        location: learner.location || null,
        joined_at: learner.joined_at ? new Date(learner.joined_at).toISOString() : null,
        stats: {
          total_programmes_enrolled: aggregateStats.totalProgrammes || 0,
          total_programmes_completed: aggregateStats.completedProgrammes || 0,
          total_lessons_completed: aggregateStats.completedLessons || 0,
          overall_completion_rate: aggregateStats.overallCompletionRate || 0,
          last_activity_at: lastActivity ? new Date(lastActivity.created_at).toISOString() : null,
        },
        active_programmes: (programmeHistory || []).filter(p => p.status === 'active'),
        previous_programmes: (programmeHistory || []).filter(p => p.status !== 'active'),
        programme_history: programmeHistory || []
      };

      return res.status(200).json({
        error: false,
        profile
      });
    } catch (error) {
      console.error('Error fetching learner profile:', error);
      return res.status(500).json({
        error: true,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get learner activity timeline from the perspective of the authenticated convener
   */
  async getLearnerActivity(req, res) {
    try {
      const convenerId = req.user_id;
      const learnerId = req.params.id;
      const { limit = 50, offset = 0 } = req.query;

      // Verify ownership
      const ownedProgrammes = await db.programmes.findAll({
        where: { created_by: convenerId },
        attributes: ['id']
      });

      const ownedProgrammeIds = ownedProgrammes.map(p => p.id);

      if (ownedProgrammeIds.length === 0) {
        return res.status(403).json({
          error: true,
          message: 'Unauthorized'
        });
      }

      // Fetch activity logs with programme info
      const activities = await db.activity_logs.findAll({
        where: {
          user_id: learnerId,
          programme_id: { [db.Sequelize.Op.in]: ownedProgrammeIds }
        },
        include: [
          {
            model: db.programmes,
            as: 'programme',
            attributes: ['id', 'name']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // For lesson completions, we want to try and get the lesson title
      // Since it's polymorphic, we'll do a manual secondary fetch or a clever map
      const lessonIds = activities
        .filter(a => a.entity_type === 'lesson' && a.entity_id)
        .map(a => a.entity_id);

      let lessonsMap = {};
      if (lessonIds.length > 0) {
        const lessons = await db.lessons.findAll({
          where: { id: { [db.Sequelize.Op.in]: lessonIds } },
          attributes: ['id', 'title']
        });
        lessonsMap = lessons.reduce((acc, l) => ({ ...acc, [l.id]: l.title }), {});
      }

      const enrichedActivities = activities.map(a => {
        const activity = a.toJSON();
        if (activity.entity_type === 'lesson' && lessonsMap[activity.entity_id]) {
          activity.entity_name = lessonsMap[activity.entity_id];
        } else if (activity.entity_type === 'programme' && activity.programme) {
          activity.entity_name = activity.programme.name;
        }

        // Ensure consistent date format
        activity.created_at = activity.created_at ? new Date(activity.created_at).toISOString() : null;

        return activity;
      });

      return res.status(200).json({
        error: false,
        activities: enrichedActivities
      });
    } catch (error) {
      console.error('Error fetching learner activity:', error);
      return res.status(500).json({
        error: true,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Suspend a learner
   */
  async suspendLearner(req, res) {
    try {
      const convenerId = req.user_id;
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          error: true,
          message: 'Reason for suspension is required'
        });
      }

      // Find enrollment and verify ownership
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

      // Use LearnerLifecycleService to handle suspension
      const LearnerLifecycleService = require('../services/LearnerLifecycleService');
      const updated = await LearnerLifecycleService.suspendLearner({
        enrollmentId: id,
        actorId: convenerId,
        reason
      });

      return res.status(200).json({
        error: false,
        message: 'Learner suspended successfully',
        enrollment: updated
      });
    } catch (error) {
      console.error('Error suspending learner:', error);
      return res.status(500).json({
        error: true,
        message: error.message || 'Internal server error'
      });
    }
  }

  /**
   * Reactivate a suspended learner
   */
  async reactivateLearner(req, res) {
    try {
      const convenerId = req.user_id;
      const { id } = req.params;
      const { reason } = req.body;

      // Find enrollment and verify ownership
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

      // Use LearnerLifecycleService to handle reactivation
      const LearnerLifecycleService = require('../services/LearnerLifecycleService');
      const updated = await LearnerLifecycleService.reactivateLearner({
        enrollmentId: id,
        actorId: convenerId,
        reason: reason || 'Learner reactivated by convener'
      });

      return res.status(200).json({
        error: false,
        message: 'Learner reactivated successfully',
        enrollment: updated
      });
    } catch (error) {
      console.error('Error reactivating learner:', error);
      return res.status(500).json({
        error: true,
        message: error.message || 'Internal server error'
      });
    }
  }

  /**
   * Remove a learner permanently
   */
  async removeLearner(req, res) {
    try {
      const convenerId = req.user_id;
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          error: true,
          message: 'Reason for removal is required'
        });
      }

      // Find enrollment and verify ownership
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

      // Use LearnerLifecycleService to handle removal
      const LearnerLifecycleService = require('../services/LearnerLifecycleService');
      const updated = await LearnerLifecycleService.removeLearner({
        enrollmentId: id,
        actorId: convenerId,
        reason
      });

      return res.status(200).json({
        error: false,
        message: 'Learner removed successfully',
        enrollment: updated
      });
    } catch (error) {
      console.error('Error removing learner:', error);
      return res.status(500).json({
        error: true,
        message: error.message || 'Internal server error'
      });
    }
  }

  /**
   * Add a note for a learner
   */
  async addNote(req, res) {
    try {
      const convenerId = req.user_id;
      const { id } = req.params;
      const { note_type = 'general', content, linked_entity_type, linked_entity_id } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({
          error: true,
          message: 'Note content is required'
        });
      }

      // Find enrollment and verify ownership
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

      // Create note
      const note = await db.learner_notes.create({
        enrollment_id: id,
        note_type,
        content: content.trim(),
        created_by: convenerId,
        linked_entity_type: linked_entity_type || null,
        linked_entity_id: linked_entity_id || null
      });

      // Update notes_count on enrollment (denormalized for performance)
      await enrollment.increment('notes_count', { by: 1 });

      // Log audit event
      const AuditService = require('../services/AuditService');
      await AuditService.logAction({
        actorId: convenerId,
        targetType: 'learner_note',
        targetId: note.id,
        action: 'create_note',
        afterValue: note.toJSON(),
        metadata: { note_type, linked_entity_type }
      });

      return res.status(201).json({
        error: false,
        message: 'Note added successfully',
        note
      });
    } catch (error) {
      console.error('Error adding note:', error);
      return res.status(500).json({
        error: true,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get notes for a learner
   */
  async getNotes(req, res) {
    try {
      const convenerId = req.user_id;
      const { id } = req.params;
      const { note_type, limit = 50, offset = 0 } = req.query;

      // Find enrollment and verify ownership
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

      // Build filter
      const where = { enrollment_id: id };
      if (note_type) {
        where.note_type = note_type;
      }

      // Fetch notes with creator info
      const { rows, count } = await db.learner_notes.findAndCountAll({
        where,
        include: [
          {
            model: db.users,
            as: 'creator',
            attributes: ['id', 'first_name', 'last_name', 'email']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return res.status(200).json({
        error: false,
        notes: rows,
        total: count
      });
    } catch (error) {
      console.error('Error fetching notes:', error);
      return res.status(500).json({
        error: true,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Send communication to a learner
   */
  async sendCommunication(req, res) {
    try {
      const convenerId = req.user_id;
      const { id } = req.params;
      const { channel, template_id, subject, body_preview } = req.body;

      if (!channel) {
        return res.status(400).json({
          error: true,
          message: 'Communication channel is required'
        });
      }

      const validChannels = ['email', 'in_app', 'sms', 'notification'];
      if (!validChannels.includes(channel)) {
        return res.status(400).json({
          error: true,
          message: `Invalid channel. Valid values: ${validChannels.join(', ')}`
        });
      }

      // Find enrollment and verify ownership
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

      // Check if learner can receive communications
      const LearnerLifecycleService = require('../services/LearnerLifecycleService');
      const permissions = LearnerLifecycleService.getAccessPermissions(
        enrollment.lifecycle_stage || 'active'
      );

      if (!permissions.can_communicate) {
        return res.status(403).json({
          error: true,
          message: `Cannot communicate with learner in ${enrollment.lifecycle_stage} stage`
        });
      }

      // Create communication event
      const communication = await db.learner_communication_events.create({
        enrollment_id: id,
        channel,
        template_id: template_id || null,
        subject: subject || null,
        body_preview: body_preview || null,
        created_by: convenerId,
        delivery_status: 'pending'
      });

      // Log audit event
      const AuditService = require('../services/AuditService');
      await AuditService.logAction({
        actorId: convenerId,
        targetType: 'communication_event',
        targetId: communication.id,
        action: 'send_communication',
        afterValue: communication.toJSON(),
        metadata: { channel, template_id }
      });

      return res.status(201).json({
        error: false,
        message: 'Communication sent successfully',
        communication
      });
    } catch (error) {
      console.error('Error sending communication:', error);
      return res.status(500).json({
        error: true,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Record learner attendance
   */
  async recordAttendance(req, res) {
    try {
      const convenerId = req.user_id;
      const { id } = req.params;
      const { event_type, event_date, status, notes } = req.body;

      if (!event_type || !event_date || !status) {
        return res.status(400).json({
          error: true,
          message: 'event_type, event_date, and status are required'
        });
      }

      // Find enrollment and verify ownership
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

      // Create attendance record
      const attendance = await db.learner_attendance.create({
        enrollment_id: id,
        cohort_id: enrollment.cohort_id,
        event_type,
        event_date,
        status,
        recorded_by: convenerId,
        notes: notes || null
      });

      // Log audit event
      const AuditService = require('../services/AuditService');
      await AuditService.logAction({
        actorId: convenerId,
        targetType: 'attendance',
        targetId: attendance.id,
        action: 'record_attendance',
        afterValue: attendance.toJSON(),
        metadata: { event_type, status }
      });

      return res.status(201).json({
        error: false,
        message: 'Attendance recorded successfully',
        attendance
      });
    } catch (error) {
      console.error('Error recording attendance:', error);
      return res.status(500).json({
        error: true,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new LearnerManagementController();
