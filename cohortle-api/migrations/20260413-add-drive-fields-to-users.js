'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('users');

    if (!tableDescription.drive_refresh_token) {
      await queryInterface.addColumn('users', 'drive_refresh_token', {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null,
        comment: 'AES-256-GCM encrypted Google Drive refresh token',
      });
    }

    if (!tableDescription.drive_connected_email) {
      await queryInterface.addColumn('users', 'drive_connected_email', {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: null,
        comment: 'Google account email used for Drive connection',
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('users');

    if (tableDescription.drive_connected_email) {
      await queryInterface.removeColumn('users', 'drive_connected_email');
    }

    if (tableDescription.drive_refresh_token) {
      await queryInterface.removeColumn('users', 'drive_refresh_token');
    }
  },
};
