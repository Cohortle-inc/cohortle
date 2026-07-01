'use strict';

/**
 * FunnelLead Model
 *
 * Represents a submitted interest form from a potential partner organisation.
 * Tracks the lead through the sales funnel from initial submission to partnership.
 *
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */
module.exports = (sequelize, DataTypes) => {
  const FunnelLead = sequelize.define(
    'FunnelLead',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      organisation_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      contact_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      website: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      programme_type: {
        type: DataTypes.ENUM('fellowship', 'training', 'bootcamp', 'community', 'other'),
        allowNull: false,
      },
      participant_count: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      current_tools: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      pain_points: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      cohort_start_date: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      demo_scheduled_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('new', 'contacted', 'demo_scheduled', 'demo_completed', 'partner'),
        allowNull: false,
        defaultValue: 'new',
      },
    },
    {
      tableName: 'funnel_leads',
      timestamps: true,
      underscored: true,
    }
  );

  return FunnelLead;
};
