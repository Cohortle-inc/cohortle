'use strict';

/**
 * Migration: Create acceptance_tokens table
 *
 * Stores time-limited tokens sent to accepted applicants via email.
 * Redeeming the token completes enrollment into the specified cohort.
 *
 * Columns:
 *   id               UUID PK
 *   token            VARCHAR(128) NOT NULL UNIQUE — 64-char random hex
 *   application_id   UUID NOT NULL FK → applications(id)
 *   cohort_id        INT NOT NULL FK → cohorts(id)
 *   applicant_email  VARCHAR(255) NOT NULL
 *   expires_at       TIMESTAMP NOT NULL — NOW() + 7 days
 *   used_at          TIMESTAMP NULL — set when redeemed
 *   created_at       TIMESTAMP NOT NULL DEFAULT NOW()
 *
 * Requirements: 5.3
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('acceptance_tokens')) {
      console.log('Table acceptance_tokens already exists, skipping creation');
      return;
    }

    await queryInterface.createTable('acceptance_tokens', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },

      token: {
        type: Sequelize.STRING(128),
        allowNull: false,
        unique: true,
        comment: '64-char random hex token sent in the acceptance email link',
      },

      application_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'applications', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Application this token was issued for',
      },

      cohort_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'cohorts', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Cohort the applicant will be enrolled into on redemption',
      },

      applicant_email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Email address the token was sent to',
      },

      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'Token expiry — 7 days after creation',
      },

      used_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
        comment: 'Timestamp when the token was redeemed — null if unused',
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('acceptance_tokens', ['token'], {
      name: 'idx_acceptance_tokens_token',
      unique: true,
    }).catch(() => {
      console.log('Index idx_acceptance_tokens_token already exists');
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('acceptance_tokens', 'idx_acceptance_tokens_token').catch(() => {});
    await queryInterface.dropTable('acceptance_tokens');
  },
};
