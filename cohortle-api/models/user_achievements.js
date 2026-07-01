const Sequelize = require("sequelize");

module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    "user_achievements",
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      achievement_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "achievements",
          key: "id",
        },
      },
    },
    {
      sequelize,
      tableName: "user_achievements",
      timestamps: true,
      createdAt: "earned_at",
      updatedAt: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "id" }],
        },
        {
          name: "idx_user_achievements_user_id",
          using: "BTREE",
          fields: [{ name: "user_id" }],
        },
        {
          name: "idx_user_achievements_achievement_id",
          using: "BTREE",
          fields: [{ name: "achievement_id" }],
        },
        {
          name: "unique_achievement",
          unique: true,
          using: "BTREE",
          fields: [{ name: "user_id" }, { name: "achievement_id" }],
        },
      ],
    }
  );
};
