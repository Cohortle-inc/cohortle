/**
 * WLIMP Database Verification Script
 * Tests that all WLIMP tables and relationships are working correctly
 */

const db = require('./models');
const { programmes, cohorts, weeks, lessons, enrollments } = db;

async function verifyDatabase() {
  console.log('========================================');
  console.log('WLIMP Database Verification');
  console.log('========================================\n');

  let allTestsPassed = true;

  try {
    // Test 1: Check if tables exist
    console.log('Test 1: Checking if WLIMP tables exist...');
    try {
      await weeks.findAll({ limit: 1 });
      console.log('✓ weeks table exists');
    } catch (err) {
      console.log('✗ weeks table missing:', err.message);
      allTestsPassed = false;
    }

    try {
      await lessons.findAll({ limit: 1 });
      console.log('✓ lessons table exists');
    } catch (err) {
      console.log('✗ lessons table missing:', err.message);
      allTestsPassed = false;
    }

    try {
      await enrollments.findAll({ limit: 1 });
      console.log('✓ enrollments table exists');
    } catch (err) {
      console.log('✗ enrollments table missing:', err.message);
      allTestsPassed = false;
    }

    // Test 2: Check cohorts has enrollment_code column
    console.log('\nTest 2: Checking cohorts.enrollment_code column...');
    try {
      const cohort = await cohorts.findOne();
      if (cohort && 'enrollment_code' in cohort.dataValues) {
        console.log('✓ cohorts.enrollment_code column exists');
      } else {
        console.log('⚠ cohorts table has no records to verify column');
      }
    } catch (err) {
      console.log('✗ cohorts.enrollment_code column missing:', err.message);
      allTestsPassed = false;
    }

    // Test 3: Create test programme
    console.log('\nTest 3: Creating test programme...');
    try {
      const programme = await programmes.create({
        name: 'Test WLIMP Programme',
        description: 'Test programme for verification',
        start_date: new Date('2026-03-01'),
        created_by: 1,
        type: 'structured',
        status: 'active',
      });
      console.log('✓ Programme created:', programme.id);

      // Test 4: Create test cohort with enrollment code
      console.log('\nTest 4: Creating test cohort with enrollment code...');
      const cohort = await cohorts.create({
        programme_id: programme.id,
        name: 'Test Cohort',
        enrollment_code: 'TEST-' + Date.now(),
        start_date: new Date('2026-03-01'),
        status: 'active',
      });
      console.log('✓ Cohort created:', cohort.id);
      console.log('  Enrollment code:', cohort.enrollment_code);

      // Test 5: Create test week
      console.log('\nTest 5: Creating test week...');
      const week = await weeks.create({
        programme_id: programme.id,
        week_number: 1,
        title: 'Test Week 1',
        start_date: new Date('2026-03-01'),
      });
      console.log('✓ Week created:', week.id);

      // Test 6: Create test lesson
      console.log('\nTest 6: Creating test lesson...');
      const lesson = await lessons.create({
        week_id: week.id,
        title: 'Test Lesson',
        description: 'Test lesson description',
        content_type: 'video',
        content_url: 'https://www.youtube.com/watch?v=test',
        order_index: 0,
      });
      console.log('✓ Lesson created:', lesson.id);

      // Test 7: Create test enrollment
      console.log('\nTest 7: Creating test enrollment...');
      const enrollment = await enrollments.create({
        user_id: 1,
        cohort_id: cohort.id,
        enrolled_at: new Date(),
      });
      console.log('✓ Enrollment created:', enrollment.id);

      // Test 8: Test relationships
      console.log('\nTest 8: Testing relationships...');
      
      // Week -> Programme
      const weekWithProgramme = await weeks.findByPk(week.id, {
        include: [{ model: programmes, as: 'programme' }],
      });
      if (weekWithProgramme.programme) {
        console.log('✓ Week -> Programme relationship works');
      } else {
        console.log('✗ Week -> Programme relationship failed');
        allTestsPassed = false;
      }

      // Lesson -> Week
      const lessonWithWeek = await lessons.findByPk(lesson.id, {
        include: [{ model: weeks, as: 'week' }],
      });
      if (lessonWithWeek.week) {
        console.log('✓ Lesson -> Week relationship works');
      } else {
        console.log('✗ Lesson -> Week relationship failed');
        allTestsPassed = false;
      }

      // Enrollment -> Cohort
      const enrollmentWithCohort = await enrollments.findByPk(enrollment.id, {
        include: [{ model: cohorts, as: 'cohort' }],
      });
      if (enrollmentWithCohort.cohort) {
        console.log('✓ Enrollment -> Cohort relationship works');
      } else {
        console.log('✗ Enrollment -> Cohort relationship failed');
        allTestsPassed = false;
      }

      // Test 9: Query enrolled programmes
      console.log('\nTest 9: Testing enrolled programmes query...');
      const EnrollmentService = require('./services/EnrollmentService');
      const enrolledProgrammes = await EnrollmentService.getUserEnrolledProgrammes(1);
      if (enrolledProgrammes.length > 0) {
        console.log('✓ getUserEnrolledProgrammes works');
        console.log('  Found', enrolledProgrammes.length, 'programme(s)');
      } else {
        console.log('⚠ getUserEnrolledProgrammes returned empty (may be expected)');
      }

      // Test 10: Query programme weeks
      console.log('\nTest 10: Testing programme weeks query...');
      const ProgrammeService = require('./services/ProgrammeService');
      const programmeWeeks = await ProgrammeService.getProgrammeWeeks(programme.id, cohort.id);
      if (programmeWeeks.length > 0) {
        console.log('✓ getProgrammeWeeks works');
        console.log('  Found', programmeWeeks.length, 'week(s)');
        console.log('  Week has', programmeWeeks[0].lessons.length, 'lesson(s)');
      } else {
        console.log('✗ getProgrammeWeeks returned empty');
        allTestsPassed = false;
      }

      // Cleanup
      console.log('\nCleaning up test data...');
      await enrollment.destroy();
      await lesson.destroy();
      await week.destroy();
      await cohort.destroy();
      await programme.destroy();
      console.log('✓ Test data cleaned up');

    } catch (err) {
      console.log('✗ Test failed:', err.message);
      console.error(err);
      allTestsPassed = false;
    }

    // Summary
    console.log('\n========================================');
    console.log('Summary');
    console.log('========================================');
    if (allTestsPassed) {
      console.log('✓ All tests passed! Database is fully functional.');
      process.exit(0);
    } else {
      console.log('✗ Some tests failed. Check errors above.');
      process.exit(1);
    }

  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

// Run verification
verifyDatabase();
