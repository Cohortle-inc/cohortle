'use strict';

/**
 * Migration: Add manage_programme permission to convener role
 *
 * Conveners were missing a `manage` permission on the `programme` resource_type.
 * Without it, the RBAC check in lifecycle transition routes denied access.
 * This inserts the permission and links it to the convener and administrator roles.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    // Idempotent: skip if already exists
    const existing = await queryInterface.sequelize.query(
      `SELECT COUNT(*) as count FROM permissions WHERE name = 'manage_programme'`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (existing[0].count > 0) {
      console.log('Permission manage_programme already exists, skipping');
      return;
    }

    // Insert the permission
    await queryInterface.sequelize.query(`
      INSERT INTO permissions (permission_id, name, description, resource_type, action, scope, created_at)
      VALUES (UUID(), 'manage_programme', 'Manage programme lifecycle, settings, and onboarding mode', 'programme', 'manage', 'own', NOW())
    `);

    // Link to convener and administrator roles
    await queryInterface.sequelize.query(`
      INSERT INTO role_permissions (mapping_id, role_id, permission_id, granted_at)
      SELECT UUID(), r.role_id, p.permission_id, NOW()
      FROM roles r
      CROSS JOIN permissions p
      WHERE p.name = 'manage_programme'
        AND r.name IN ('convener', 'administrator')
    `);

    console.log('manage_programme permission added to convener and administrator roles');
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DELETE rp FROM role_permissions rp
      INNER JOIN permissions p ON rp.permission_id = p.permission_id
      WHERE p.name = 'manage_programme'
    `).catch(() => {
      return queryInterface.sequelize.query(`
        DELETE FROM role_permissions
        WHERE permission_id IN (
          SELECT permission_id FROM permissions WHERE name = 'manage_programme'
        )
      `);
    });

    await queryInterface.sequelize.query(
      `DELETE FROM permissions WHERE name = 'manage_programme'`
    );
  },
};
