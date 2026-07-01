'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('applications', 'source', {
      type: Sequelize.STRING(50),
      allowNull: true,
      defaultValue: null,
      comment: 'Attribution source — e.g. "discover", "org_page", "direct"',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('applications', 'source');
  },
};
