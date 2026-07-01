'use strict';

const Sequelize = require('sequelize');

/**
 * Sequelize model for quiz_attempts table.
 *
 * Stores each learner's quiz submission. Multiple rows per
 * (lesson_id, user_id, cohort_id) are allowed to support retakes.
 *
 * Requirements: 7.1
 */
module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'quiz_attempts',
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
        references: {
          model: 'module_lessons',
          key: 'id',
        },
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      cohort_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'cohorts',
          key: 'id',
        },
      },
      answers: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      score: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      passed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      submitted_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'quiz_attempts',
      timestamps: false,
      underscored: true,
      indexes: [
        {
          name: 'PRIMARY',
          unique: true,
          using: 'BTREE',
          fields: [{ name: 'id' }],
        },
        {
          name: 'idx_quiz_attempts_lesson_user_cohort',
          using: 'BTREE',
          fields: [{ name: 'lesson_id' }, { name: 'user_id' }, { name: 'cohort_id' }],
        },
        {
          name: 'idx_quiz_attempts_lesson_id',
          using: 'BTREE',
          fields: [{ name: 'lesson_id' }],
        },
        {
          name: 'idx_quiz_attempts_user_id',
          using: 'BTREE',
          fields: [{ name: 'user_id' }],
        },
      ],
    }
  );
};
