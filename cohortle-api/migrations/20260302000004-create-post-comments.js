'use strict';

/**
 * Migration: Create post_comments table for Learner Experience Complete
 * 
 * This migration creates the post_comments table to enable learners to comment
 * on posts in the cohort community feed. Unlike lesson comments, post comments
 * are single-level (no threading).
 * 
 * Requirements: 7.9, 7.10
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Check if table exists
        const tableExists = await queryInterface.showAllTables()
            .then(tables => tables.includes('post_comments'));

        if (tableExists) {
            console.log('Table post_comments already exists, skipping creation');
            return;
        }

        await queryInterface.createTable('post_comments', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.literal('(UUID())'),
                allowNull: false,
                primaryKey: true,
            },
            post_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'cohort_posts',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            text: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
        });

        // Add indexes for performance
        await queryInterface.addIndex('post_comments', ['post_id'], {
            name: 'idx_post_comments_post_id',
        });

        await queryInterface.addIndex('post_comments', ['user_id'], {
            name: 'idx_post_comments_user_id',
        });

        // Add index for sorting by creation date
        await queryInterface.addIndex('post_comments', ['created_at'], {
            name: 'idx_post_comments_created_at',
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('post_comments');
    },
};
