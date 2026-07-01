/**
 * Test Database Setup Script
 * 
 * This script creates the test database and runs all migrations.
 * Run this before executing property-based tests.
 * 
 * Usage: node __tests__/setup-test-db.js
 */

const mysql = require('mysql2/promise');
const { execSync } = require('child_process');
require('dotenv').config();

const config = {
  host: process.env.DB_HOSTNAME || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'cohortle_test',
  password: process.env.DB_PASSWORD || 'teSTo5Tdh33eG9Ikzwzgk0V7dvKZ4rz0uV2gOHQTKMY6QR4bv7Vba62WQlOZZUYKb0Ta',
};

const testDbName = process.env.DB_TEST_DATABASE || 'cohortle_test';

async function setupTestDatabase() {
  let connection;
  
  try {
    console.log('Connecting to MySQL server...');
    connection = await mysql.createConnection(config);
    
    console.log(`Creating test database: ${testDbName}`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${testDbName}`);
    
    console.log('Test database created successfully.');
    
    await connection.end();
    
    console.log('Running migrations on test database...');
    
    // Set environment to test and run migrations
    const env = {
      ...process.env,
      NODE_ENV: 'test',
      DB_DATABASE: testDbName,
    };
    
    execSync('npx sequelize-cli db:migrate', {
      stdio: 'inherit',
      env,
    });
    
    console.log('✓ Test database setup complete!');
    console.log(`✓ Database: ${testDbName}`);
    console.log('✓ All migrations applied');
    console.log('\nYou can now run property-based tests with: npm run test:pbt');
    
  } catch (error) {
    console.error('Error setting up test database:', error);
    process.exit(1);
  }
}

setupTestDatabase();
