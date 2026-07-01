/**
 * Verify Role System Setup
 * 
 * This script verifies that the role system is properly set up:
 * - Roles exist
 * - Permissions exist
 * - Role-permission mappings exist
 * - All users have roles
 * - Role assignments are correct
 * - History is being tracked
 * 
 * Usage:
 *   node scripts/verify-role-system.js
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

async function verifyRoleSystem() {
  let allChecksPass = true;

  try {
    console.log('🔍 Role System Verification\n');
    console.log('=' .repeat(60));
    console.log('');

    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Check 1: Roles
    console.log('📋 Check 1: Roles');
    console.log('-'.repeat(60));
    const [roles] = await sequelize.query(`
      SELECT role_id, name, description, hierarchy_level, created_at
      FROM roles
      ORDER BY hierarchy_level
    `);

    if (roles.length === 0) {
      console.error('❌ FAIL: No roles found!');
      allChecksPass = false;
    } else {
      console.log(`✅ PASS: Found ${roles.length} roles`);
      roles.forEach(role => {
        console.log(`   - ${role.name} (level ${role.hierarchy_level})`);
      });
    }
    console.log('');

    // Check 2: Permissions
    console.log('📋 Check 2: Permissions');
    console.log('-'.repeat(60));
    const [permissions] = await sequelize.query(`
      SELECT COUNT(*) as count FROM permissions
    `);

    const permissionCount = permissions[0].count;
    if (permissionCount === 0) {
      console.error('❌ FAIL: No permissions found!');
      allChecksPass = false;
    } else {
      console.log(`✅ PASS: Found ${permissionCount} permissions`);
      
      // Show permissions by resource type
      const [permsByType] = await sequelize.query(`
        SELECT resource_type, COUNT(*) as count
        FROM permissions
        GROUP BY resource_type
        ORDER BY resource_type
      `);
      
      permsByType.forEach(row => {
        console.log(`   - ${row.resource_type}: ${row.count} permissions`);
      });
    }
    console.log('');

    // Check 3: Role-Permission Mappings
    console.log('📋 Check 3: Role-Permission Mappings');
    console.log('-'.repeat(60));
    const [mappings] = await sequelize.query(`
      SELECT 
        r.name as role_name,
        COUNT(rp.permission_id) as permission_count
      FROM roles r
      LEFT JOIN role_permissions rp ON r.role_id = rp.role_id
      GROUP BY r.role_id, r.name
      ORDER BY r.hierarchy_level
    `);

    let mappingsFail = false;
    mappings.forEach(row => {
      if (row.permission_count === 0) {
        console.error(`❌ FAIL: Role '${row.role_name}' has no permissions!`);
        mappingsFail = true;
        allChecksPass = false;
      } else {
        console.log(`✅ ${row.role_name}: ${row.permission_count} permissions`);
      }
    });

    if (!mappingsFail) {
      console.log('✅ PASS: All roles have permissions');
    }
    console.log('');

    // Check 4: Users with Roles
    console.log('📋 Check 4: Users with Roles');
    console.log('-'.repeat(60));
    const [userStats] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN role_id IS NOT NULL THEN 1 ELSE 0 END) as users_with_roles,
        SUM(CASE WHEN role_id IS NULL THEN 1 ELSE 0 END) as users_without_roles
      FROM users
    `);

    const stats = userStats[0];
    console.log(`   Total users: ${stats.total_users}`);
    console.log(`   Users with roles: ${stats.users_with_roles}`);
    console.log(`   Users without roles: ${stats.users_without_roles}`);

    if (stats.users_without_roles > 0) {
      console.error(`❌ FAIL: ${stats.users_without_roles} users don't have roles!`);
      allChecksPass = false;
    } else {
      console.log('✅ PASS: All users have roles');
    }
    console.log('');

    // Check 5: Role Distribution
    console.log('📋 Check 5: Role Distribution');
    console.log('-'.repeat(60));
    const [roleDistribution] = await sequelize.query(`
      SELECT 
        r.name as role_name,
        COUNT(u.user_id) as user_count
      FROM roles r
      LEFT JOIN users u ON r.role_id = u.role_id
      GROUP BY r.role_id, r.name
      ORDER BY r.hierarchy_level
    `);

    let hasAdmin = false;
    roleDistribution.forEach(row => {
      console.log(`   ${row.role_name}: ${row.user_count} users`);
      if (row.role_name === 'administrator' && row.user_count > 0) {
        hasAdmin = true;
      }
    });

    if (!hasAdmin) {
      console.warn('⚠️  WARNING: No administrators found!');
      console.warn('   You should create at least one administrator.');
      allChecksPass = false;
    } else {
      console.log('✅ PASS: At least one administrator exists');
    }
    console.log('');

    // Check 6: Role Assignments
    console.log('📋 Check 6: Role Assignments');
    console.log('-'.repeat(60));
    const [assignmentStats] = await sequelize.query(`
      SELECT 
        COUNT(DISTINCT user_id) as users_with_assignments,
        COUNT(*) as total_assignments,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_assignments,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_assignments
      FROM user_role_assignments
    `);

    const assignStats = assignmentStats[0];
    console.log(`   Users with assignments: ${assignStats.users_with_assignments}`);
    console.log(`   Total assignments: ${assignStats.total_assignments}`);
    console.log(`   Active assignments: ${assignStats.active_assignments}`);
    console.log(`   Inactive assignments: ${assignStats.inactive_assignments}`);

    // Check for users without active assignments
    const [usersWithoutAssignments] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM users u
      WHERE NOT EXISTS (
        SELECT 1 
        FROM user_role_assignments ura 
        WHERE ura.user_id = u.user_id 
          AND ura.status = 'active'
      )
    `);

    if (usersWithoutAssignments[0].count > 0) {
      console.warn(`⚠️  WARNING: ${usersWithoutAssignments[0].count} users don't have active role assignments!`);
      allChecksPass = false;
    } else {
      console.log('✅ PASS: All users have active role assignments');
    }
    console.log('');

    // Check 7: Role Assignment History
    console.log('📋 Check 7: Role Assignment History');
    console.log('-'.repeat(60));
    const [historyStats] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_history_entries,
        COUNT(DISTINCT user_id) as users_with_history
      FROM role_assignment_history
    `);

    const histStats = historyStats[0];
    console.log(`   Total history entries: ${histStats.total_history_entries}`);
    console.log(`   Users with history: ${histStats.users_with_history}`);

    if (histStats.total_history_entries === 0) {
      console.warn('⚠️  WARNING: No role assignment history found!');
      console.warn('   History tracking may not be working.');
    } else {
      console.log('✅ PASS: Role assignment history is being tracked');
    }
    console.log('');

    // Check 8: Data Integrity
    console.log('📋 Check 8: Data Integrity');
    console.log('-'.repeat(60));
    
    // Check for orphaned role assignments
    const [orphanedAssignments] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM user_role_assignments ura
      WHERE NOT EXISTS (
        SELECT 1 FROM users u WHERE u.user_id = ura.user_id
      )
    `);

    if (orphanedAssignments[0].count > 0) {
      console.error(`❌ FAIL: ${orphanedAssignments[0].count} orphaned role assignments found!`);
      allChecksPass = false;
    } else {
      console.log('✅ PASS: No orphaned role assignments');
    }

    // Check for mismatched roles
    const [mismatchedRoles] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM users u
      JOIN user_role_assignments ura ON u.user_id = ura.user_id
      WHERE ura.status = 'active'
        AND u.role_id != ura.role_id
    `);

    if (mismatchedRoles[0].count > 0) {
      console.error(`❌ FAIL: ${mismatchedRoles[0].count} users have mismatched roles!`);
      allChecksPass = false;
    } else {
      console.log('✅ PASS: No mismatched roles');
    }
    console.log('');

    // Final Summary
    console.log('=' .repeat(60));
    console.log('');
    if (allChecksPass) {
      console.log('✅ ALL CHECKS PASSED!');
      console.log('   Role system is properly configured.\n');
    } else {
      console.error('❌ SOME CHECKS FAILED!');
      console.error('   Please review the errors above and fix them.\n');
      process.exit(1);
    }

    await sequelize.close();
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run the script
verifyRoleSystem();
