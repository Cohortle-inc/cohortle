module.exports = function (sequelize, DataTypes) {
  const Application = sequelize.define(
    "applications",
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
      cohort_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "cohorts",
          key: "id",
        },
      },
      applicant_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      applicant_email: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "submitted",
      },
      responses: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {},
      },
      reviewer_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
      },
      reviewer_notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      rejection_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      decision_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      source: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: null,
        comment: 'Attribution source — e.g. "discover", "org_page", "direct"',
      },
      submitted_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: "applications",
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "id" }],
        },
        {
          name: "idx_applications_programme_id",
          using: "BTREE",
          fields: [{ name: "programme_id" }],
        },
        {
          name: "idx_applications_email",
          using: "BTREE",
          fields: [{ name: "applicant_email" }],
        },
        {
          name: "idx_applications_status",
          using: "BTREE",
          fields: [{ name: "status" }],
        },
      ],
    },
  );

  Application.associate = function (models) {
    Application.belongsTo(models.programmes, {
      foreignKey: "programme_id",
      as: "programme",
    });
    Application.belongsTo(models.cohorts, {
      foreignKey: "cohort_id",
      as: "cohort",
    });
    Application.belongsTo(models.users, {
      foreignKey: "user_id",
      as: "applicant",
    });
    Application.belongsTo(models.users, {
      foreignKey: "reviewer_id",
      as: "reviewer",
    });
    Application.hasMany(models.application_history, {
      foreignKey: "application_id",
      as: "history",
    });
  };

  return Application;
};
