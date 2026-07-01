const Sequelize = require("sequelize");

module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    "role_permissions",
    {
      mapping_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      role_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "roles",
          key: "role_id",
        },
      },
      permission_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "permissions",
          key: "permission_id",
        },
      },
      granted_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
      },
    },
    {
      sequelize,
      tableName: "role_permissions",
      timestamps: true,
      createdAt: "granted_at",
      updatedAt: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "mapping_id" }],
        },
        {
          name: "unique_role_permission",
          unique: true,
          using: "BTREE",
          fields: [{ name: "role_id" }, { name: "permission_id" }],
        },
      ],
    }
  );
};
