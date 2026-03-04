/**
 * Create test data for dashboard sections
 * Run this to populate live sessions and lesson completions for testing
 */

const db = require('./cohortle-api/models');
const { v4: uuidv4 } = require('uuid');

async function createTestData() {
  console.log('=== Creating Test Dashboard Data ===\n');

  try {
    await db.sequelize.authenticate();
    console.log('✓ Database connected\n');

    // Get first user
    const user = await db.users.findOne();
    if (!user) {
      console.log('⚠ No users found. Please create a user first.');
      return;
    }
    console.log(`Using user: ${user.email} (ID: ${user.id})\n`);

    // Get user's first enrollment
    const enrollment = await db.enrollments.findOne({
      where: { user_id: user.id },
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

    if (!enrollment) {
      console.log('⚠ User has no enrollments. Please enroll in a programme first.');
      return;
    }

    const programme = enrollment.cohort.programme;
    console.log(`Using programme: ${programme.name} (ID: ${programme.id})\n`);

    // Get or create a week
    let week = await db.weeks.findOne({
      where: { programme_id: programme.id },
    });

    if (!week) {
      console.log('Creating a test week...');
      week = await db.weeks.create({
        programme_id: programme.id,
        title: 'Test Week',
        description: 'Test week for dashboard data',
        week_number: 1,
        start_date: new Date(),
        is_visible: true,
      });
      console.log(`✓ Created week: ${week.title} (ID: ${week.id})\n`);
    } else {
      console.log(`Using existing week: ${week.title} (ID: ${week.id})\n`);
    }

    // Create a live session lesson
    console.log('Creating live session lesson...');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7); // 7 days from now

    const liveSession = await db.lessons.create({
      id: uuidv4(),
      week_id: week.id,
      title: 'Test Live Q&A Session',
      description: 'A test live session for dashboard testing',
      type: 'live_session',
      content_url: 'https://zoom.us/j/123456789',
      content_text: JSON.stringify({
        sessionDate: futureDate.toISOString(),
        description: 'Join us for a live Q&A session',
      }),
      order_index: 1,
    });
    console.log(`✓ Created live session: ${liveSession.title}`);
    console.log(`  Session date: ${futureDate.toISOString()}`);
    console.log(`  Join URL: ${liveSession.content_url}\n`);

    // Create a regular lesson
    console.log('Creating regular lesson...');
    const regularLesson = await db.lessons.create({
      id: uuidv4(),
      week_id: week.id,
      title: 'Test Lesson for Completion',
      description: 'A test lesson to mark as complete',
      type: 'text',
      content_text: 'This is test lesson content.',
      order_index: 2,
    });
    console.log(`✓ Created lesson: ${regularLesson.title} (ID: ${regularLesson.id})\n`);

    // Mark the lesson as complete
    console.log('Creating lesson completion...');
    const completion = await db.lesson_completions.create({
      user_id: user.id,
      lesson_id: regularLesson.id,
      cohort_id: enrollment.cohort_id,
      completed_at: new Date(),
    });
    console.log(`✓ Marked lesson as complete\n`);

    console.log('=== Test Data Created Successfully ===\n');
    console.log('You should now see:');
    console.log('1. One upcoming live session in the dashboard');
    console.log('2. One completed lesson in recent activity');
    console.log('\nRefresh your dashboard to see the changes!');

  } catch (error) {
    console.error('Error creating test data:', error);
    console.error('Stack:', error.stack);
  } finally {
    await db.sequelize.close();
  }
}

createTestData();
