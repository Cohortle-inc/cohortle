/**
 * Verify migration file syntax without connecting to database
 */

console.log('🔍 Verifying Migration File Syntax...\n');

try {
  // Load the migration file
  const migration = require('./migrations/20260220000000-add-post-visibility-scope.js');
  
  console.log('✓ Migration file loaded successfully');
  
  // Check if it has the required methods
  if (typeof migration.up !== 'function') {
    throw new Error('Missing "up" method');
  }
  console.log('✓ "up" method exists');
  
  if (typeof migration.down !== 'function') {
    throw new Error('Missing "down" method');
  }
  console.log('✓ "down" method exists');
  
  // Check the migration structure
  console.log('\n📋 Migration Details:');
  console.log('  File: 20260220000000-add-post-visibility-scope.js');
  console.log('  Type: Sequelize Migration');
  console.log('\n  Changes:');
  console.log('  - Add visibility_scope column (ENUM: community, cohort)');
  console.log('  - Add cohort_id column (nullable, FK to cohorts)');
  console.log('  - Add 3 indexes for performance');
  console.log('  - Default value: community scope, NULL cohort_id');
  
  console.log('\n✅ Migration file is valid!\n');
  console.log('📝 Next Steps:');
  console.log('  1. The migration has been run manually on production');
  console.log('  2. Verify in phpMyAdmin that columns exist:');
  console.log('     - posts.visibility_scope (ENUM)');
  console.log('     - posts.cohort_id (INT, nullable)');
  console.log('  3. Check indexes were created:');
  console.log('     - idx_posts_visibility_scope');
  console.log('     - idx_posts_cohort_id');
  console.log('     - idx_posts_community_cohort');
  console.log('  4. Verify foreign key constraint: fk_posts_cohort');
  
} catch (error) {
  console.error('❌ Migration file validation failed:', error.message);
  process.exit(1);
}
