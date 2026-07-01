const db = require('./models');

async function diagnoseUsersTable() {
  try {
    console.log('Checking users table structure...\n');
    
    // Get table structure
    const [columns] = await db.sequelize.query('DESCRIBE users');
    console.log('Users table columns:');
    console.log(JSON.stringify(columns, null, 2));
    
    console.log('\n\nChecking sample user data...\n');
    
    // Get a sample user
    const user = await db.users.findOne({
      attributes: ['id', 'email', 'first_name', 'last_name', 'joined_at'],
      raw: true
    });
    
    if (user) {
      console.log('Sample user:');
      console.log(JSON.stringify(user, null, 2));
      console.log('\njoined_at value:', user.joined_at);
      console.log('joined_at type:', typeof user.joined_at);
      console.log('joined_at is null:', user.joined_at === null);
    } else {
      console.log('No users found in database');
    }
    
    // Check if any users have joined_at set
    const usersWithJoinedAt = await db.users.count({
      where: {
        joined_at: {
          [db.Sequelize.Op.ne]: null
        }
      }
    });
    
    const totalUsers = await db.users.count();
    
    console.log(`\n\nUsers with joined_at: ${usersWithJoinedAt} / ${totalUsers}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

diagnoseUsersTable();
