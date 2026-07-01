'use strict';

/**
 * Migration: Upgrade testaconvener@cohortle.com to administrator role
 *
 * Runs automatically on deployment. Safe to re-run — checks current role first.
 * Updates both:
 *   - users.role_id (used by getUserWithRole to build the JWT)
 *   - user_role_assignments (audit trail)
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const email = 'testaconvener@cohortle.com';
      console.log(`🔍 Looking up user: ${email}`);

      const [users] = await queryInterface.sequelize.query(
        `SELECT id, email, first_name, last_name, role_id FROM users WHERE email = ?`,
        { replacements: [email], transaction }
      );

      if (users.length === 0) {
        console.log(`⚠️  User ${email} not found. Skipping.`);
        await transaction.commit();
        return;
      }

      const user = users[0];
      console.log(`✅ User found: ${user.first_name} ${user.last_name} (ID: ${user.id})`);

      // Get administrator role ID
      const [roles] = await queryInterface.sequelize.query(
        `SELECT role_id FROM roles WHERE name = 'administrator'`,
        { transaction }
      );

      if (roles.length === 0) {
        console.log('❌ Administrator role not found. Run role system migrations first.');
        await transaction.rollback();
        return;
      }

      const adminRoleId = roles[0].role_id;

      // Already an administrator — nothing to do
      if (user.role_id === adminRoleId) {
        console.log('ℹ️  User already has administrator role. No changes needed.');
        await transaction.commit();
        return;
      }

      // Update role_id on the users table
      await queryInterface.sequelize.query(
        `UPDATE users SET role_id = ? WHERE id = ?`,
        { replacements: [adminRoleId, user.id], transaction }
      );
      console.log(`✅ Updated users.role_id to administrator (${adminRoleId})`);

      // Upsert into user_role_assignments
      const [existing] = await queryInterface.sequelize.query(
        `SELECT id FROM user_role_assignments WHERE user_id = ? AND role_id = ? AND is_active = 1`,
        { replacements: [user.id, adminRoleId], transaction }
      );

      if (existing.length === 0) {
        await queryInterface.sequelize.query(
          `INSERT INTO user_role_assignments 
           (user_id, role_id, is_active, assigned_by, assigned_at, notes, created_at, updated_at)
           VALUES (?, ?, 1, NULL, NOW(), ?, NOW(), NOW())`,
          {
            replacements: [
              user.id,
              adminRoleId,
              `Auto-upgrade to administrator via migration for ${email}`
            ],
            transaction
          }
        );
        console.log('✅ Created user_role_assignments record');
      }

      // Deactivate any other active role assignments for this user
      await queryInterface.sequelize.query(
        `UPDATE user_role_assignments 
         SET is_active = 0, updated_at = NOW()
         WHERE user_id = ? AND role_id != ? AND is_active = 1`,
        { replacements: [user.id, adminRoleId], transaction }
      );

      // Add audit history
      await queryInterface.sequelize.query(
        `INSERT INTO role_assignment_history 
         (user_id, role_id, assigned_by, assigned_at, notes, created_at, updated_at)
         VALUES (?, ?, NULL, NOW(), ?, NOW(), NOW())`,
        {
          replacements: [
            user.id,
            adminRoleId,
            `Auto-upgrade to administrator via migration for ${email}`
          ],
          transaction
        }
      );
      console.log('✅ Created role_assignment_history record');

      await transaction.commit();
      console.log(`✨ ${email} is now an administrator. They must log out and back in.`);

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const email = 'testaconvener@cohortle.com';

      const [users] = await queryInterface.sequelize.query(
        `SELECT id FROM users WHERE email = ?`,
        { replacements: [email], transaction }
      );

      if (users.length === 0) {
        await transaction.commit();
        return;
      }

      const user = users[0];

      const [roles] = await queryInterface.sequelize.query(
        `SELECT role_id FROM roles WHERE name = 'convener'`,
        { transaction }
      );

      if (roles.length === 0) {
        await transaction.rollback();
        return;
      }

      const convenerRoleId = roles[0].role_id;

      await queryInterface.sequelize.query(
        `UPDATE users SET role_id = ? WHERE id = ?`,
        { replacements: [convenerRoleId, user.id], transaction }
      );

      await transaction.commit();
      console.log(`✅ Reverted ${email} to convener role`);

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
