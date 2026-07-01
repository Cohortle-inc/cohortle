const Sequelize = require("sequelize");

module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    "lesson_completions",
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      lesson_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "lessons",
          key: "id",
        },
      },
      cohort_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "cohorts",
          key: "id",
        },
      },
      completed_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: "lesson_completions",
      timestamps: false,
      underscored: true,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "id" }],
        },
        {
          name: "idx_lesson_completions_user_id",
          using: "BTREE",
          fields: [{ name: "user_id" }],
        },
        {
          name: "idx_lesson_completions_lesson_id",
          using: "BTREE",
          fields: [{ name: "lesson_id" }],
        },
        {
          name: "idx_lesson_completions_cohort_id",
          using: "BTREE",
          fields: [{ name: "cohort_id" }],
        },
        {
          name: "unique_completion",
          unique: true,
          using: "BTREE",
          fields: [{ name: "user_id" }, { name: "lesson_id" }, { name: "cohort_id" }],
        },
      ],
    },
  );
};
