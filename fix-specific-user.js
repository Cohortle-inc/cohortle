/**
 * Fix Script: Assign Student Role to User Without Role Assignment
 * 
 * Usage: node fix-specific-user.js <email>
 * Example: node fix-specific-user.js learner5@cohortle.com
 */

require('dotenv').config({ path: './cohortle-api/.env' });
const db = require('./cohortle-api/models');

async function fixUserRole(email) {
  console.log('='.repeat(80));
  console.log('FIX USER ROLE ASSIGNMENT');
  console.log('='.repeat(80));
  console.log(`\nTarget User: ${email}\n`);

  try {
    // 1. Find user
    const user = await db.users.findOne({
      where: { email },
      attributes: ['id', 'email', 'first_name', 'last_name', 'role_id']
    });

    if (!user) {
      console.log(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log(`✅ User found:`);
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Current role_id: ${user.role_id || 'NULL'}`);

    // 2. Check existing role assignments
    const existingAssignments = await db.user_role_assignments.findAll({
      where: { user_id: user.id },
      include: [{
        model: db.roles,
        as: 'role',
        attributes: ['name']
      }]
    });

    console.log(`\n📋 Existing role assignments: ${existingAssignments.length}`);
    existingAssignments.forEach((assignment, index) => {
      console.log(`   ${index + 1}. ${assignment.role?.name || 'unknown'} (${assignment.status})`);
    });

    // 3. Check for active assignment
    const activeAssignment = existingAssignments.find(a => a.status === 'active');
    
    if (activeAssignment) {
      console.log(`\n⚠️  User already has an active role assignment: ${activeAssignment.role?.name}`);
      console.log(`   No fix needed. If user still can't authenticate, check other issues.`);
      process.exit(0);
    }

    // 4. Get student role
    const studentRole = await db.roles.findOne({
      where: { name: 'student' }
    });

    if (!studentRole) {
      console.log(`\n❌ Student role not found in database!`);
      console.log(`   Run role system initialization first.`);
      process.exit(1);
    }

    console.log(`\n✅ Student role found:`);
    console.log(`   - Role ID: ${studentRole.role_id}`);
    console.log(`   - Name: ${studentRole.name}`);

    // 5. Create role assignment
    console.log(`\n🔧 Creating role assignment...`);
    
    const assignment = await db.user_role_assignments.create({
      user_id: user.id,
      role_id: studentRole.role_id,
      assigned_by: null, // System assignment
      assigned_at: new Date(),
      effective_from: new Date(),
      effective_until: null, // Permanent
      status: 'active',
      notes: 'Assigned by fix script to resolve authentication issue'
    });

    console.log(`✅ Role assignment created:`);
    console.log(`   - Assignment ID: ${assignment.assignment_id}`);
    console.log(`   - Status: ${assignment.status}`);

    // 6. Update denormalized role_id in users table
    console.log(`\n🔧 Updating denormalized role_id in users table...`);
    
    await db.users.update(
      { role_id: studentRole.role_id },
      { where: { id: user.id } }
    );

    console.log(`✅ Users table updated`);

    // 7. Verify fix
    console.log(`\n🔍 Verifying fix...`);
    
    const verifyUser = await db.users.findOne({
      where: { id: user.id },
      include: [{
        model: db.roles,
        as: 'role',
        attributes: ['name']
      }]
    });

    const verifyAssignment = await db.user_role_assignments.findOne({
      where: { user_id: user.id, status: 'active' },
      include: [{
        model: db.roles,
        as: 'role',
        attributes: ['name']
      }]
    });

    console.log(`\n✅ VERIFICATION RESULTS:`);
    console.log(`   - Denormalized role: ${verifyUser.role?.name || 'NULL'}`);
    console.log(`   - Active assignment role: ${verifyAssignment?.role?.name || 'NULL'}`);

    if (verifyUser.role?.name === 'student' && verifyAssignment?.role?.name === 'student') {
      console.log(`\n✅ FIX SUCCESSFUL!`);
      console.log(`   User ${email} now has student role assigned.`);
      console.log(`   They should be able to authenticate and access dashboard.`);
    } else {
      console.log(`\n⚠️  Fix may not be complete. Please check manually.`);
    }

  } catch (error) {
    console.error(`\n❌ Error fixing user role:`, error);
    process.exit(1);
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.log('Usage: node fix-specific-user.js <email>');
  console.log('Example: node fix-specific-user.js learner5@cohortle.com');
  process.exit(1);
}

// Run fix
fixUserRole(email)
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
