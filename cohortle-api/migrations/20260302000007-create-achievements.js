'use strict';

/**
 * Migration: Create achievements table for Learner Experience Complete
 * 
 * This migration creates the achievements table to define available achievements
 * that learners can earn (e.g., completing a programme, maintaining a streak).
 * The criteria field stores JSON defining how the achievement is earned.
 * 
 * Requirements: 8.10, 8.11
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Check if table exists
        const tableExists = await queryInterface.showAllTables()
            .then(tables => tables.includes('achievements'));

        if (tableExists) {
            console.log('Table achievements already exists, skipping creation');
            return;
        }

        await queryInterface.createTable('achievements', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.literal('(UUID())'),
                allowNull: false,
                primaryKey: true,
            },
            name: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            icon: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            criteria: {
                type: Sequelize.JSON,
                allowNull: false,
                comment: 'JSON object defining achievement criteria',
            },
        });

        // Add index for name lookups
        await queryInterface.addIndex('achievements', ['name'], {
            name: 'idx_achievements_name',
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('achievements');
    },
};
