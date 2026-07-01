'use strict';

module.exports = (sequelize, DataTypes) => {
  const LearnerPayment = sequelize.define(
    'learner_payment',
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
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      currency: {
        type: DataTypes.CHAR(3),
        allowNull: false,
        defaultValue: 'USD'
      },
      status: {
        type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'refunded', 'disputed'),
        allowNull: false,
        defaultValue: 'pending'
      },
      payment_type: {
        type: DataTypes.ENUM('full', 'installment', 'partial', 'deposit'),
        allowNull: false,
        defaultValue: 'full'
      },
      provider: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      provider_reference: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      installment_plan_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      installment_number: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      due_date: {
        type: DataTypes.DATE,
        allowNull: true
      },
      paid_at: {
        type: DataTypes.DATE,
        allowNull: true
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
      failure_reason: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      tableName: 'learner_payments',
      timestamps: false,
      freezeTableName: true
    }
  );

  LearnerPayment.associate = (models) => {
    LearnerPayment.belongsTo(models.enrollments, {
      foreignKey: 'enrollment_id',
      as: 'enrollment'
    });
  };

  return LearnerPayment;
};
