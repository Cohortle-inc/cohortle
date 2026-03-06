const mysql = require('mysql2/promise');
require('dotenv').config({ path: './cohortle-api/.env' });

async function checkConveners() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });

  try {
    console.log('Checking for conveners in production database...\n');

    // Check users table for convener role
    const [users] = await connection.execute(
      'SELECT id, email, first_name, last_name, role, created_at FROM users WHERE role = ?',
      ['convener']
    );

    console.log(`Found ${users.length} convener(s) in users table:`);
    if (users.length > 0) {
      users.forEach(user => {
        console.log(`  - ${user.email} (${user.first_name} ${user.last_name}) - ID: ${user.id}`);
        console.log(`    Created: ${user.created_at}`);
      });
    } else {
      console.log('  No conveners found with role="convener" in users table');
    }

    console.log('\n---\n');

    // Check user_role_assignments table
    const [roleAssignments] = await connection.execute(`
      SELECT ura.user_id, u.email, u.first_name, u.last_name, r.name as role_name, ura.assigned_at
      FROM user_role_assignments ura
      JOIN users u ON ura.user_id = u.id
      JOIN roles r ON ura.role_id = r.id
      WHERE r.name = 'convener'
    `);

    console.log(`Found ${roleAssignments.length} convener(s) in user_role_assignments table:`);
    if (roleAssignments.length > 0) {
      roleAssignments.forEach(assignment => {
        console.log(`  - ${assignment.email} (${assignment.first_name} ${assignment.last_name})`);
        console.log(`    User ID: ${assignment.user_id}, Assigned: ${assignment.assigned_at}`);
      });
    } else {
      console.log('  No conveners found in user_role_assignments table');
    }

    console.log('\n---\n');

    // Check all users
    const [allUsers] = await connection.execute(
      'SELECT id, email, first_name, last_name, role, created_at FROM users ORDER BY created_at DESC LIMIT 10'
    );

    console.log(`Recent users (last 10):`);
    allUsers.forEach(user => {
      console.log(`  - ${user.email} - Role: ${user.role || 'NULL'} - ID: ${user.id}`);
    });

  } catch (error) {
    console.error('Error checking conveners:', error);
  } finally {
    await connection.end();
  }
}

checkConveners();
