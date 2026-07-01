'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Extend enrollments table with operational fields
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Add columns to enrollments table
      await queryInterface.addColumn(
        'enrollments',
        'lifecycle_stage',
        {
          type: Sequelize.ENUM('onboarding', 'active', 'at_risk', 'suspended', 'completed', 'withdrawn', 'removed', 'alumni'),
          defaultValue: 'active',
          allowNull: false,
          comment: 'Current lifecycle stage of the learner in this programme'
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'enrollments',
        'access_status_reason',
        {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'Reason for current access status (suspended, removed, etc.)'
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'enrollments',
        'suspended_at',
        {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'When the learner was suspended'
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'enrollments',
        'suspended_by',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: 'User ID of who suspended the learner'
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'enrollments',
        'reactivated_at',
        {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'When the learner was reactivated after suspension'
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'enrollments',
        'removed_at',
        {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'When the learner was removed from the programme'
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'enrollments',
        'removed_by',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          comment: 'User ID of who removed the learner'
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'enrollments',
        'payment_status',
        {
          type: Sequelize.ENUM('pending', 'partial', 'paid', 'overdue', 'failed', 'refunded'),
          allowNull: true,
          comment: 'Payment status for this enrollment'
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'enrollments',
        'payment_due_date',
        {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'Due date for payment'
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'enrollments',
        'last_contacted_at',
        {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'Last time convener or system reached out to learner'
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'enrollments',
        'onboarding_completed_at',
        {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'When learner completed onboarding'
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'enrollments',
        'graduation_status',
        {
          type: Sequelize.ENUM('active', 'graduated', 'incomplete', 'deferred'),
          allowNull: true,
          comment: 'Graduation status'
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'enrollments',
        'graduated_at',
        {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'When learner graduated from the programme'
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'enrollments',
        'notes_count',
        {
          type: Sequelize.INTEGER,
          defaultValue: 0,
          comment: 'Denormalized count of notes for quick access'
        },
        { transaction }
      );

      // Create indexes for performance
      await queryInterface.addIndex(
        'enrollments',
        ['lifecycle_stage', 'cohort_id'],
        { name: 'idx_enrollments_lifecycle_cohort', transaction }
      );

      await queryInterface.addIndex(
        'enrollments',
        ['payment_status', 'cohort_id'],
        { name: 'idx_enrollments_payment_status', transaction }
      );

      await queryInterface.addIndex(
        'enrollments',
        ['suspended_at'],
        { name: 'idx_enrollments_suspended_at', transaction }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Drop indexes
      await queryInterface.removeIndex(
        'enrollments',
        'idx_enrollments_lifecycle_cohort',
        { transaction }
      );
      await queryInterface.removeIndex(
        'enrollments',
        'idx_enrollments_payment_status',
        { transaction }
      );
      await queryInterface.removeIndex(
        'enrollments',
        'idx_enrollments_suspended_at',
        { transaction }
      );

      // Drop columns
      await queryInterface.removeColumn('enrollments', 'lifecycle_stage', { transaction });
      await queryInterface.removeColumn('enrollments', 'access_status_reason', { transaction });
      await queryInterface.removeColumn('enrollments', 'suspended_at', { transaction });
      await queryInterface.removeColumn('enrollments', 'suspended_by', { transaction });
      await queryInterface.removeColumn('enrollments', 'reactivated_at', { transaction });
      await queryInterface.removeColumn('enrollments', 'removed_at', { transaction });
      await queryInterface.removeColumn('enrollments', 'removed_by', { transaction });
      await queryInterface.removeColumn('enrollments', 'payment_status', { transaction });
      await queryInterface.removeColumn('enrollments', 'payment_due_date', { transaction });
      await queryInterface.removeColumn('enrollments', 'last_contacted_at', { transaction });
      await queryInterface.removeColumn('enrollments', 'onboarding_completed_at', { transaction });
      await queryInterface.removeColumn('enrollments', 'graduation_status', { transaction });
      await queryInterface.removeColumn('enrollments', 'graduated_at', { transaction });
      await queryInterface.removeColumn('enrollments', 'notes_count', { transaction });
    });
  }
};
