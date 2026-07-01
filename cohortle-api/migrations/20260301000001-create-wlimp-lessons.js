'use strict';

/**
 * Migration: Create lessons table for WLIMP Programme Rollout
 * 
 * This migration creates the lessons table to store individual learning
 * units within weeks. Each lesson contains external content links
 * (YouTube, Google Drive, PDFs, etc.).
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('lessons', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.literal('(UUID())'),
                allowNull: false,
                primaryKey: true,
            },
            week_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'weeks',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            title: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            content_type: {
                type: Sequelize.STRING(50),
                allowNull: false,
                comment: 'Type of content: video, link, pdf',
            },
            content_url: {
                type: Sequelize.TEXT,
                allowNull: false,
                comment: 'External URL to content (YouTube, Drive, PDF, etc.)',
            },
            order_index: {
                type: Sequelize.INTEGER,
                allowNull: false,
                comment: 'Order of lesson within the week',
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
            },
        });

        // Add index for performance
        await queryInterface.addIndex('lessons', ['week_id'], {
            name: 'idx_lessons_week_id',
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('lessons');
    },
};
