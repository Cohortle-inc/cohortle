'use strict';

/**
 * Migration: Add intro_video_url to users table
 * Allows conveners to embed a welcome/intro video on their org page.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('users');
    if (!table.intro_video_url) {
      await queryInterface.addColumn('users', 'intro_video_url', {
        type: Sequelize.STRING(500),
        allowNull: true,
        defaultValue: null,
      });
    }
    if (!table.tawk_property_id) {
      await queryInterface.addColumn('users', 'tawk_property_id', {
        type: Sequelize.STRING(100),
        allowNull: true,
        defaultValue: null,
        comment: 'Tawk.to Property ID for live chat widget on org page',
      });
    }
    if (!table.tawk_widget_id) {
      await queryInterface.addColumn('users', 'tawk_widget_id', {
        type: Sequelize.STRING(100),
        allowNull: true,
        defaultValue: null,
        comment: 'Tawk.to Widget ID for live chat widget on org page',
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('users');
    if (table.intro_video_url) await queryInterface.removeColumn('users', 'intro_video_url');
    if (table.tawk_property_id) await queryInterface.removeColumn('users', 'tawk_property_id');
    if (table.tawk_widget_id) await queryInterface.removeColumn('users', 'tawk_widget_id');
  },
};
