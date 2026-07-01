/**
 * Diagnostic script to check for learner role mismatches in the database
 * This checks for inconsistencies between the old 'role' field and the new role system
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');

// Database connection
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

async function diagnoseLearnerRoleMismatch() {
  try {
    console.log('🔍 Checking for learner role mismatches...\n');

    // 1. Check users table structure
    console.log('1. Checking users table structure...');
    const [tableInfo] = await sequelize.query(`
      DESCRIBE users;
    `);
    
    const hasRoleColumn = tableInfo.some(col => col.Field === 'role');
    console.log(`   - 'role' column exists: ${hasRoleColumn ? '✓' : '✗'}`);
    
    if (!hasRoleColumn) {
      console.log('   ⚠️  Old role column not found - this is expected if fully migrated');
    }

    // 2. Check for users with 'student' or 'learner' role
    console.log('\n2. Checking for learner users...');
    const [learners] = await sequelize.query(`
      SELECT 
        u.id,
        u.email,
        u.name,
        ${hasRoleColumn ? 'u.role as old_role,' : ''}
        u.email_verified,
        u.created_at
      FROM users u
      ${hasRoleColumn ? "WHERE u.role IN ('student', 'learner')" : ''}
      ORDER BY u.id
      LIMIT 20;
    `);

    console.log(`   Found ${learners.length} learner users`);
    
    if (learners.length > 0) {
      console.log('\n   Sample learners:');
      learners.slice(0, 5).forEach(user => {
        console.log(`   - ID: ${user.id}, Email: ${user.email}, ${hasRoleColumn ? `Old Role: ${user.old_role}, ` : ''}Email Verified: ${user.email_verified}`);
      });
    }

    // 3. Check role system assignments
    console.log('\n3. Checking role system assignments...');
    const [roleAssignments] = await sequelize.query(`
      SELECT 
        u.id,
        u.email,
        ${hasRoleColumn ? 'u.role as old_role,' : ''}
        r.name as assigned_role,
        ura.assigned_at
      FROM users u
      LEFT JOIN user_role_assignments ura ON u.id = ura.user_id
      LEFT JOIN roles r ON ura.role_id = r.id
      ${hasRoleColumn ? "WHERE u.role IN ('student', 'learner')" : ''}
      ORDER BY u.id
      LIMIT 20;
    `);

    console.log(`   Found ${roleAssignments.length} role assignments for learners`);

    // 4. Check for mismatches
    console.log('\n4. Checking for role mismatches...');
    const mismatches = [];
    
    for (const assignment of roleAssignments) {
      if (hasRoleColumn) {
        const oldRole = assignment.old_role;
        const newRole = assignment.assigned_role;
        
        // Check if old role is 'student' or 'learner' but new role is different or missing
        if ((oldRole === 'student' || oldRole === 'learner') && newRole !== 'student') {
          mismatches.push({
            id: assignment.id,
            email: assignment.email,
            oldRole,
            newRole: newRole || 'NONE',
            issue: newRole ? 'Role mismatch' : 'No role assigned in new system'
          });
        }
      } else {
        // If no old role column, just check if they have a role assigned
        if (!assignment.assigned_role) {
          mismatches.push({
            id: assignment.id,
            email: assignment.email,
            oldRole: 'N/A',
            newRole: 'NONE',
            issue: 'No role assigned in role system'
          });
        }
      }
    }

    if (mismatches.length > 0) {
      console.log(`   ⚠️  Found ${mismatches.length} mismatches:`);
      mismatches.forEach(mismatch => {
        console.log(`   - User ${mismatch.id} (${mismatch.email}): ${mismatch.issue}`);
        console.log(`     Old: ${mismatch.oldRole}, New: ${mismatch.newRole}`);
      });
    } else {
      console.log('   ✓ No role mismatches found');
    }

    // 5. Check for users without any role assignment
    console.log('\n5. Checking for users without role assignments...');
    const [usersWithoutRoles] = await sequelize.query(`
      SELECT 
        u.id,
        u.email,
        ${hasRoleColumn ? 'u.role as old_role,' : ''}
        u.created_at
      FROM users u
      LEFT JOIN user_role_assignments ura ON u.id = ura.user_id
      WHERE ura.user_id IS NULL
      ORDER BY u.created_at DESC
      LIMIT 10;
    `);

    if (usersWithoutRoles.length > 0) {
      console.log(`   ⚠️  Found ${usersWithoutRoles.length} users without role assignments:`);
      usersWithoutRoles.forEach(user => {
        console.log(`   - User ${user.id} (${user.email})${hasRoleColumn ? `, Old Role: ${user.old_role}` : ''}`);
      });
    } else {
      console.log('   ✓ All users have role assignments');
    }

    // 6. Check ProfileService query
    console.log('\n6. Checking ProfileService query compatibility...');
    const [profileTest] = await sequelize.query(`
      SELECT 
        u.id,
        u.email,
        u.name,
        u.profile_picture,
        u.email_verified,
        r.name as role
      FROM users u
      LEFT JOIN user_role_assignments ura ON u.id = ura.user_id
      LEFT JOIN roles r ON ura.role_id = r.id
      WHERE u.id = 1
      LIMIT 1;
    `);

    if (profileTest.length > 0) {
      console.log('   ✓ ProfileService query structure is correct');
      console.log(`   Sample result: ID=${profileTest[0].id}, Role=${profileTest[0].role || 'NULL'}`);
    } else {
      console.log('   ⚠️  No users found to test query');
    }

    // 7. Summary and recommendations
    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY AND RECOMMENDATIONS');
    console.log('='.repeat(60));

    if (mismatches.length > 0) {
      console.log('\n⚠️  ISSUES FOUND:');
      console.log(`   - ${mismatches.length} users have role mismatches`);
      console.log('\n   RECOMMENDED ACTION:');
      console.log('   Run the role assignment script to fix mismatches:');
      console.log('   node cohortle-api/scripts/assign-roles-to-existing-users.js');
    }

    if (usersWithoutRoles.length > 0) {
      console.log('\n⚠️  USERS WITHOUT ROLES:');
      console.log(`   - ${usersWithoutRoles.length} users have no role assignments`);
      console.log('\n   RECOMMENDED ACTION:');
      console.log('   These users need to be assigned roles in the role system');
    }

    if (mismatches.length === 0 && usersWithoutRoles.length === 0) {
      console.log('\n✓ NO DATABASE ISSUES FOUND');
      console.log('   All learners have correct role assignments');
      console.log('\n   If learners still get "user not authenticated" errors,');
      console.log('   the issue is likely in the frontend code or environment variables.');
    }

    await sequelize.close();
  } catch (error) {
    console.error('Error diagnosing learner role mismatch:', error);
    process.exit(1);
  }
}

diagnoseLearnerRoleMismatch();
