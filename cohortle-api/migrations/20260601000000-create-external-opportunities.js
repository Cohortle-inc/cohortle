'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableExists = await queryInterface.showAllTables().then(tables =>
      tables.includes('external_opportunities')
    );
    if (tableExists) return;

    await queryInterface.createTable('external_opportunities', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      organisation: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      category: {
        type: Sequelize.ENUM(
          'fellowship', 'accelerator', 'incubator',
          'leadership', 'bootcamp', 'challenge',
          'scholarship', 'ngo_training', 'other'
        ),
        allowNull: false,
      },
      format: {
        type: Sequelize.ENUM('online', 'in-person', 'hybrid'),
        allowNull: true,
        defaultValue: null,
      },
      duration: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      price_info: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      highlights: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      thumbnail_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      apply_url: {
        type: Sequelize.STRING(1000),
        allowNull: false,
      },
      deadline: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      location: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      tags: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('draft', 'published', 'archived'),
        allowNull: false,
        defaultValue: 'draft',
      },
      is_featured: {
        type: Sequelize.TINYINT(1),
        allowNull: false,
        defaultValue: 0,
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
      published_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      archived_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('external_opportunities');
  },
};
