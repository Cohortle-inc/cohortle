'use strict';

/**
 * Migration: Add content_text column and make content_url nullable in lessons table
 * 
 * This migration adds support for text-based lessons by:
 * 1. Adding a content_text column for storing text content
 * 2. Making content_url nullable since text lessons don't need URLs
 * 
 * This allows lessons to have either:
 * - content_url (for video, link, pdf, quiz, live_session types)
 * - content_text (for text type)
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Check if content_text column already exists
        const tableDescription = await queryInterface.describeTable('lessons');
        
        if (!tableDescription.content_text) {
            // Add content_text column
            await queryInterface.addColumn('lessons', 'content_text', {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: 'Text content for text-type lessons',
            });
            console.log('✓ Added content_text column to lessons table');
        } else {
            console.log('⊘ content_text column already exists, skipping');
        }

        // Make content_url nullable
        if (tableDescription.content_url && tableDescription.content_url.allowNull === false) {
            await queryInterface.changeColumn('lessons', 'content_url', {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: 'External URL to content (YouTube, Drive, PDF, etc.) - required for video/link/pdf types',
            });
            console.log('✓ Made content_url nullable in lessons table');
        } else {
            console.log('⊘ content_url is already nullable, skipping');
        }
    },

    async down(queryInterface, Sequelize) {
        // Remove content_text column
        const tableDescription = await queryInterface.describeTable('lessons');
        
        if (tableDescription.content_text) {
            await queryInterface.removeColumn('lessons', 'content_text');
            console.log('✓ Removed content_text column from lessons table');
        }

        // Make content_url NOT NULL again
        if (tableDescription.content_url) {
            await queryInterface.changeColumn('lessons', 'content_url', {
                type: Sequelize.TEXT,
                allowNull: false,
                comment: 'External URL to content (YouTube, Drive, PDF, etc.)',
            });
            console.log('✓ Made content_url NOT NULL in lessons table');
        }
    },
};
