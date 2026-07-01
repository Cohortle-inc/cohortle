'use strict';

module.exports = (sequelize, DataTypes) => {
  const LearnerNote = sequelize.define(
    'learner_note',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      enrollment_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      note_type: {
        type: DataTypes.ENUM('support', 'intervention', 'engagement', 'achievement', 'issue', 'follow_up', 'general'),
        allowNull: false,
        defaultValue: 'general'
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
      },
      linked_entity_type: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      linked_entity_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      }
    },
    {
      tableName: 'learner_notes',
      timestamps: false,
      freezeTableName: true
    }
  );

  LearnerNote.associate = (models) => {
    LearnerNote.belongsTo(models.enrollments, {
      foreignKey: 'enrollment_id',
      as: 'enrollment'
    });
    LearnerNote.belongsTo(models.users, {
      foreignKey: 'created_by',
      as: 'creator'
    });
  };

  return LearnerNote;
};
