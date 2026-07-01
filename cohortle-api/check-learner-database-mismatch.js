/**
 * Check for database mismatches that could cause "user not authenticated" errors for learners
 * This script verifies:
 * 1. Users have proper role assignments in the new role system
 * 2. No orphaned users without roles
 * 3. Role system consistency
 */

const mysql = require('mysql2/promise');

async function checkLearnerDatabaseMismatch() {
  let connection;
  
  try {
    // Connect to production database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'cohortle_db',
      port: process.env.DB_PORT || 3306
    });

    console.log('🔍 Checking for learner database mismatches...\n');

    // 1. Check users without role assignments
    console.log('1. Checking users without role assignments:');
    const [usersWithoutRoles] = await connection.execute(`
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.created_at
      FROM users u
      LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
      WHERE ura.user_id IS NULL
      ORDER BY u.created_at DESC
      LIMIT 20
    `);

    if (usersWithoutRoles.length > 0) {
      console.log(`❌ Found ${usersWithoutRoles.length} users without role assignments:`);
      usersWithoutRoles.forEach(user => {
        console.log(`   - ID: ${user.id}, Email: ${user.email}, Name: ${user.first_name} ${user.last_name}`);
      });
    } else {
      console.log('✅ All users have role assignments');
    }

    // 2. Check role assignment consistency
    console.log('\n2. Checking role assignment consistency:');
    const [roleStats] = await connection.execute(`
      SELECT 
        r.name as role_name,
        COUNT(ura.user_id) as user_count
      FROM roles r
      LEFT JOIN user_role_assignments ura ON r.id = ura.role_id AND ura.status = 'active'
      GROUP BY r.id, r.name
      ORDER BY user_count DESC
    `);

    console.log('Role distribution:');
    roleStats.forEach(stat => {
      console.log(`   - ${stat.role_name}: ${stat.user_count} users`);
    });

    // 3. Check for duplicate role assignments
    console.log('\n3. Checking for duplicate role assignments:');
    const [duplicateRoles] = await connection.execute(`
      SELECT 
        user_id,
        COUNT(*) as assignment_count
      FROM user_role_assignments 
      WHERE status = 'active'
      GROUP BY user_id
      HAVING COUNT(*) > 1
    `);

    if (duplicateRoles.length > 0) {
      console.log(`❌ Found ${duplicateRoles.length} users with multiple active role assignments:`);
      duplicateRoles.forEach(dup => {
        console.log(`   - User ID: ${dup.user_id}, Active assignments: ${dup.assignment_count}`);
      });
    } else {
      console.log('✅ No duplicate role assignments found');
    }

    // 4. Check specific learner accounts that might be having issues
    console.log('\n4. Checking recent learner accounts:');
    const [recentLearners] = await connection.execute(`
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        r.name as role_name,
        ura.assigned_at,
        u.email_verified
      FROM users u
      LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
      LEFT JOIN roles r ON ura.role_id = r.id
      WHERE u.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      ORDER BY u.created_at DESC
      LIMIT 10
    `);

    console.log('Recent users (last 7 days):');
    recentLearners.forEach(user => {
      const status = user.role_name ? '✅' : '❌';
      const verified = user.email_verified ? '✅' : '❌';
      console.log(`   ${status} ID: ${user.id}, Email: ${user.email}, Role: ${user.role_name || 'NONE'}, Verified: ${verified}`);
    });

    // 5. Check for authentication-related issues
    console.log('\n5. Checking authentication-related data:');
    const [authStats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN email_verified = 1 THEN 1 ELSE 0 END) as verified_users,
        SUM(CASE WHEN ura.user_id IS NOT NULL THEN 1 ELSE 0 END) as users_with_roles
      FROM users u
      LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
    `);

    const stats = authStats[0];
    console.log(`Total users: ${stats.total_users}`);
    console.log(`Verified users: ${stats.verified_users} (${((stats.verified_users / stats.total_users) * 100).toFixed(1)}%)`);
    console.log(`Users with roles: ${stats.users_with_roles} (${((stats.users_with_roles / stats.total_users) * 100).toFixed(1)}%)`);

    // 6. Generate fix script if needed
    if (usersWithoutRoles.length > 0) {
      console.log('\n🔧 RECOMMENDED FIX:');
      console.log('Run the following SQL to assign student role to users without roles:');
      console.log(`
INSERT INTO user_role_assignments (user_id, role_id, assigned_by, assigned_at, status)
SELECT 
  u.id,
  (SELECT id FROM roles WHERE name = 'student' LIMIT 1),
  1,
  NOW(),
  'active'
FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
WHERE ura.user_id IS NULL;
      `);
    }

    console.log('\n✅ Database mismatch check complete!');

  } catch (error) {
    console.error('❌ Error checking database:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the check
checkLearnerDatabaseMismatch().catch(console.error);