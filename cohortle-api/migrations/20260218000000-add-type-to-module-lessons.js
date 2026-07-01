"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add type column to module_lessons table
    await queryInterface.addColumn("module_lessons", "type", {
      type: Sequelize.STRING(50),
      allowNull: false,
      defaultValue: "video",
    });

    // Add index for performance when filtering by type
    await queryInterface.addIndex("module_lessons", ["type"], {
      name: "idx_module_lessons_type",
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove index first
    await queryInterface.removeIndex("module_lessons", "idx_module_lessons_type");
    
    // Remove column
    await queryInterface.removeColumn("module_lessons", "type");
  },
};
