/**
 * Script to run the bio and linkedin_username migration on production database
 * 
 * This script runs the migration: 20260309000000-add-bio-linkedin-to-users.js
 * which adds the bio and linkedin_username columns to the users table.
 * 
 * Usage:
 *   node run-bio-linkedin-migration.js
 */

const { Sequelize } = require('sequelize');
require('dotenv').config({ path: './cohortle-api/.env' });

async function runMigration() {
  console.log('=== Bio & LinkedIn Migration Script ===\n');
  
  // Create Sequelize instance
  const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: console.log,
    }
  );

  try {
    // Test connection
    console.log('Testing database connection...');
    await sequelize.authenticate();
    console.log('✓ Database connection successful\n');

    // Check if columns already exist
    console.log('Checking if columns already exist...');
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME}' 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME IN ('bio', 'linkedin_username')
    `);

    const existingColumns = results.map(r => r.COLUMN_NAME);
    console.log('Existing columns:', existingColumns.length > 0 ? existingColumns.join(', ') : 'none');

    if (existingColumns.includes('bio') && existingColumns.includes('linkedin_username')) {
      console.log('\n✓ Both columns already exist. Migration not needed.');
      await sequelize.close();
      return;
    }

    // Run migration
    console.log('\nRunning migration...');
    
    if (!existingColumns.includes('bio')) {
      console.log('Adding bio column...');
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN bio TEXT NULL 
        COMMENT 'User biography or about section'
      `);
      console.log('✓ bio column added');
    }

    if (!existingColumns.includes('linkedin_username')) {
      console.log('Adding linkedin_username column...');
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN linkedin_username VARCHAR(255) NULL 
        COMMENT 'LinkedIn username (not full URL, just the username)'
      `);
      console.log('✓ linkedin_username column added');
    }

    console.log('\n✓ Migration completed successfully!');

    // Verify columns were added
    console.log('\nVerifying columns...');
    const [verifyResults] = await sequelize.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_COMMENT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME}' 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME IN ('bio', 'linkedin_username')
    `);

    console.log('\nColumn details:');
    verifyResults.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE}, nullable: ${col.IS_NULLABLE}, comment: ${col.COLUMN_COMMENT}`);
    });

    await sequelize.close();
    console.log('\n✓ Database connection closed');
    console.log('\n=== Migration Complete ===');
    
  } catch (error) {
    console.error('\n✗ Migration failed:', error.message);
    console.error('\nError details:', error);
    await sequelize.close();
    process.exit(1);
  }
}

// Run the migration
runMigration();
