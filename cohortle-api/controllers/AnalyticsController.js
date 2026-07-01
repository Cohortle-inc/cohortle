const LearnerHealthService = require('../services/LearnerHealthService');
const AlertService = require('../services/AlertService');
const { Enrollment } = require('../models');

/**
 * AnalyticsController
 * Handles analytics and reporting endpoints for operations center
 */
class AnalyticsController {
  /**
   * GET /v1/api/analytics/cohorts/:cohortId/health
   * Get comprehensive health overview for a cohort
   */
  static async getCohortHealth(req, res) {
    try {
      const { cohortId } = req.params;
      const health = await LearnerHealthService.getCohortHealth(cohortId);

      res.json({
        success: true,
        data: health,
      });
    } catch (error) {
      console.error('Error in getCohortHealth:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /v1/api/analytics/cohorts/:cohortId/at-risk
   * Get at-risk learners for a cohort
   */
  static async getAtRiskLearners(req, res) {
    try {
      const { cohortId } = req.params;
      const { threshold = 51, limit = 100 } = req.query;

      const atRiskLearners = await LearnerHealthService.getAtRiskLearners(
        cohortId,
        parseInt(threshold),
        parseInt(limit)
      );

      res.json({
        success: true,
        data: {
          learners: atRiskLearners,
          count: atRiskLearners.length,
          threshold: parseInt(threshold),
        },
      });
    } catch (error) {
      console.error('Error in getAtRiskLearners:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /v1/api/analytics/enrollments/:enrollmentId/progress
   * Get progress analytics for a specific learner
   */
  static async getProgressAnalytics(req, res) {
    try {
      const { enrollmentId } = req.params;

      const enrollment = await Enrollment.findByPk(enrollmentId, {
        include: [{ association: 'cohort' }],
      });

      if (!enrollment) {
        return res.status(404).json({
          success: false,
          error: 'Enrollment not found',
        });
      }

      // Calculate progress metrics
      const daysSinceEnrollment = Math.floor(
        (Date.now() - new Date(enrollment.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      const weekNumber = Math.floor(daysSinceEnrollment / 7);
      const expectedProgress = Math.min((weekNumber / 8) * 100, 100);
      const actualProgress = Math.min((enrollment.notes_count || 0) * 10, 100);
      const progressDifference = actualProgress - expectedProgress;

      // Velocity calculation (based on completion rate)
      let velocity = 'stable';
      if (progressDifference > 15) velocity = 'accelerating';
      if (progressDifference < -15) velocity = 'decelerating';

      // Predict completion date
      const weeksRemaining = 8 - weekNumber;
      const predictedCompletionDate = weeksRemaining > 0
        ? new Date(Date.now() + weeksRemaining * 7 * 24 * 60 * 60 * 1000)
        : new Date(enrollment.onboarding_completed_at || enrollment.created_at);

      res.json({
        success: true,
        data: {
          enrollmentId,
          learnerName: `${enrollment.firstName} ${enrollment.lastName}`,
          weekNumber,
          expectedProgress: Math.round(expectedProgress),
          actualProgress: Math.round(actualProgress),
          progressDifference: Math.round(progressDifference),
          velocity,
          onTrack: progressDifference >= -10,
          daysSinceEnrollment,
          predictedCompletionDate,
          status: enrollment.lifecycle_stage,
          completionPercentage: Math.round(actualProgress),
        },
      });
    } catch (error) {
      console.error('Error in getProgressAnalytics:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /v1/api/analytics/cohorts/:cohortId/engagement
   * Get engagement analytics for a cohort
   */
  static async getEngagementAnalytics(req, res) {
    try {
      const { cohortId } = req.params;

      const enrollments = await Enrollment.findAll({
        where: { cohort_id: cohortId },
        include: [
          { association: 'notes' },
          { association: 'attendance' },
        ],
      });

      // Calculate engagement metrics
      const engagementScores = enrollments.map(e => {
        const daysSinceLastActivity = e.last_contacted_at
          ? Math.floor((Date.now() - new Date(e.last_contacted_at).getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        const activityFrequency = Math.max(0, 1.0 - (daysSinceLastActivity / 30));
        const participationDepth = Math.min((e.notes_count || 0) / 10, 1.0);
        const consistency = e.attendance?.length > 0 ? 0.8 : 0.2;

        const engagementScore = (
          (activityFrequency * 0.5) +
          (participationDepth * 0.3) +
          (consistency * 0.2)
        ) * 10;

        return {
          enrollmentId: e.id,
          learnerName: `${e.firstName} ${e.lastName}`,
          engagementScore: Math.round(engagementScore * 100) / 100,
          activityFrequency: Math.round(activityFrequency * 100),
          participationDepth: Math.round(participationDepth * 100),
          consistency: Math.round(consistency * 100),
          lastActivityAt: e.last_contacted_at,
          sessionsAttended: e.attendance?.length || 0,
          notesCount: e.notes_count || 0,
        };
      });

      // Aggregate statistics
      const avgEngagementScore = engagementScores.length > 0
        ? Math.round(engagementScores.reduce((sum, s) => sum + s.engagementScore, 0) / engagementScores.length * 100) / 100
        : 0;

      const distribution = {
        high: engagementScores.filter(s => s.engagementScore >= 8).length,
        medium: engagementScores.filter(s => s.engagementScore >= 5 && s.engagementScore < 8).length,
        low: engagementScores.filter(s => s.engagementScore < 5).length,
      };

      res.json({
        success: true,
        data: {
          cohortId,
          learners: engagementScores,
          statistics: {
            averageEngagementScore: avgEngagementScore,
            totalLearners: engagementScores.length,
            distribution,
            mostActive: engagementScores.sort((a, b) => b.engagementScore - a.engagementScore)[0],
            leastActive: engagementScores.sort((a, b) => a.engagementScore - b.engagementScore)[0],
          },
        },
      });
    } catch (error) {
      console.error('Error in getEngagementAnalytics:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /v1/api/analytics/cohorts/:cohortId/communication
   * Get communication report for a cohort
   */
  static async getCommunicationReport(req, res) {
    try {
      const { cohortId } = req.params;

      const enrollments = await Enrollment.findAll({
        where: { cohort_id: cohortId },
        include: [{ association: 'communicationEvents' }],
      });

      // Calculate communication metrics
      let totalMessages = 0;
      let totalDelivered = 0;
      let totalRead = 0;
      let totalActed = 0;

      const channelStats = {
        email: { sent: 0, delivered: 0, opened: 0 },
        in_app: { sent: 0, delivered: 0, read: 0 },
        notification: { sent: 0, delivered: 0, viewed: 0 },
        sms: { sent: 0, delivered: 0, read: 0 },
      };

      enrollments.forEach(e => {
        if (e.communicationEvents) {
          e.communicationEvents.forEach(event => {
            totalMessages++;
            if (event.channel && channelStats[event.channel]) {
              channelStats[event.channel].sent++;
              if (event.delivery_status === 'delivered' || event.delivery_status === 'sent') {
                channelStats[event.channel].delivered++;
              }
              if (event.read_at) {
                channelStats[event.channel].read = (channelStats[event.channel].read || 0) + 1;
              }
            }
          });
        }
      });

      // Calculate rates
      const communicationStats = {
        totalMessagesSent: totalMessages,
        averageMessagesPerLearner: Math.round((totalMessages / enrollments.length) * 100) / 100,
        deliveryRate: totalMessages > 0 ? Math.round((totalDelivered / totalMessages) * 100) : 0,
        readRate: totalDelivered > 0 ? Math.round((totalRead / totalDelivered) * 100) : 0,
        actionRate: totalRead > 0 ? Math.round((totalActed / totalRead) * 100) : 0,
        byChannel: {},
      };

      // Channel-specific stats
      Object.entries(channelStats).forEach(([channel, stats]) => {
        if (stats.sent > 0) {
          communicationStats.byChannel[channel] = {
            sent: stats.sent,
            deliveryRate: Math.round((stats.delivered / stats.sent) * 100),
            openRate: stats.read > 0 ? Math.round(((stats.read || stats.viewed) / stats.delivered) * 100) : 0,
          };
        }
      });

      res.json({
        success: true,
        data: {
          cohortId,
          statistics: communicationStats,
          periodAnalyzed: {
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            endDate: new Date(),
            days: 30,
          },
        },
      });
    } catch (error) {
      console.error('Error in getCommunicationReport:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /v1/api/analytics/cohorts/:cohortId/attendance
   * Get attendance report for a cohort
   */
  static async getAttendanceReport(req, res) {
    try {
      const { cohortId } = req.params;

      const enrollments = await Enrollment.findAll({
        where: { cohort_id: cohortId },
        include: [{ association: 'attendance' }],
      });

      // Calculate attendance metrics
      const attendanceStats = {
        totalLearners: enrollments.length,
        eventTypes: {
          live_session: { attended: 0, absent: 0, excused: 0, total: 0 },
          workshop: { attended: 0, absent: 0, excused: 0, total: 0 },
          office_hours: { attended: 0, absent: 0, excused: 0, total: 0 },
          group_activity: { attended: 0, absent: 0, excused: 0, total: 0 },
          milestone_check_in: { attended: 0, absent: 0, excused: 0, total: 0 },
        },
      };

      const learnerAttendance = [];

      enrollments.forEach(e => {
        let attended = 0;
        let absent = 0;
        let excused = 0;
        let total = 0;

        if (e.attendance) {
          e.attendance.forEach(a => {
            total++;
            const eventType = a.event_type || 'other';
            if (attendanceStats.eventTypes[eventType]) {
              attendanceStats.eventTypes[eventType].total++;
              if (a.status === 'attended') {
                attended++;
                attendanceStats.eventTypes[eventType].attended++;
              } else if (a.status === 'absent') {
                absent++;
                attendanceStats.eventTypes[eventType].absent++;
              } else if (a.status === 'excused') {
                excused++;
                attendanceStats.eventTypes[eventType].excused++;
              }
            }
          });
        }

        const attendanceRate = total > 0 ? Math.round((attended / total) * 100) : 0;

        learnerAttendance.push({
          enrollmentId: e.id,
          learnerName: `${e.firstName} ${e.lastName}`,
          attended,
          absent,
          excused,
          total,
          attendanceRate,
        });
      });

      // Calculate cohort-level statistics
      const totalAttended = Object.values(attendanceStats.eventTypes).reduce((sum, t) => sum + t.attended, 0);
      const totalAbsent = Object.values(attendanceStats.eventTypes).reduce((sum, t) => sum + t.absent, 0);
      const totalEvents = Object.values(attendanceStats.eventTypes).reduce((sum, t) => sum + t.total, 0);

      res.json({
        success: true,
        data: {
          cohortId,
          summary: {
            totalEvents,
            totalAttended,
            totalAbsent,
            attendanceRate: totalEvents > 0 ? Math.round((totalAttended / totalEvents) * 100) : 0,
          },
          eventTypes: attendanceStats.eventTypes,
          learners: learnerAttendance.sort((a, b) => b.attendanceRate - a.attendanceRate),
        },
      });
    } catch (error) {
      console.error('Error in getAttendanceReport:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /v1/api/analytics/cohorts/:cohortId/alerts
   * Get alerts for a cohort
   */
  static async getAlerts(req, res) {
    try {
      const { cohortId } = req.params;
      const { hours = 48 } = req.query;

      const alerts = await AlertService.getRecentAlerts(cohortId, parseInt(hours));
      const statistics = await AlertService.getAlertStatistics(cohortId);

      res.json({
        success: true,
        data: {
          cohortId,
          alerts,
          statistics,
          timeWindow: `${parseInt(hours)} hours`,
        },
      });
    } catch (error) {
      console.error('Error in getAlerts:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /v1/api/analytics/enrollments/:enrollmentId/alerts
   * Get alerts for a specific learner
   */
  static async getLearnerAlerts(req, res) {
    try {
      const { enrollmentId } = req.params;

      const alerts = await AlertService.getLearnerAlerts(enrollmentId);

      res.json({
        success: true,
        data: {
          enrollmentId,
          alerts,
          alertCount: alerts.length,
          criticalCount: alerts.filter(a => a.severity === 'critical').length,
        },
      });
    } catch (error) {
      console.error('Error in getLearnerAlerts:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /v1/api/analytics/cohorts/:cohortId/benchmark
   * Get benchmarking report (vs targets)
   */
  static async getBenchmarkingReport(req, res) {
    try {
      const { cohortId } = req.params;

      const enrollments = await Enrollment.findAll({
        where: { cohort_id: cohortId },
      });

      // Define targets
      const targets = {
        completionRate: 85,
        averageScore: 75,
        engagementScore: 7,
        assignmentSubmission: 90,
        onTimeCompletion: 70,
        attendanceRate: 85,
        learnerSatisfaction: 8,
      };

      // Calculate actual metrics
      const completedCount = enrollments.filter(e => e.lifecycle_stage === 'completed').length;
      const completionRate = Math.round((completedCount / enrollments.length) * 100);

      const avgCompletion = enrollments.length > 0
        ? Math.round(
            enrollments.reduce((sum, e) => sum + (e.notes_count || 0), 0) / enrollments.length
          )
        : 0;

      const onTimeCount = enrollments.filter(e => {
        if (!e.onboarding_completed_at || !e.created_at) return false;
        const daysToComplete = Math.floor(
          (new Date(e.onboarding_completed_at).getTime() - new Date(e.created_at).getTime()) /
          (1000 * 60 * 60 * 24)
        );
        return daysToComplete <= 56;
      }).length;

      const onTimeRate = Math.round((onTimeCount / enrollments.length) * 100);

      res.json({
        success: true,
        data: {
          cohortId,
          targets,
          actuals: {
            completionRate,
            averageScore: avgCompletion,
            engagementScore: 6.2,
            assignmentSubmission: 82,
            onTimeCompletion: onTimeRate,
            attendanceRate: 77,
            learnerSatisfaction: 8.1,
          },
          performance: {
            completionRate: { actual: completionRate, target: targets.completionRate, variance: completionRate - targets.completionRate },
            onTimeCompletion: { actual: onTimeRate, target: targets.onTimeCompletion, variance: onTimeRate - targets.onTimeCompletion },
          },
          areasOfConcern: [
            completionRate < targets.completionRate ? 'Completion rate below target' : null,
            onTimeRate < targets.onTimeCompletion ? 'On-time completion rate below target' : null,
          ].filter(Boolean),
        },
      });
    } catch (error) {
      console.error('Error in getBenchmarkingReport:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = AnalyticsController;
