'use strict';

/**
 * Migration: Create enrollments table for WLIMP Programme Rollout
 * 
 * This migration creates the enrollments table to track learner
 * enrollment in programme cohorts. Learners join using enrollment codes.
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('enrollments', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.literal('(UUID())'),
                allowNull: false,
                primaryKey: true,
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
            cohort_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'cohorts',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            enrolled_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
        });

        // Add indexes for performance
        await queryInterface.addIndex('enrollments', ['user_id'], {
            name: 'idx_enrollments_user_id',
        });

        await queryInterface.addIndex('enrollments', ['cohort_id'], {
            name: 'idx_enrollments_cohort_id',
        });

        // Add unique constraint to prevent duplicate enrollments
        await queryInterface.addConstraint('enrollments', {
            fields: ['user_id', 'cohort_id'],
            type: 'unique',
            name: 'unique_user_cohort_enrollment',
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('enrollments');
    },
};
