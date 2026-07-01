/**
 * Diagnostic script to check joined_at field status
 * Run this before and after the migration to verify the fix
 * 
 * Usage: node check-joined-at-status.js
 */

require('dotenv').config();
const db = require('./models');

async function checkJoinedAtStatus() {
  try {
    console.log('='.repeat(60));
    console.log('JOINED_AT FIELD STATUS CHECK');
    console.log('='.repeat(60));
    console.log('');

    // Get total user count
    const totalUsers = await db.users.count();
    console.log(`📊 Total users in database: ${totalUsers}`);
    console.log('');

    // Get users with NULL joined_at
    const usersWithoutJoinedAt = await db.users.count({
      where: { joined_at: null }
    });
    console.log(`❌ Users without joined_at: ${usersWithoutJoinedAt}`);

    // Get users with joined_at populated
    const usersWithJoinedAt = totalUsers - usersWithoutJoinedAt;
    console.log(`✅ Users with joined_at: ${usersWithJoinedAt}`);
    console.log('');

    // Calculate percentage
    const percentage = totalUsers > 0 ? ((usersWithJoinedAt / totalUsers) * 100).toFixed(2) : 0;
    console.log(`📈 Completion: ${percentage}%`);
    console.log('');

    // Show sample of users without joined_at
    if (usersWithoutJoinedAt > 0) {
      console.log('🔍 Sample users without joined_at:');
      const sampleUsers = await db.users.findAll({
        where: { joined_at: null },
        attributes: ['id', 'email', 'first_name', 'last_name', 'joined_at'],
        limit: 5,
        order: [['id', 'ASC']]
      });

      sampleUsers.forEach(user => {
        console.log(`   - User #${user.id}: ${user.email} (${user.first_name} ${user.last_name})`);
      });
      console.log('');
    }

    // Show sample of users with joined_at
    if (usersWithJoinedAt > 0) {
      console.log('✅ Sample users with joined_at:');
      const sampleUsers = await db.users.findAll({
        where: { joined_at: { [db.Sequelize.Op.ne]: null } },
        attributes: ['id', 'email', 'first_name', 'last_name', 'joined_at'],
        limit: 5,
        order: [['id', 'ASC']]
      });

      sampleUsers.forEach(user => {
        const joinedDate = new Date(user.joined_at);
        const monthsAgo = Math.floor((Date.now() - joinedDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
        console.log(`   - User #${user.id}: ${user.email} - Joined ${monthsAgo} months ago (${joinedDate.toLocaleDateString()})`);
      });
      console.log('');
    }

    // Show date distribution if users have joined_at
    if (usersWithJoinedAt > 0) {
      console.log('📅 Date distribution:');
      const [results] = await db.sequelize.query(`
        SELECT 
          DATE_FORMAT(joined_at, '%Y-%m') as month,
          COUNT(*) as user_count
        FROM users
        WHERE joined_at IS NOT NULL
        GROUP BY month
        ORDER BY month DESC
        LIMIT 10
      `);

      results.forEach(row => {
        console.log(`   ${row.month}: ${row.user_count} users`);
      });
      console.log('');
    }

    // Recommendation
    console.log('='.repeat(60));
    if (usersWithoutJoinedAt === 0) {
      console.log('✅ STATUS: All users have joined_at populated!');
      console.log('   No migration needed.');
    } else {
      console.log('⚠️  STATUS: Migration needed!');
      console.log(`   ${usersWithoutJoinedAt} users need joined_at populated.`);
      console.log('');
      console.log('   Run migration with:');
      console.log('   npx sequelize-cli db:migrate');
    }
    console.log('='.repeat(60));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking joined_at status:', error);
    console.error('');
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the check
checkJoinedAtStatus();
