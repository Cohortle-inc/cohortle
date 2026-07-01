/**
 * Migration: Create analytics cache tables
 * Purpose: Performance optimization for computed metrics
 * 
 * These tables cache expensive calculations to avoid recalculating on every request
 * Cache entries expire after a set time and are refreshed on demand
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      /**
       * cohort_analytics_cache
       * Stores computed metrics for cohorts
       */
      await queryInterface.createTable(
        'cohort_analytics_cache',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          cohort_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'cohorts',
              key: 'id',
            },
            onDelete: 'CASCADE',
          },
          overall_health_score: {
            type: Sequelize.FLOAT,
            allowNull: false,
            comment: '0-100 scale, inverted (higher = better)',
          },
          engagement_score: {
            type: Sequelize.FLOAT,
            allowNull: false,
            comment: '0-10 scale',
          },
          completion_rate: {
            type: Sequelize.INTEGER,
            allowNull: false,
            comment: 'Percentage 0-100',
          },
          on_time_rate: {
            type: Sequelize.INTEGER,
            allowNull: false,
            comment: 'Percentage 0-100',
          },
          at_risk_count: {
            type: Sequelize.INTEGER,
            allowNull: false,
            comment: 'Number of learners with risk score > 50',
          },
          progress_velocity: {
            type: Sequelize.ENUM('accelerating', 'stable', 'decelerating'),
            allowNull: false,
            defaultValue: 'stable',
          },
          health_distribution: {
            type: Sequelize.JSON,
            allowNull: true,
            comment: '{ healthy: n, monitor: n, at_risk: n, critical: n }',
          },
          calculated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
          },
          expires_at: {
            type: Sequelize.DATE,
            allowNull: false,
            comment: 'Cache invalidation timestamp',
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
          },
        },
        { transaction }
      );

      // Indexes for cohort_analytics_cache
      await queryInterface.addIndex(
        'cohort_analytics_cache',
        ['cohort_id'],
        { transaction, name: 'idx_cohort_analytics_cohort_id' }
      );

      await queryInterface.addIndex(
        'cohort_analytics_cache',
        ['expires_at'],
        { transaction, name: 'idx_cohort_analytics_expires_at' }
      );

      await queryInterface.addIndex(
        'cohort_analytics_cache',
        ['at_risk_count'],
        { transaction, name: 'idx_cohort_analytics_at_risk_count' }
      );

      /**
       * learner_health_cache
       * Stores computed health metrics for individual learners
       */
      await queryInterface.createTable(
        'learner_health_cache',
        {
          id: {
            type: Sequelize.BIGINT,
            primaryKey: true,
            autoIncrement: true,
          },
          enrollment_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'enrollments',
              key: 'id',
            },
            onDelete: 'CASCADE',
          },
          risk_score: {
            type: Sequelize.FLOAT,
            allowNull: false,
            comment: '0-100 scale, higher = more at-risk',
          },
          health_status: {
            type: Sequelize.ENUM('healthy', 'monitor', 'at_risk', 'critical'),
            allowNull: false,
          },
          primary_issues: {
            type: Sequelize.JSON,
            allowNull: true,
            comment: 'Array of top 3 issues',
          },
          score_breakdown: {
            type: Sequelize.JSON,
            allowNull: true,
            comment: 'Detailed score components',
          },
          engagement_score: {
            type: Sequelize.FLOAT,
            allowNull: true,
            comment: 'Component score for engagement',
          },
          progress_score: {
            type: Sequelize.FLOAT,
            allowNull: true,
            comment: 'Component score for progress',
          },
          communication_score: {
            type: Sequelize.FLOAT,
            allowNull: true,
            comment: 'Component score for communication',
          },
          calculated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
          },
          expires_at: {
            type: Sequelize.DATE,
            allowNull: false,
            comment: 'Cache invalidation timestamp',
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
          },
        },
        { transaction }
      );

      // Indexes for learner_health_cache
      await queryInterface.addIndex(
        'learner_health_cache',
        ['enrollment_id'],
        { transaction, name: 'idx_learner_health_enrollment_id' }
      );

      await queryInterface.addIndex(
        'learner_health_cache',
        ['health_status'],
        { transaction, name: 'idx_learner_health_status' }
      );

      await queryInterface.addIndex(
        'learner_health_cache',
        ['risk_score'],
        { transaction, name: 'idx_learner_health_risk_score' }
      );

      await queryInterface.addIndex(
        'learner_health_cache',
        ['expires_at'],
        { transaction, name: 'idx_learner_health_expires_at' }
      );

      // Composite index for cohort + status filtering
      await queryInterface.addIndex(
        'learner_health_cache',
        ['enrollment_id', 'health_status'],
        { transaction, name: 'idx_learner_health_enrollment_status' }
      );

      /**
       * alert_events
       * Stores generated alerts for audit and historical analysis
       */
      await queryInterface.createTable(
        'alert_events',
        {
          id: {
            type: Sequelize.BIGINT,
            primaryKey: true,
            autoIncrement: true,
          },
          enrollment_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'enrollments',
              key: 'id',
            },
            onDelete: 'CASCADE',
          },
          cohort_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'cohorts',
              key: 'id',
            },
            onDelete: 'CASCADE',
          },
          alert_type: {
            type: Sequelize.ENUM(
              'activity_drop',
              'grade_decline',
              'milestone_overdue',
              'disengagement_pattern',
              'late_submission_trend',
              'forum_silence',
              'office_hours_no_show'
            ),
            allowNull: false,
          },
          severity: {
            type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
            allowNull: false,
          },
          message: {
            type: Sequelize.TEXT,
            allowNull: false,
          },
          suggested_action: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          details: {
            type: Sequelize.JSON,
            allowNull: true,
            comment: 'Alert-specific data (e.g., days since activity)',
          },
          acknowledged: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
          },
          acknowledged_by: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
              model: 'users',
              key: 'id',
            },
            onDelete: 'SET NULL',
          },
          acknowledged_at: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          acknowledged_notes: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          resolved: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
          },
          resolved_by: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
              model: 'users',
              key: 'id',
            },
            onDelete: 'SET NULL',
          },
          resolved_at: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          resolution_notes: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
          },
        },
        { transaction }
      );

      // Indexes for alert_events
      await queryInterface.addIndex(
        'alert_events',
        ['enrollment_id'],
        { transaction, name: 'idx_alert_enrollment_id' }
      );

      await queryInterface.addIndex(
        'alert_events',
        ['cohort_id'],
        { transaction, name: 'idx_alert_cohort_id' }
      );

      await queryInterface.addIndex(
        'alert_events',
        ['severity'],
        { transaction, name: 'idx_alert_severity' }
      );

      await queryInterface.addIndex(
        'alert_events',
        ['alert_type'],
        { transaction, name: 'idx_alert_type' }
      );

      await queryInterface.addIndex(
        'alert_events',
        ['created_at'],
        { transaction, name: 'idx_alert_created_at' }
      );

      await queryInterface.addIndex(
        'alert_events',
        ['resolved'],
        { transaction, name: 'idx_alert_resolved' }
      );

      // Composite index for common queries
      await queryInterface.addIndex(
        'alert_events',
        ['cohort_id', 'severity', 'created_at'],
        { transaction, name: 'idx_alert_cohort_severity_date' }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.dropTable('alert_events', { transaction });
      await queryInterface.dropTable('learner_health_cache', { transaction });
      await queryInterface.dropTable('cohort_analytics_cache', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
