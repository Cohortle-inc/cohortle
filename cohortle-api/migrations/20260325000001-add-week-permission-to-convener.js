'use strict';

/**
 * Migration: Add manage_weeks permission to convener role
 * 
 * The convener role was missing a 'week' resource_type permission,
 * causing PUT /v1/api/weeks/:id and DELETE /v1/api/weeks/:id to return 403.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if permission already exists
    const existing = await queryInterface.sequelize.query(
      `SELECT permission_id FROM permissions WHERE name = 'manage_weeks' LIMIT 1`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (existing.length > 0) {
      console.log('manage_weeks permission already exists, skipping...');
      return;
    }

    // Insert the missing week permission
    await queryInterface.sequelize.query(`
      INSERT INTO permissions (permission_id, name, description, resource_type, action, scope, created_at)
      VALUES (UUID(), 'manage_weeks', 'Create and edit weeks', 'week', 'manage', 'own', NOW())
    `);

    // Assign it to the convener role
    await queryInterface.sequelize.query(`
      INSERT INTO role_permissions (mapping_id, role_id, permission_id, granted_at)
      SELECT UUID(), r.role_id, p.permission_id, NOW()
      FROM roles r
      CROSS JOIN permissions p
      WHERE r.name = 'convener'
        AND p.name = 'manage_weeks'
    `);

    console.log('manage_weeks permission added to convener role successfully.');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      DELETE rp FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.permission_id
      WHERE p.name = 'manage_weeks'
    `);

    await queryInterface.sequelize.query(
      `DELETE FROM permissions WHERE name = 'manage_weeks'`
    );
  },
};
