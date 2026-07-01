module.exports = function (sequelize, DataTypes) {
  const ApplicationHistory = sequelize.define(
    "application_history",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      application_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "applications",
          key: "id",
        },
      },
      from_status: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      to_status: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      changed_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: "application_history",
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "id" }],
        },
        {
          name: "idx_app_history_application_id",
          using: "BTREE",
          fields: [{ name: "application_id" }],
        },
      ],
    },
  );

  ApplicationHistory.associate = function (models) {
    ApplicationHistory.belongsTo(models.applications, {
      foreignKey: "application_id",
      as: "application",
    });
  };

  return ApplicationHistory;
};
