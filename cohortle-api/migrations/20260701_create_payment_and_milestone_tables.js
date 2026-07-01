'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Create learner_payments table
      await queryInterface.createTable(
        'learner_payments',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
          },
          enrollment_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'enrollments', key: 'id' }
          },
          amount: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false,
            comment: 'Payment amount in the specified currency'
          },
          currency: {
            type: Sequelize.CHAR(3),
            allowNull: false,
            defaultValue: 'USD',
            comment: 'ISO 4217 currency code'
          },
          status: {
            type: Sequelize.ENUM('pending', 'processing', 'completed', 'failed', 'refunded', 'disputed'),
            allowNull: false,
            defaultValue: 'pending',
            comment: 'Payment status'
          },
          payment_type: {
            type: Sequelize.ENUM('full', 'installment', 'partial', 'deposit'),
            allowNull: false,
            defaultValue: 'full',
            comment: 'Type of payment'
          },
          provider: {
            type: Sequelize.STRING(50),
            allowNull: true,
            comment: 'Payment provider (stripe, paypal, etc.)'
          },
          provider_reference: {
            type: Sequelize.STRING(255),
            allowNull: true,
            comment: 'Reference ID from payment provider'
          },
          installment_plan_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
            comment: 'ID of installment plan if applicable'
          },
          installment_number: {
            type: Sequelize.INTEGER,
            allowNull: true,
            comment: 'Which installment this is (1, 2, 3, etc.)'
          },
          due_date: {
            type: Sequelize.DATE,
            allowNull: true,
            comment: 'When payment is due'
          },
          paid_at: {
            type: Sequelize.DATE,
            allowNull: true,
            comment: 'When payment was completed'
          },
          created_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW,
            allowNull: false
          },
          updated_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW,
            allowNull: false
          },
          failure_reason: {
            type: Sequelize.TEXT,
            allowNull: true,
            comment: 'Reason for payment failure'
          }
        },
        { transaction }
      );

      await queryInterface.addIndex('learner_payments', ['enrollment_id'], { transaction });
      await queryInterface.addIndex('learner_payments', ['status'], { transaction });
      await queryInterface.addIndex('learner_payments', ['due_date'], { transaction });
      await queryInterface.addIndex('learner_payments', ['provider_reference'], { transaction });

      // Create installment_plans table
      await queryInterface.createTable(
        'installment_plans',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
          },
          enrollment_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'enrollments', key: 'id' }
          },
          total_amount: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false,
            comment: 'Total amount to be paid across all installments'
          },
          currency: {
            type: Sequelize.CHAR(3),
            allowNull: false,
            defaultValue: 'USD'
          },
          num_installments: {
            type: Sequelize.INTEGER,
            allowNull: false,
            comment: 'Total number of installments'
          },
          installment_amount: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false,
            comment: 'Amount per installment'
          },
          frequency: {
            type: Sequelize.ENUM('weekly', 'biweekly', 'monthly', 'custom'),
            allowNull: false,
            defaultValue: 'monthly',
            comment: 'Frequency of installments'
          },
          start_date: {
            type: Sequelize.DATE,
            allowNull: false,
            comment: 'Date of first installment'
          },
          status: {
            type: Sequelize.ENUM('active', 'paused', 'completed', 'failed', 'cancelled'),
            allowNull: false,
            defaultValue: 'active'
          },
          created_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW,
            allowNull: false
          },
          updated_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW,
            allowNull: false
          }
        },
        { transaction }
      );

      await queryInterface.addIndex('installment_plans', ['enrollment_id'], { transaction });
      await queryInterface.addIndex('installment_plans', ['status'], { transaction });

      // Create learner_milestones table
      await queryInterface.createTable(
        'learner_milestones',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
          },
          enrollment_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'enrollments', key: 'id' }
          },
          cohort_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'cohorts', key: 'id' }
          },
          milestone_type: {
            type: Sequelize.ENUM('assignment_submission', 'week_completion', 'assessment_pass', 'participation_goal', 'custom'),
            allowNull: false,
            comment: 'Type of milestone'
          },
          title: {
            type: Sequelize.STRING(255),
            allowNull: false,
            comment: 'Milestone title'
          },
          description: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          status: {
            type: Sequelize.ENUM('pending', 'in_progress', 'completed', 'at_risk', 'overdue'),
            allowNull: false,
            defaultValue: 'pending'
          },
          due_date: {
            type: Sequelize.DATE,
            allowNull: true,
            comment: 'When milestone is due'
          },
          completed_at: {
            type: Sequelize.DATE,
            allowNull: true,
            comment: 'When milestone was completed'
          },
          created_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW,
            allowNull: false
          },
          updated_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW,
            allowNull: false
          }
        },
        { transaction }
      );

      await queryInterface.addIndex('learner_milestones', ['enrollment_id'], { transaction });
      await queryInterface.addIndex('learner_milestones', ['status'], { transaction });
      await queryInterface.addIndex('learner_milestones', ['due_date'], { transaction });
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('learner_milestones', { transaction });
      await queryInterface.dropTable('installment_plans', { transaction });
      await queryInterface.dropTable('learner_payments', { transaction });
    });
  }
};
