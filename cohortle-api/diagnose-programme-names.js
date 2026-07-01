/**
 * Diagnose Programme Names
 * This script checks the programme names in the database
 */

require('dotenv').config();
const db = require('./models');
const { programmes, cohorts, enrollments } = db;

async function diagnoseProgrammeNames() {
  console.log('\n=== Programme Names Diagnostic ===\n');

  try {
    // Fetch all programmes with related data
    const allProgrammes = await programmes.findAll({
      attributes: ['id', 'name', 'description', 'created_at'],
      include: [
        {
          model: cohorts,
          as: 'cohorts',
          attributes: ['id', 'name', 'enrollment_code'],
          include: [
            {
              model: enrollments,
              as: 'enrollments',
              attributes: ['id', 'user_id'],
            },
          ],
        },
      ],
      order: [['id', 'ASC']],
    });

    if (allProgrammes.length === 0) {
      console.log('No programmes found in database.');
      return;
    }

    console.log(`Found ${allProgrammes.length} programme(s):\n`);

    allProgrammes.forEach((programme) => {
      const cohortCount = programme.cohorts ? programme.cohorts.length : 0;
      const enrollmentCount = programme.cohorts
        ? programme.cohorts.reduce((sum, cohort) => sum + (cohort.enrollments ? cohort.enrollments.length : 0), 0)
        : 0;

      console.log(`Programme ID: ${programme.id}`);
      console.log(`Name: ${programme.name}`);
      console.log(`Description: ${programme.description || 'N/A'}`);
      console.log(`Cohorts: ${cohortCount}`);
      console.log(`Enrollments: ${enrollmentCount}`);
      console.log(`Created: ${programme.created_at}`);
      
      if (programme.cohorts && programme.cohorts.length > 0) {
        console.log('\nCohorts:');
        programme.cohorts.forEach((cohort) => {
          console.log(`  - ${cohort.name} (Code: ${cohort.enrollment_code}, Enrollments: ${cohort.enrollments ? cohort.enrollments.length : 0})`);
        });
      }
      
      console.log('\n' + '-'.repeat(80) + '\n');
    });

    console.log('=== Diagnostic Complete ===\n');
  } catch (error) {
    console.error('Error diagnosing programme names:', error);
    process.exit(1);
  } finally {
    await db.sequelize.close();
  }
}

diagnoseProgrammeNames();
