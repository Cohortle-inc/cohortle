'use strict';

/**
 * Migration: Add rarity and category columns to achievements table
 *
 * - rarity: ENUM('common','rare','epic','legendary') DEFAULT 'common'
 * - category: VARCHAR(100) — maps to a frontend icon category
 *
 * Requirements: 4.1, 4.2
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('achievements');

    if (!tableDescription.rarity) {
      await queryInterface.addColumn('achievements', 'rarity', {
        type: Sequelize.ENUM('common', 'rare', 'epic', 'legendary'),
        allowNull: false,
        defaultValue: 'common',
      });
    } else {
      console.log('Column rarity already exists on achievements, skipping');
    }

    if (!tableDescription.category) {
      await queryInterface.addColumn('achievements', 'category', {
        type: Sequelize.STRING(100),
        allowNull: true,
      });
    } else {
      console.log('Column category already exists on achievements, skipping');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('achievements', 'category');
    await queryInterface.removeColumn('achievements', 'rarity');
  },
};
