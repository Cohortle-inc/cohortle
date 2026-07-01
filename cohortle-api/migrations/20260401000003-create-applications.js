'use strict';

/**
 * Migration: Create applications table
 *
 * Stores all programme applications submitted by applicants (with or without
 * a Cohortle account). Each application is scoped to one programme and tracks
 * the full lifecycle from submission through review to a final decision.
 *
 * Columns:
 *   id               UUID PK — auto-generated
 *   programme_id     INT NOT NULL FK → programmes(id)
 *   cohort_id        INT NULL FK → cohorts(id) — set on acceptance
 *   applicant_name   VARCHAR(255) NOT NULL
 *   applicant_email  VARCHAR(255) NOT NULL
 *   user_id          INT NULL FK → users(id) — set if/when account exists
 *   status           ENUM-like STRING: draft|submitted|under_review|accepted|rejected|waitlisted
 *   responses        JSON NOT NULL DEFAULT '{}'
 *   reviewer_id      INT NULL FK → users(id)
 *   reviewer_notes   TEXT NULL
 *   rejection_reason TEXT NULL
 *   decision_at      TIMESTAMP NULL
 *   submitted_at     TIMESTAMP NOT NULL DEFAULT NOW()
 *   created_at       TIMESTAMP NOT NULL DEFAULT NOW()
 *   updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
 *
 * Indexes:
 *   idx_applications_programme_id  (programme_id)
 *   idx_applications_email         (applicant_email)
 *   idx_applications_status        (status)
 *
 * Requirements: 2.2, 8.1
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    // Idempotency guard — skip if table already exists
    const tables = await queryInterface.showAllTables();
    if (tables.includes('applications')) {
      console.log('Table applications already exists, skipping creation');
      return;
    }

    await queryInterface.createTable('applications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
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
        comment: 'Programme this application belongs to',
      },

      cohort_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
        references: {
          model: 'cohorts',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Cohort assigned on acceptance — null until accepted',
      },

      applicant_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Full name provided by the applicant at submission time',
      },

      applicant_email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Email address provided by the applicant at submission time',
      },

      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Linked Cohortle user account — null until account is created or matched',
      },

      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'submitted',
        comment: 'Application lifecycle status: draft|submitted|under_review|accepted|rejected|waitlisted',
      },

      responses: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {},
        comment: 'Applicant answers to application template questions, keyed by question ID',
      },

      reviewer_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Convener or admin who made the final decision',
      },

      reviewer_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null,
        comment: 'Internal notes added by the reviewer — not visible to the applicant',
      },

      rejection_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null,
        comment: 'Reason provided when status is rejected — sent to the applicant by email',
      },

      decision_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
        comment: 'Timestamp when the final accept/reject decision was recorded',
      },

      submitted_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Timestamp when the application was formally submitted (status → submitted)',
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // CHECK constraint to restrict status to valid enum values
    await queryInterface.sequelize.query(`
      ALTER TABLE applications
      ADD CONSTRAINT chk_application_status
      CHECK (status IN ('draft', 'submitted', 'under_review', 'accepted', 'rejected', 'waitlisted'))
    `).catch(() => {
      console.log('Constraint chk_application_status could not be created (may already exist)');
    });

    // Index on programme_id — used for listing all applications for a programme
    await queryInterface.addIndex('applications', ['programme_id'], {
      name: 'idx_applications_programme_id',
    }).catch(() => {
      console.log('Index idx_applications_programme_id already exists');
    });

    // Index on applicant_email — used for duplicate detection and learner lookup
    await queryInterface.addIndex('applications', ['applicant_email'], {
      name: 'idx_applications_email',
    }).catch(() => {
      console.log('Index idx_applications_email already exists');
    });

    // Index on status — used for filtering by status in the review dashboard
    await queryInterface.addIndex('applications', ['status'], {
      name: 'idx_applications_status',
    }).catch(() => {
      console.log('Index idx_applications_status already exists');
    });

    // Now that the applications table exists, add the FK from enrollments.application_id
    // if that column was already created by migration 20260401000002 without the FK.
    const enrollmentColumns = await queryInterface.describeTable('enrollments').catch(() => null);
    if (enrollmentColumns && enrollmentColumns.application_id) {
      await queryInterface.sequelize.query(`
        ALTER TABLE enrollments
        ADD CONSTRAINT fk_enrollments_application_id
        FOREIGN KEY (application_id) REFERENCES applications(id)
        ON UPDATE CASCADE ON DELETE SET NULL
      `).catch(() => {
        console.log('FK fk_enrollments_application_id already exists or could not be added');
      });
    }
  },

  async down(queryInterface) {
    // Drop the FK on enrollments first to avoid constraint violations
    await queryInterface.sequelize.query(`
      ALTER TABLE enrollments
      DROP FOREIGN KEY fk_enrollments_application_id
    `).catch(() => {
      console.log('FK fk_enrollments_application_id does not exist, skipping');
    });

    // Drop indexes (Sequelize drops them automatically with the table, but be explicit)
    await queryInterface.removeIndex('applications', 'idx_applications_programme_id').catch(() => {});
    await queryInterface.removeIndex('applications', 'idx_applications_email').catch(() => {});
    await queryInterface.removeIndex('applications', 'idx_applications_status').catch(() => {});

    await queryInterface.dropTable('applications');
  },
};
