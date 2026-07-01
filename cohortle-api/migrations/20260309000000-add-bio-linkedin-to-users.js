'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('users');
    
    // Only add bio column if it doesn't exist
    if (!tableDescription.bio) {
      await queryInterface.addColumn('users', 'bio', {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'User biography or about section'
      });
    }

    // Only add linkedin_username column if it doesn't exist
    if (!tableDescription.linkedin_username) {
      await queryInterface.addColumn('users', 'linkedin_username', {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'LinkedIn username (not full URL, just the username)'
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('users');
    
    if (tableDescription.linkedin_username) {
      await queryInterface.removeColumn('users', 'linkedin_username');
    }
    
    if (tableDescription.bio) {
      await queryInterface.removeColumn('users', 'bio');
    }
  }
};
