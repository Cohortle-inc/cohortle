'use strict';

/**
 * Migration: Create weeks table for WLIMP Programme Rollout
 * 
 * This migration creates the weeks table to organize programme content
 * into weekly groupings. Each week belongs to a programme and contains
 * multiple lessons.
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('weeks', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.literal('(UUID())'),
                allowNull: false,
                primaryKey: true,
            },
            programme_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'programmes',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            week_number: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            title: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            start_date: {
                type: Sequelize.DATEONLY,
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

        // Add indexes for performance
        await queryInterface.addIndex('weeks', ['programme_id'], {
            name: 'idx_weeks_programme_id',
        });

        // Add unique constraint for programme_id + week_number
        await queryInterface.addConstraint('weeks', {
            fields: ['programme_id', 'week_number'],
            type: 'unique',
            name: 'unique_programme_week_number',
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('weeks');
    },
};
