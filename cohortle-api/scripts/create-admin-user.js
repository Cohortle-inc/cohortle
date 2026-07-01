/**
 * Create Administrator User
 * 
 * This script promotes an existing user to administrator role.
 * You can specify the user by email address.
 * 
 * Usage:
 *   node scripts/create-admin-user.js admin@example.com
 *   node scripts/create-admin-user.js admin@example.com "Promoted to platform administrator"
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');

// Get email from command line arguments
const userEmail = process.argv[2];
const reason = process.argv[3] || 'Promoted to platform administrator';

if (!userEmail) {
  console.error('❌ ERROR: Please provide a user email address');
  console.error('\nUsage:');
  console.error('  node scripts/create-admin-user.js admin@example.com');
  console.error('  node scripts/create-admin-user.js admin@example.com "Custom reason"');
  process.exit(1);
}

// Database configuration
const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOSTNAME,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
  }
);

async function createAdminUser() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Step 1: Find the user
    console.log(`📋 Step 1: Finding user with email: ${userEmail}`);
    const [users] = await sequelize.query(`
      SELECT id, email, first_name, last_name, role_id
      FROM users
      WHERE email = :email
    `, {
      replacements: { email: userEmail }
    });

    if (users.length === 0) {
      console.error(`❌ ERROR: User not found with email: ${userEmail}`);
      console.error('\nPlease check the email address and try again.');
      process.exit(1);
    }

    const user = users[0];
    const userName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'No name';
    console.log(`✅ Found user: ${userName} (${user.email})\n`);

    // Step 2: Get administrator role
    console.log('📋 Step 2: Getting administrator role...');
    const [roles] = await sequelize.query(`
      SELECT role_id, name
      FROM roles
      WHERE name = 'administrator'
    `);

    if (roles.length === 0) {
      console.error('❌ ERROR: Administrator role not found!');
      console.error('   Please run the seeder first:');
      console.error('   npx sequelize-cli db:seed --seed 20260304000000-seed-roles-and-permissions.js');
      process.exit(1);
    }

    const adminRole = roles[0];
    console.log(`✅ Found administrator role\n`);

    // Check if user is already an admin
    if (user.role_id === adminRole.role_id) {
      console.log('ℹ️  User is already an administrator!');
      console.log('   Nothing to do.\n');
      await sequelize.close();
      return;
    }

    // Get current role name
    let currentRoleName = 'none';
    if (user.role_id) {
      const [currentRoles] = await sequelize.query(`
        SELECT name FROM roles WHERE role_id = :roleId
      `, {
        replacements: { roleId: user.role_id }
      });
      if (currentRoles.length > 0) {
        currentRoleName = currentRoles[0].name;
      }
    }

    console.log(`📋 Step 3: Promoting user from '${currentRoleName}' to 'administrator'...`);

    // Step 3: Update user role
    await sequelize.query(`
      UPDATE users
      SET role_id = :adminRoleId
      WHERE id = :userId
    `, {
      replacements: {
        adminRoleId: adminRole.role_id,
        userId: user.id
      }
    });

    console.log(`✅ Updated user role to administrator\n`);

    // Step 4: Deactivate old role assignment (if exists)
    console.log('📋 Step 4: Updating role assignments...');
    await sequelize.query(`
      UPDATE user_role_assignments
      SET status = 'inactive'
      WHERE user_id = :userId
        AND status = 'active'
    `, {
      replacements: { userId: user.id }
    });

    // Create new role assignment
    await sequelize.query(`
      INSERT INTO user_role_assignments (user_id, role_id, assigned_by, assigned_at, status)
      VALUES (:userId, :adminRoleId, NULL, NOW(), 'active')
    `, {
      replacements: {
        userId: user.id,
        adminRoleId: adminRole.role_id
      }
    });

    console.log(`✅ Created new administrator role assignment\n`);

    // Step 5: Log in role assignment history
    console.log('📋 Step 5: Logging role change in history...');
    await sequelize.query(`
      INSERT INTO role_assignment_history (user_id, previous_role_id, new_role_id, changed_by, changed_at, reason)
      VALUES (:userId, :previousRoleId, :newRoleId, NULL, NOW(), :reason)
    `, {
      replacements: {
        userId: user.id,
        previousRoleId: user.role_id,
        newRoleId: adminRole.role_id,
        reason: reason
      }
    });

    console.log(`✅ Logged role change in history\n`);

    // Step 6: Verification
    console.log('📋 Step 6: Verifying administrator assignment...');
    const [verificationResults] = await sequelize.query(`
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        r.name as role_name,
        r.hierarchy_level,
        ura.status as assignment_status
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
      WHERE u.id = :userId
    `, {
      replacements: { userId: user.id }
    });

    if (verificationResults.length > 0) {
      const result = verificationResults[0];
      console.log('✅ Verification successful!');
      console.log('\n📊 Administrator Details:');
      console.log(`   Email: ${result.email}`);
      console.log(`   Name: ${[result.first_name, result.last_name].filter(Boolean).join(' ') || 'No name'}`);
      console.log(`   Role: ${result.role_name}`);
      console.log(`   Hierarchy Level: ${result.hierarchy_level}`);
      console.log(`   Assignment Status: ${result.assignment_status || 'N/A'}`);
    }

    console.log('\n✅ Administrator created successfully!\n');
    console.log('⚠️  IMPORTANT: The user will need to log out and log back in');
    console.log('   for the role change to take effect (JWT token refresh).\n');

    await sequelize.close();
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run the script
createAdminUser();
