'use strict';

/**
 * Migration: Create lesson_comments table for Learner Experience Complete
 * 
 * This migration creates the lesson_comments table to enable learners to post
 * comments and questions on lessons, with support for threaded discussions
 * (up to 2 levels of nesting).
 * 
 * Requirements: 5.1, 5.2, 5.4, 5.5, 5.6, 5.7, 5.9, 5.10, 5.11, 5.12
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Check if table exists
        const tableExists = await queryInterface.showAllTables()
            .then(tables => tables.includes('lesson_comments'));

        if (!tableExists) {
            await queryInterface.createTable('lesson_comments', {
                id: {
                    type: Sequelize.UUID,
                    defaultValue: Sequelize.literal('(UUID())'),
                    allowNull: false,
                    primaryKey: true,
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
                parent_id: {
                    type: Sequelize.UUID,
                    allowNull: true,
                    references: {
                        model: 'lesson_comments',
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
                updated_at: {
                    allowNull: false,
                    type: Sequelize.DATE,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
                },
            });

            // Add indexes for performance
            await queryInterface.addIndex('lesson_comments', ['lesson_id'], {
                name: 'idx_lesson_comments_lesson_id',
            });

            await queryInterface.addIndex('lesson_comments', ['user_id'], {
                name: 'idx_lesson_comments_user_id',
            });

            await queryInterface.addIndex('lesson_comments', ['parent_id'], {
                name: 'idx_lesson_comments_parent_id',
            });

            // Add index for sorting by creation date
            await queryInterface.addIndex('lesson_comments', ['created_at'], {
                name: 'idx_lesson_comments_created_at',
            });
        } else {
            console.log('Table lesson_comments already exists, skipping creation');
        }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('lesson_comments');
    },
};
