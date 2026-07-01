'use strict';

module.exports = (sequelize, DataTypes) => {
  const AuditEvent = sequelize.define(
    'audit_event',
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      actor_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      target_type: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      target_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      action: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      before_value: {
        type: DataTypes.JSON,
        allowNull: true
      },
      after_value: {
        type: DataTypes.JSON,
        allowNull: true
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
      },
      ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true
      },
      user_agent: {
        type: DataTypes.STRING(255),
        allowNull: true
      }
    },
    {
      tableName: 'audit_events',
      timestamps: false,
      freezeTableName: true
    }
  );

  AuditEvent.associate = (models) => {
    AuditEvent.belongsTo(models.users, {
      foreignKey: 'actor_id',
      as: 'actor'
    });
  };

  return AuditEvent;
};
