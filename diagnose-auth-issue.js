/**
 * Diagnose Authentication Issues
 * 
 * This script checks:
 * 1. Users table structure (role vs role_id)
 * 2. Sample user data with roles
 * 3. Role assignments
 */

require('dotenv').config({ path: './cohortle-api/.env' });
const { Sequelize } = require('sequelize');

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

async function diagnose() {
  try {
    console.log('🔍 Diagnosing Authentication Issues\n');
    
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Check users table structure
    console.log('📋 Users Table Structure:');
    const [columns] = await sequelize.query(`
      DESCRIBE users
    `);
    
    const hasRoleColumn = columns.some(col => col.Field === 'role');
    const hasRoleIdColumn = columns.some(col => col.Field === 'role_id');
    
    console.log(`   - Has 'role' column: ${hasRoleColumn}`);
    console.log(`   - Has 'role_id' column: ${hasRoleIdColumn}\n`);

    // Check sample users
    console.log('👥 Sample Users (first 5):');
    const [users] = await sequelize.query(`
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.role_id,
        r.name as role_name,
        r.hierarchy_level
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      LIMIT 5
    `);
    
    users.forEach(user => {
      console.log(`   ${user.id}. ${user.email}`);
      console.log(`      role_id: ${user.role_id || 'NULL'}`);
      console.log(`      role_name: ${user.role_name || 'NULL'}`);
      console.log('');
    });

    // Check users without roles
    console.log('⚠️  Users Without Roles:');
    const [usersWithoutRoles] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE role_id IS NULL
    `);
    console.log(`   Count: ${usersWithoutRoles[0].count}\n`);

    // Check role distribution
    console.log('📊 Role Distribution:');
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
    console.log('');

    // Check if there's a 'learner' role
    console.log('🔍 Checking for "learner" role:');
    const [learnerRole] = await sequelize.query(`
      SELECT * FROM roles WHERE name = 'learner'
    `);
    console.log(`   Found: ${learnerRole.length > 0 ? 'YES' : 'NO'}\n`);

    // Check if there's a 'student' role
    console.log('🔍 Checking for "student" role:');
    const [studentRole] = await sequelize.query(`
      SELECT * FROM roles WHERE name = 'student'
    `);
    console.log(`   Found: ${studentRole.length > 0 ? 'YES' : 'NO'}\n`);

    await sequelize.close();
    
    console.log('\n✅ Diagnosis complete!');
    console.log('\n📝 Summary:');
    console.log('   - Users table uses role_id (UUID) to link to roles table');
    console.log('   - Auth code expects user.role (string) which doesn\'t exist');
    console.log('   - Need to join with roles table to get role name');
    console.log('   - Frontend expects "learner" but database has "student"');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

diagnose();
