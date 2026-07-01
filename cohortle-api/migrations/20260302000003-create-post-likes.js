'use strict';

/**
 * Migration: Create post_likes table for Learner Experience Complete
 * 
 * This migration creates the post_likes table to track which learners have
 * liked which posts in the cohort community feed. Supports engagement metrics
 * and social interaction features.
 * 
 * Requirements: 7.11, 7.12, 7.13
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Check if table exists
        const tableExists = await queryInterface.showAllTables()
            .then(tables => tables.includes('post_likes'));

        if (tableExists) {
            console.log('Table post_likes already exists, skipping creation');
            return;
        }

        await queryInterface.createTable('post_likes', {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
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
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
        });

        // Add indexes for performance
        await queryInterface.addIndex('post_likes', ['post_id'], {
            name: 'idx_post_likes_post_id',
        });

        await queryInterface.addIndex('post_likes', ['user_id'], {
            name: 'idx_post_likes_user_id',
        });

        // Add unique constraint to prevent duplicate likes
        await queryInterface.addConstraint('post_likes', {
            fields: ['post_id', 'user_id'],
            type: 'unique',
            name: 'unique_like',
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('post_likes');
    },
};
