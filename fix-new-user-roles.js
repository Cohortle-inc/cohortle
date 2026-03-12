#!/usr/bin/env node

/**
 * Fix script to repair new users who don't have proper role assignments
 * This script:
 * 1. Finds users created in the last 24 hours with missing or mismatched roles
 * 2. Ensures they have active role assignments in user_role_assignments table
 * 3. Updates the denormalized role_id field in users table
 */

const db = require('./cohortle-api/models');
const RoleAssignmentService = require('./cohortle-api/services/RoleAssignmentService');

async function fixNewUserRoles() {
  try {
    console.log('🔧 Fixing new user role assignments...\n');

    // Get all users created in the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentUsers = await db.users.findAll({
      where: {
        createdAt: {
          [db.Sequelize.Op.gte]: oneDayAgo
        }
      },
      attributes: ['id', 'email', 'role_id', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    console.log(`Found ${recentUsers.length} users created in the last 24 hours\n`);

    let fixed = 0;
    let skipped = 0;

    for (const user of recentUsers) {
      // Check if user has an active role assignment
      const activeAssignment = await db.user_role_assignments.findOne({
        where: {
          user_id: user.id,
          status: 'active',
          effective_from: {
            [db.Sequelize.Op.lte]: new Date()
          },
          [db.Sequelize.Op.or]: [
            { effective_until: null },
            { effective_until: { [db.Sequelize.Op.gte]: new Date() } }
          ]
        }
      });

      if (activeAssignment) {
        // User has active assignment, verify role_id is set
        if (!user.role_id || user.role_id !== activeAssignment.role_id) {
          console.log(`⚠️  User ${user.email}: Updating role_id from ${user.role_id} to ${activeAssignment.role_id}`);
          await db.users.update(
            { role_id: activeAssignment.role_id },
            { where: { id: user.id } }
          );
          fixed++;
        } else {
          console.log(`✅ User ${user.email}: Already has correct role assignment`);
          skipped++;
        }
      } else {
        // User has no active assignment - this is the problem
        console.log(`❌ User ${user.email}: No active role assignment found!`);
        
        // Try to infer the role from the user's status or other fields
        // For now, assign as 'student' (learner) by default
        console.log(`   Attempting to assign 'student' role...`);
        
        const roleAssignment = await RoleAssignmentService.assignRole(
          user.id,
          'student',
          null,
          { notes: 'Auto-assigned during fix for missing role' }
        );

        if (roleAssignment.success) {
          console.log(`   ✅ Successfully assigned 'student' role`);
          fixed++;
        } else {
          console.log(`   ❌ Failed to assign role: ${roleAssignment.error}`);
          skipped++;
        }
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Fixed: ${fixed}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${recentUsers.length}`);

  } catch (error) {
    console.error('❌ Error during fix:', error);
  } finally {
    process.exit(0);
  }
}

fixNewUserRoles();
