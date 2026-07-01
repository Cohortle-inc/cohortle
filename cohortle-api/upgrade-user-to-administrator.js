/**
 * Script to upgrade a user to administrator role
 * Usage: node upgrade-user-to-administrator.js <email>
 *
 * This updates both:
 *   1. The users.role column (used by JWT and profile API)
 *   2. The user_role_assignments table (used by the role system)
 */

require('dotenv').config();
const db = require('./models');
const RoleAssignmentService = require('./services/RoleAssignmentService');

async function upgradeUserToAdministrator(email) {
  try {
    console.log(`\n🔍 Looking up user: ${email}`);

    const user = await db.users.findOne({ where: { email } });

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log(`✅ User found: ${user.first_name} ${user.last_name} (ID: ${user.id})`);
    console.log(`   Current role column: ${user.role}`);

    // Step 1: Update the users.role column directly
    await db.users.update(
      { role: 'administrator' },
      { where: { id: user.id } }
    );
    console.log(`✅ Updated users.role column to 'administrator'`);

    // Step 2: Assign via RoleAssignmentService (updates user_role_assignments table)
    try {
      const result = await RoleAssignmentService.assignRole(
        user.id,
        'administrator',
        null,
        { notes: `Manual upgrade to administrator role via script for ${email}` }
      );

      if (result.success) {
        console.log(`✅ Role assignment record created (ID: ${result.assignmentId})`);
      } else {
        console.warn(`⚠️  Role assignment service returned: ${result.error}`);
        console.warn(`   The users.role column was still updated — login should work.`);
      }
    } catch (assignErr) {
      console.warn(`⚠️  RoleAssignmentService failed: ${assignErr.message}`);
      console.warn(`   The users.role column was still updated — login should work.`);
    }

    console.log(`\n📋 Summary:`);
    console.log(`   - User: ${user.first_name} ${user.last_name}`);
    console.log(`   - Email: ${email}`);
    console.log(`   - Previous role: ${user.role}`);
    console.log(`   - New role: administrator`);
    console.log(`\n✨ ${email} can now access /internal (admin panel).`);
    console.log(`   They must log out and log back in for the new role to take effect.`);

  } catch (error) {
    console.error('❌ Error upgrading user:', error);
    process.exit(1);
  } finally {
    await db.sequelize.close();
  }
}

const email = process.argv[2];

if (!email) {
  console.error('Usage: node upgrade-user-to-administrator.js <email>');
  process.exit(1);
}

console.log('🚀 User Role Upgrade Script — Administrator');
console.log('============================================');

upgradeUserToAdministrator(email);
