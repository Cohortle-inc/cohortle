const Sequelize = require("sequelize");

module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    "weeks",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      programme_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "programmes",
          key: "id",
        },
      },
      week_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: "weeks",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "id" }],
        },
        {
          name: "idx_weeks_programme_id",
          using: "BTREE",
          fields: [{ name: "programme_id" }],
        },
        {
          name: "unique_programme_week",
          unique: true,
          using: "BTREE",
          fields: [{ name: "programme_id" }, { name: "week_number" }],
        },
      ],
    },
  );
};
