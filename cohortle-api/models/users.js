const Sequelize = require("sequelize");
module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    "users",
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      first_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      last_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      location: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      joined_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      socials: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      profile_image: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      email_verified: {
        type: DataTypes.TINYINT(1),
        allowNull: false,
        defaultValue: 0,
      },
      role_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "roles",
          key: "role_id",
        },
      },
      bio: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      linkedin_username: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      google_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      organisation_slug: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      organisation_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      organisation_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      drive_refresh_token: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      drive_connected_email: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: "users",
      timestamps: false, // Users table doesn't have createdAt/updatedAt columns
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "id" }],
        },
        {
          name: "idx_users_role_id",
          using: "BTREE",
          fields: [{ name: "role_id" }],
        },
      ],
    },
  );
};
