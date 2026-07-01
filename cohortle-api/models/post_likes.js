const Sequelize = require("sequelize");

module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    "post_likes",
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      post_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "cohort_posts",
          key: "id",
        },
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
    },
    {
      sequelize,
      tableName: "post_likes",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "id" }],
        },
        {
          name: "idx_post_likes_post_id",
          using: "BTREE",
          fields: [{ name: "post_id" }],
        },
        {
          name: "idx_post_likes_user_id",
          using: "BTREE",
          fields: [{ name: "user_id" }],
        },
        {
          name: "unique_like",
          unique: true,
          using: "BTREE",
          fields: [{ name: "post_id" }, { name: "user_id" }],
        },
      ],
    }
  );
};
