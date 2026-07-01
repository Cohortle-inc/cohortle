'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class external_opportunities extends Model {
    static associate(models) {
      external_opportunities.belongsTo(models.users, {
        foreignKey: 'created_by',
        as: 'creator',
      });
    }
  }

  external_opportunities.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      organisation: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      category: {
        type: DataTypes.ENUM(
          'fellowship', 'accelerator', 'incubator',
          'leadership', 'bootcamp', 'challenge',
          'scholarship', 'ngo_training', 'other'
        ),
        allowNull: false,
      },
      format: {
        type: DataTypes.ENUM('online', 'in-person', 'hybrid'),
        allowNull: true,
      },
      duration: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      price_info: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      highlights: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      thumbnail_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      apply_url: {
        type: DataTypes.STRING(1000),
        allowNull: false,
      },
      deadline: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      location: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      tags: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('draft', 'published', 'archived'),
        allowNull: false,
        defaultValue: 'draft',
      },
      is_featured: {
        type: DataTypes.TINYINT(1),
        allowNull: false,
        defaultValue: 0,
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      published_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      archived_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'external_opportunities',
      tableName: 'external_opportunities',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return external_opportunities;
};
