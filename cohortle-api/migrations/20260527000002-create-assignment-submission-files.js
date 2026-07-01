'use strict';

/**
 * Migration: Create assignment_submission_files table
 *
 * Stores file metadata for files attached to an assignment submission.
 * Multiple files per submission are supported.
 *
 * Requirements: 5.3
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('assignment_submission_files')) {
      console.log('Table assignment_submission_files already exists, skipping creation');
      return;
    }

    await queryInterface.createTable('assignment_submission_files', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      submission_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'assignment_submissions',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      file_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      file_url: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      file_type: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      file_size: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'File size in bytes',
      },
      uploaded_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('assignment_submission_files', ['submission_id'], {
      name: 'idx_assignment_submission_files_submission_id',
    });

    console.log('Created assignment_submission_files table');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('assignment_submission_files');
  },
};
