/**
 * Fix Script: Assign Student Role to ALL Users Without Role Assignments
 * 
 * Usage: node fix-all-users-without-roles.js
 * 
 * This script will:
 * 1. Find all users without active role assignments
 * 2. Assign 'student' role to each
 * 3. Update denormalized role_id
 * 4. Show summary of changes
 */

require('dotenv').config({ path: './cohortle-api/.env' });
const db = require('./cohortle-api/models');

async function fixAllUsersWithoutRoles() {
  console.log('='.repeat(80));
  console.log('FIX ALL USERS WITHOUT ROLE ASSIGNMENTS');
  console.log('='.repeat(80));
  console.log();

  try {
    // Get student role
    const studentRole = await db.roles.findOne({
      where: { name: 'student' }
    });

    if (!studentRole) {
      console.log(`❌ Student role not found in database!`);
      console.log(`   Run role system initialization first.`);
      process.exit(1);
    }

    console.log(`✅ Student role found: ${studentRole.role_id}\n`);

    // Find all users without active role assignments
    console.log('🔍 Finding users without active role assignments...\n');

    const usersWithoutRoles = await db.sequelize.query(`
      SELECT u.id, u.email, u.first_name, u.last_name
      FROM users u
      LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
      WHERE ura.id IS NULL
      ORDER BY u.id
    `, { type: db.sequelize.QueryTypes.SELECT });

    console.log(`Found ${usersWithoutRoles.length} users without active role assignments:\n`);

    if (usersWithoutRoles.length === 0) {
      console.log('✅ All users have role assignments! Nothing to fix.');
      process.exit(0);
    }

    usersWithoutRoles.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email} (ID: ${user.id})`);
    });

    console.log(`\n${'='.repeat(80)}`);
    console.log('APPLYING FIXES');
    console.log('='.repeat(80));
    console.log();

    let successCount = 0;
    let failureCount = 0;

    // Fix each user
    for (const user of usersWithoutRoles) {
      try {
        console.log(`Processing: ${user.email}...`);

        // Create role assignment
        await db.user_role_assignments.create({
          user_id: user.id,
          role_id: studentRole.role_id,
          assigned_by: null,
          assigned_at: new Date(),
          effective_from: new Date(),
          effective_until: null,
          status: 'active',
          notes: 'Assigned by fix-all-users-without-roles script'
        });

        // Update denormalized role_id
        await db.users.update(
          { role_id: studentRole.role_id },
          { where: { id: user.id } }
        );

        console.log(`  ✅ Fixed\n`);
        successCount++;

      } catch (error) {
        console.log(`  ❌ Failed: ${error.message}\n`);
        failureCount++;
      }
    }

    // Summary
    console.log('='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log(`\n✅ Successfully fixed: ${successCount} users`);
    console.log(`❌ Failed: ${failureCount} users`);
    console.log(`\nTotal users processed: ${usersWithoutRoles.length}`);

    if (failureCount === 0) {
      console.log('\n✅ All users have been assigned the student role!');
      console.log('   They should now be able to authenticate and access the dashboard.');
    } else {
      console.log('\n⚠️  Some users failed to be fixed. Check the errors above.');
    }

    console.log('\n' + '='.repeat(80));

    process.exit(failureCount === 0 ? 0 : 1);

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

// Run fix
fixAllUsersWithoutRoles()
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
