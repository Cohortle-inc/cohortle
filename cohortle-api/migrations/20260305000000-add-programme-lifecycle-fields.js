'use strict';

/**
 * Migration: Add programme lifecycle management fields
 * 
 * Adds lifecycle_status, status_changed_at, status_changed_by, and onboarding_mode
 * fields to the programmes table to support programme lifecycle management.
 * 
 * Lifecycle states: draft, recruiting, active, completed, archived
 * Onboarding modes: code (join with code), application (apply to join)
 * 
 * Requirements: 10.1-10.7, 11.1-11.6
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if lifecycle_status column already exists
    const tableDescription = await queryInterface.describeTable('programmes');
    
    if (!tableDescription.lifecycle_status) {
      await queryInterface.addColumn('programmes', 'lifecycle_status', {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'draft',
        comment: 'Programme lifecycle state: draft, recruiting, active, completed, archived'
      });
    }

    if (!tableDescription.status_changed_at) {
      await queryInterface.addColumn('programmes', 'status_changed_at', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Timestamp of last lifecycle status change'
      });
    }

    if (!tableDescription.status_changed_by) {
      await queryInterface.addColumn('programmes', 'status_changed_by', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'User who last changed the lifecycle status'
      });
    }

    if (!tableDescription.onboarding_mode) {
      await queryInterface.addColumn('programmes', 'onboarding_mode', {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'code',
        comment: 'Learner onboarding mode: code (join with code) or application (apply to join)'
      });
    }

    // Add check constraints for valid values
    await queryInterface.sequelize.query(`
      ALTER TABLE programmes 
      ADD CONSTRAINT chk_lifecycle_status 
      CHECK (lifecycle_status IN ('draft', 'recruiting', 'active', 'completed', 'archived'))
    `).catch(() => {
      // Constraint might already exist, ignore error
      console.log('Constraint chk_lifecycle_status already exists or could not be created');
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE programmes 
      ADD CONSTRAINT chk_onboarding_mode 
      CHECK (onboarding_mode IN ('code', 'application'))
    `).catch(() => {
      // Constraint might already exist, ignore error
      console.log('Constraint chk_onboarding_mode already exists or could not be created');
    });

    // Add index for lifecycle_status for efficient filtering
    await queryInterface.addIndex('programmes', ['lifecycle_status'], {
      name: 'idx_programmes_lifecycle_status'
    }).catch(() => {
      // Index might already exist, ignore error
      console.log('Index idx_programmes_lifecycle_status already exists');
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove constraints
    await queryInterface.sequelize.query(`
      ALTER TABLE programmes DROP CONSTRAINT IF EXISTS chk_lifecycle_status
    `).catch(() => {
      console.log('Constraint chk_lifecycle_status does not exist');
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE programmes DROP CONSTRAINT IF EXISTS chk_onboarding_mode
    `).catch(() => {
      console.log('Constraint chk_onboarding_mode does not exist');
    });

    // Remove index
    await queryInterface.removeIndex('programmes', 'idx_programmes_lifecycle_status')
      .catch(() => {
        console.log('Index idx_programmes_lifecycle_status does not exist');
      });

    // Remove columns
    await queryInterface.removeColumn('programmes', 'lifecycle_status');
    await queryInterface.removeColumn('programmes', 'status_changed_at');
    await queryInterface.removeColumn('programmes', 'status_changed_by');
    await queryInterface.removeColumn('programmes', 'onboarding_mode');
  }
};
