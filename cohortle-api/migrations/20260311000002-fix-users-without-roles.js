'use strict';

/**
 * Migration: Fix Users Without Role Assignments
 * 
 * This migration automatically assigns the 'student' role to any users
 * that don't have an active role assignment. This fixes the authentication
 * issue where users without roles get JWT tokens with role='unassigned'.
 * 
 * Runs automatically on deployment - no manual intervention needed.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('[Migration] Starting: Fix users without role assignments');

    try {
      // Get the student role
      const studentRole = await queryInterface.sequelize.query(
        `SELECT role_id FROM roles WHERE name = 'student' LIMIT 1`,
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );

      if (!studentRole || studentRole.length === 0) {
        console.log('[Migration] ERROR: Student role not found. Skipping migration.');
        return;
      }

      const studentRoleId = studentRole[0].role_id;
      console.log(`[Migration] Found student role: ${studentRoleId}`);

      // Find all users without active role assignments
      const usersWithoutRoles = await queryInterface.sequelize.query(
        `
        SELECT u.id, u.email
        FROM users u
        WHERE NOT EXISTS (
          SELECT 1 FROM user_role_assignments ura 
          WHERE u.id = ura.user_id AND ura.status = 'active'
        )
        `,
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );

      console.log(`[Migration] Found ${usersWithoutRoles.length} users without active role assignments`);

      if (usersWithoutRoles.length === 0) {
        console.log('[Migration] No users to fix. Migration complete.');
        return;
      }

      // Create role assignments for each user using raw SQL with explicit columns
      const now = new Date();
      const { v4: uuidv4 } = require('uuid');
      
      // Get list of users without roles
      const userIds = usersWithoutRoles.map(u => u.id);
      
      if (userIds.length > 0) {
        // Use raw SQL INSERT with explicit column list to ensure assignment_id is included
        const placeholders = userIds.map(() => 
          `(UUID(), ?, ?, NULL, NOW(), NOW(), NULL, 'active', 'Auto-assigned by migration to fix authentication issue')`
        ).join(',');
        
        const values = [];
        userIds.forEach(() => {
          values.push(userIds[0]); // user_id
          values.push(studentRoleId); // role_id
        });
        
        // Better approach: insert one by one or use proper bulk insert
        for (const user of usersWithoutRoles) {
          await queryInterface.sequelize.query(
            `INSERT INTO user_role_assignments 
             (assignment_id, user_id, role_id, assigned_by, assigned_at, effective_from, effective_until, status, notes)
             VALUES (UUID(), ?, ?, NULL, NOW(), NOW(), NULL, 'active', 'Auto-assigned by migration to fix authentication issue')`,
            { replacements: [user.id, studentRoleId] }
          );
        }
        console.log(`[Migration] Created ${usersWithoutRoles.length} role assignments`);
      }

      // Update denormalized role_id in users table
      await queryInterface.sequelize.query(
        `
        UPDATE users u
        SET role_id = ?
        WHERE u.id IN (
          SELECT user_id FROM user_role_assignments 
          WHERE role_id = ? AND status = 'active'
        )
        `,
        { replacements: [studentRoleId, studentRoleId] }
      );

      console.log(`[Migration] Updated denormalized role_id for ${usersWithoutRoles.length} users`);
      console.log('[Migration] SUCCESS: All users without roles have been assigned the student role');

    } catch (error) {
      console.error('[Migration] ERROR:', error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    console.log('[Migration] Rolling back: Fix users without role assignments');

    try {
      // Get the student role
      const studentRole = await queryInterface.sequelize.query(
        `SELECT role_id FROM roles WHERE name = 'student' LIMIT 1`,
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );

      if (!studentRole || studentRole.length === 0) {
        console.log('[Migration] Student role not found. Skipping rollback.');
        return;
      }

      const studentRoleId = studentRole[0].role_id;

      // Delete role assignments created by this migration
      await queryInterface.sequelize.query(
        `
        DELETE FROM user_role_assignments
        WHERE role_id = ? AND status = 'active' AND notes = 'Auto-assigned by migration to fix authentication issue'
        `,
        { replacements: [studentRoleId] }
      );

      console.log('[Migration] Rollback complete');

    } catch (error) {
      console.error('[Migration] ERROR during rollback:', error.message);
      throw error;
    }
  }
};
