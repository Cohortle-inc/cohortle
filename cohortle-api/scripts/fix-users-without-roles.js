/**
 * Fix Users Without Role Assignments
 * 
 * This script identifies and fixes users who don't have role assignments
 * in the user_role_assignments table.
 */

const db = require('../models');
require('dotenv').config();

async function fixUsersWithoutRoles() {
  console.log('='.repeat(60));
  console.log('FIX USERS WITHOUT ROLE ASSIGNMENTS');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Check database connection
    await db.sequelize.authenticate();
    console.log('✓ Database connected');
    console.log('');

    // Find users without role assignments
    console.log('Step 1: Finding users without role assignments...');
    const usersWithoutRoles = await db.sequelize.query(`
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.created_at
      FROM users u
      LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
      WHERE ura.id IS NULL
      ORDER BY u.created_at DESC
    `, { type: db.sequelize.QueryTypes.SELECT });

    if (usersWithoutRoles.length === 0) {
      console.log('✓ All users have role assignments!');
      console.log('No fixes needed.');
      return;
    }

    console.log(`Found ${usersWithoutRoles.length} users without role assignments:`);
    usersWithoutRoles.forEach(user => {
      console.log(`  - ${user.email} (ID: ${user.id})`);
    });
    console.log('');

    // Get student role ID
    console.log('Step 2: Getting student role ID...');
    const studentRole = await db.roles.findOne({
      where: { name: 'student' },
      attributes: ['role_id', 'name']
    });

    if (!studentRole) {
      console.error('✗ Student role not found in database!');
      console.error('Please run role system initialization first.');
      process.exit(1);
    }

    console.log(`✓ Student role found: ${studentRole.role_id}`);
    console.log('');

    // Assign student role to users without roles
    console.log('Step 3: Assigning student role to users...');
    
    let successCount = 0;
    let errorCount = 0;

    for (const user of usersWithoutRoles) {
      try {
        await db.user_role_assignments.create({
          user_id: user.id,
          role_id: studentRole.role_id,
          assigned_by: 1, // System assignment
          assigned_at: new Date(),
          status: 'active'
        });
        
        console.log(`  ✓ Assigned student role to ${user.email}`);
        successCount++;
      } catch (error) {
        console.error(`  ✗ Failed to assign role to ${user.email}: ${error.message}`);
        errorCount++;
      }
    }

    console.log('');
    console.log('='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total users processed: ${usersWithoutRoles.length}`);
    console.log(`Successfully assigned roles: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log('');

    if (errorCount === 0) {
      console.log('✓ All users now have role assignments!');
    } else {
      console.log('⚠ Some users still need manual intervention');
    }

    // Verify fix
    console.log('');
    console.log('Step 4: Verifying fix...');
    const remainingUsers = await db.sequelize.query(`
      SELECT COUNT(*) as count
      FROM users u
      LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
      WHERE ura.id IS NULL
    `, { type: db.sequelize.QueryTypes.SELECT });

    const remainingCount = remainingUsers[0].count;
    if (remainingCount === 0) {
      console.log('✓ Verification passed: All users have roles');
    } else {
      console.log(`⚠ Verification: ${remainingCount} users still without roles`);
    }

  } catch (error) {
    console.error('Error fixing users:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await db.sequelize.close();
  }
}

// Run the fix
fixUsersWithoutRoles();
