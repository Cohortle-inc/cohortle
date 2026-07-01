'use strict';

/**
 * Migration: Create verification_tokens table for Email Verification Flow Improvement
 * 
 * This migration creates the verification_tokens table to store email verification
 * tokens with expiration tracking. Tokens are used to verify user email addresses
 * during signup and when resending verification emails.
 * 
 * Requirements: 4.1, 7.1, 7.2
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Check if table exists
        const tableExists = await queryInterface.showAllTables()
            .then(tables => tables.includes('verification_tokens'));

        if (tableExists) {
            console.log('Table verification_tokens already exists, skipping creation');
            return;
        }

        await queryInterface.createTable('verification_tokens', {
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
            token: {
                type: Sequelize.STRING(255),
                allowNull: false,
                unique: true,
            },
            expires_at: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            used_at: {
                type: Sequelize.DATE,
                allowNull: true,
                defaultValue: null,
            },
        });

        // Add indexes for performance
        await queryInterface.addIndex('verification_tokens', ['token'], {
            name: 'idx_verification_tokens_token',
        });

        await queryInterface.addIndex('verification_tokens', ['user_id'], {
            name: 'idx_verification_tokens_user_id',
        });

        await queryInterface.addIndex('verification_tokens', ['expires_at'], {
            name: 'idx_verification_tokens_expires_at',
        });

        console.log('Table verification_tokens created successfully with indexes');
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('verification_tokens');
    },
};
