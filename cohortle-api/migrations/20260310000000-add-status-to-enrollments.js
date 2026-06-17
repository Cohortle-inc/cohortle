'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('enrollments', 'status', {
      type: Sequelize.STRING(50),
      allowNull: false,
      defaultValue: 'active',
      after: 'cohort_id'
    });

    await queryInterface.addIndex('enrollments', ['status'], {
      name: 'idx_enrollments_status'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('enrollments', 'idx_enrollments_status');
    await queryInterface.removeColumn('enrollments', 'status');
  }
};
