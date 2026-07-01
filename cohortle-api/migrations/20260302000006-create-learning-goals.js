'use strict';

/**
 * Migration: Create learning_goals table for Learner Experience Complete
 * 
 * This migration creates the learning_goals table to store learner-defined
 * learning goals such as lessons per week or hours per week targets.
 * 
 * Requirements: 8.12, 8.13
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Check if table exists
        const tableExists = await queryInterface.showAllTables()
            .then(tables => tables.includes('learning_goals'));

        if (tableExists) {
            console.log('Table learning_goals already exists, skipping creation');
            return;
        }

        await queryInterface.createTable('learning_goals', {
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                primaryKey: true,
                references: {
                    model: 'users',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            goal_type: {
                type: Sequelize.ENUM('lessons_per_week', 'hours_per_week'),
                allowNull: false,
            },
            target_value: {
                type: Sequelize.INTEGER,
                allowNull: false,
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

        // No additional indexes needed - user_id is the primary key
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('learning_goals');
    },
};
