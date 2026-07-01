/**
 * Test script for post visibility scope migration
 * Tests the database migration for community post access control
 */

const { Sequelize } = require('sequelize');
const config = require('./config/config');

// Get database configuration
const dbConfig = config.development;

async function testMigration() {
  console.log('🧪 Testing Post Visibility Scope Migration...\n');

  // Create database connection
  const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      dialect: dbConfig.dialect,
      logging: false,
    }
  );

  try {
    // Test 1: Check connection
    console.log('✓ Test 1: Database connection');
    await sequelize.authenticate();
    console.log('  Connected successfully\n');

    // Test 2: Verify columns exist
    console.log('✓ Test 2: Verify new columns exist');
    const [columns] = await sequelize.query(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT, IS_NULLABLE, COLUMN_COMMENT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = '${dbConfig.database}'
        AND TABLE_NAME = 'posts'
        AND COLUMN_NAME IN ('visibility_scope', 'cohort_id')
      ORDER BY COLUMN_NAME;
    `);
    
    if (columns.length !== 2) {
      throw new Error(`Expected 2 columns, found ${columns.length}`);
    }
    
    columns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (nullable: ${col.IS_NULLABLE})`);
    });
    console.log('');

    // Test 3: Verify ENUM values
    console.log('✓ Test 3: Verify ENUM values for visibility_scope');
    const [enumValues] = await sequelize.query(`
      SELECT COLUMN_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = '${dbConfig.database}'
        AND TABLE_NAME = 'posts'
        AND COLUMN_NAME = 'visibility_scope';
    `);
    
    console.log(`  ENUM type: ${enumValues[0].COLUMN_TYPE}`);
    if (!enumValues[0].COLUMN_TYPE.includes('community') || 
        !enumValues[0].COLUMN_TYPE.includes('cohort')) {
      throw new Error('ENUM values incorrect');
    }
    console.log('');

    // Test 4: Verify indexes
    console.log('✓ Test 4: Verify indexes created');
    const [indexes] = await sequelize.query(`
      SHOW INDEX FROM posts 
      WHERE Key_name LIKE 'idx_posts%';
    `);
    
    const expectedIndexes = [
      'idx_posts_visibility_scope',
      'idx_posts_cohort_id',
      'idx_posts_community_cohort'
    ];
    
    const foundIndexes = [...new Set(indexes.map(idx => idx.Key_name))];
    console.log(`  Found indexes: ${foundIndexes.join(', ')}`);
    
    expectedIndexes.forEach(expected => {
      if (!foundIndexes.includes(expected)) {
        throw new Error(`Missing index: ${expected}`);
      }
    });
    console.log('');

    // Test 5: Verify foreign key constraint
    console.log('✓ Test 5: Verify foreign key constraint');
    const [constraints] = await sequelize.query(`
      SELECT CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = '${dbConfig.database}'
        AND TABLE_NAME = 'posts'
        AND COLUMN_NAME = 'cohort_id'
        AND REFERENCED_TABLE_NAME IS NOT NULL;
    `);
    
    if (constraints.length === 0) {
      throw new Error('Foreign key constraint not found');
    }
    
    console.log(`  Constraint: ${constraints[0].CONSTRAINT_NAME}`);
    console.log(`  References: ${constraints[0].REFERENCED_TABLE_NAME}.${constraints[0].REFERENCED_COLUMN_NAME}`);
    console.log('');

    // Test 6: Check existing data has default values
    console.log('✓ Test 6: Verify existing posts have default values');
    const [posts] = await sequelize.query(`
      SELECT COUNT(*) as total,
             SUM(CASE WHEN visibility_scope = 'community' THEN 1 ELSE 0 END) as community_count,
             SUM(CASE WHEN cohort_id IS NULL THEN 1 ELSE 0 END) as null_cohort_count
      FROM posts;
    `);
    
    if (posts[0].total > 0) {
      console.log(`  Total posts: ${posts[0].total}`);
      console.log(`  Posts with 'community' scope: ${posts[0].community_count}`);
      console.log(`  Posts with NULL cohort_id: ${posts[0].null_cohort_count}`);
      
      if (posts[0].community_count !== posts[0].total) {
        console.warn('  ⚠️  Warning: Some posts do not have default visibility_scope');
      }
    } else {
      console.log('  No existing posts to check');
    }
    console.log('');

    // Test 7: Test inserting data with new columns
    console.log('✓ Test 7: Test data insertion');
    
    // Insert a community-scoped post
    await sequelize.query(`
      INSERT INTO posts (community_ids, visibility_scope, cohort_id, created_at, updated_at)
      VALUES ('1', 'community', NULL, NOW(), NOW());
    `);
    console.log('  ✓ Inserted community-scoped post');
    
    // Get a cohort ID for testing
    const [cohorts] = await sequelize.query(`SELECT id FROM cohorts LIMIT 1;`);
    
    if (cohorts.length > 0) {
      const cohortId = cohorts[0].id;
      
      // Insert a cohort-scoped post
      await sequelize.query(`
        INSERT INTO posts (community_ids, visibility_scope, cohort_id, created_at, updated_at)
        VALUES ('1', 'cohort', ${cohortId}, NOW(), NOW());
      `);
      console.log('  ✓ Inserted cohort-scoped post');
    } else {
      console.log('  ⚠️  No cohorts available to test cohort-scoped posts');
    }
    
    // Clean up test data
    await sequelize.query(`
      DELETE FROM posts 
      WHERE community_ids = '1' 
      AND created_at > DATE_SUB(NOW(), INTERVAL 1 MINUTE);
    `);
    console.log('  ✓ Cleaned up test data');
    console.log('');

    console.log('✅ All migration tests passed!\n');

  } catch (error) {
    console.error('❌ Migration test failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run tests
testMigration();
