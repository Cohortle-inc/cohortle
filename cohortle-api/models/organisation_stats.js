'use strict';

module.exports = (sequelize, DataTypes) => {
  const organisation_stats = sequelize.define('organisation_stats', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    total_learners: { type: DataTypes.INTEGER, defaultValue: 0 },
    programmes_completed: { type: DataTypes.INTEGER, defaultValue: 0 },
    success_rate: { type: DataTypes.INTEGER, defaultValue: 0 },
    years_experience: { type: DataTypes.INTEGER, defaultValue: 0 },
  }, {
    tableName: 'organisation_stats',
    timestamps: false,
  });
  return organisation_stats;
};
