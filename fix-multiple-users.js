/**
 * Fix Script: Assign Student Role to Multiple Users
 * 
 * Usage: node fix-multiple-users.js <email1> <email2> <email3> ...
 * Example: node fix-multiple-users.js learner5@cohortle.com learner6@cohortle.com
 */

require('dotenv').config({ path: './cohortle-api/.env' });
const db = require('./cohortle-api/models');

async function fixMultipleUsers(emails) {
  console.log('='.repeat(80));
  console.log('FIX MULTIPLE USERS - ROLE ASSIGNMENT');
  console.log('='.repeat(80));
  console.log(`\nTarget Users: ${emails.length}`);
  emails.forEach((email, i) => {
    console.log(`  ${i + 1}. ${email}`);
  });
  console.log();

  const results = {
    success: [],
    alreadyHasRole: [],
    notFound: [],
    failed: []
  };

  // Get student role once
  const studentRole = await db.roles.findOne({
    where: { name: 'student' }
  });

  if (!studentRole) {
    console.log(`❌ Student role not found in database!`);
    console.log(`   Run role system initialization first.`);
    process.exit(1);
  }

  console.log(`✅ Student role found: ${studentRole.role_id}\n`);

  // Process each user
  for (const email of emails) {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`Processing: ${email}`);
    console.log('─'.repeat(80));

    try {
      // Find user
      const user = await db.users.findOne({
        where: { email },
        attributes: ['id', 'email', 'first_name', 'last_name', 'role_id']
      });

      if (!user) {
        console.log(`❌ User not found`);
        results.notFound.push(email);
        continue;
      }

      console.log(`✅ User found (ID: ${user.id})`);

      // Check for active assignment
      const activeAssignment = await db.user_role_assignments.findOne({
        where: { user_id: user.id, status: 'active' },
        include: [{
          model: db.roles,
          as: 'role',
          attributes: ['name']
        }]
      });

      if (activeAssignment) {
        console.log(`⚠️  Already has active role: ${activeAssignment.role?.name}`);
        results.alreadyHasRole.push(email);
        continue;
      }

      // Create role assignment
      console.log(`🔧 Creating role assignment...`);
      
      const assignment = await db.user_role_assignments.create({
        user_id: user.id,
        role_id: studentRole.role_id,
        assigned_by: null,
        assigned_at: new Date(),
        effective_from: new Date(),
        effective_until: null,
        status: 'active',
        notes: 'Assigned by fix-multiple-users script'
      });

      console.log(`✅ Role assignment created`);

      // Update denormalized role_id
      console.log(`🔧 Updating denormalized role_id...`);
      
      await db.users.update(
        { role_id: studentRole.role_id },
        { where: { id: user.id } }
      );

      console.log(`✅ User updated`);
      results.success.push(email);

    } catch (error) {
      console.error(`❌ Error:`, error.message);
      results.failed.push({ email, error: error.message });
    }
  }

  // Summary
  console.log(`\n${'='.repeat(80)}`);
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`\n✅ Successfully fixed: ${results.success.length}`);
  results.success.forEach(email => console.log(`   - ${email}`));

  if (results.alreadyHasRole.length > 0) {
    console.log(`\n⚠️  Already had role: ${results.alreadyHasRole.length}`);
    results.alreadyHasRole.forEach(email => console.log(`   - ${email}`));
  }

  if (results.notFound.length > 0) {
    console.log(`\n❌ Not found: ${results.notFound.length}`);
    results.notFound.forEach(email => console.log(`   - ${email}`));
  }

  if (results.failed.length > 0) {
    console.log(`\n❌ Failed: ${results.failed.length}`);
    results.failed.forEach(item => console.log(`   - ${item.email}: ${item.error}`));
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log(`Total: ${results.success.length + results.alreadyHasRole.length + results.notFound.length + results.failed.length} users processed`);
  console.log('='.repeat(80));

  return results.failed.length === 0 ? 0 : 1;
}

// Get emails from command line arguments
const emails = process.argv.slice(2);

if (emails.length === 0) {
  console.log('Usage: node fix-multiple-users.js <email1> <email2> <email3> ...');
  console.log('Example: node fix-multiple-users.js learner5@cohortle.com learner6@cohortle.com');
  process.exit(1);
}

// Run fix
fixMultipleUsers(emails)
  .then(exitCode => {
    console.log('\n✅ Script completed');
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
