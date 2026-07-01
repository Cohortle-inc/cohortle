'use strict';

/**
 * Migration: Add application flow fields to enrollments table
 *
 * - enrollment_source: ENUM('code','application') NOT NULL DEFAULT 'code'
 *   Tracks how the learner was enrolled. Defaults to 'code' so all existing
 *   enrollments remain valid without data changes.
 *
 * - application_id: UUID NULL
 *   References applications(id) — set only when enrollment_source = 'application'.
 *   The FK is added as a raw ALTER TABLE after the column is created, with a
 *   deferred check for whether the applications table exists (it is created in
 *   migration 20260401000003). If the table does not yet exist the FK is skipped
 *   and will be added by a subsequent migration or manually.
 *
 * Requirements: 5.6, 11.4
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('enrollments');

    // --- enrollment_source ---
    if (!tableDescription.enrollment_source) {
      await queryInterface.addColumn('enrollments', 'enrollment_source', {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'code',
        comment: 'How the learner was enrolled: code | application',
      });

      // Add CHECK constraint to restrict to valid values
      await queryInterface.sequelize.query(`
        ALTER TABLE enrollments
        ADD CONSTRAINT chk_enrollment_source
        CHECK (enrollment_source IN ('code', 'application'))
      `).catch(() => {
        console.log('Constraint chk_enrollment_source could not be created (may already exist)');
      });
    }

    // --- application_id ---
    if (!tableDescription.application_id) {
      await queryInterface.addColumn('enrollments', 'application_id', {
        type: Sequelize.UUID,
        allowNull: true,
        defaultValue: null,
        comment: 'FK to applications(id) — set when enrollment_source = application',
      });

      // Add index for lookups by application_id
      await queryInterface.addIndex('enrollments', ['application_id'], {
        name: 'idx_enrollments_application_id',
      }).catch(() => {
        console.log('Index idx_enrollments_application_id already exists');
      });

      // Add the FK to applications(id) only if the applications table already exists.
      // Migration 20260401000003 creates that table, so this FK may not be addable
      // on first run. It is safe to skip — the column is still present and the FK
      // can be added once the applications table exists.
      const tables = await queryInterface.showAllTables();
      if (tables.includes('applications')) {
        await queryInterface.sequelize.query(`
          ALTER TABLE enrollments
          ADD CONSTRAINT fk_enrollments_application_id
          FOREIGN KEY (application_id) REFERENCES applications(id)
          ON UPDATE CASCADE ON DELETE SET NULL
        `).catch(() => {
          console.log('FK fk_enrollments_application_id could not be added (may already exist)');
        });
      } else {
        console.log(
          'applications table does not exist yet — FK fk_enrollments_application_id skipped. ' +
          'Run migration 20260401000003 and then add the FK manually if required.'
        );
      }
    }
  },

  async down(queryInterface) {
    // Drop FK first (if it exists), then index, then columns
    await queryInterface.sequelize.query(`
      ALTER TABLE enrollments
      DROP FOREIGN KEY fk_enrollments_application_id
    `).catch(() => {
      console.log('FK fk_enrollments_application_id does not exist, skipping');
    });

    await queryInterface.removeIndex('enrollments', 'idx_enrollments_application_id')
      .catch(() => {
        console.log('Index idx_enrollments_application_id does not exist');
      });

    const tableDescription = await queryInterface.describeTable('enrollments');

    if (tableDescription.application_id) {
      await queryInterface.removeColumn('enrollments', 'application_id');
    }

    await queryInterface.sequelize.query(`
      ALTER TABLE enrollments
      DROP CONSTRAINT IF EXISTS chk_enrollment_source
    `).catch(() => {
      console.log('Constraint chk_enrollment_source does not exist');
    });

    if (tableDescription.enrollment_source) {
      await queryInterface.removeColumn('enrollments', 'enrollment_source');
    }
  },
};
