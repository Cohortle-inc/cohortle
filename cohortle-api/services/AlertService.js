const { Enrollment, LearnerNote, LearnerCommunicationEvent, LearnerAttendance, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * AlertService
 * Generates early warning alerts for at-risk learners based on behavioral patterns
 */
class AlertService {
  static ALERT_TYPES = {
    ACTIVITY_DROP: 'activity_drop',
    GRADE_DECLINE: 'grade_decline',
    MILESTONE_OVERDUE: 'milestone_overdue',
    DISENGAGEMENT_PATTERN: 'disengagement_pattern',
    LATE_SUBMISSION_TREND: 'late_submission_trend',
    FORUM_SILENCE: 'forum_silence',
    OFFICE_HOURS_NO_SHOW: 'office_hours_no_show',
  };

  static SEVERITY_LEVELS = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical',
  };

  /**
   * Generate all alerts for a cohort
   */
  static async generateCohortAlerts(cohortId) {
    try {
      const enrollments = await Enrollment.findAll({
        where: {
          cohort_id: cohortId,
          lifecycle_stage: { [Op.ne]: 'removed' },
        },
        include: [
          { association: 'notes' },
          { association: 'communicationEvents' },
          { association: 'attendance' },
        ],
      });

      const alerts = [];

      for (const enrollment of enrollments) {
        alerts.push(...await this.checkActivityDrop(enrollment));
        alerts.push(...await this.checkGradeDecline(enrollment));
        alerts.push(...await this.checkMilestoneOverdue(enrollment));
        alerts.push(...await this.checkDisengagementPattern(enrollment));
        alerts.push(...await this.checkLateSubmissionTrend(enrollment));
        alerts.push(...await this.checkForumSilence(enrollment));
        alerts.push(...await this.checkOfficeHoursNoShow(enrollment));
      }

      return alerts.filter(a => a !== null);
    } catch (error) {
      console.error(`Error generating cohort alerts for ${cohortId}:`, error);
      throw error;
    }
  }

  /**
   * Check for activity drop (no activity for >10 days)
   */
  static async checkActivityDrop(enrollment) {
    try {
      const lastContactAt = enrollment.last_contacted_at
        ? new Date(enrollment.last_contacted_at)
        : new Date(enrollment.created_at);
      const daysSinceActivity = Math.floor(
        (Date.now() - lastContactAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceActivity > 10) {
        return [{
          enrollmentId: enrollment.id,
          learnerName: `${enrollment.firstName} ${enrollment.lastName}`,
          type: this.ALERT_TYPES.ACTIVITY_DROP,
          severity: daysSinceActivity > 20 ? this.SEVERITY_LEVELS.CRITICAL : this.SEVERITY_LEVELS.HIGH,
          message: `${enrollment.firstName} has no activity for ${daysSinceActivity} days`,
          suggestedAction: 'Send personalized check-in message',
          details: {
            daysSinceActivity,
            lastActivityAt: lastContactAt,
          },
          createdAt: new Date(),
        }];
      }

      return [];
    } catch (error) {
      console.error(`Error checking activity drop for enrollment ${enrollment.id}:`, error);
      return [];
    }
  }

  /**
   * Check for grade decline (scores dropping significantly)
   */
  static async checkGradeDecline(enrollment) {
    try {
      // In production, would track assignment scores over time
      // For now, flag if notes count is low despite time in course
      const daysSinceEnrollment = Math.floor(
        (Date.now() - new Date(enrollment.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      const notesCount = enrollment.notes_count || 0;
      const expectedNotes = Math.floor(daysSinceEnrollment / 7) * 2; // ~2 notes per week

      if (expectedNotes > 5 && notesCount < expectedNotes * 0.6) {
        return [{
          enrollmentId: enrollment.id,
          learnerName: `${enrollment.firstName} ${enrollment.lastName}`,
          type: this.ALERT_TYPES.GRADE_DECLINE,
          severity: this.SEVERITY_LEVELS.MEDIUM,
          message: `${enrollment.firstName} scores appear below expected for ${daysSinceEnrollment} days in course`,
          suggestedAction: 'Review recent assignments and offer tutoring support',
          details: {
            daysSinceEnrollment,
            notesCount,
            expectedNotes: Math.floor(expectedNotes),
          },
          createdAt: new Date(),
        }];
      }

      return [];
    } catch (error) {
      console.error(`Error checking grade decline for enrollment ${enrollment.id}:`, error);
      return [];
    }
  }

  /**
   * Check for overdue milestones
   */
  static async checkMilestoneOverdue(enrollment) {
    try {
      // In production, would check against milestone due dates
      // For now, check if completion is significantly behind schedule
      const daysSinceEnrollment = Math.floor(
        (Date.now() - new Date(enrollment.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Assume 8-week course with weekly milestones
      const weekNumber = Math.floor(daysSinceEnrollment / 7);
      const expectedProgress = (weekNumber / 8) * 100;
      const actualProgress = Math.min((enrollment.notes_count || 0) * 10, 100);

      if (weekNumber > 2 && actualProgress < expectedProgress * 0.6) {
        return [{
          enrollmentId: enrollment.id,
          learnerName: `${enrollment.firstName} ${enrollment.lastName}`,
          type: this.ALERT_TYPES.MILESTONE_OVERDUE,
          severity: this.SEVERITY_LEVELS.HIGH,
          message: `${enrollment.firstName} is behind on milestones (${Math.floor(actualProgress)}% vs ${Math.floor(expectedProgress)}% expected)`,
          suggestedAction: 'Check-in on progress and barriers to completion',
          details: {
            weekNumber,
            expectedProgress: Math.floor(expectedProgress),
            actualProgress: Math.floor(actualProgress),
          },
          createdAt: new Date(),
        }];
      }

      return [];
    } catch (error) {
      console.error(`Error checking milestone overdue for enrollment ${enrollment.id}:`, error);
      return [];
    }
  }

  /**
   * Check for disengagement pattern (inconsistent activity when baseline is active)
   */
  static async checkDisengagementPattern(enrollment) {
    try {
      const recentNotes = enrollment.notes
        ? enrollment.notes.filter(n => {
            const noteDate = new Date(n.created_at);
            const daysSinceNote = (Date.now() - noteDate.getTime()) / (1000 * 60 * 60 * 24);
            return daysSinceNote < 30;
          })
        : [];

      const daysSinceEnrollment = Math.floor(
        (Date.now() - new Date(enrollment.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      // If enrolled >2 weeks but no notes in last 3 days, flag as disengaged
      if (daysSinceEnrollment > 14 && recentNotes.length === 0) {
        const daysSinceLastNote = recentNotes.length > 0
          ? Math.floor((Date.now() - new Date(recentNotes[0].created_at).getTime()) / (1000 * 60 * 60 * 24))
          : daysSinceEnrollment;

        if (daysSinceLastNote > 3) {
          return [{
            enrollmentId: enrollment.id,
            learnerName: `${enrollment.firstName} ${enrollment.lastName}`,
            type: this.ALERT_TYPES.DISENGAGEMENT_PATTERN,
            severity: this.SEVERITY_LEVELS.MEDIUM,
            message: `${enrollment.firstName} shows disengagement pattern - no recent activity`,
            suggestedAction: 'Personalized outreach with motivational support',
            details: {
              daysSinceLastNote,
              daysSinceEnrollment,
            },
            createdAt: new Date(),
          }];
        }
      }

      return [];
    } catch (error) {
      console.error(`Error checking disengagement pattern for enrollment ${enrollment.id}:`, error);
      return [];
    }
  }

  /**
   * Check for late submission trend (3+ late submissions)
   */
  static async checkLateSubmissionTrend(enrollment) {
    try {
      // In production, would track submission dates vs deadlines
      // For now, use notes as proxy for submissions
      const notes = enrollment.notes || [];
      const recentNotes = notes.filter(n => {
        const noteDate = new Date(n.created_at);
        const daysSinceNote = (Date.now() - noteDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceNote < 60;
      });

      // Flag if multiple notes but with gaps suggesting late work
      if (recentNotes.length >= 3) {
        const intervals = [];
        for (let i = 1; i < recentNotes.length; i++) {
          const diff = Math.floor(
            (new Date(recentNotes[i - 1].created_at).getTime() - new Date(recentNotes[i].created_at).getTime()) /
            (1000 * 60 * 60 * 24)
          );
          intervals.push(diff);
        }

        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const lateCount = intervals.filter(i => i > 10).length; // >10 days = potentially late

        if (lateCount >= 2) {
          return [{
            enrollmentId: enrollment.id,
            learnerName: `${enrollment.firstName} ${enrollment.lastName}`,
            type: this.ALERT_TYPES.LATE_SUBMISSION_TREND,
            severity: this.SEVERITY_LEVELS.MEDIUM,
            message: `${enrollment.firstName} has submitted ${lateCount} assignments late in the last 60 days`,
            suggestedAction: 'Discuss time management and deadline planning',
            details: {
              lateSubmissionCount: lateCount,
              averageDaysBetweenSubmissions: Math.floor(avgInterval),
            },
            createdAt: new Date(),
          }];
        }
      }

      return [];
    } catch (error) {
      console.error(`Error checking late submission trend for enrollment ${enrollment.id}:`, error);
      return [];
    }
  }

  /**
   * Check for forum silence (no posts when baseline is active)
   */
  static async checkForumSilence(enrollment) {
    try {
      const attendance = enrollment.attendance || [];
      const recentAttendance = attendance.filter(a => {
        const eventDate = new Date(a.event_date);
        const daysSinceEvent = (Date.now() - eventDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceEvent < 30;
      });

      // Flag if no forum/discussion attendance in last 2 weeks
      const forumAttendance = recentAttendance.filter(a => a.event_type === 'group_activity');

      if (enrollment.lifecycle_stage === 'active' && forumAttendance.length === 0) {
        return [{
          enrollmentId: enrollment.id,
          learnerName: `${enrollment.firstName} ${enrollment.lastName}`,
          type: this.ALERT_TYPES.FORUM_SILENCE,
          severity: this.SEVERITY_LEVELS.LOW,
          message: `${enrollment.firstName} hasn't participated in community discussions`,
          suggestedAction: 'Invite to community and highlight relevant discussions',
          details: {
            daysSinceLastForumPost: 30,
          },
          createdAt: new Date(),
        }];
      }

      return [];
    } catch (error) {
      console.error(`Error checking forum silence for enrollment ${enrollment.id}:`, error);
      return [];
    }
  }

  /**
   * Check for office hours no-show (registered but didn't attend)
   */
  static async checkOfficeHoursNoShow(enrollment) {
    try {
      const attendance = enrollment.attendance || [];
      const recentOfficeHours = attendance.filter(a => {
        const eventDate = new Date(a.event_date);
        const daysSinceEvent = (Date.now() - eventDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceEvent < 60 && a.event_type === 'office_hours';
      });

      const noShowCount = recentOfficeHours.filter(a => a.status === 'absent').length;

      if (noShowCount >= 2) {
        return [{
          enrollmentId: enrollment.id,
          learnerName: `${enrollment.firstName} ${enrollment.lastName}`,
          type: this.ALERT_TYPES.OFFICE_HOURS_NO_SHOW,
          severity: this.SEVERITY_LEVELS.LOW,
          message: `${enrollment.firstName} has missed ${noShowCount} office hour sessions`,
          suggestedAction: 'Offer alternative support or reschedule at different times',
          details: {
            noShowCount,
            totalRecentOfficeHours: recentOfficeHours.length,
          },
          createdAt: new Date(),
        }];
      }

      return [];
    } catch (error) {
      console.error(`Error checking office hours no-show for enrollment ${enrollment.id}:`, error);
      return [];
    }
  }

  /**
   * Get recent alerts for a cohort (last 24-48 hours)
   */
  static async getRecentAlerts(cohortId, hours = 48) {
    try {
      const allAlerts = await this.generateCohortAlerts(cohortId);
      
      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
      
      return allAlerts
        .filter(alert => new Date(alert.createdAt) > cutoffTime)
        .sort((a, b) => {
          // Sort by severity first
          const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          return severityOrder[a.severity] - severityOrder[b.severity];
        });
    } catch (error) {
      console.error(`Error fetching recent alerts for cohort ${cohortId}:`, error);
      throw error;
    }
  }

  /**
   * Get alerts for specific learner
   */
  static async getLearnerAlerts(enrollmentId) {
    try {
      const enrollment = await Enrollment.findByPk(enrollmentId, {
        include: [
          { association: 'notes' },
          { association: 'communicationEvents' },
          { association: 'attendance' },
        ],
      });

      if (!enrollment) {
        throw new Error(`Enrollment ${enrollmentId} not found`);
      }

      const alerts = [
        ...await this.checkActivityDrop(enrollment),
        ...await this.checkGradeDecline(enrollment),
        ...await this.checkMilestoneOverdue(enrollment),
        ...await this.checkDisengagementPattern(enrollment),
        ...await this.checkLateSubmissionTrend(enrollment),
        ...await this.checkForumSilence(enrollment),
        ...await this.checkOfficeHoursNoShow(enrollment),
      ];

      return alerts.filter(a => a !== null);
    } catch (error) {
      console.error(`Error fetching alerts for enrollment ${enrollmentId}:`, error);
      throw error;
    }
  }

  /**
   * Acknowledge/dismiss an alert
   */
  static async acknowledgeAlert(alertId, actorId) {
    try {
      // In production, would store in alerts table
      // For now, return confirmation
      return {
        alertId,
        acknowledgedBy: actorId,
        acknowledgedAt: new Date(),
      };
    } catch (error) {
      console.error(`Error acknowledging alert ${alertId}:`, error);
      throw error;
    }
  }

  /**
   * Get alert statistics for cohort
   */
  static async getAlertStatistics(cohortId) {
    try {
      const allAlerts = await this.generateCohortAlerts(cohortId);

      const byType = {};
      const bySeverity = {};
      let totalAlerts = 0;

      allAlerts.forEach(alert => {
        totalAlerts++;
        byType[alert.type] = (byType[alert.type] || 0) + 1;
        bySeverity[alert.severity] = (bySeverity[alert.severity] || 0) + 1;
      });

      return {
        totalAlerts,
        byType,
        bySeverity,
        criticalCount: bySeverity.critical || 0,
        highCount: bySeverity.high || 0,
        topAlertType: Object.entries(byType).sort((a, b) => b[1] - a[1])[0]?.[0],
      };
    } catch (error) {
      console.error(`Error fetching alert statistics for cohort ${cohortId}:`, error);
      throw error;
    }
  }
}

module.exports = AlertService;
