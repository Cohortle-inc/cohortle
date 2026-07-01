const Sequelize = require("sequelize");
module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    "programmes",
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      community_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "communities",
          key: "id",
        },
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      start_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      end_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: "draft",
      },
      type: {
        type: DataTypes.ENUM("scheduled", "structured", "self_paced"),
        defaultValue: "scheduled",
        allowNull: false,
      },
      settings: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      thumbnail: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      lifecycle_status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "draft",
      },
      status_changed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      status_changed_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
      },
      onboarding_mode: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "code",
      },
      application_deadline: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      application_form_slug: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      format: {
        type: DataTypes.ENUM("online", "in-person", "hybrid"),
        allowNull: true,
      },
      duration: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      highlights: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      learning_outcomes: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      prerequisites: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      price_info: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      intro_video_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      thumbnail_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: "programmes",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "id" }],
        },
        {
          name: "community_id",
          using: "BTREE",
          fields: [{ name: "community_id" }],
        },
      ],
    },
  );
};
