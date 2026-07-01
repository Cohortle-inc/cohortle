/**
 * Database Role System Diagnostic Script
 * Checks the integrity of the role system in the database
 */

const db = require('./models');
require('dotenv').config();

async function runDiagnostics() {
  console.log('='.repeat(60));
  console.log('DATABASE ROLE SYSTEM DIAGNOSTICS');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Test 1: Check database connection
    console.log('Test 1: Database Connection');
    console.log('-'.repeat(60));
    await db.sequelize.authenticate();
    console.log('✓ Database connection successful');
    console.log('');

    // Test 2: Check roles table
    console.log('Test 2: Roles Table');
    console.log('-'.repeat(60));
    const roles = await db.roles.findAll({
      attributes: ['role_id', 'name', 'description'],
      raw: true
    });
    console.log(`Found ${roles.length} roles:`);
    roles.forEach(role => {
      console.log(`  - ${role.name} (${role.role_id})`);
    });
    console.log('');

    // Test 3: Check total users
    console.log('Test 3: Total Users');
    console.log('-'.repeat(60));
    const totalUsers = await db.users.count();
    console.log(`Total users in database: ${totalUsers}`);
    console.log('');

    // Test 4: Check users with role assignments
    console.log('Test 4: Users with Role Assignments');
    console.log('-'.repeat(60));
    const usersWithRoles = await db.sequelize.query(`
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        r.name as role,
        ura.assigned_at,
        ura.status
      FROM users u
      INNER JOIN user_role_assignments ura ON u.id = ura.user_id
      INNER JOIN roles r ON ura.role_id = r.role_id
      WHERE ura.status = 'active'
      ORDER BY u.id DESC
      LIMIT 10
    `, { type: db.sequelize.QueryTypes.SELECT });

    console.log(`Users with active role assignments: ${usersWithRoles.length}`);
    usersWithRoles.forEach(user => {
      console.log(`  - ${user.email} (ID: ${user.id}) → ${user.role} (assigned: ${user.assigned_at})`);
    });
    console.log('');

    // Test 5: Check users WITHOUT role assignments
    console.log('Test 5: Users WITHOUT Role Assignments');
    console.log('-'.repeat(60));
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
      ORDER BY u.id DESC
    `, { type: db.sequelize.QueryTypes.SELECT });

    if (usersWithoutRoles.length > 0) {
      console.log(`⚠ WARNING: Found ${usersWithoutRoles.length} users without role assignments:`);
      usersWithoutRoles.forEach(user => {
        console.log(`  - ${user.email} (ID: ${user.id}) - created: ${user.created_at}`);
      });
      console.log('');
      console.log('These users need role assignments!');
    } else {
      console.log('✓ All users have role assignments');
    }
    console.log('');

    // Test 6: Role distribution
    console.log('Test 6: Role Distribution');
    console.log('-'.repeat(60));
    const roleDistribution = await db.sequelize.query(`
      SELECT 
        r.name as role,
        COUNT(ura.id) as user_count
      FROM roles r
      LEFT JOIN user_role_assignments ura ON r.role_id = ura.role_id AND ura.status = 'active'
      GROUP BY r.name
      ORDER BY user_count DESC
    `, { type: db.sequelize.QueryTypes.SELECT });

    console.log('Role distribution:');
    roleDistribution.forEach(dist => {
      console.log(`  - ${dist.role}: ${dist.user_count} users`);
    });
    console.log('');

    // Test 7: Check for duplicate active role assignments
    console.log('Test 7: Duplicate Active Role Assignments');
    console.log('-'.repeat(60));
    const duplicateRoles = await db.sequelize.query(`
      SELECT 
        user_id,
        COUNT(*) as assignment_count
      FROM user_role_assignments
      WHERE status = 'active'
      GROUP BY user_id
      HAVING COUNT(*) > 1
    `, { type: db.sequelize.QueryTypes.SELECT });

    if (duplicateRoles.length > 0) {
      console.log(`⚠ WARNING: Found ${duplicateRoles.length} users with multiple active role assignments:`);
      for (const dup of duplicateRoles) {
        const user = await db.users.findByPk(dup.user_id, {
          attributes: ['email'],
          raw: true
        });
        console.log(`  - User ID ${dup.user_id} (${user?.email}): ${dup.assignment_count} active assignments`);
      }
    } else {
      console.log('✓ No duplicate active role assignments found');
    }
    console.log('');

    // Test 8: Check recent registrations
    console.log('Test 8: Recent Registrations (Last 10)');
    console.log('-'.repeat(60));
    const recentUsers = await db.sequelize.query(`
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.created_at,
        r.name as role,
        ura.assigned_at
      FROM users u
      LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
      LEFT JOIN roles r ON ura.role_id = r.role_id
      ORDER BY u.created_at DESC
      LIMIT 10
    `, { type: db.sequelize.QueryTypes.SELECT });

    console.log('Recent registrations:');
    recentUsers.forEach(user => {
      const roleInfo = user.role ? `${user.role}` : 'NO ROLE';
      console.log(`  - ${user.email} (ID: ${user.id}) → ${roleInfo} (registered: ${user.created_at})`);
    });
    console.log('');

    // Test 9: Check email verification status
    console.log('Test 9: Email Verification Status');
    console.log('-'.repeat(60));
    const verificationStats = await db.sequelize.query(`
      SELECT 
        email_verified,
        COUNT(*) as user_count
      FROM users
      GROUP BY email_verified
    `, { type: db.sequelize.QueryTypes.SELECT });

    console.log('Email verification distribution:');
    verificationStats.forEach(stat => {
      const status = stat.email_verified === 1 ? 'Verified' : 'Not Verified';
      console.log(`  - ${status}: ${stat.user_count} users`);
    });
    console.log('');

    // Test 10: Check for users with old role_id column (if it exists)
    console.log('Test 10: Check Old role_id Column');
    console.log('-'.repeat(60));
    try {
      const usersWithOldRoleId = await db.sequelize.query(`
        SELECT 
          id,
          email,
          role_id
        FROM users
        WHERE role_id IS NOT NULL
        LIMIT 10
      `, { type: db.sequelize.QueryTypes.SELECT });

      if (usersWithOldRoleId.length > 0) {
        console.log(`⚠ WARNING: Found ${usersWithOldRoleId.length} users with old role_id column populated`);
        console.log('This column is deprecated and should not be used');
      } else {
        console.log('✓ No users using old role_id column');
      }
    } catch (error) {
      if (error.message.includes('Unknown column')) {
        console.log('✓ Old role_id column does not exist (good)');
      } else {
        console.log(`⚠ Could not check old role_id column: ${error.message}`);
      }
    }
    console.log('');

    // Test 11: Verify referential integrity - role_id foreign keys
    console.log('Test 11: Referential Integrity - role_id Foreign Keys');
    console.log('-'.repeat(60));
    const orphanedRoleAssignments = await db.sequelize.query(`
      SELECT 
        ura.id,
        ura.user_id,
        ura.role_id,
        ura.status
      FROM user_role_assignments ura
      LEFT JOIN roles r ON ura.role_id = r.role_id
      WHERE r.role_id IS NULL
    `, { type: db.sequelize.QueryTypes.SELECT });

    if (orphanedRoleAssignments.length > 0) {
      console.log(`⚠ WARNING: Found ${orphanedRoleAssignments.length} role assignments with invalid role_id:`);
      orphanedRoleAssignments.forEach(assignment => {
        console.log(`  - Assignment ID ${assignment.id}: user_id=${assignment.user_id}, role_id=${assignment.role_id} (INVALID)`);
      });
    } else {
      console.log('✓ All role assignments have valid role_id foreign keys');
    }
    console.log('');

    // Test 12: Verify referential integrity - user_id foreign keys
    console.log('Test 12: Referential Integrity - user_id Foreign Keys');
    console.log('-'.repeat(60));
    const orphanedUserAssignments = await db.sequelize.query(`
      SELECT 
        ura.id,
        ura.user_id,
        ura.role_id,
        ura.status
      FROM user_role_assignments ura
      LEFT JOIN users u ON ura.user_id = u.id
      WHERE u.id IS NULL
    `, { type: db.sequelize.QueryTypes.SELECT });

    if (orphanedUserAssignments.length > 0) {
      console.log(`⚠ WARNING: Found ${orphanedUserAssignments.length} role assignments with invalid user_id:`);
      orphanedUserAssignments.forEach(assignment => {
        console.log(`  - Assignment ID ${assignment.id}: user_id=${assignment.user_id} (INVALID), role_id=${assignment.role_id}`);
      });
    } else {
      console.log('✓ All role assignments have valid user_id foreign keys');
    }
    console.log('');

    // Test 13: Check for inactive role assignments
    console.log('Test 13: Inactive Role Assignments');
    console.log('-'.repeat(60));
    const inactiveAssignments = await db.sequelize.query(`
      SELECT 
        u.id,
        u.email,
        r.name as role,
        ura.status,
        ura.assigned_at
      FROM user_role_assignments ura
      INNER JOIN users u ON ura.user_id = u.id
      INNER JOIN roles r ON ura.role_id = r.role_id
      WHERE ura.status = 'inactive'
      ORDER BY ura.assigned_at DESC
      LIMIT 10
    `, { type: db.sequelize.QueryTypes.SELECT });

    if (inactiveAssignments.length > 0) {
      console.log(`Found ${inactiveAssignments.length} inactive role assignments (showing first 10):`);
      inactiveAssignments.forEach(assignment => {
        console.log(`  - ${assignment.email} (ID: ${assignment.id}) → ${assignment.role} (status: ${assignment.status})`);
      });
    } else {
      console.log('✓ No inactive role assignments found');
    }
    console.log('');

    // Test 14: Check role assignment timestamps
    console.log('Test 14: Role Assignment Timestamps');
    console.log('-'.repeat(60));
    const assignmentTimestamps = await db.sequelize.query(`
      SELECT 
        u.id,
        u.email,
        u.created_at as user_created,
        ura.assigned_at as role_assigned,
        TIMESTAMPDIFF(SECOND, u.created_at, ura.assigned_at) as delay_seconds
      FROM users u
      INNER JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
      WHERE TIMESTAMPDIFF(SECOND, u.created_at, ura.assigned_at) > 5
      ORDER BY delay_seconds DESC
      LIMIT 10
    `, { type: db.sequelize.QueryTypes.SELECT });

    if (assignmentTimestamps.length > 0) {
      console.log(`⚠ Found ${assignmentTimestamps.length} users with delayed role assignment (>5 seconds):`);
      assignmentTimestamps.forEach(user => {
        console.log(`  - ${user.email} (ID: ${user.id}): ${user.delay_seconds}s delay`);
      });
      console.log('Note: Delays may indicate role assignment is not happening in same transaction');
    } else {
      console.log('✓ All role assignments happened within 5 seconds of user creation');
    }
    console.log('');

    // Summary
    console.log('='.repeat(60));
    console.log('DIAGNOSTIC SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total users: ${totalUsers}`);
    console.log(`Users with roles: ${usersWithRoles.length}`);
    console.log(`Users without roles: ${usersWithoutRoles.length}`);
    console.log(`Duplicate role assignments: ${duplicateRoles.length}`);
    console.log(`Orphaned role_id foreign keys: ${orphanedRoleAssignments.length}`);
    console.log(`Orphaned user_id foreign keys: ${orphanedUserAssignments.length}`);
    console.log(`Inactive assignments: ${inactiveAssignments.length}`);
    console.log(`Delayed role assignments (>5s): ${assignmentTimestamps.length}`);
    console.log('');

    const hasIssues = usersWithoutRoles.length > 0 || 
                      duplicateRoles.length > 0 || 
                      orphanedRoleAssignments.length > 0 || 
                      orphanedUserAssignments.length > 0;

    if (usersWithoutRoles.length > 0) {
      console.log('⚠ ACTION REQUIRED: Assign roles to users without assignments');
      console.log('Run the fix script: node cohortle-api/scripts/fix-users-without-roles.js');
    } else if (duplicateRoles.length > 0) {
      console.log('⚠ ACTION REQUIRED: Fix duplicate role assignments');
      console.log('Manual intervention may be needed to resolve duplicates');
    } else if (orphanedRoleAssignments.length > 0 || orphanedUserAssignments.length > 0) {
      console.log('⚠ ACTION REQUIRED: Fix referential integrity issues');
      console.log('Database has orphaned records that need cleanup');
    } else if (assignmentTimestamps.length > 0) {
      console.log('⚠ WARNING: Some role assignments are delayed');
      console.log('Consider wrapping user creation and role assignment in a transaction');
    } else {
      console.log('✓ Database role system is healthy');
    }
    console.log('');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Error running diagnostics:', error);
    console.error(error.stack);
  } finally {
    await db.sequelize.close();
  }
}

// Run diagnostics
runDiagnostics();
