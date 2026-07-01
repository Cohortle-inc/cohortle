'use strict';

/**
 * Migration: Create funnel_leads table for Cohortle Marketing Funnel
 *
 * Stores submitted interest form data from potential partner organisations.
 * Includes indexes on email and status for efficient querying.
 *
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Idempotent guard — skip if table already exists
    const tables = await queryInterface.showAllTables();
    if (tables.includes('funnel_leads')) {
      console.log('Table funnel_leads already exists, skipping creation');
      return;
    }

    await queryInterface.createTable('funnel_leads', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      organisation_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      contact_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      website: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      programme_type: {
        type: Sequelize.ENUM('fellowship', 'training', 'bootcamp', 'community', 'other'),
        allowNull: false,
      },
      participant_count: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      current_tools: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      pain_points: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      cohort_start_date: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      demo_scheduled_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('new', 'contacted', 'demo_scheduled', 'demo_completed', 'partner'),
        allowNull: false,
        defaultValue: 'new',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.addIndex('funnel_leads', ['email'], {
      name: 'idx_funnel_leads_email',
    });

    await queryInterface.addIndex('funnel_leads', ['status'], {
      name: 'idx_funnel_leads_status',
    });

    console.log('Table funnel_leads created successfully with indexes');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('funnel_leads');
    // Drop the ENUM types created by Sequelize (PostgreSQL-specific)
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_funnel_leads_programme_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_funnel_leads_status";');
  },
};
