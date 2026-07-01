'use strict';

module.exports = (sequelize, DataTypes) => {
  const organisation_faqs = sequelize.define('organisation_faqs', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    question: { type: DataTypes.TEXT, allowNull: false },
    answer: { type: DataTypes.TEXT, allowNull: false },
    order_index: { type: DataTypes.INTEGER, defaultValue: 0 },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: 'organisation_faqs',
    timestamps: false,
  });
  return organisation_faqs;
};
