'use strict';

/**
 * Migration: Add manage_applications permission to convener role
 *
 * Inserts a new `manage_applications` permission into the permissions table
 * and links it to the convener role via role_permissions.
 * Also links it to the administrator role (admins get all permissions).
 *
 * Requirements: 10.6
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if permission already exists
    const existing = await queryInterface.sequelize.query(
      `SELECT COUNT(*) as count FROM permissions WHERE name = 'manage_applications'`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (existing[0].count > 0) {
      console.log('Permission manage_applications already exists, skipping');
      return;
    }

    // Insert the permission
    await queryInterface.sequelize.query(`
      INSERT INTO permissions (permission_id, name, description, resource_type, action, scope, created_at)
      VALUES (UUID(), 'manage_applications', 'Review, accept, and reject programme applications', 'application', 'manage', 'own', NOW())
    `);

    // Link to convener and administrator roles
    await queryInterface.sequelize.query(`
      INSERT INTO role_permissions (mapping_id, role_id, permission_id, granted_at)
      SELECT UUID(), r.role_id, p.permission_id, NOW()
      FROM roles r
      CROSS JOIN permissions p
      WHERE p.name = 'manage_applications'
        AND r.name IN ('convener', 'administrator')
    `);

    console.log('manage_applications permission added to convener and administrator roles');
  },

  async down(queryInterface) {
    // Remove role_permissions links first
    await queryInterface.sequelize.query(`
      DELETE rp FROM role_permissions rp
      INNER JOIN permissions p ON rp.permission_id = p.permission_id
      WHERE p.name = 'manage_applications'
    `).catch(() => {
      // Try alternative syntax for non-MySQL
      return queryInterface.sequelize.query(`
        DELETE FROM role_permissions
        WHERE permission_id IN (
          SELECT permission_id FROM permissions WHERE name = 'manage_applications'
        )
      `);
    });

    // Remove the permission itself
    await queryInterface.sequelize.query(
      `DELETE FROM permissions WHERE name = 'manage_applications'`
    );
  },
};
