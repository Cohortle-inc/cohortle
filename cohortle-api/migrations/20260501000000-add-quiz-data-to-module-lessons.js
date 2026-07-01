'use strict';

/**
 * Migration: Add quiz_data JSON column to module_lessons table
 *
 * Stores the native quiz structure (questions, settings) directly on the
 * lesson record. Only populated when lesson.type === 'quiz'.
 *
 * Requirements: 3.1
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('module_lessons');

    if (tableDescription.quiz_data) {
      console.log('Column quiz_data already exists on module_lessons, skipping');
      return;
    }

    await queryInterface.addColumn('module_lessons', 'quiz_data', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: null,
    });

    console.log('Added quiz_data column to module_lessons');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('module_lessons', 'quiz_data');
  },
};
