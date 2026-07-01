'use strict';

module.exports = (sequelize, DataTypes) => {
  const LearnerMilestone = sequelize.define(
    'learner_milestone',
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
      cohort_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      milestone_type: {
        type: DataTypes.ENUM('assignment_submission', 'week_completion', 'assessment_pass', 'participation_goal', 'custom'),
        allowNull: false
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'at_risk', 'overdue'),
        allowNull: false,
        defaultValue: 'pending'
      },
      due_date: {
        type: DataTypes.DATE,
        allowNull: true
      },
      completed_at: {
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
      }
    },
    {
      tableName: 'learner_milestones',
      timestamps: false,
      freezeTableName: true
    }
  );

  LearnerMilestone.associate = (models) => {
    LearnerMilestone.belongsTo(models.enrollments, {
      foreignKey: 'enrollment_id',
      as: 'enrollment'
    });
    LearnerMilestone.belongsTo(models.cohorts, {
      foreignKey: 'cohort_id',
      as: 'cohort'
    });
  };

  return LearnerMilestone;
};
