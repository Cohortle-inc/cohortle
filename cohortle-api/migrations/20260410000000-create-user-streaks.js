'use strict';

/**
 * Migration: Create user_streaks table for Streaks and Achievements feature
 *
 * Stores the current and longest streak for each user, updated whenever
 * a lesson is completed. Keyed by user_id (UNIQUE) for fast single-row lookups.
 *
 * Requirements: 1.6
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableExists = await queryInterface.showAllTables()
      .then(tables => tables.includes('user_streaks'));

    if (tableExists) {
      console.log('Table user_streaks already exists, skipping creation');
      return;
    }

    await queryInterface.createTable('user_streaks', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      current_streak: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      longest_streak: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      last_activity_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('user_streaks', ['user_id'], {
      name: 'idx_user_streaks_user_id',
      unique: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_streaks');
  },
};
