const Sequelize = require("sequelize");

module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    "cohort_posts",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      cohort_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "cohorts",
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
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: "cohort_posts",
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
          name: "idx_cohort_posts_cohort_id",
          using: "BTREE",
          fields: [{ name: "cohort_id" }],
        },
        {
          name: "idx_cohort_posts_user_id",
          using: "BTREE",
          fields: [{ name: "user_id" }],
        },
        {
          name: "idx_cohort_posts_created_at",
          using: "BTREE",
          fields: [{ name: "created_at" }],
        },
        {
          name: "idx_cohort_posts_cohort_created",
          using: "BTREE",
          fields: [{ name: "cohort_id" }, { name: "created_at" }],
        },
      ],
    }
  );
};
