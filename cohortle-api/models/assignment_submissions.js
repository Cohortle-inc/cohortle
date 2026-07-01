const Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'assignment_submissions',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      lesson_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'module_lessons', key: 'id' },
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      cohort_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'cohorts', key: 'id' },
      },
      text_answer: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('submitted', 'graded'),
        allowNull: false,
        defaultValue: 'submitted',
      },
      grading_status: {
        type: DataTypes.ENUM('pending', 'passed', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
      },
      feedback: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      submitted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      graded_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'assignment_submissions',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          name: 'idx_assignment_submissions_unique',
          unique: true,
          fields: ['lesson_id', 'user_id', 'cohort_id'],
        },
        {
          name: 'idx_assignment_submissions_lesson_id',
          fields: ['lesson_id'],
        },
        {
          name: 'idx_assignment_submissions_user_id',
          fields: ['user_id'],
        },
      ],
    }
  );
};
