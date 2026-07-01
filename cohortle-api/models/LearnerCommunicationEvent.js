'use strict';

module.exports = (sequelize, DataTypes) => {
  const LearnerCommunicationEvent = sequelize.define(
    'learner_communication_event',
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
      channel: {
        type: DataTypes.ENUM('email', 'in_app', 'sms', 'notification'),
        allowNull: false
      },
      template_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      subject: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      body_preview: {
        type: DataTypes.TEXT,
        allowNull: true
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
      delivery_status: {
        type: DataTypes.ENUM('pending', 'sent', 'delivered', 'failed', 'bounced'),
        defaultValue: 'pending'
      },
      delivery_timestamp: {
        type: DataTypes.DATE,
        allowNull: true
      },
      read_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      tableName: 'learner_communication_events',
      timestamps: false,
      freezeTableName: true
    }
  );

  LearnerCommunicationEvent.associate = (models) => {
    LearnerCommunicationEvent.belongsTo(models.enrollments, {
      foreignKey: 'enrollment_id',
      as: 'enrollment'
    });
    LearnerCommunicationEvent.belongsTo(models.users, {
      foreignKey: 'created_by',
      as: 'sender'
    });
  };

  return LearnerCommunicationEvent;
};
