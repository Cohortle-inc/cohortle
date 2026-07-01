module.exports = function (sequelize, DataTypes) {
  const ApplicationTemplateQuestion = sequelize.define(
    "application_template_questions",
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
      question_text: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      question_type: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "textarea",
      },
      is_required: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      options: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      order_index: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
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
      tableName: "application_template_questions",
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "id" }],
        },
        {
          name: "idx_template_questions_programme_id",
          using: "BTREE",
          fields: [{ name: "programme_id" }],
        },
      ],
    },
  );

  ApplicationTemplateQuestion.associate = function (models) {
    ApplicationTemplateQuestion.belongsTo(models.programmes, {
      foreignKey: "programme_id",
      as: "programme",
    });
  };

  return ApplicationTemplateQuestion;
};
