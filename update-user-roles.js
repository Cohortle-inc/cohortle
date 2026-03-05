// Script to update existing users' roles
// This script sets the role to 'learner' for users who don't have a role set

const db = require('./cohortle-api/models');

async function updateUserRoles() {
  try {
    console.log('Connecting to database...');
    await db.sequelize.authenticate();
    console.log('Database connection established.');

    // Get all users
    const users = await db.users.findAll({
      attributes: ['id', 'email', 'role']
    });

    console.log(`Found ${users.length} users`);

    let updatedCount = 0;
    const usersToUpdate = [];

    // Check which users need role update
    for (const user of users) {
      if (!user.role || user.role === 'unassigned') {
        usersToUpdate.push(user.id);
        console.log(`User ${user.id} (${user.email}): role = ${user.role || 'null'} -> will update to 'learner'`);
      }
    }

    if (usersToUpdate.length === 0) {
      console.log('No users need role updates.');
      return;
    }

    console.log(`\nUpdating ${usersToUpdate.length} users...`);

    // Update users in batches
    const batchSize = 10;
    for (let i = 0; i < usersToUpdate.length; i += batchSize) {
      const batch = usersToUpdate.slice(i, i + batchSize);
      
      const [updated] = await db.users.update(
        { role: 'learner' },
        {
          where: {
            id: batch,
            role: { [db.Sequelize.Op.or]: [null, 'unassigned'] }
          }
        }
      );

      updatedCount += updated;
      console.log(`Batch ${Math.floor(i/batchSize) + 1}: Updated ${updated} users`);
    }

    console.log(`\n✅ Successfully updated ${updatedCount} users to role='learner'`);

    // Verify the update
    const updatedUsers = await db.users.findAll({
      where: { id: usersToUpdate },
      attributes: ['id', 'email', 'role']
    });

    console.log('\nVerification:');
    for (const user of updatedUsers) {
      console.log(`User ${user.id} (${user.email}): role = ${user.role}`);
    }

  } catch (error) {
    console.error('Error updating user roles:', error);
  } finally {
    await db.sequelize.close();
    console.log('\nDatabase connection closed.');
  }
}

// Run the script
updateUserRoles();