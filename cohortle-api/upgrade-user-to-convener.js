/**
 * Script to upgrade a user to convener role
 * Usage: node upgrade-user-to-convener.js <email>
 */

require('dotenv').config();
const db = require('./models');
const RoleAssignmentService = require('./services/RoleAssignmentService');

async function upgradeUserToConvener(email) {
  try {
    console.log(`\n🔍 Looking up user: ${email}`);
    
    // Find user by email
    const user = await db.users.findOne({
      where: { email },
      include: [{
        model: db.roles,
        as: 'role',
        attributes: ['name', 'role_id']
      }]
    });

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log(`✅ User found: ${user.first_name} ${user.last_name} (ID: ${user.id})`);
    console.log(`   Current role: ${user.role ? user.role.name : 'unassigned'}`);

    // Check if already a convener
    if (user.role && user.role.name === 'convener') {
      console.log(`ℹ️  User is already a convener. No changes needed.`);
      process.exit(0);
    }

    // Assign convener role
    console.log(`\n🔄 Upgrading user to convener role...`);
    const result = await RoleAssignmentService.assignRole(
      user.id,
      'convener',
      null, // System assignment (no admin)
      {
        notes: `Manual upgrade to convener role via script for ${email}`
      }
    );

    if (result.success) {
      console.log(`✅ Successfully upgraded ${email} to convener role!`);
      console.log(`   Assignment ID: ${result.assignmentId}`);
      console.log(`\n📋 Summary:`);
      console.log(`   - User: ${user.first_name} ${user.last_name}`);
      console.log(`   - Email: ${email}`);
      console.log(`   - Previous role: ${user.role ? user.role.name : 'unassigned'}`);
      console.log(`   - New role: convener`);
      console.log(`\n✨ The user can now access convener features!`);
    } else {
      console.error(`❌ Failed to upgrade user: ${result.error}`);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error upgrading user:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await db.sequelize.close();
  }
}

// Get email from command line argument or use default
const email = process.argv[2] || 'wecarefng@gmail.com';

console.log('🚀 User Role Upgrade Script');
console.log('============================');

upgradeUserToConvener(email);
