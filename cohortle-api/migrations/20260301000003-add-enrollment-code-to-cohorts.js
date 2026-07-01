'use strict';

/**
 * Migration: Add enrollment_code to cohorts table
 * 
 * This migration adds the enrollment_code field to the cohorts table
 * to support code-based enrollment for WLIMP programmes.
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Check if enrollment_code column already exists
        const [columns] = await queryInterface.sequelize.query(
            `SHOW COLUMNS FROM cohorts LIKE 'enrollment_code'`
        );

        if (columns.length === 0) {
            await queryInterface.addColumn('cohorts', 'enrollment_code', {
                type: Sequelize.STRING(50),
                allowNull: true,
                unique: true,
                after: 'name',
                comment: 'Unique code for learners to join the cohort (e.g., WLIMP-2026)',
            });

            // Add index for fast lookup
            await queryInterface.addIndex('cohorts', ['enrollment_code'], {
                name: 'idx_cohorts_enrollment_code',
                unique: true,
            });
        }
    },

    async down(queryInterface, Sequelize) {
        // Remove index first
        try {
            await queryInterface.removeIndex('cohorts', 'idx_cohorts_enrollment_code');
        } catch (e) {
            // Index might not exist
        }

        // Remove column
        try {
            await queryInterface.removeColumn('cohorts', 'enrollment_code');
        } catch (e) {
            // Column might not exist
        }
    },
};
