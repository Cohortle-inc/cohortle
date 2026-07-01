'use strict';

/**
 * Migration: Create newsletter_subscribers table
 * Stores email subscribers for organisation newsletters
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('newsletter_subscribers', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      organisation_slug: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Organisation slug',
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Subscriber email',
      },
      subscribed_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('newsletter_subscribers', ['organisation_slug']);
    await queryInterface.addIndex('newsletter_subscribers', ['email']);
    await queryInterface.addIndex('newsletter_subscribers', ['organisation_slug', 'email'], {
      unique: true,
      name: 'unique_org_email',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('newsletter_subscribers');
  },
};
