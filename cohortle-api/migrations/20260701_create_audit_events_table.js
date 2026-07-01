'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Create audit_events table for operational auditability
      await queryInterface.createTable(
        'audit_events',
        {
          id: {
            type: Sequelize.BIGINT,
            primaryKey: true,
            autoIncrement: true
          },
          actor_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            comment: 'User ID who performed the action'
          },
          target_type: {
            type: Sequelize.STRING(50),
            allowNull: false,
            comment: 'Type of target (enrollment, payment, note, etc.)'
          },
          target_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            comment: 'ID of the target entity'
          },
          action: {
            type: Sequelize.STRING(100),
            allowNull: false,
            comment: 'Action performed (suspend, reactivate, remove, create_note, etc.)'
          },
          before_value: {
            type: Sequelize.JSON,
            allowNull: true,
            comment: 'Previous state before action'
          },
          after_value: {
            type: Sequelize.JSON,
            allowNull: true,
            comment: 'New state after action'
          },
          reason: {
            type: Sequelize.TEXT,
            allowNull: true,
            comment: 'Reason for the action'
          },
          metadata: {
            type: Sequelize.JSON,
            allowNull: true,
            comment: 'Additional metadata'
          },
          created_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW,
            allowNull: false
          },
          ip_address: {
            type: Sequelize.STRING(45),
            allowNull: true,
            comment: 'IP address of actor'
          },
          user_agent: {
            type: Sequelize.STRING(255),
            allowNull: true,
            comment: 'User agent string'
          }
        },
        { transaction }
      );

      // Create indexes for audit queries
      await queryInterface.addIndex(
        'audit_events',
        ['actor_id', 'created_at'],
        { name: 'idx_audit_actor_date', transaction }
      );

      await queryInterface.addIndex(
        'audit_events',
        ['target_type', 'target_id'],
        { name: 'idx_audit_target', transaction }
      );

      await queryInterface.addIndex(
        'audit_events',
        ['action', 'created_at'],
        { name: 'idx_audit_action_date', transaction }
      );

      await queryInterface.addIndex(
        'audit_events',
        ['created_at'],
        { name: 'idx_audit_date', transaction }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex('audit_events', 'idx_audit_actor_date', { transaction });
      await queryInterface.removeIndex('audit_events', 'idx_audit_target', { transaction });
      await queryInterface.removeIndex('audit_events', 'idx_audit_action_date', { transaction });
      await queryInterface.removeIndex('audit_events', 'idx_audit_date', { transaction });
      await queryInterface.dropTable('audit_events', { transaction });
    });
  }
};
