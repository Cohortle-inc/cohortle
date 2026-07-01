'use strict';

/**
 * Migration: Assign roles to users without role assignments
 * 
 * This migration ensures all users have proper role assignments in the
 * user_role_assignments table. Users without roles get the default 'student' role.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔍 Checking for users without role assignments...');

      // Find users without active role assignments
      const [usersWithoutRoles] = await queryInterface.sequelize.query(`
        SELECT 
          u.id,
          u.email,
          u.first_name,
          u.last_name,
          u.role_id
        FROM users u
        LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
        WHERE ura.user_id IS NULL
        ORDER BY u.created_at
      `, { transaction });

      if (usersWithoutRoles.length === 0) {
        console.log('✅ All users have role assignments');
        await transaction.commit();
        return;
      }

      console.log(`📊 Found ${usersWithoutRoles.length} users without role assignments`);

      // Get student role ID (default role)
      const [studentRoles] = await queryInterface.sequelize.query(
        `SELECT role_id FROM roles WHERE name = 'student'`,
        { transaction }
      );

      if (studentRoles.length === 0) {
        console.log('❌ Student role not found. Please run role system migrations first.');
        await transaction.rollback();
        return;
      }

      const studentRoleId = studentRoles[0].role_id;
      console.log(`✅ Using student role ID: ${studentRoleId}`);

      // Update users.role_id if NULL
      const [updateResult] = await queryInterface.sequelize.query(`
        UPDATE users
        SET role_id = ?
        WHERE role_id IS NULL
      `, {
        replacements: [studentRoleId],
        transaction
      });

      if (updateResult.affectedRows > 0) {
        console.log(`✅ Updated ${updateResult.affectedRows} users with student role_id`);
      }

      // Create role assignments for users without them
      for (const user of usersWithoutRoles) {
        await queryInterface.sequelize.query(`
          INSERT INTO user_role_assignments (assignment_id, user_id, role_id, assigned_by, assigned_at, effective_from, status)
          VALUES (UUID(), ?, ?, NULL, NOW(), NOW(), 'active')
        `, {
          replacements: [user.id, studentRoleId],
          transaction
        });
      }

      console.log(`✅ Created ${usersWithoutRoles.length} role assignments`);

      // Create role assignment history entries
      // Note: changed_by is required, so we use the first admin user or system user
      const [adminUsers] = await queryInterface.sequelize.query(`
        SELECT u.id FROM users u
        INNER JOIN user_role_assignments ura ON u.id = ura.user_id
        INNER JOIN roles r ON ura.role_id = r.role_id
        WHERE r.name = 'administrator'
        LIMIT 1
      `, { transaction });

      const changedBy = adminUsers.length > 0 ? adminUsers[0].id : null;

      if (changedBy) {
        await queryInterface.sequelize.query(`
          INSERT INTO role_assignment_history (user_id, previous_role_id, new_role_id, changed_by, changed_at, reason)
          SELECT 
            u.id,
            NULL,
            ?,
            ?,
            NOW(),
            'Migration: Assigned default student role to user without role assignment'
          FROM users u
          WHERE NOT EXISTS (
            SELECT 1 
            FROM role_assignment_history rah 
            WHERE rah.user_id = u.id
          )
        `, {
          replacements: [studentRoleId, changedBy],
          transaction
        });
      }

      console.log('✅ Created role assignment history entries');

      // Verify the fix
      const [remainingUsers] = await queryInterface.sequelize.query(`
        SELECT COUNT(*) as count
        FROM users u
        LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
        WHERE ura.user_id IS NULL
      `, { transaction });

      const remainingCount = remainingUsers[0].count;
      
      if (remainingCount === 0) {
        console.log('✅ Verification passed: All users now have role assignments');
      } else {
        console.log(`⚠️  Warning: ${remainingCount} users still without role assignments`);
      }

      await transaction.commit();
      console.log('✨ Role assignment migration complete!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error assigning roles to users:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // This migration cannot be safely reversed as it assigns default roles
    // Removing role assignments could break the system
    console.log('⚠️  This migration cannot be reversed - role assignments are permanent');
  }
};
