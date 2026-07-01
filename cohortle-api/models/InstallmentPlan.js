'use strict';

module.exports = (sequelize, DataTypes) => {
  const InstallmentPlan = sequelize.define(
    'installment_plan',
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
      total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      currency: {
        type: DataTypes.CHAR(3),
        allowNull: false,
        defaultValue: 'USD'
      },
      num_installments: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      installment_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      frequency: {
        type: DataTypes.ENUM('weekly', 'biweekly', 'monthly', 'custom'),
        allowNull: false,
        defaultValue: 'monthly'
      },
      start_date: {
        type: DataTypes.DATE,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('active', 'paused', 'completed', 'failed', 'cancelled'),
        allowNull: false,
        defaultValue: 'active'
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
      }
    },
    {
      tableName: 'installment_plans',
      timestamps: false,
      freezeTableName: true
    }
  );

  InstallmentPlan.associate = (models) => {
    InstallmentPlan.belongsTo(models.enrollments, {
      foreignKey: 'enrollment_id',
      as: 'enrollment'
    });
    InstallmentPlan.hasMany(models.learner_payments, {
      foreignKey: 'installment_plan_id',
      as: 'payments'
    });
  };

  return InstallmentPlan;
};
