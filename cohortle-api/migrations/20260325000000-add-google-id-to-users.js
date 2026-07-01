'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('users');

    // Only add google_id column if it doesn't exist
    if (!tableDescription.google_id) {
      await queryInterface.addColumn('users', 'google_id', {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: null,
        after: 'password',
        comment: 'Google OAuth sub (user ID) for Google-authenticated users',
      });
    }

    // Add partial unique index on google_id (excluding NULL values)
    const indexes = await queryInterface.showIndex('users');
    const indexExists = indexes.some((idx) => idx.name === 'users_google_id_unique');

    if (!indexExists) {
      await queryInterface.addIndex('users', ['google_id'], {
        name: 'users_google_id_unique',
        unique: true,
        where: { google_id: { [Sequelize.Op.ne]: null } },
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the index first, then the column
    try {
      await queryInterface.removeIndex('users', 'users_google_id_unique');
    } catch (err) {
      // Index may not exist; ignore
    }

    const tableDescription = await queryInterface.describeTable('users');
    if (tableDescription.google_id) {
      await queryInterface.removeColumn('users', 'google_id');
    }
  },
};
