const { Enrollment, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * LearnerHealthService
 * Calculates learner health metrics and at-risk scores for proactive intervention
 */
class LearnerHealthService {
  /**
   * Calculate at-risk score for a single learner (0-100 scale)
   * Score breakdown:
   * - 25%: Engagement (activity recency & frequency)
   * - 20%: Assignment completion rate
   * - 15%: Forum/discussion participation
   * - 20%: Progress vs. cohort average
   * - 15%: Assignment grades
   * - 10%: Milestone completion
   * - 10%: Recent convener contact
   * - 10%: Support notes logged
   * - 30%: Lifecycle stage
   * - 5%: Suspension history
   */
  static async calculateAtRiskScore(enrollmentId) {
    try {
      const enrollment = await Enrollment.findByPk(enrollmentId, {
        include: [{ association: 'cohort' }],
      });

      if (!enrollment) {
        throw new Error(`Enrollment ${enrollmentId} not found`);
      }

      const metrics = await this.gatherHealthMetrics(enrollmentId, enrollment.cohort_id);

      const score = this.computeAtRiskScore(enrollment, metrics);

      return {
        enrollmentId,
        learnerName: `${enrollment.firstName} ${enrollment.lastName}`,
        riskScore: Math.round(score.total * 100) / 100,
        healthStatus: this.getHealthStatus(score.total),
        primaryIssues: this.identifyPrimaryIssues(score),
        scoreBreakdown: {
          engagement: Math.round(score.engagement * 100) / 100,
          assignments: Math.round(score.assignments * 100) / 100,
          forum: Math.round(score.forum * 100) / 100,
          progress: Math.round(score.progress * 100) / 100,
          grades: Math.round(score.grades * 100) / 100,
          milestones: Math.round(score.milestones * 100) / 100,
          contact: Math.round(score.contact * 100) / 100,
          support: Math.round(score.support * 100) / 100,
          lifecycle: Math.round(score.lifecycle * 100) / 100,
          suspension: Math.round(score.suspension * 100) / 100,
        },
        metrics,
      };
    } catch (error) {
      console.error(`Error calculating at-risk score for enrollment ${enrollmentId}:`, error);
      throw error;
    }
  }

  /**
   * Get at-risk learners for a cohort, sorted by risk score
   */
  static async getAtRiskLearners(cohortId, threshold = 51, limit = 100) {
    try {
      const enrollments = await Enrollment.findAll({
        where: {
          cohort_id: cohortId,
          lifecycle_stage: { [Op.ne]: 'removed' },
        },
        limit,
      });

      const scores = await Promise.all(
        enrollments.map(e => this.calculateAtRiskScore(e.id))
      );

      return scores
        .filter(s => s.riskScore >= threshold)
        .sort((a, b) => b.riskScore - a.riskScore)
        .map(s => ({
          ...s,
          actionRecommended: s.riskScore > 75 ? 'immediate_outreach' : 'monitor',
        }));
    } catch (error) {
      console.error(`Error fetching at-risk learners for cohort ${cohortId}:`, error);
      throw error;
    }
  }

  /**
   * Get comprehensive health overview for a cohort
   */
  static async getCohortHealth(cohortId) {
    try {
      const enrollments = await Enrollment.findAll({
        where: {
          cohort_id: cohortId,
          lifecycle_stage: { [Op.ne]: 'removed' },
        },
      });

      const allScores = await Promise.all(
        enrollments.map(e => this.calculateAtRiskScore(e.id))
      );

      const healthDistribution = {
        healthy: allScores.filter(s => s.riskScore < 25).length,
        monitor: allScores.filter(s => s.riskScore >= 25 && s.riskScore < 50).length,
        atRisk: allScores.filter(s => s.riskScore >= 50 && s.riskScore < 75).length,
        critical: allScores.filter(s => s.riskScore >= 75).length,
      };

      return {
        cohortId,
        totalLearners: enrollments.length,
        overallScore: this.aggregateScore(allScores),
        healthDistribution,
        engagementScore: this.calculateEngagementScore(enrollments),
        completionRate: this.calculateCompletionRate(enrollments),
        onTimeRate: this.calculateOnTimeRate(enrollments),
        progressVelocity: this.calculateProgressVelocity(enrollments),
        trend: this.calculateTrend(allScores),
        topIssues: this.identifyTopIssues(allScores),
        calculatedAt: new Date(),
      };
    } catch (error) {
      console.error(`Error fetching cohort health for ${cohortId}:`, error);
      throw error;
    }
  }

  /**
   * Gather health metrics for a learner
   */
  static async gatherHealthMetrics(enrollmentId, cohortId) {
    try {
      const enrollment = await Enrollment.findByPk(enrollmentId, {
        include: [
          { association: 'notes' },
          { association: 'communicationEvents' },
          { association: 'attendance' },
        ],
      });

      // Calculate days since last activity
      const lastContactAt = enrollment.last_contacted_at 
        ? new Date(enrollment.last_contacted_at) 
        : new Date(enrollment.created_at);
      const daysSinceContact = Math.floor(
        (Date.now() - lastContactAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Notes and support tracking
      const notesCount = enrollment.notes_count || 0;
      const recentNotes = enrollment.notes 
        ? enrollment.notes.filter(n => {
            const noteDate = new Date(n.created_at);
            const daysSinceNote = (Date.now() - noteDate.getTime()) / (1000 * 60 * 60 * 24);
            return daysSinceNote < 30;
          }).length 
        : 0;

      // Communication tracking
      const communicationCount = enrollment.communicationEvents?.length || 0;
      const recentCommunication = enrollment.communicationEvents
        ? enrollment.communicationEvents.filter(e => {
            const eventDate = new Date(e.created_at);
            const daysSinceEvent = (Date.now() - eventDate.getTime()) / (1000 * 60 * 60 * 24);
            return daysSinceEvent < 14;
          }).length
        : 0;

      // Attendance tracking
      const attendanceCount = enrollment.attendance?.length || 0;
      const recentAttendance = enrollment.attendance
        ? enrollment.attendance.filter(a => {
            const eventDate = new Date(a.event_date);
            const daysSinceEvent = (Date.now() - eventDate.getTime()) / (1000 * 60 * 60 * 24);
            return daysSinceEvent < 30;
          }).length
        : 0;

      // Suspension history
      const wasSuspended = enrollment.lifecycle_stage === 'suspended' || 
                          (enrollment.suspended_at && enrollment.reactivated_at === null);
      const daysSuspended = enrollment.suspended_at && !enrollment.reactivated_at
        ? Math.floor((Date.now() - new Date(enrollment.suspended_at).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        daysSinceLastActivity: daysSinceContact,
        lifecycleStage: enrollment.lifecycle_stage,
        paymentStatus: enrollment.payment_status,
        completionPercentage: Math.min((enrollment.notes_count || 0) * 10, 100), // Placeholder
        notesCount,
        recentNotes,
        communicationCount,
        recentCommunication,
        attendanceCount,
        recentAttendance,
        wasSuspended,
        daysSuspended,
        suspendedAt: enrollment.suspended_at,
        reactivatedAt: enrollment.reactivated_at,
        lastContactAt,
        onboardingCompletedAt: enrollment.onboarding_completed_at,
        graduationStatus: enrollment.graduation_status,
      };
    } catch (error) {
      console.error(`Error gathering health metrics for ${enrollmentId}:`, error);
      throw error;
    }
  }

  /**
   * Compute at-risk score with weighted components
   */
  static computeAtRiskScore(enrollment, metrics) {
    // Engagement score (25% weight)
    const engagementScore = Math.min(metrics.daysSinceLastActivity / 30, 1.0);

    // Assignment completion (20% weight) - based on notes count as proxy
    const assignmentScore = Math.max(0, 1.0 - (metrics.notesCount / 10));

    // Forum participation (15% weight)
    const forumScore = Math.max(0, 1.0 - (metrics.recentAttendance / 5));

    // Progress vs. cohort (20% weight) - based on completion percentage
    const progressScore = Math.max(0, 1.0 - (metrics.completionPercentage / 100));

    // Assignment grades (15% weight) - proxy through recent notes
    const gradesScore = metrics.recentNotes === 0 ? 0.5 : Math.max(0, 1.0 - (metrics.recentNotes / 3));

    // Milestone completion (10% weight)
    const milestoneScore = metrics.completionPercentage < 50 ? 0.7 : 0.2;

    // Recent contact (10% weight)
    const contactScore = Math.min(metrics.daysSinceLastActivity / 28, 1.0);

    // Support notes logged (10% weight)
    const supportScore = metrics.recentNotes === 0 && metrics.daysSinceLastActivity > 7 ? 0.8 : 0.2;

    // Lifecycle stage (30% weight)
    const lifecycleScores = {
      onboarding: 0.3,
      active: 0.0,
      at_risk: 0.8,
      suspended: 0.9,
      completed: 0.1,
      withdrawn: 0.7,
      removed: 1.0,
      alumni: 0.1,
    };
    const lifecycleScore = lifecycleScores[enrollment.lifecycle_stage] || 0.0;

    // Suspension history (5% weight)
    const suspensionScore = metrics.wasSuspended ? 0.3 : 0.0;

    // Calculate weighted total
    const total = (
      (engagementScore * 0.25) +
      (assignmentScore * 0.20) +
      (forumScore * 0.15) +
      (progressScore * 0.20) +
      (gradesScore * 0.15) +
      (milestoneScore * 0.10) +
      (contactScore * 0.10) +
      (supportScore * 0.10) +
      (lifecycleScore * 0.30) +
      (suspensionScore * 0.05)
    );

    // Normalize to 0-100 scale
    return {
      total: Math.max(0, Math.min(100, total * 100)),
      engagement: engagementScore,
      assignments: assignmentScore,
      forum: forumScore,
      progress: progressScore,
      grades: gradesScore,
      milestones: milestoneScore,
      contact: contactScore,
      support: supportScore,
      lifecycle: lifecycleScore,
      suspension: suspensionScore,
    };
  }

  /**
   * Get health status from risk score
   */
  static getHealthStatus(score) {
    if (score < 25) return 'healthy';
    if (score < 50) return 'monitor';
    if (score < 75) return 'at_risk';
    return 'critical';
  }

  /**
   * Identify primary issues for a learner
   */
  static identifyPrimaryIssues(score) {
    const issues = [];

    if (score.engagement > 0.6) issues.push('No Recent Activity');
    if (score.assignments > 0.6) issues.push('Low Assignment Completion');
    if (score.forum > 0.6) issues.push('No Participation');
    if (score.progress > 0.6) issues.push('Behind Progress');
    if (score.grades > 0.6) issues.push('Low Grades');
    if (score.milestones > 0.6) issues.push('Milestone Delays');
    if (score.contact > 0.6) issues.push('No Contact');
    if (score.suspension > 0.3) issues.push('Suspension History');

    return issues.slice(0, 3); // Top 3 issues
  }

  /**
   * Identify top issues across cohort
   */
  static identifyTopIssues(scores) {
    const issueCounts = {};

    scores.forEach(score => {
      score.primaryIssues.forEach(issue => {
        issueCounts[issue] = (issueCounts[issue] || 0) + 1;
      });
    });

    return Object.entries(issueCounts)
      .map(([issue, count]) => ({ issue, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  /**
   * Aggregate health score for cohort
   */
  static aggregateScore(scores) {
    if (scores.length === 0) return 0;

    const weightedSum = scores.reduce((sum, score) => {
      // Weight critical cases more heavily
      const weight = score.riskScore > 75 ? 1.5 : 1.0;
      return sum + (score.riskScore * weight);
    }, 0);

    const totalWeight = scores.length + 
      scores.filter(s => s.riskScore > 75).length * 0.5;

    const average = weightedSum / totalWeight;
    return Math.round((100 - average) * 100) / 100; // Invert: higher is better
  }

  /**
   * Calculate engagement score for cohort (0-10 scale)
   */
  static calculateEngagementScore(enrollments) {
    if (enrollments.length === 0) return 0;

    const totalActivity = enrollments.reduce((sum, e) => {
      const daysSinceActivity = e.last_contacted_at
        ? Math.floor((Date.now() - new Date(e.last_contacted_at).getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      return sum + Math.max(0, 1.0 - (daysSinceActivity / 30));
    }, 0);

    const engagement = (totalActivity / enrollments.length) * 10;
    return Math.round(engagement * 100) / 100;
  }

  /**
   * Calculate completion rate for cohort
   */
  static calculateCompletionRate(enrollments) {
    if (enrollments.length === 0) return 0;

    const completedCount = enrollments.filter(e => e.lifecycle_stage === 'completed').length;
    return Math.round((completedCount / enrollments.length) * 100);
  }

  /**
   * Calculate on-time rate for cohort
   */
  static calculateOnTimeRate(enrollments) {
    if (enrollments.length === 0) return 0;

    const onTimeCount = enrollments.filter(e => {
      if (!e.onboarding_completed_at) return false;
      // Assume 8-week course, if completed within 9 weeks = on-time
      const daysToComplete = Math.floor(
        (new Date(e.onboarding_completed_at).getTime() - new Date(e.created_at).getTime()) /
        (1000 * 60 * 60 * 24)
      );
      return daysToComplete <= 56; // 8 weeks
    }).length;

    return Math.round((onTimeCount / enrollments.length) * 100);
  }

  /**
   * Calculate progress velocity (trend direction)
   */
  static calculateProgressVelocity(enrollments) {
    if (enrollments.length === 0) return 'stable';

    // In production, would track progress over time
    // For now, return based on completion distribution
    const completedPercentage = (
      enrollments.filter(e => e.lifecycle_stage === 'completed').length /
      enrollments.length
    ) * 100;

    if (completedPercentage > 70) return 'accelerating';
    if (completedPercentage > 40) return 'stable';
    return 'decelerating';
  }

  /**
   * Calculate trend for cohort (up, stable, down)
   */
  static calculateTrend(scores) {
    if (scores.length === 0) return 'stable';

    const criticalCount = scores.filter(s => s.riskScore >= 75).length;
    const criticalPercentage = (criticalCount / scores.length) * 100;

    if (criticalPercentage > 30) return 'down';
    if (criticalPercentage < 10) return 'up';
    return 'stable';
  }

  /**
   * Get access permissions for learner based on lifecycle stage
   */
  static getAccessPermissions(lifecycleStage) {
    const permissions = {
      onboarding: {
        can_access_content: true,
        can_submit_work: true,
        can_communicate: true,
        can_access_resources: true,
      },
      active: {
        can_access_content: true,
        can_submit_work: true,
        can_communicate: true,
        can_access_resources: true,
      },
      at_risk: {
        can_access_content: true,
        can_submit_work: true,
        can_communicate: true,
        can_access_resources: true,
      },
      suspended: {
        can_access_content: false,
        can_submit_work: false,
        can_communicate: true, // Can still receive messages
        can_access_resources: false,
      },
      completed: {
        can_access_content: true,
        can_submit_work: false,
        can_communicate: true,
        can_access_resources: true,
      },
      withdrawn: {
        can_access_content: false,
        can_submit_work: false,
        can_communicate: false,
        can_access_resources: false,
      },
      removed: {
        can_access_content: false,
        can_submit_work: false,
        can_communicate: false,
        can_access_resources: false,
      },
      alumni: {
        can_access_content: true, // Read-only
        can_submit_work: false,
        can_communicate: true,
        can_access_resources: true,
      },
    };

    return permissions[lifecycleStage] || permissions.active;
  }
}

module.exports = LearnerHealthService;
