const Sequelize = require("sequelize");

module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    "permissions",
    {
      permission_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      resource_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      action: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      scope: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "own",
      },
    },
    {
      sequelize,
      tableName: "permissions",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "permission_id" }],
        },
        {
          name: "name",
          unique: true,
          using: "BTREE",
          fields: [{ name: "name" }],
        },
      ],
    }
  );
};
