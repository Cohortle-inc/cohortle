'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('org_page_views', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      organisation_slug: { type: Sequelize.STRING(50), allowNull: false },
      referrer: { type: Sequelize.STRING(500), allowNull: true },
      user_agent: { type: Sequelize.STRING(500), allowNull: true },
      viewed_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('org_page_views', ['organisation_slug']);
    await queryInterface.addIndex('org_page_views', ['viewed_at']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('org_page_views');
  },
};
