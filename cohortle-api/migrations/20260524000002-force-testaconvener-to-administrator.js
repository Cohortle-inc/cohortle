'use strict';

/**
 * Migration: Force testaconvener@cohortle.com to administrator role
 *
 * This is a more robust version that handles edge cases:
 * - Creates the administrator role if it doesn't exist
 * - Updates both users.role_id and user_role_assignments
 * - Logs the current state for debugging
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const email = 'testaconvener@cohortle.com';

      // Debug: show all roles
      const [allRoles] = await queryInterface.sequelize.query(
        `SELECT role_id, name FROM roles`,
        { transaction }
      );
      console.log(`[Admin Migration] Roles in database:`, allRoles.map(r => `${r.name}(${r.role_id})`).join(', '));

      // Find user
      const [users] = await queryInterface.sequelize.query(
        `SELECT id, email, first_name, last_name, role_id FROM users WHERE email = ?`,
        { replacements: [email], transaction }
      );

      if (users.length === 0) {
        console.log(`[Admin Migration] ⚠️ User ${email} not found. Skipping.`);
        await transaction.commit();
        return;
      }

      const user = users[0];
      console.log(`[Admin Migration] Found user: ${user.first_name} ${user.last_name} (ID: ${user.id}, current role_id: ${user.role_id})`);

      // Find administrator role
      let [roles] = await queryInterface.sequelize.query(
        `SELECT role_id FROM roles WHERE name = 'administrator'`,
        { transaction }
      );

      let adminRoleId;

      if (roles.length === 0) {
        // Administrator role doesn't exist — create it
        console.log(`[Admin Migration] Administrator role not found, creating it...`);
        await queryInterface.sequelize.query(
          `INSERT INTO roles (role_id, name, description, hierarchy_level, created_at, updated_at)
           VALUES (UUID(), 'administrator', 'System administrator with full access', 3, NOW(), NOW())`,
          { transaction }
        );
        const [newRole] = await queryInterface.sequelize.query(
          `SELECT role_id FROM roles WHERE name = 'administrator'`,
          { transaction }
        );
        adminRoleId = newRole[0].role_id;
        console.log(`[Admin Migration] Created administrator role with ID: ${adminRoleId}`);
      } else {
        adminRoleId = roles[0].role_id;
        console.log(`[Admin Migration] Found administrator role ID: ${adminRoleId}`);
      }

      // Check if already administrator
      if (user.role_id === adminRoleId) {
        console.log(`[Admin Migration] ✅ User already has administrator role_id. No change needed.`);
        await transaction.commit();
        return;
      }

      // Update users.role_id
      await queryInterface.sequelize.query(
        `UPDATE users SET role_id = ? WHERE id = ?`,
        { replacements: [adminRoleId, user.id], transaction }
      );
      console.log(`[Admin Migration] ✅ Updated users.role_id to ${adminRoleId}`);

      // Deactivate existing role assignments
      await queryInterface.sequelize.query(
        `UPDATE user_role_assignments SET is_active = 0, updated_at = NOW()
         WHERE user_id = ? AND is_active = 1`,
        { replacements: [user.id], transaction }
      );

      // Insert new administrator assignment
      await queryInterface.sequelize.query(
        `INSERT INTO user_role_assignments (user_id, role_id, is_active, assigned_by, assigned_at, notes, created_at, updated_at)
         VALUES (?, ?, 1, NULL, NOW(), ?, NOW(), NOW())`,
        {
          replacements: [
            user.id,
            adminRoleId,
            `Force-upgrade to administrator via migration for ${email}`
          ],
          transaction
        }
      );
      console.log(`[Admin Migration] ✅ Created user_role_assignments record`);

      // Verify the update
      const [verify] = await queryInterface.sequelize.query(
        `SELECT u.id, u.email, u.role_id, r.name as role_name 
         FROM users u LEFT JOIN roles r ON u.role_id = r.role_id
         WHERE u.email = ?`,
        { replacements: [email], transaction }
      );
      console.log(`[Admin Migration] Verification: ${JSON.stringify(verify[0])}`);

      await transaction.commit();
      console.log(`[Admin Migration] ✨ ${email} is now administrator. They must log out and back in.`);

    } catch (error) {
      await transaction.rollback();
      console.error('[Admin Migration] ❌ Failed:', error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [users] = await queryInterface.sequelize.query(
        `SELECT id FROM users WHERE email = 'testaconvener@cohortle.com'`,
        { transaction }
      );
      if (users.length > 0) {
        const [roles] = await queryInterface.sequelize.query(
          `SELECT role_id FROM roles WHERE name = 'convener'`,
          { transaction }
        );
        if (roles.length > 0) {
          await queryInterface.sequelize.query(
            `UPDATE users SET role_id = ? WHERE id = ?`,
            { replacements: [roles[0].role_id, users[0].id], transaction }
          );
        }
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
