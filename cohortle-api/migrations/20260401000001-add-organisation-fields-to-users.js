'use strict';

/**
 * Migration: Add organisation fields to users table
 *
 * - organisation_slug: VARCHAR(50) NULL UNIQUE — URL-safe identifier for the
 *   convener's public Organisation Page (/org/[slug]). Must be lowercase
 *   alphanumeric + hyphens, 3–50 characters, globally unique.
 * - organisation_name: VARCHAR(255) NULL — display name shown on the
 *   Organisation Page.
 * - organisation_description: TEXT NULL — brief description shown on the
 *   Organisation Page.
 *
 * Requirements: 13.1, 13.7
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('users');

    // --- organisation_slug ---
    if (!tableDescription.organisation_slug) {
      await queryInterface.addColumn('users', 'organisation_slug', {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: null,
        comment: 'Unique URL-safe slug for the convener Organisation Page (/org/[slug])',
      });
    }

    // Partial unique index on organisation_slug (excludes NULLs)
    const indexes = await queryInterface.showIndex('users');
    const indexExists = indexes.some((idx) => idx.name === 'idx_users_organisation_slug');

    if (!indexExists) {
      await queryInterface.addIndex('users', ['organisation_slug'], {
        name: 'idx_users_organisation_slug',
        unique: true,
        where: { organisation_slug: { [Sequelize.Op.ne]: null } },
      });
    }

    // --- organisation_name ---
    if (!tableDescription.organisation_name) {
      await queryInterface.addColumn('users', 'organisation_name', {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: null,
        comment: 'Display name for the convener organisation shown on the Organisation Page',
      });
    }

    // --- organisation_description ---
    if (!tableDescription.organisation_description) {
      await queryInterface.addColumn('users', 'organisation_description', {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null,
        comment: 'Brief description of the organisation shown on the Organisation Page',
      });
    }
  },

  async down(queryInterface) {
    // Remove index first, then columns
    try {
      await queryInterface.removeIndex('users', 'idx_users_organisation_slug');
    } catch {
      // Index may not exist; ignore
    }

    const tableDescription = await queryInterface.describeTable('users');

    if (tableDescription.organisation_description) {
      await queryInterface.removeColumn('users', 'organisation_description');
    }

    if (tableDescription.organisation_name) {
      await queryInterface.removeColumn('users', 'organisation_name');
    }

    if (tableDescription.organisation_slug) {
      await queryInterface.removeColumn('users', 'organisation_slug');
    }
  },
};
