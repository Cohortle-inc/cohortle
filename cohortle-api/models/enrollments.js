const Sequelize = require("sequelize");

module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    "enrollments",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      cohort_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "cohorts",
          key: "id",
        },
      },
      enrolled_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      enrollment_source: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "code",
      },
      application_id: {
        type: DataTypes.UUID,
        allowNull: true,
        defaultValue: null,
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "active",
      },
      payment_status: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: null,
      },
      payment_due_date: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      sequelize,
      tableName: "enrollments",
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "id" }],
        },
        {
          name: "idx_enrollments_user_id",
          using: "BTREE",
          fields: [{ name: "user_id" }],
        },
        {
          name: "idx_enrollments_cohort_id",
          using: "BTREE",
          fields: [{ name: "cohort_id" }],
        },
        {
          name: "unique_user_cohort",
          unique: true,
          using: "BTREE",
          fields: [{ name: "user_id" }, { name: "cohort_id" }],
        },
      ],
    },
  );
};
