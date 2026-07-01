const AnalyticsController = require('../controllers/AnalyticsController');
const TokenMiddleware = require('../middleware/TokenMiddleware');

/**
 * Analytics Routes
 * All routes require authentication with convener|administrator role
 */
module.exports = (app) => {
  const convenerOrAdmin = TokenMiddleware({ role: 'convener|administrator' });

  /**
   * GET /v1/api/analytics/cohorts/:cohortId/health
   * Get comprehensive health overview for a cohort
   * Returns: Overall health score, engagement, completion rate, on-time rate, distribution
   */
  app.get(
    '/v1/api/analytics/cohorts/:cohortId/health',
    convenerOrAdmin,
    AnalyticsController.getCohortHealth
  );

  /**
   * GET /v1/api/analytics/cohorts/:cohortId/at-risk
   * Get at-risk learners for a cohort
   * Query params: threshold (default 51), limit (default 100)
   * Returns: Learners with risk scores, primary issues, recommended actions
   */
  app.get(
    '/v1/api/analytics/cohorts/:cohortId/at-risk',
    convenerOrAdmin,
    AnalyticsController.getAtRiskLearners
  );

  /**
   * GET /v1/api/analytics/enrollments/:enrollmentId/progress
   * Get progress analytics for a specific learner
   * Returns: Week number, expected vs actual progress, velocity, predicted completion
   */
  app.get(
    '/v1/api/analytics/enrollments/:enrollmentId/progress',
    convenerOrAdmin,
    AnalyticsController.getProgressAnalytics
  );

  /**
   * GET /v1/api/analytics/cohorts/:cohortId/engagement
   * Get engagement analytics for a cohort
   * Returns: Per-learner engagement scores, distribution, statistics
   */
  app.get(
    '/v1/api/analytics/cohorts/:cohortId/engagement',
    convenerOrAdmin,
    AnalyticsController.getEngagementAnalytics
  );

  /**
   * GET /v1/api/analytics/cohorts/:cohortId/communication
   * Get communication report for a cohort
   * Returns: Total messages, delivery rates, read rates, channel-specific stats
   */
  app.get(
    '/v1/api/analytics/cohorts/:cohortId/communication',
    convenerOrAdmin,
    AnalyticsController.getCommunicationReport
  );

  /**
   * GET /v1/api/analytics/cohorts/:cohortId/attendance
   * Get attendance report for a cohort
   * Returns: Overall attendance rate, by event type, per learner
   */
  app.get(
    '/v1/api/analytics/cohorts/:cohortId/attendance',
    convenerOrAdmin,
    AnalyticsController.getAttendanceReport
  );

  /**
   * GET /v1/api/analytics/cohorts/:cohortId/alerts
   * Get alerts for a cohort
   * Query params: hours (default 48)
   * Returns: Recent alerts sorted by severity, alert statistics
   */
  app.get(
    '/v1/api/analytics/cohorts/:cohortId/alerts',
    convenerOrAdmin,
    AnalyticsController.getAlerts
  );

  /**
   * GET /v1/api/analytics/enrollments/:enrollmentId/alerts
   * Get alerts for a specific learner
   * Returns: Learner-specific alerts with details and suggested actions
   */
  app.get(
    '/v1/api/analytics/enrollments/:enrollmentId/alerts',
    convenerOrAdmin,
    AnalyticsController.getLearnerAlerts
  );

  /**
   * GET /v1/api/analytics/cohorts/:cohortId/benchmark
   * Get benchmarking report (vs targets)
   * Returns: Actual vs target metrics, performance variance, areas of concern
   */
  app.get(
    '/v1/api/analytics/cohorts/:cohortId/benchmark',
    convenerOrAdmin,
    AnalyticsController.getBenchmarkingReport
  );
};
