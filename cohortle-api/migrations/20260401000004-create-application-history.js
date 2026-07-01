'use strict';

/**
 * Migration: Create application_history table
 *
 * Records every status transition for an application, providing a full
 * audit trail of who changed what and when. Each row captures the
 * before/after status, the acting user, and any optional notes.
 *
 * Columns:
 *   id               UUID PK — auto-generated
 *   application_id   UUID NOT NULL FK → applications(id)
 *   from_status      VARCHAR(50) NULL — null for the initial submission transition
 *   to_status        VARCHAR(50) NOT NULL
 *   changed_by       INT NULL FK → users(id) — null for system/public transitions
 *   notes            TEXT NULL
 *   created_at       TIMESTAMP NOT NULL DEFAULT NOW()
 *
 * Indexes:
 *   idx_app_history_application_id  (application_id)
 *
 * Requirements: 8.1
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    // Idempotency guard — skip if table already exists
    const tables = await queryInterface.showAllTables();
    if (tables.includes('application_history')) {
      console.log('Table application_history already exists, skipping creation');
      return;
    }

    await queryInterface.createTable('application_history', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },

      application_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'applications',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Application this history record belongs to',
      },

      from_status: {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: null,
        comment: 'Status before the transition — null for the initial null → submitted transition',
      },

      to_status: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Status after the transition',
      },

      changed_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'User who triggered the transition — null for public/system transitions',
      },

      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null,
        comment: 'Optional notes recorded at the time of the transition',
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Timestamp when this history record was created',
      },
    });

    // Index on application_id — used for fetching all history for a given application
    await queryInterface.addIndex('application_history', ['application_id'], {
      name: 'idx_app_history_application_id',
    }).catch(() => {
      console.log('Index idx_app_history_application_id already exists');
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('application_history', 'idx_app_history_application_id').catch(() => {});
    await queryInterface.dropTable('application_history');
  },
};
