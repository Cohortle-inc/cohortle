/**
 * Test Backend-Frontend Database Connection
 * 
 * This script tests if the backend test database is properly configured
 * and accessible from both the backend and frontend test environments.
 */

const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, 'cohortle-api', '.env') });

// Backend test database configuration
const backendTestConfig = {
  host: process.env.DB_HOSTNAME || '107.175.94.134',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'cohortle_test',
  password: process.env.DB_PASSWORD || 'teSTo5Tdh33eG9Ikzwzgk0V7dvKZ4rz0uV2gOHQTKMY6QR4bv7Vba62WQlOZZUYKb0Ta',
  database: process.env.DB_TEST_DATABASE || 'cohortle_test',
};

async function testBackendDatabase() {
  console.log('\n=== Testing Backend Test Database ===\n');
  
  let connection;
  try {
    console.log('Configuration:');
    console.log(`  Host: ${backendTestConfig.host}`);
    console.log(`  Port: ${backendTestConfig.port}`);
    console.log(`  User: ${backendTestConfig.user}`);
    console.log(`  Database: ${backendTestConfig.database}`);
    console.log('\nConnecting to database...');
    
    connection = await mysql.createConnection(backendTestConfig);
    console.log('✓ Successfully connected to test database\n');
    
    // Check if database exists
    const [databases] = await connection.query('SHOW DATABASES LIKE ?', [backendTestConfig.database]);
    if (databases.length === 0) {
      console.log('✗ Test database does not exist');
      console.log(`\nTo create it, run: node cohortle-api/__tests__/setup-test-db.js`);
      return false;
    }
    console.log('✓ Test database exists\n');
    
    // Check tables
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`Found ${tables.length} tables:`);
    
    if (tables.length === 0) {
      console.log('✗ No tables found - migrations may not have been run');
      console.log(`\nTo run migrations, execute:`);
      console.log(`  cd cohortle-api`);
      console.log(`  NODE_ENV=test npm run migrate`);
      return false;
    }
    
    // List key tables
    const tableNames = tables.map(t => Object.values(t)[0]);
    const keyTables = ['users', 'programmes', 'cohorts', 'weeks', 'wlimp_lessons', 'wlimp_enrollments'];
    const foundKeyTables = keyTables.filter(t => tableNames.includes(t));
    
    console.log('\nKey WLIMP tables:');
    keyTables.forEach(table => {
      const exists = tableNames.includes(table);
      console.log(`  ${exists ? '✓' : '✗'} ${table}`);
    });
    
    // Check for test data
    console.log('\nChecking for test data:');
    
    const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
    console.log(`  Users: ${users[0].count}`);
    
    if (tableNames.includes('programmes')) {
      const [programmes] = await connection.query('SELECT COUNT(*) as count FROM programmes');
      console.log(`  Programmes: ${programmes[0].count}`);
    }
    
    if (tableNames.includes('cohorts')) {
      const [cohorts] = await connection.query('SELECT COUNT(*) as count FROM cohorts');
      console.log(`  Cohorts: ${cohorts[0].count}`);
    }
    
    if (tableNames.includes('wlimp_lessons')) {
      const [lessons] = await connection.query('SELECT COUNT(*) as count FROM wlimp_lessons');
      console.log(`  WLIMP Lessons: ${lessons[0].count}`);
    }
    
    console.log('\n✓ Backend test database is properly configured!\n');
    return true;
    
  } catch (error) {
    console.error('\n✗ Error connecting to test database:');
    console.error(`  ${error.message}\n`);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('Possible issues:');
      console.log('  1. MySQL server is not running');
      console.log('  2. Host/port configuration is incorrect');
      console.log('  3. Firewall is blocking the connection');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('Possible issues:');
      console.log('  1. Username or password is incorrect');
      console.log('  2. User does not have access to the database');
      console.log('  3. User does not exist');
    }
    
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function testBackendAPI() {
  console.log('\n=== Testing Backend API ===\n');
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  console.log(`API URL: ${apiUrl}`);
  
  try {
    // Test if backend is running
    const response = await fetch(`${apiUrl}/health`).catch(() => null);
    
    if (!response) {
      console.log('✗ Backend API is not running\n');
      console.log('To start the backend:');
      console.log('  cd cohortle-api');
      console.log('  npm start');
      return false;
    }
    
    if (response.ok) {
      console.log('✓ Backend API is running and healthy\n');
      return true;
    } else {
      console.log(`✗ Backend API returned status: ${response.status}\n`);
      return false;
    }
  } catch (error) {
    console.log('✗ Cannot connect to backend API');
    console.log(`  Error: ${error.message}\n`);
    return false;
  }
}

async function testFrontendConfig() {
  console.log('\n=== Testing Frontend Configuration ===\n');
  
  const fs = require('fs');
  
  // Check if .env.local exists
  const envLocalPath = path.join(__dirname, 'cohortle-web', '.env.local');
  const envExamplePath = path.join(__dirname, 'cohortle-web', '.env.example');
  
  if (fs.existsSync(envLocalPath)) {
    console.log('✓ .env.local exists');
    
    const envContent = fs.readFileSync(envLocalPath, 'utf8');
    const apiUrlMatch = envContent.match(/NEXT_PUBLIC_API_URL=(.+)/);
    
    if (apiUrlMatch) {
      console.log(`✓ NEXT_PUBLIC_API_URL is configured: ${apiUrlMatch[1]}`);
    } else {
      console.log('✗ NEXT_PUBLIC_API_URL is not set in .env.local');
    }
  } else {
    console.log('✗ .env.local does not exist');
    console.log('\nTo create it:');
    console.log('  cd cohortle-web');
    console.log('  cp .env.example .env.local');
    console.log('  # Edit .env.local and set NEXT_PUBLIC_API_URL=http://localhost:3001');
  }
  
  // Check Jest configuration
  const jestConfigPath = path.join(__dirname, 'cohortle-web', 'jest.config.js');
  if (fs.existsSync(jestConfigPath)) {
    console.log('✓ Jest configuration exists');
  } else {
    console.log('✗ Jest configuration not found');
  }
  
  console.log('');
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Backend-Frontend Test Database Connection Verification   ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  const dbOk = await testBackendDatabase();
  const apiOk = await testBackendAPI();
  await testFrontendConfig();
  
  console.log('\n=== Summary ===\n');
  console.log(`Backend Test Database: ${dbOk ? '✓ OK' : '✗ NEEDS SETUP'}`);
  console.log(`Backend API: ${apiOk ? '✓ RUNNING' : '✗ NOT RUNNING'}`);
  
  if (dbOk && apiOk) {
    console.log('\n✓ All systems ready for integration testing!\n');
    console.log('Next steps:');
    console.log('  1. Run backend tests: cd cohortle-api && npm test');
    console.log('  2. Run frontend tests: cd cohortle-web && npm test');
    console.log('  3. Run integration tests (manual): Follow INTEGRATION_TESTING_GUIDE.md');
  } else {
    console.log('\n✗ Setup required before testing\n');
    console.log('Follow the instructions above to resolve issues.');
  }
  
  process.exit(dbOk && apiOk ? 0 : 1);
}

main();
