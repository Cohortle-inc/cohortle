'use strict';

/**
 * Migration: Create organisation_stats table
 * Stores statistics displayed on organisation page
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('organisation_stats', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
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
        unique: true,
        comment: 'Convener user ID',
      },
      total_learners: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
        comment: 'Total learners trained',
      },
      programmes_completed: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
        comment: 'Number of programmes completed',
      },
      success_rate: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0,
        allowNull: false,
        comment: 'Success rate percentage',
      },
      years_experience: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
        comment: 'Years of experience',
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        onUpdate: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('organisation_stats', ['user_id']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('organisation_stats');
  },
};
