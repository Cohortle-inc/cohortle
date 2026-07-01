'use strict';

/**
 * Migration: Create quiz_attempts table
 *
 * Stores each learner's quiz submission. Multiple rows per (lesson_id, user_id, cohort_id)
 * are allowed to support retakes. The `passed` flag is derived at insert time from
 * the quiz's passing_score setting.
 *
 * Requirements: 7.1
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('quiz_attempts')) {
      console.log('Table quiz_attempts already exists, skipping creation');
      return;
    }

    await queryInterface.createTable('quiz_attempts', {
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
      answers: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      score: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      passed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      submitted_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('quiz_attempts', ['lesson_id', 'user_id', 'cohort_id'], {
      name: 'idx_quiz_attempts_lesson_user_cohort',
    });
    await queryInterface.addIndex('quiz_attempts', ['lesson_id'], {
      name: 'idx_quiz_attempts_lesson_id',
    });
    await queryInterface.addIndex('quiz_attempts', ['user_id'], {
      name: 'idx_quiz_attempts_user_id',
    });

    console.log('Created quiz_attempts table');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('quiz_attempts');
  },
};
