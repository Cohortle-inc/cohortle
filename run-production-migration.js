/**
 * Run Production Migration Script
 * 
 * This script connects to the production database and runs the
 * cohort-programme foreign key constraint migration.
 * 
 * Usage: node run-production-migration.js
 */

require('./cohortle-api/node_modules/dotenv').config({ path: './cohortle-api/.env' });
const path = require('path');

// Use the Sequelize CLI to run migrations
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function runMigration() {
  console.log('');
  console.log('========================================');
  console.log(' Production Migration Runner');
  console.log('========================================');
  console.log('');
  
  console.log('📋 Configuration:');
  console.log(`   Database: ${process.env.DB_DATABASE}`);
  console.log(`   Host: ${process.env.DB_HOSTNAME}`);
  console.log(`   Port: ${process.env.DB_PORT || 3306}`);
  console.log('');
  
  console.log('⚠️  WARNING: This will run migrations on PRODUCTION database!');
  console.log('');
  console.log('Press Ctrl+C within 5 seconds to cancel...');
  console.log('');
  
  // Wait 5 seconds
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('🚀 Starting migration...');
  console.log('');
  
  try {
    const { stdout, stderr } = await execPromise('npm run migrate', {
      cwd: path.join(__dirname, 'cohortle-api'),
      env: process.env
    });
    
    console.log(stdout);
    
    if (stderr && !stderr.includes('DeprecationWarning')) {
      console.error('⚠️  Warnings:', stderr);
    }
    
    console.log('');
    console.log('✅ Migration completed successfully!');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('❌ Migration failed!');
    console.error('');
    console.error('Error:', error.message);
    console.error('');
    
    if (error.stdout) {
      console.error('Output:', error.stdout);
    }
    
    if (error.stderr) {
      console.error('Error details:', error.stderr);
    }
    
    console.error('');
    console.error('Possible issues:');
    console.error('  1. Database connection failed');
    console.error('  2. Orphaned cohorts exist (cohorts with invalid programme_id)');
    console.error('  3. Foreign key constraint already exists');
    console.error('  4. Database permissions issue');
    console.error('');
    
    process.exit(1);
  }
}

// Run the migration
runMigration().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
