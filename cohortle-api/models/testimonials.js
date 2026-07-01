'use strict';

module.exports = (sequelize, DataTypes) => {
  const testimonials = sequelize.define('testimonials', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    learner_name: { type: DataTypes.STRING(255), allowNull: false },
    learner_avatar: { type: DataTypes.STRING(500), allowNull: true },
    programme_name: { type: DataTypes.STRING(255), allowNull: true },
    quote: { type: DataTypes.TEXT, allowNull: false },
    rating: { type: DataTypes.INTEGER, defaultValue: 5 },
    is_featured: { type: DataTypes.BOOLEAN, defaultValue: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: 'testimonials',
    timestamps: false,
  });
  return testimonials;
};
