'use strict';

/**
 * Migration: Create user_preferences table for Learner Experience Complete
 * 
 * This migration creates the user_preferences table to store learner notification
 * preferences for email notifications about lesson reminders, community activity,
 * programme updates, and weekly digests.
 * 
 * Requirements: 8.7, 8.8, 8.9
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Check if table exists
        const tableExists = await queryInterface.showAllTables()
            .then(tables => tables.includes('user_preferences'));

        if (tableExists) {
            console.log('Table user_preferences already exists, skipping creation');
            return;
        }

        await queryInterface.createTable('user_preferences', {
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
            email_lesson_reminders: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            email_community_activity: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            email_programme_updates: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            email_weekly_digest: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
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
        await queryInterface.dropTable('user_preferences');
    },
};
