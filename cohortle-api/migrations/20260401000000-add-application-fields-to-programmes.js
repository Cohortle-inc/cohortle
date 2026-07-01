'use strict';

/**
 * Migration: Add application flow fields to programmes table
 *
 * - onboarding_mode: already exists from 20260305000000 as STRING(20) with CHECK
 *   constraint for ('code','application'). This migration updates that constraint
 *   to also allow 'hybrid'.
 * - application_deadline: TIMESTAMP NULL — deadline after which new submissions
 *   are rejected.
 * - application_form_slug: VARCHAR(255) NULL UNIQUE — auto-generated slug used
 *   to construct the public application form URL (/apply/[slug]).
 *
 * Requirements: 7.1, 7.6, 1.1
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('programmes');

    // --- onboarding_mode ---
    // The column was added by 20260305000000 as STRING(20) DEFAULT 'code'.
    // We only need to widen the CHECK constraint to include 'hybrid'.
    if (tableDescription.onboarding_mode) {
      // Drop the old constraint (only allowed 'code','application') and replace it.
      await queryInterface.sequelize.query(`
        ALTER TABLE programmes
        DROP CONSTRAINT IF EXISTS chk_onboarding_mode
      `).catch(() => {
        console.log('Constraint chk_onboarding_mode does not exist, skipping drop');
      });

      await queryInterface.sequelize.query(`
        ALTER TABLE programmes
        ADD CONSTRAINT chk_onboarding_mode
        CHECK (onboarding_mode IN ('code', 'application', 'hybrid'))
      `).catch(() => {
        console.log('Constraint chk_onboarding_mode already exists or could not be created');
      });
    } else {
      // Column does not exist yet — create it (defensive fallback).
      await queryInterface.addColumn('programmes', 'onboarding_mode', {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'code',
        comment: 'Learner onboarding mode: code | application | hybrid',
      });

      await queryInterface.sequelize.query(`
        ALTER TABLE programmes
        ADD CONSTRAINT chk_onboarding_mode
        CHECK (onboarding_mode IN ('code', 'application', 'hybrid'))
      `).catch(() => {
        console.log('Constraint chk_onboarding_mode could not be created');
      });
    }

    // --- application_deadline ---
    if (!tableDescription.application_deadline) {
      await queryInterface.addColumn('programmes', 'application_deadline', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
        comment: 'Optional deadline after which new application submissions are rejected',
      });
    }

    // --- application_form_slug ---
    if (!tableDescription.application_form_slug) {
      await queryInterface.addColumn('programmes', 'application_form_slug', {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: null,
        comment: 'Unique slug for the public application form URL (/apply/[slug])',
      });

      // Unique index on application_form_slug (partial — excludes NULLs)
      await queryInterface.addIndex('programmes', ['application_form_slug'], {
        name: 'idx_programmes_application_form_slug',
        unique: true,
        where: { application_form_slug: { [Sequelize.Op.ne]: null } },
      }).catch(() => {
        console.log('Index idx_programmes_application_form_slug already exists');
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove application_form_slug index and column
    await queryInterface.removeIndex('programmes', 'idx_programmes_application_form_slug')
      .catch(() => {
        console.log('Index idx_programmes_application_form_slug does not exist');
      });

    const tableDescription = await queryInterface.describeTable('programmes');

    if (tableDescription.application_form_slug) {
      await queryInterface.removeColumn('programmes', 'application_form_slug');
    }

    if (tableDescription.application_deadline) {
      await queryInterface.removeColumn('programmes', 'application_deadline');
    }

    // Revert the onboarding_mode constraint back to the original two-value set
    await queryInterface.sequelize.query(`
      ALTER TABLE programmes
      DROP CONSTRAINT IF EXISTS chk_onboarding_mode
    `).catch(() => {
      console.log('Constraint chk_onboarding_mode does not exist');
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE programmes
      ADD CONSTRAINT chk_onboarding_mode
      CHECK (onboarding_mode IN ('code', 'application'))
    `).catch(() => {
      console.log('Could not restore chk_onboarding_mode constraint');
    });
  },
};
