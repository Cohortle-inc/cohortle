'use strict';

/**
 * Migration: Add programme enrichment fields
 * - format: 'online' | 'in-person' | 'hybrid'
 * - duration: e.g. '12 weeks', '6 months'
 * - highlights: JSON array of key bullet points
 * - learning_outcomes: JSON array of outcomes
 * - prerequisites: free text
 * - price_info: e.g. 'Free', '£500', 'Funded'
 * - intro_video_url: YouTube/Vimeo URL for programme preview video
 * - thumbnail_url: cover image for the programme card
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('programmes');

    const addIfMissing = async (col, def) => {
      if (!table[col]) await queryInterface.addColumn('programmes', col, def);
    };

    await addIfMissing('format', {
      type: Sequelize.ENUM('online', 'in-person', 'hybrid'),
      allowNull: true,
      defaultValue: null,
    });

    await addIfMissing('duration', {
      type: Sequelize.STRING(100),
      allowNull: true,
      defaultValue: null,
    });

    await addIfMissing('highlights', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: null,
    });

    await addIfMissing('learning_outcomes', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: null,
    });

    await addIfMissing('prerequisites', {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: null,
    });

    await addIfMissing('price_info', {
      type: Sequelize.STRING(255),
      allowNull: true,
      defaultValue: null,
    });

    await addIfMissing('intro_video_url', {
      type: Sequelize.STRING(500),
      allowNull: true,
      defaultValue: null,
    });

    await addIfMissing('thumbnail_url', {
      type: Sequelize.STRING(500),
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('programmes');
    const cols = ['format', 'duration', 'highlights', 'learning_outcomes', 'prerequisites', 'price_info', 'intro_video_url', 'thumbnail_url'];
    for (const col of cols) {
      if (table[col]) await queryInterface.removeColumn('programmes', col);
    }
  },
};
