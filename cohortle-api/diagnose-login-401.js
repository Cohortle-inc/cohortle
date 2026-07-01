const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Database connection
const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOSTNAME,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
  }
);

async function diagnoseLogin() {
  try {
    console.log('🔍 Diagnosing Login 401 Issue...\n');

    // Get the most recent user (the one that just registered)
    const [users] = await sequelize.query(`
      SELECT id, email, first_name, last_name, password, role_id, joined_at
      FROM users
      ORDER BY joined_at DESC
      LIMIT 5
    `);

    if (users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }

    console.log(`Found ${users.length} most recent users:\n`);
    
    for (const user of users) {
      console.log(`📧 Email: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.first_name} ${user.last_name}`);
      console.log(`   Role ID: ${user.role_id}`);
      console.log(`   Joined: ${user.joined_at}`);
      console.log(`   Password Hash: ${user.password ? user.password.substring(0, 20) + '...' : 'NULL'}`);
      console.log(`   Hash Length: ${user.password ? user.password.length : 0}`);
      console.log(`   Hash Starts With: ${user.password ? user.password.substring(0, 7) : 'N/A'}`);
      console.log('');
    }

    // Test password comparison
    console.log('\n🔐 Testing Password Comparison...\n');
    
    const testUser = users[0];
    console.log(`Testing with user: ${testUser.email}`);
    
    // Test with a sample password
    const testPassword = 'TestPassword123';
    console.log(`Test password: ${testPassword}`);
    
    if (!testUser.password) {
      console.log('❌ ERROR: User has no password hash stored!');
      return;
    }

    // Check if it's a bcrypt hash
    const isBcryptHash = testUser.password.startsWith('$2a$') || 
                         testUser.password.startsWith('$2b$') || 
                         testUser.password.startsWith('$2y$');
    
    console.log(`Is valid bcrypt hash format: ${isBcryptHash}`);
    
    if (!isBcryptHash) {
      console.log('❌ ERROR: Password is not stored as a bcrypt hash!');
      console.log('   This means passwords are being stored in plain text or wrong format.');
      return;
    }

    // Try comparing with bcrypt
    try {
      const isMatch = await bcrypt.compare(testPassword, testUser.password);
      console.log(`Password comparison result: ${isMatch}`);
    } catch (error) {
      console.log(`❌ Error comparing password: ${error.message}`);
    }

    console.log('\n✅ Diagnosis complete');
    console.log('\n💡 To test login, try these credentials:');
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Password: [the password you used during registration]`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

diagnoseLogin();
