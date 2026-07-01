'use strict';

/**
 * Migration: Create assignment_submissions table
 *
 * One row per learner per lesson per cohort (unique constraint).
 * Re-submission updates the existing row (upsert in service layer).
 *
 * Requirements: 5.2
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('assignment_submissions')) {
      console.log('Table assignment_submissions already exists, skipping creation');
      return;
    }

    await queryInterface.createTable('assignment_submissions', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      lesson_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'module_lessons',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      cohort_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'cohorts',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      text_answer: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('submitted', 'graded'),
        allowNull: false,
        defaultValue: 'submitted',
      },
      grading_status: {
        type: Sequelize.ENUM('pending', 'passed', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
      },
      feedback: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      submitted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      graded_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    // Unique: one submission per learner per lesson per cohort
    await queryInterface.addIndex('assignment_submissions', ['lesson_id', 'user_id', 'cohort_id'], {
      name: 'idx_assignment_submissions_unique',
      unique: true,
    });

    await queryInterface.addIndex('assignment_submissions', ['lesson_id'], {
      name: 'idx_assignment_submissions_lesson_id',
    });

    await queryInterface.addIndex('assignment_submissions', ['user_id'], {
      name: 'idx_assignment_submissions_user_id',
    });

    console.log('Created assignment_submissions table');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('assignment_submissions');
  },
};
