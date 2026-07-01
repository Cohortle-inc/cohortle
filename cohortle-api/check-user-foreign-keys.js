/**
 * Script to check all foreign key constraints that reference the users table
 * This helps identify all tables that need to be cleaned up before deleting users
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOSTNAME,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false
  }
);

async function checkUserForeignKeys() {
  try {
    console.log('🔍 Checking all foreign key constraints referencing users table...\n');

    // Get all foreign keys that reference the users table
    const [foreignKeys] = await sequelize.query(`
      SELECT 
        TABLE_NAME,
        COLUMN_NAME,
        CONSTRAINT_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND REFERENCED_TABLE_NAME = 'users'
      ORDER BY TABLE_NAME, COLUMN_NAME
    `);

    console.log(`Found ${foreignKeys.length} foreign key constraint(s) referencing users:\n`);
    
    foreignKeys.forEach((fk, index) => {
      console.log(`${index + 1}. ${fk.TABLE_NAME}.${fk.COLUMN_NAME}`);
      console.log(`   → references users.${fk.REFERENCED_COLUMN_NAME}`);
      console.log(`   Constraint: ${fk.CONSTRAINT_NAME}\n`);
    });

    // Check for tables that reference programmes (indirect dependency)
    console.log('\n🔗 Checking tables that reference programmes (indirect user dependency)...\n');
    
    const [programmeRefs] = await sequelize.query(`
      SELECT 
        TABLE_NAME,
        COLUMN_NAME,
        CONSTRAINT_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND REFERENCED_TABLE_NAME = 'programmes'
      ORDER BY TABLE_NAME, COLUMN_NAME
    `);

    console.log(`Found ${programmeRefs.length} foreign key constraint(s) referencing programmes:\n`);
    
    programmeRefs.forEach((fk, index) => {
      console.log(`${index + 1}. ${fk.TABLE_NAME}.${fk.COLUMN_NAME}`);
      console.log(`   → references programmes.${fk.REFERENCED_COLUMN_NAME}`);
      console.log(`   Constraint: ${fk.CONSTRAINT_NAME}\n`);
    });

    // Check for tables that reference cohorts (indirect dependency)
    console.log('\n🔗 Checking tables that reference cohorts (indirect user dependency)...\n');
    
    const [cohortRefs] = await sequelize.query(`
      SELECT 
        TABLE_NAME,
        COLUMN_NAME,
        CONSTRAINT_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND REFERENCED_TABLE_NAME = 'cohorts'
      ORDER BY TABLE_NAME, COLUMN_NAME
    `);

    console.log(`Found ${cohortRefs.length} foreign key constraint(s) referencing cohorts:\n`);
    
    cohortRefs.forEach((fk, index) => {
      console.log(`${index + 1}. ${fk.TABLE_NAME}.${fk.COLUMN_NAME}`);
      console.log(`   → references cohorts.${fk.REFERENCED_COLUMN_NAME}`);
      console.log(`   Constraint: ${fk.CONSTRAINT_NAME}\n`);
    });

    console.log('\n✅ Foreign key check complete!');
    
  } catch (error) {
    console.error('❌ Error checking foreign keys:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

checkUserForeignKeys()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
