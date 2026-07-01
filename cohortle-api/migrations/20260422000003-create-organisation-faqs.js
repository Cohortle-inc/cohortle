'use strict';

/**
 * Migration: Create organisation_faqs table
 * Stores FAQ entries for organisation page
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('organisation_faqs', {
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
        comment: 'Convener user ID',
      },
      question: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'FAQ question',
      },
      answer: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'FAQ answer',
      },
      order_index: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
        comment: 'Display order',
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('organisation_faqs', ['user_id']);
    await queryInterface.addIndex('organisation_faqs', ['order_index']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('organisation_faqs');
  },
};
