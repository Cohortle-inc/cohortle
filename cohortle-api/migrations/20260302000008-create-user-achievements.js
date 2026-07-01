'use strict';

/**
 * Migration: Create user_achievements table for Learner Experience Complete
 * 
 * This migration creates the user_achievements table to track which achievements
 * each learner has earned and when they earned them.
 * 
 * Requirements: 8.10, 8.11
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Check if table exists
        const tableExists = await queryInterface.showAllTables()
            .then(tables => tables.includes('user_achievements'));

        if (tableExists) {
            console.log('Table user_achievements already exists, skipping creation');
            return;
        }

        await queryInterface.createTable('user_achievements', {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
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
            achievement_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'achievements',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            earned_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
        });

        // Add indexes for performance
        await queryInterface.addIndex('user_achievements', ['user_id'], {
            name: 'idx_user_achievements_user_id',
        });

        await queryInterface.addIndex('user_achievements', ['achievement_id'], {
            name: 'idx_user_achievements_achievement_id',
        });

        // Add unique constraint to prevent duplicate achievements
        await queryInterface.addConstraint('user_achievements', {
            fields: ['user_id', 'achievement_id'],
            type: 'unique',
            name: 'unique_achievement',
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('user_achievements');
    },
};
