/**
 * Audit Script: Check Role Assignment Status for All Users
 * 
 * Usage: node audit-all-user-roles.js
 * 
 * This script will:
 * 1. Count users by role status
 * 2. List users without role assignments
 * 3. List users with multiple assignments
 * 4. List users with inactive assignments
 * 5. Show summary statistics
 */

require('dotenv').config({ path: './cohortle-api/.env' });
const db = require('./cohortle-api/models');

async function auditAllUserRoles() {
  console.log('='.repeat(80));
  console.log('USER ROLE ASSIGNMENT AUDIT');
  console.log('='.repeat(80));
  console.log();

  try {
    // 1. Total users
    const totalUsers = await db.users.count();
    console.log(`📊 Total users in database: ${totalUsers}\n`);

    // 2. Users with active role assignments
    const usersWithActiveRoles = await db.sequelize.query(`
      SELECT COUNT(DISTINCT u.id) as count
      FROM users u
      INNER JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
    `, { type: db.sequelize.QueryTypes.SELECT });

    const activeCount = usersWithActiveRoles[0].count;
    console.log(`✅ Users with active role assignments: ${activeCount}`);

    // 3. Users without any role assignments
    const usersWithoutRoles = await db.sequelize.query(`
      SELECT u.id, u.email, u.first_name, u.last_name
      FROM users u
      LEFT JOIN user_role_assignments ura ON u.id = ura.user_id
      WHERE ura.id IS NULL
      ORDER BY u.id
    `, { type: db.sequelize.QueryTypes.SELECT });

    console.log(`❌ Users without any role assignments: ${usersWithoutRoles.length}`);

    if (usersWithoutRoles.length > 0 && usersWithoutRoles.length <= 20) {
      console.log(`   Users:`);
      usersWithoutRoles.forEach(user => {
        console.log(`   - ${user.email} (ID: ${user.id})`);
      });
    } else if (usersWithoutRoles.length > 20) {
      console.log(`   (Showing first 20 of ${usersWithoutRoles.length})`);
      usersWithoutRoles.slice(0, 20).forEach(user => {
        console.log(`   - ${user.email} (ID: ${user.id})`);
      });
    }

    // 4. Users with multiple role assignments
    const usersWithMultipleRoles = await db.sequelize.query(`
      SELECT u.id, u.email, COUNT(ura.assignment_id) as assignment_count
      FROM users u
      INNER JOIN user_role_assignments ura ON u.id = ura.user_id
      GROUP BY u.id, u.email
      HAVING COUNT(ura.assignment_id) > 1
      ORDER BY assignment_count DESC
    `, { type: db.sequelize.QueryTypes.SELECT });

    console.log(`\n⚠️  Users with multiple role assignments: ${usersWithMultipleRoles.length}`);

    if (usersWithMultipleRoles.length > 0 && usersWithMultipleRoles.length <= 20) {
      console.log(`   Users:`);
      usersWithMultipleRoles.forEach(user => {
        console.log(`   - ${user.email} (ID: ${user.id}, assignments: ${user.assignment_count})`);
      });
    } else if (usersWithMultipleRoles.length > 20) {
      console.log(`   (Showing first 20 of ${usersWithMultipleRoles.length})`);
      usersWithMultipleRoles.slice(0, 20).forEach(user => {
        console.log(`   - ${user.email} (ID: ${user.id}, assignments: ${user.assignment_count})`);
      });
    }

    // 5. Users with only inactive assignments
    const usersWithInactiveOnly = await db.sequelize.query(`
      SELECT u.id, u.email, COUNT(ura.assignment_id) as inactive_count
      FROM users u
      INNER JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'inactive'
      LEFT JOIN user_role_assignments ura_active ON u.id = ura_active.user_id AND ura_active.status = 'active'
      WHERE ura_active.assignment_id IS NULL
      GROUP BY u.id, u.email
      ORDER BY u.id
    `, { type: db.sequelize.QueryTypes.SELECT });

    console.log(`\n⚠️  Users with only inactive assignments: ${usersWithInactiveOnly.length}`);

    if (usersWithInactiveOnly.length > 0 && usersWithInactiveOnly.length <= 20) {
      console.log(`   Users:`);
      usersWithInactiveOnly.forEach(user => {
        console.log(`   - ${user.email} (ID: ${user.id})`);
      });
    }

    // 6. Role distribution
    const roleDistribution = await db.sequelize.query(`
      SELECT r.name, COUNT(DISTINCT ura.user_id) as user_count
      FROM roles r
      LEFT JOIN user_role_assignments ura ON r.role_id = ura.role_id AND ura.status = 'active'
      GROUP BY r.role_id, r.name
      ORDER BY user_count DESC
    `, { type: db.sequelize.QueryTypes.SELECT });

    console.log(`\n📈 Role distribution (active assignments):`);
    roleDistribution.forEach(role => {
      console.log(`   - ${role.name}: ${role.user_count} users`);
    });

    // 7. Summary
    console.log(`\n${'='.repeat(80)}`);
    console.log('SUMMARY');
    console.log('='.repeat(80));

    const percentageWithRoles = ((activeCount / totalUsers) * 100).toFixed(1);
    console.log(`\n✅ Users with active roles: ${activeCount}/${totalUsers} (${percentageWithRoles}%)`);
    console.log(`❌ Users without roles: ${usersWithoutRoles.length}/${totalUsers} (${((usersWithoutRoles.length / totalUsers) * 100).toFixed(1)}%)`);

    if (usersWithoutRoles.length > 0) {
      console.log(`\n⚠️  ACTION REQUIRED:`);
      console.log(`   Run: node fix-all-users-without-roles.js`);
      console.log(`   This will assign 'student' role to all ${usersWithoutRoles.length} users without roles.`);
    } else {
      console.log(`\n✅ All users have role assignments!`);
    }

    if (usersWithMultipleRoles.length > 0) {
      console.log(`\n⚠️  WARNING: ${usersWithMultipleRoles.length} users have multiple role assignments.`);
      console.log(`   Only one should be active. Check these users manually.`);
    }

    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

// Run audit
auditAllUserRoles()
  .then(() => {
    console.log('\n✅ Audit completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Audit failed:', error);
    process.exit(1);
  });
