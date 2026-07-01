'use strict';

/**
 * Migration: Add Foreign Key Constraint for Cohort-Programme Relationship
 * 
 * This migration adds a foreign key constraint to ensure data integrity
 * between cohorts and programmes tables. This prevents:
 * - Cohorts from referencing non-existent programmes
 * - Programmes with cohorts from being deleted
 * - Invalid programme_id values in cohorts table
 * 
 * Created: 2026-03-02
 * Purpose: Prevent cohort-programme mismatch issues
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔍 Checking for existing foreign key constraint...');
      
      // Check if constraint already exists
      const [constraints] = await queryInterface.sequelize.query(
        `SELECT CONSTRAINT_NAME 
         FROM information_schema.TABLE_CONSTRAINTS 
         WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'cohorts' 
         AND CONSTRAINT_TYPE = 'FOREIGN KEY'
         AND CONSTRAINT_NAME = 'fk_cohorts_programme';`,
        { transaction }
      );

      if (constraints.length > 0) {
        console.log('✅ Foreign key constraint already exists, skipping...');
        await transaction.commit();
        return;
      }

      console.log('🔍 Checking for orphaned cohorts (cohorts with invalid programme_id)...');
      
      // Find cohorts with invalid programme references
      const [orphanedCohorts] = await queryInterface.sequelize.query(
        `SELECT c.id, c.name, c.programme_id, c.enrollment_code
         FROM cohorts c
         LEFT JOIN programmes p ON c.programme_id = p.id
         WHERE p.id IS NULL;`,
        { transaction }
      );

      if (orphanedCohorts.length > 0) {
        console.log(`⚠️  Found ${orphanedCohorts.length} orphaned cohort(s):`);
        orphanedCohorts.forEach(cohort => {
          console.log(`   - Cohort ID ${cohort.id}: "${cohort.name}" (code: ${cohort.enrollment_code}) references non-existent programme ${cohort.programme_id}`);
        });
        
        throw new Error(
          `Cannot add foreign key constraint: ${orphanedCohorts.length} cohort(s) reference non-existent programmes. ` +
          `Please fix these data integrity issues first by either: ` +
          `1) Updating the cohorts to reference valid programmes, or ` +
          `2) Deleting the orphaned cohorts.`
        );
      }

      console.log('✅ No orphaned cohorts found');
      console.log('📝 Adding foreign key constraint...');

      // Add foreign key constraint
      await queryInterface.addConstraint('cohorts', {
        fields: ['programme_id'],
        type: 'foreign key',
        name: 'fk_cohorts_programme',
        references: {
          table: 'programmes',
          field: 'id'
        },
        onDelete: 'RESTRICT', // Prevent deleting programmes that have cohorts
        onUpdate: 'CASCADE',   // Update cohort programme_id if programme id changes
        transaction
      });

      console.log('✅ Foreign key constraint added successfully');
      console.log('');
      console.log('Benefits:');
      console.log('  - Cohorts can only reference existing programmes');
      console.log('  - Programmes with cohorts cannot be deleted');
      console.log('  - Database enforces data integrity automatically');
      
      await transaction.commit();
      console.log('✅ Migration completed successfully');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Migration failed:', error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔍 Checking if foreign key constraint exists...');
      
      const [constraints] = await queryInterface.sequelize.query(
        `SELECT CONSTRAINT_NAME 
         FROM information_schema.TABLE_CONSTRAINTS 
         WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'cohorts' 
         AND CONSTRAINT_TYPE = 'FOREIGN KEY'
         AND CONSTRAINT_NAME = 'fk_cohorts_programme';`,
        { transaction }
      );

      if (constraints.length === 0) {
        console.log('✅ Foreign key constraint does not exist, nothing to remove');
        await transaction.commit();
        return;
      }

      console.log('📝 Removing foreign key constraint...');
      
      await queryInterface.removeConstraint('cohorts', 'fk_cohorts_programme', { transaction });
      
      console.log('✅ Foreign key constraint removed successfully');
      await transaction.commit();
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Rollback failed:', error.message);
      throw error;
    }
  }
};
