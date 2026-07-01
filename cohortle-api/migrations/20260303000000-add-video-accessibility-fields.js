'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if columns already exist
    const tableDescription = await queryInterface.describeTable('lessons');
    
    if (!tableDescription.caption_url) {
      await queryInterface.addColumn('lessons', 'caption_url', {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'URL to video caption/subtitle file (e.g., .vtt, .srt)'
      });
    } else {
      console.log('Column caption_url already exists, skipping');
    }

    if (!tableDescription.transcript_url) {
      await queryInterface.addColumn('lessons', 'transcript_url', {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'URL to video transcript document'
      });
    } else {
      console.log('Column transcript_url already exists, skipping');
    }

    if (!tableDescription.has_captions) {
      await queryInterface.addColumn('lessons', 'has_captions', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Indicates if video has captions available'
      });
    } else {
      console.log('Column has_captions already exists, skipping');
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('lessons', 'caption_url');
    await queryInterface.removeColumn('lessons', 'transcript_url');
    await queryInterface.removeColumn('lessons', 'has_captions');
  }
};
