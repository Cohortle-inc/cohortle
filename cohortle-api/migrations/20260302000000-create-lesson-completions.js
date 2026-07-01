'use strict';

/**
 * Migration: Create lesson_completions table for Learner Experience Complete
 * 
 * This migration creates the lesson_completions table to track which lessons
 * learners have completed within specific cohorts. This enables progress tracking
 * at the lesson, week, and programme levels.
 * 
 * Requirements: 1.6, 5.5, 6.10, 7.7, 8.4, 8.9, 12.1
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Check if table exists
        const tableExists = await queryInterface.showAllTables()
            .then(tables => tables.includes('lesson_completions'));

        if (tableExists) {
            console.log('Table lesson_completions already exists, skipping creation');
            return;
        }

        await queryInterface.createTable('lesson_completions', {
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
            lesson_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'lessons',
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
            completed_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
        });

        // Add indexes for performance
        await queryInterface.addIndex('lesson_completions', ['user_id'], {
            name: 'idx_lesson_completions_user_id',
        });

        await queryInterface.addIndex('lesson_completions', ['lesson_id'], {
            name: 'idx_lesson_completions_lesson_id',
        });

        await queryInterface.addIndex('lesson_completions', ['cohort_id'], {
            name: 'idx_lesson_completions_cohort_id',
        });

        // Add unique constraint to prevent duplicate completions
        await queryInterface.addConstraint('lesson_completions', {
            fields: ['user_id', 'lesson_id', 'cohort_id'],
            type: 'unique',
            name: 'unique_completion',
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('lesson_completions');
    },
};
