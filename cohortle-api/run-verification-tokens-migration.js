#!/usr/bin/env node
/**
 * Script to run the verification_tokens migration on production database
 * 
 * This script runs the migration to create the verification_tokens table
 * with proper indexes for the email verification flow improvement.
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const Umzug = require('umzug');
const path = require('path');

async function runMigration() {
  console.log('🔄 Starting verification_tokens migration...\n');

  // Create Sequelize instance
  const sequelize = new Sequelize(
    process.env.DB_DATABASE,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOSTNAME,
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: console.log,
    }
  );

  try {
    // Test connection
    console.log('📡 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Check if email_verified field exists in users table
    console.log('🔍 Checking if email_verified field exists in users table...');
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${process.env.DB_DATABASE}' 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'email_verified'
    `);
    
    if (results.length > 0) {
      console.log('✅ email_verified field exists in users table\n');
    } else {
      console.log('❌ email_verified field NOT found in users table');
      console.log('⚠️  Please run migration 20250425194222-add-email-to-users.js first\n');
      process.exit(1);
    }

    // Check if verification_tokens table already exists
    console.log('🔍 Checking if verification_tokens table exists...');
    const [tables] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = '${process.env.DB_DATABASE}' 
        AND TABLE_NAME = 'verification_tokens'
    `);

    if (tables.length > 0) {
      console.log('✅ verification_tokens table already exists');
      console.log('ℹ️  Migration has already been applied\n');
      
      // Show table structure
      console.log('📋 Current table structure:');
      const [columns] = await sequelize.query(`
        DESCRIBE verification_tokens
      `);
      console.table(columns);
      
      // Show indexes
      console.log('\n📋 Current indexes:');
      const [indexes] = await sequelize.query(`
        SHOW INDEX FROM verification_tokens
      `);
      console.table(indexes.map(idx => ({
        Key_name: idx.Key_name,
        Column_name: idx.Column_name,
        Non_unique: idx.Non_unique
      })));
      
      await sequelize.close();
      return;
    }

    console.log('ℹ️  verification_tokens table does not exist, creating...\n');

    // Setup Umzug for migrations
    const umzug = new Umzug({
      migrations: {
        path: path.join(__dirname, 'migrations'),
        pattern: /20260306000000-create-verification-tokens\.js$/,
        params: [sequelize.getQueryInterface(), Sequelize],
      },
      storage: 'sequelize',
      storageOptions: {
        sequelize: sequelize,
      },
    });

    // Run the specific migration
    console.log('🚀 Running migration: 20260306000000-create-verification-tokens.js');
    await umzug.up();
    console.log('✅ Migration completed successfully\n');

    // Verify table was created
    console.log('🔍 Verifying table creation...');
    const [verifyTables] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = '${process.env.DB_DATABASE}' 
        AND TABLE_NAME = 'verification_tokens'
    `);

    if (verifyTables.length > 0) {
      console.log('✅ verification_tokens table created successfully\n');
      
      // Show table structure
      console.log('📋 Table structure:');
      const [columns] = await sequelize.query(`
        DESCRIBE verification_tokens
      `);
      console.table(columns);
      
      // Show indexes
      console.log('\n📋 Indexes:');
      const [indexes] = await sequelize.query(`
        SHOW INDEX FROM verification_tokens
      `);
      console.table(indexes.map(idx => ({
        Key_name: idx.Key_name,
        Column_name: idx.Column_name,
        Non_unique: idx.Non_unique
      })));
    } else {
      console.log('❌ Failed to verify table creation');
      process.exit(1);
    }

    await sequelize.close();
    console.log('\n✅ All checks passed! Database setup complete.');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    await sequelize.close();
    process.exit(1);
  }
}

// Run the migration
runMigration();
