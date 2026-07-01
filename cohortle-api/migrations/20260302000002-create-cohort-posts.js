'use strict';

/**
 * Migration: Create cohort_posts table for Learner Experience Complete
 * 
 * This migration creates the cohort_posts table to enable cohort-specific
 * community feeds where learners can share updates, ask questions, and
 * engage with their learning cohort.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Check if table exists
        const tableExists = await queryInterface.showAllTables()
            .then(tables => tables.includes('cohort_posts'));

        if (tableExists) {
            console.log('Table cohort_posts already exists, skipping creation');
            return;
        }

        await queryInterface.createTable('cohort_posts', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.literal('(UUID())'),
                allowNull: false,
                primaryKey: true,
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
            content: {
                type: Sequelize.TEXT,
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
        await queryInterface.addIndex('cohort_posts', ['cohort_id'], {
            name: 'idx_cohort_posts_cohort_id',
        });

        await queryInterface.addIndex('cohort_posts', ['user_id'], {
            name: 'idx_cohort_posts_user_id',
        });

        // Add index for sorting by creation date (reverse chronological)
        await queryInterface.addIndex('cohort_posts', ['created_at'], {
            name: 'idx_cohort_posts_created_at',
        });

        // Add composite index for cohort + date for efficient feed queries
        await queryInterface.addIndex('cohort_posts', ['cohort_id', 'created_at'], {
            name: 'idx_cohort_posts_cohort_created',
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('cohort_posts');
    },
};
