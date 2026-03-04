/**
 * Diagnostic script for dashboard live sessions and recent activity
 */

const path = require('path');
const db = require('./cohortle-api/models');
const ProgressService = require('./cohortle-api/services/ProgressService');

async function diagnoseDashboard() {
  console.log('=== Dashboard Diagnostics ===\n');

  try {
    // Test database connection
    await db.sequelize.authenticate();
    console.log('✓ Database connection successful\n');

    // Check for users
    const users = await db.users.findAll({ limit: 5 });
    console.log(`Found ${users.length} users`);
    
    if (users.length === 0) {
      console.log('⚠ No users found in database');
      return;
    }

    const testUser = users[0];
    console.log(`Testing with user: ${testUser.email} (ID: ${testUser.id})\n`);

    // Check enrollments
    const enrollments = await db.enrollments.findAll({
      where: { user_id: testUser.id },
      include: [
        {
          model: db.cohorts,
          as: 'cohort',
          include: [
            {
              model: db.programmes,
              as: 'programme',
            },
          ],
        },
      ],
    });

    console.log(`User has ${enrollments.length} enrollments`);
    enrollments.forEach((e) => {
      console.log(`  - ${e.cohort?.programme?.name || 'Unknown'} (Cohort ${e.cohort_id})`);
    });
    console.log('');

    // Check lesson completions
    const completions = await db.lesson_completions.findAll({
      where: { user_id: testUser.id },
      limit: 5,
    });

    console.log(`User has ${completions.length} lesson completions`);
    console.log('');

    // Test getRecentActivity
    console.log('Testing getRecentActivity...');
    try {
      const activities = await ProgressService.getRecentActivity(testUser.id, 5);
      console.log(`✓ getRecentActivity returned ${activities.length} activities`);
      activities.forEach((activity) => {
        console.log(`  - ${activity.title} (${activity.programmeName})`);
        console.log(`    Completed: ${activity.completedAt}`);
      });
    } catch (error) {
      console.error('✗ getRecentActivity failed:', error.message);
      console.error('Stack:', error.stack);
    }
    console.log('');

    // Check live sessions
    console.log('Checking live sessions...');
    const liveSessions = await db.lessons.findAll({
      where: { type: 'live_session' },
      include: [
        {
          model: db.weeks,
          as: 'week',
          include: [
            {
              model: db.programmes,
              as: 'programme',
            },
          ],
        },
      ],
      limit: 10,
    });

    console.log(`Found ${liveSessions.length} live session lessons`);
    liveSessions.forEach((lesson) => {
      console.log(`  - ${lesson.title}`);
      console.log(`    Programme: ${lesson.week?.programme?.name || 'Unknown'}`);
      console.log(`    content_url: ${lesson.content_url || 'none'}`);
      console.log(`    content_text: ${lesson.content_text ? lesson.content_text.substring(0, 100) + '...' : 'none'}`);
    });
    console.log('');

    console.log('=== Diagnostics Complete ===');
  } catch (error) {
    console.error('Error during diagnostics:', error);
    console.error('Stack:', error.stack);
  } finally {
    await db.sequelize.close();
  }
}

diagnoseDashboard();
