/**
 * Diagnostic script to identify profile page errors
 * Run with: node diagnose-profile-error.js
 */

const db = require('./cohortle-api/models');

async function diagnoseProfileError() {
  console.log('🔍 Diagnosing Profile Page Error...\n');

  try {
    // Test database connection
    console.log('1. Testing database connection...');
    await db.sequelize.authenticate();
    console.log('✅ Database connection successful\n');

    // Check if required tables exist
    console.log('2. Checking required tables...');
    const tables = [
      'users',
      'enrollments',
      'cohorts',
      'programmes',
      'weeks',
      'lessons',
      'lesson_completions',
      'user_preferences',
      'learning_goals',
      'achievements',
      'user_achievements'
    ];

    for (const table of tables) {
      try {
        const result = await db.sequelize.query(
          `SELECT COUNT(*) as count FROM ${table} LIMIT 1`,
          { type: db.sequelize.QueryTypes.SELECT }
        );
        console.log(`✅ ${table} - exists`);
      } catch (err) {
        console.log(`❌ ${table} - MISSING or ERROR: ${err.message}`);
      }
    }

    console.log('\n3. Testing ProfileService methods...');
    
    // Test with a sample user ID (1)
    const testUserId = 1;
    
    // Check if user exists
    const user = await db.users.findByPk(testUserId);
    if (!user) {
      console.log(`⚠️  Test user (ID: ${testUserId}) not found. Using first available user...`);
      const firstUser = await db.users.findOne();
      if (!firstUser) {
        console.log('❌ No users found in database');
        return;
      }
      console.log(`✅ Found user: ${firstUser.first_name} ${firstUser.last_name} (ID: ${firstUser.id})`);
    } else {
      console.log(`✅ Test user found: ${user.first_name} ${user.last_name}`);
    }

    // Test getUserProfile
    console.log('\n4. Testing getUserProfile...');
    const ProfileService = require('./cohortle-api/services/ProfileService');
    try {
      const profile = await ProfileService.getUserProfile(user?.id || testUserId);
      console.log('✅ getUserProfile successful');
      console.log('   User:', profile.user.name);
      console.log('   Stats:', JSON.stringify(profile.stats, null, 2));
    } catch (err) {
      console.log('❌ getUserProfile failed:', err.message);
      console.log('   Stack:', err.stack);
    }

    // Test getPreferences
    console.log('\n5. Testing getPreferences...');
    try {
      const prefs = await ProfileService.getPreferences(user?.id || testUserId);
      console.log('✅ getPreferences successful');
      console.log('   Preferences:', JSON.stringify(prefs, null, 2));
    } catch (err) {
      console.log('❌ getPreferences failed:', err.message);
    }

    // Test getLearningGoal
    console.log('\n6. Testing getLearningGoal...');
    try {
      const goal = await ProfileService.getLearningGoal(user?.id || testUserId);
      console.log('✅ getLearningGoal successful');
      console.log('   Goal:', goal ? JSON.stringify(goal, null, 2) : 'No goal set');
    } catch (err) {
      console.log('❌ getLearningGoal failed:', err.message);
    }

    // Test getUserAchievements
    console.log('\n7. Testing getUserAchievements...');
    try {
      const achievements = await ProfileService.getUserAchievements(user?.id || testUserId);
      console.log('✅ getUserAchievements successful');
      console.log(`   Achievements: ${achievements.length} found`);
    } catch (err) {
      console.log('❌ getUserAchievements failed:', err.message);
    }

    console.log('\n✅ Diagnosis complete!');

  } catch (err) {
    console.error('\n❌ Fatal error during diagnosis:', err.message);
    console.error('Stack:', err.stack);
  } finally {
    await db.sequelize.close();
  }
}

diagnoseProfileError();
