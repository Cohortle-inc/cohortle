'use strict';

/**
 * Migration: Backfill lifecycle_status for existing programmes
 *
 * Programmes created before the lifecycle system was introduced have:
 *   - status = 'published' but lifecycle_status = NULL
 *   - status = 'draft'     but lifecycle_status = NULL
 *
 * Rules:
 *   - published + no lifecycle_status → set lifecycle_status = 'active'
 *   - draft     + no lifecycle_status → set lifecycle_status = 'draft'
 *
 * This is idempotent — only updates rows where lifecycle_status IS NULL.
 */

module.exports = {
  async up(queryInterface) {
    // Published programmes → active
    await queryInterface.sequelize.query(`
      UPDATE programmes
      SET lifecycle_status = 'active'
      WHERE status = 'published'
        AND (lifecycle_status IS NULL OR lifecycle_status = '')
    `);

    // Draft programmes → draft (explicit, in case the column default isn't set)
    await queryInterface.sequelize.query(`
      UPDATE programmes
      SET lifecycle_status = 'draft'
      WHERE status = 'draft'
        AND (lifecycle_status IS NULL OR lifecycle_status = '')
    `);

    console.log('Backfilled lifecycle_status for existing programmes');
  },

  async down(queryInterface) {
    // Revert: clear lifecycle_status for programmes that were published
    await queryInterface.sequelize.query(`
      UPDATE programmes
      SET lifecycle_status = NULL
      WHERE status = 'published' AND lifecycle_status = 'active'
    `);
  },
};
