const Sequelize = require("sequelize");

/**
 * Lesson Model (stored in module_lessons table)
 * 
 * Lessons belong to Learning Units (previously called "Modules").
 * Each lesson has a type (video, assignment, live, form, etc.) and tracks completion.
 * 
 * Note: The database table name remains "module_lessons" for backward compatibility.
 * The "module_id" field refers to a Learning Unit (programme_modules table).
 */
module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    "module_lessons",
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      module_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "programme_modules",
          key: "id",
        },
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      media: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      text: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      video_guid: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      order_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      estimated_duration: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      is_required: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      status: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: "draft",
      },
      type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "video",
      },
    },
    {
      sequelize,
      tableName: "module_lessons",
      timestamps: true,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "id" }],
        },
        {
          name: "module_id",
          using: "BTREE",
          fields: [{ name: "module_id" }],
        },
      ],
    },
  );
};
