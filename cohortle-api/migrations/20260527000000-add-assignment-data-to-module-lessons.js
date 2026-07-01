'use strict';

/**
 * Migration: Add assignment_data JSON column to module_lessons table
 *
 * Stores the assignment configuration (instructions, due_date, toggles) directly
 * on the lesson record. Only populated when lesson.type === 'assignment'.
 *
 * Requirements: 5.1
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('module_lessons');

    if (tableDescription.assignment_data) {
      console.log('Column assignment_data already exists on module_lessons, skipping');
      return;
    }

    await queryInterface.addColumn('module_lessons', 'assignment_data', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: null,
    });

    console.log('Added assignment_data column to module_lessons');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('module_lessons', 'assignment_data');
  },
};
