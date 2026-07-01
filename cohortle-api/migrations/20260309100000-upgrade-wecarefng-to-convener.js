'use strict';

/**
 * Migration: Upgrade wecarefng@gmail.com to convener role
 * This migration automatically runs on deployment to upgrade the specified user
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔍 Looking up user: wecarefng@gmail.com');
      
      // Find user by email
      const [users] = await queryInterface.sequelize.query(
        `SELECT id, email, first_name, last_name, role_id FROM users WHERE email = 'wecarefng@gmail.com'`,
        { transaction }
      );

      if (users.length === 0) {
        console.log('⚠️  User wecarefng@gmail.com not found. Skipping upgrade.');
        await transaction.commit();
        return;
      }

      const user = users[0];
      console.log(`✅ User found: ${user.first_name} ${user.last_name} (ID: ${user.id})`);

      // Get convener role ID
      const [roles] = await queryInterface.sequelize.query(
        `SELECT role_id FROM roles WHERE name = 'convener'`,
        { transaction }
      );

      if (roles.length === 0) {
        console.log('❌ Convener role not found in database. Please run role system migrations first.');
        await transaction.rollback();
        return;
      }

      const convenerRoleId = roles[0].role_id;

      // Check if user already has convener role
      if (user.role_id === convenerRoleId) {
        console.log('ℹ️  User already has convener role. No changes needed.');
        await transaction.commit();
        return;
      }

      // Update user's role_id to convener
      await queryInterface.sequelize.query(
        `UPDATE users SET role_id = ? WHERE id = ?`,
        {
          replacements: [convenerRoleId, user.id],
          transaction
        }
      );

      console.log(`✅ Updated user role_id to convener (${convenerRoleId})`);

      // Create role assignment history record
      await queryInterface.sequelize.query(
        `INSERT INTO role_assignment_history 
         (user_id, role_id, assigned_by, assigned_at, notes, created_at, updated_at) 
         VALUES (?, ?, NULL, NOW(), ?, NOW(), NOW())`,
        {
          replacements: [
            user.id,
            convenerRoleId,
            'Automatic upgrade to convener role via migration for wecarefng@gmail.com'
          ],
          transaction
        }
      );

      console.log('✅ Created role assignment history record');

      await transaction.commit();
      console.log('✨ Successfully upgraded wecarefng@gmail.com to convener role!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error upgrading user to convener:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔄 Reverting convener role upgrade for wecarefng@gmail.com');
      
      // Find user
      const [users] = await queryInterface.sequelize.query(
        `SELECT id FROM users WHERE email = 'wecarefng@gmail.com'`,
        { transaction }
      );

      if (users.length === 0) {
        console.log('⚠️  User not found. Nothing to revert.');
        await transaction.commit();
        return;
      }

      const user = users[0];

      // Get student role ID (default role)
      const [roles] = await queryInterface.sequelize.query(
        `SELECT role_id FROM roles WHERE name = 'student'`,
        { transaction }
      );

      if (roles.length === 0) {
        console.log('⚠️  Student role not found. Cannot revert.');
        await transaction.rollback();
        return;
      }

      const studentRoleId = roles[0].role_id;

      // Revert to student role
      await queryInterface.sequelize.query(
        `UPDATE users SET role_id = ? WHERE id = ?`,
        {
          replacements: [studentRoleId, user.id],
          transaction
        }
      );

      console.log('✅ Reverted user role to student');

      await transaction.commit();
      console.log('✨ Successfully reverted role upgrade');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error reverting role upgrade:', error);
      throw error;
    }
  }
};
