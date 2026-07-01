/**
 * Export Users to CSV
 * Creates a CSV file with all registered users
 */

require('dotenv').config();
const db = require('./models');
const fs = require('fs');

async function exportUsersToCSV() {
  try {
    console.log('Fetching users from database...');

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
      console.log('No users found in the database.');
      return;
    }

    // Create CSV content
    const csvHeader = 'ID,Email,First Name,Last Name,Role,Joined Date,Status\n';
    const csvRows = users.map(user => {
      const roleName = user.role ? user.role.name : 'unassigned';
      const joinedDate = new Date(user.joined_at).toISOString().split('T')[0];
      
      return `${user.id},"${user.email}","${user.first_name}","${user.last_name}","${roleName}","${joinedDate}","${user.status}"`;
    }).join('\n');

    const csvContent = csvHeader + csvRows;

    // Write to file
    const filename = `cohortle-users-${new Date().toISOString().split('T')[0]}.csv`;
    fs.writeFileSync(filename, csvContent);

    console.log(`\n✅ Successfully exported ${users.length} users to ${filename}`);
    
    // Display summary
    const roleCount = {};
    users.forEach(user => {
      const roleName = user.role ? user.role.name : 'unassigned';
      roleCount[roleName] = (roleCount[roleName] || 0) + 1;
    });

    console.log('\nSummary:');
    Object.entries(roleCount).forEach(([role, count]) => {
      console.log(`  ${role}: ${count}`);
    });
    console.log(`  Total: ${users.length}\n`);

  } catch (error) {
    console.error('Error exporting users:', error);
  } finally {
    await db.sequelize.close();
  }
}

// Run the script
exportUsersToCSV();
