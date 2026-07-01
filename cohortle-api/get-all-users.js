/**
 * Get All Users Script
 * Retrieves all registered users grouped by role
 */

require('dotenv').config();
const db = require('./models');

async function getAllUsers() {
  try {
    console.log('=== Cohortle Registered Users ===\n');

    // Get all users with their roles
    const users = await db.users.findAll({
      attributes: ['id', 'email', 'first_name', 'last_name', 'joined_at', 'status', 'role_id'],
      include: [{
        model: db.roles,
        as: 'role',
        attributes: ['name', 'role_id'],
        required: false
      }],
      order: [['joined_at', 'DESC']]
    });

    if (users.length === 0) {
      console.log('No users found in the database.\n');
      return;
    }

    // Group users by role
    const usersByRole = {
      student: [],
      convener: [],
      instructor: [],
      administrator: [],
      unassigned: []
    };

    users.forEach(user => {
      const userData = {
        id: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        joined: user.joined_at,
        status: user.status
      };

      const roleName = user.role ? user.role.name : 'unassigned';
      if (usersByRole[roleName]) {
        usersByRole[roleName].push(userData);
      } else {
        usersByRole.unassigned.push(userData);
      }
    });

    // Display results
    console.log(`Total Users: ${users.length}\n`);

    // Students
    if (usersByRole.student.length > 0) {
      console.log(`\n📚 STUDENTS (${usersByRole.student.length}):`);
      console.log('─'.repeat(80));
      usersByRole.student.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Joined: ${new Date(user.joined).toLocaleDateString()}`);
        console.log(`   Status: ${user.status}`);
        console.log('');
      });
    }

    // Conveners
    if (usersByRole.convener.length > 0) {
      console.log(`\n👨‍🏫 CONVENERS (${usersByRole.convener.length}):`);
      console.log('─'.repeat(80));
      usersByRole.convener.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Joined: ${new Date(user.joined).toLocaleDateString()}`);
        console.log(`   Status: ${user.status}`);
        console.log('');
      });
    }

    // Instructors
    if (usersByRole.instructor.length > 0) {
      console.log(`\n🎓 INSTRUCTORS (${usersByRole.instructor.length}):`);
      console.log('─'.repeat(80));
      usersByRole.instructor.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Joined: ${new Date(user.joined).toLocaleDateString()}`);
        console.log(`   Status: ${user.status}`);
        console.log('');
      });
    }

    // Administrators
    if (usersByRole.administrator.length > 0) {
      console.log(`\n👑 ADMINISTRATORS (${usersByRole.administrator.length}):`);
      console.log('─'.repeat(80));
      usersByRole.administrator.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Joined: ${new Date(user.joined).toLocaleDateString()}`);
        console.log(`   Status: ${user.status}`);
        console.log('');
      });
    }

    // Unassigned
    if (usersByRole.unassigned.length > 0) {
      console.log(`\n⚠️  UNASSIGNED ROLE (${usersByRole.unassigned.length}):`);
      console.log('─'.repeat(80));
      usersByRole.unassigned.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Joined: ${new Date(user.joined).toLocaleDateString()}`);
        console.log(`   Status: ${user.status}`);
        console.log('');
      });
    }

    // Summary
    console.log('\n=== Summary ===');
    console.log(`Students: ${usersByRole.student.length}`);
    console.log(`Conveners: ${usersByRole.convener.length}`);
    console.log(`Instructors: ${usersByRole.instructor.length}`);
    console.log(`Administrators: ${usersByRole.administrator.length}`);
    console.log(`Unassigned: ${usersByRole.unassigned.length}`);
    console.log(`Total: ${users.length}\n`);

    // Export to CSV option
    console.log('To export to CSV, run:');
    console.log('node get-all-users.js > users.txt\n');

  } catch (error) {
    console.error('Error fetching users:', error);
  } finally {
    await db.sequelize.close();
  }
}

// Run the script
getAllUsers();
