'use strict';

module.exports = (sequelize, DataTypes) => {
  const LearnerAttendance = sequelize.define(
    'learner_attendance',
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
      event_type: {
        type: DataTypes.ENUM('live_session', 'workshop', 'office_hours', 'group_activity', 'milestone_check_in'),
        allowNull: false
      },
      event_date: {
        type: DataTypes.DATE,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('attended', 'absent', 'late', 'excused', 'pending'),
        allowNull: false,
        defaultValue: 'pending'
      },
      recorded_by: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      recorded_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      tableName: 'learner_attendance',
      timestamps: false,
      freezeTableName: true
    }
  );

  LearnerAttendance.associate = (models) => {
    LearnerAttendance.belongsTo(models.enrollments, {
      foreignKey: 'enrollment_id',
      as: 'enrollment'
    });
    LearnerAttendance.belongsTo(models.cohorts, {
      foreignKey: 'cohort_id',
      as: 'cohort'
    });
    LearnerAttendance.belongsTo(models.users, {
      foreignKey: 'recorded_by',
      as: 'recorder'
    });
  };

  return LearnerAttendance;
};
