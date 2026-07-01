/**
 * Assign Roles to Existing Users
 * 
 * This script assigns the default 'student' role to all existing users
 * who don't have a role assigned yet. It also creates role assignments
 * and logs the changes in the role assignment history.
 * 
 * Run this AFTER the seeder has populated roles and permissions.
 * 
 * Usage:
 *   node scripts/assign-roles-to-existing-users.js
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');

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

async function assignRolesToExistingUsers() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Step 1: Check if roles exist
    console.log('📋 Step 1: Checking if roles exist...');
    const [roles] = await sequelize.query(`
      SELECT role_id, name, hierarchy_level 
      FROM roles 
      ORDER BY hierarchy_level
    `);

    if (roles.length === 0) {
      console.error('❌ ERROR: No roles found in database!');
      console.error('   Please run the seeder first:');
      console.error('   npx sequelize-cli db:seed --seed 20260304000000-seed-roles-and-permissions.js');
      process.exit(1);
    }

    console.log(`✅ Found ${roles.length} roles:`);
    roles.forEach(role => {
      console.log(`   - ${role.name} (level ${role.hierarchy_level})`);
    });
    console.log('');

    // Get student role ID
    const studentRole = roles.find(r => r.name === 'student');
    if (!studentRole) {
      console.error('❌ ERROR: Student role not found!');
      process.exit(1);
    }

    // Step 2: Find users without roles
    console.log('📋 Step 2: Finding users without roles...');
    const [usersWithoutRoles] = await sequelize.query(`
      SELECT id, email, first_name, last_name, created_at
      FROM users
      WHERE role_id IS NULL
      ORDER BY created_at
    `);

    if (usersWithoutRoles.length === 0) {
      console.log('✅ All users already have roles assigned!');
      console.log('   Nothing to do.\n');
      await sequelize.close();
      return;
    }

    console.log(`📊 Found ${usersWithoutRoles.length} users without roles:`);
    usersWithoutRoles.forEach((user, index) => {
      const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'No name';
      console.log(`   ${index + 1}. ${user.email} (${name})`);
    });
    console.log('');

    // Step 3: Assign student role to users
    console.log('📋 Step 3: Assigning student role to users...');
    const [updateResult] = await sequelize.query(`
      UPDATE users
      SET role_id = :studentRoleId
      WHERE role_id IS NULL
    `, {
      replacements: { studentRoleId: studentRole.role_id }
    });

    console.log(`✅ Updated ${usersWithoutRoles.length} users with student role\n`);

    // Step 4: Create role assignments
    console.log('📋 Step 4: Creating role assignments...');
    
    // Check which users don't have active assignments
    const [usersNeedingAssignments] = await sequelize.query(`
      SELECT u.id
      FROM users u
      WHERE u.role_id = :studentRoleId
        AND NOT EXISTS (
          SELECT 1 
          FROM user_role_assignments ura 
          WHERE ura.user_id = u.id 
            AND ura.status = 'active'
        )
    `, {
      replacements: { studentRoleId: studentRole.role_id }
    });

    if (usersNeedingAssignments.length > 0) {
      await sequelize.query(`
        INSERT INTO user_role_assignments (user_id, role_id, assigned_by, assigned_at, status)
        SELECT 
          u.id,
          :studentRoleId,
          NULL,
          NOW(),
          'active'
        FROM users u
        WHERE u.role_id = :studentRoleId
          AND NOT EXISTS (
            SELECT 1 
            FROM user_role_assignments ura 
            WHERE ura.user_id = u.id 
              AND ura.status = 'active'
          )
      `, {
        replacements: { studentRoleId: studentRole.role_id }
      });

      console.log(`✅ Created ${usersNeedingAssignments.length} role assignments\n`);
    } else {
      console.log('✅ All users already have role assignments\n');
    }

    // Step 5: Log in role assignment history
    console.log('📋 Step 5: Logging role assignment history...');
    
    // Check which users don't have history entries
    const [usersNeedingHistory] = await sequelize.query(`
      SELECT u.id
      FROM users u
      WHERE u.role_id = :studentRoleId
        AND NOT EXISTS (
          SELECT 1 
          FROM role_assignment_history rah 
          WHERE rah.user_id = u.id
        )
    `, {
      replacements: { studentRoleId: studentRole.role_id }
    });

    if (usersNeedingHistory.length > 0) {
      await sequelize.query(`
        INSERT INTO role_assignment_history (user_id, previous_role_id, new_role_id, changed_by, changed_at, reason)
        SELECT 
          u.id,
          NULL,
          :studentRoleId,
          NULL,
          NOW(),
          'Migration: Assigned default student role to existing user'
        FROM users u
        WHERE u.role_id = :studentRoleId
          AND NOT EXISTS (
            SELECT 1 
            FROM role_assignment_history rah 
            WHERE rah.user_id = u.id
          )
      `, {
        replacements: { studentRoleId: studentRole.role_id }
      });

      console.log(`✅ Created ${usersNeedingHistory.length} history entries\n`);
    } else {
      console.log('✅ All users already have history entries\n');
    }

    // Step 6: Verification
    console.log('📋 Step 6: Verifying role assignments...');
    const [verificationResults] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN role_id IS NOT NULL THEN 1 ELSE 0 END) as users_with_roles,
        SUM(CASE WHEN role_id IS NULL THEN 1 ELSE 0 END) as users_without_roles
      FROM users
    `);

    const stats = verificationResults[0];
    console.log('📊 Final Statistics:');
    console.log(`   Total users: ${stats.total_users}`);
    console.log(`   Users with roles: ${stats.users_with_roles}`);
    console.log(`   Users without roles: ${stats.users_without_roles}`);
    console.log('');

    if (stats.users_without_roles > 0) {
      console.warn('⚠️  WARNING: Some users still don\'t have roles!');
      console.warn('   Please investigate manually.');
    } else {
      console.log('✅ SUCCESS: All users have been assigned roles!');
    }

    // Show role distribution
    console.log('\n📊 Role Distribution:');
    const [roleDistribution] = await sequelize.query(`
      SELECT 
        r.name as role_name,
        COUNT(u.id) as user_count
      FROM roles r
      LEFT JOIN users u ON r.role_id = u.role_id
      GROUP BY r.role_id, r.name
      ORDER BY r.hierarchy_level
    `);

    roleDistribution.forEach(row => {
      console.log(`   ${row.role_name}: ${row.user_count} users`);
    });

    console.log('\n✅ Role assignment complete!\n');

    await sequelize.close();
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run the script
assignRolesToExistingUsers();
