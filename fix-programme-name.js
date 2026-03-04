/**
 * Script to check and update programme name for enrollment code prog-2026-b88glo
 * 
 * This script will:
 * 1. Find the cohort with enrollment code 'prog-2026-b88glo'
 * 2. Find the programme that cohort belongs to
 * 3. Show current programme name
 * 4. Allow you to update it to the correct name
 */

require('./cohortle-api/node_modules/dotenv').config({ path: './cohortle-api/.env' });
const path = require('path');
const mysql = require('./cohortle-api/node_modules/mysql2/promise');

async function fixProgrammeName() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOSTNAME,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
  });

  try {
    console.log('🔍 Searching for enrollment code: prog-2026-b88glo\n');

    // Find the cohort with this enrollment code
    const [cohorts] = await connection.execute(
      'SELECT id, programme_id, name, enrollment_code FROM cohorts WHERE enrollment_code = ?',
      ['prog-2026-b88glo']
    );

    if (cohorts.length === 0) {
      console.log('❌ No cohort found with enrollment code: prog-2026-b88glo');
      return;
    }

    const cohort = cohorts[0];
    console.log('✅ Found cohort:');
    console.log(`   Cohort ID: ${cohort.id}`);
    console.log(`   Cohort Name: ${cohort.name}`);
    console.log(`   Programme ID: ${cohort.programme_id}`);
    console.log(`   Enrollment Code: ${cohort.enrollment_code}\n`);

    // Find the programme
    const [programmes] = await connection.execute(
      'SELECT id, name, description, status FROM programmes WHERE id = ?',
      [cohort.programme_id]
    );

    if (programmes.length === 0) {
      console.log('❌ No programme found with ID:', cohort.programme_id);
      return;
    }

    const programme = programmes[0];
    console.log('📚 Current Programme Details:');
    console.log(`   Programme ID: ${programme.id}`);
    console.log(`   Current Name: ${programme.name}`);
    console.log(`   Description: ${programme.description || 'N/A'}`);
    console.log(`   Status: ${programme.status}\n`);

    // Check how many cohorts use this programme
    const [cohortCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM cohorts WHERE programme_id = ?',
      [programme.id]
    );
    console.log(`⚠️  This programme has ${cohortCount[0].count} cohort(s) associated with it.`);
    console.log('   Changing the programme name will affect all cohorts.\n');

    // Check how many users are enrolled
    const [userCount] = await connection.execute(
      `SELECT COUNT(DISTINCT e.user_id) as count 
       FROM enrollments e 
       JOIN cohorts c ON e.cohort_id = c.id 
       WHERE c.programme_id = ?`,
      [programme.id]
    );
    console.log(`👥 ${userCount[0].count} user(s) are enrolled in cohorts for this programme.\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📝 To update the programme name, run this SQL command:\n');
    console.log(`UPDATE programmes SET name = 'YOUR_CORRECT_PROGRAMME_NAME' WHERE id = ${programme.id};\n`);
    console.log('Replace YOUR_CORRECT_PROGRAMME_NAME with the actual programme name.');
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

fixProgrammeName();
