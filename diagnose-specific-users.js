/**
 * Diagnostic Script: Compare Authentication State for Specific Users
 * 
 * This script checks the database state for learner1@cohortle.com (working)
 * and learner5@cohortle.com (not working) to identify authentication issues.
 */

require('dotenv').config({ path: './cohortle-api/.env' });
const db = require('./cohortle-api/models');

async function diagnoseSpecificUsers() {
  console.log('='.repeat(80));
  console.log('AUTHENTICATION INCONSISTENCY DIAGNOSTIC');
  console.log('='.repeat(80));
  console.log();

  const testUsers = [
    { email: 'learner1@cohortle.com', status: 'WORKING' },
    { email: 'learner5@cohortle.com', status: 'NOT WORKING' }
  ];

  for (const testUser of testUsers) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`USER: ${testUser.email} (${testUser.status})`);
    console.log('='.repeat(80));

    try {
      // 1. Check if user exists
      const user = await db.users.findOne({
        where: { email: testUser.email },
        attributes: ['id', 'email', 'email_verified', 'first_name', 'last_name', 'role_id', 'status', 'joined_at'],
        raw: true
      });

      if (!user) {
        console.log(`❌ USER NOT FOUND in users table`);
        continue;
      }

      console.log(`\n✅ USER FOUND in users table:`);
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Email Verified: ${user.email_verified}`);
      console.log(`   - First Name: ${user.first_name || 'NULL'}`);
      console.log(`   - Last Name: ${user.last_name || 'NULL'}`);
      console.log(`   - Role ID (denormalized): ${user.role_id || 'NULL'}`);
      console.log(`   - Status: ${user.status}`);
      console.log(`   - Joined At: ${user.joined_at || 'NULL'}`);

      // 2. Check role_id in users table
      if (user.role_id) {
        const denormalizedRole = await db.roles.findOne({
          where: { role_id: user.role_id },
          attributes: ['role_id', 'name', 'hierarchy_level'],
          raw: true
        });

        if (denormalizedRole) {
          console.log(`\n✅ DENORMALIZED ROLE (from users.role_id):`);
          console.log(`   - Role ID: ${denormalizedRole.role_id}`);
          console.log(`   - Role Name: ${denormalizedRole.name}`);
          console.log(`   - Hierarchy Level: ${denormalizedRole.hierarchy_level}`);
        } else {
          console.log(`\n⚠️  DENORMALIZED ROLE ID EXISTS BUT ROLE NOT FOUND`);
          console.log(`   - Invalid role_id: ${user.role_id}`);
        }
      } else {
        console.log(`\n⚠️  NO DENORMALIZED ROLE (users.role_id is NULL)`);
      }

      // 3. Check user_role_assignments table
      const roleAssignments = await db.user_role_assignments.findAll({
        where: { user_id: user.id },
        attributes: ['assignment_id', 'role_id', 'status', 'assigned_at', 'effective_from', 'effective_until'],
        include: [{
          model: db.roles,
          as: 'role',
          attributes: ['role_id', 'name', 'hierarchy_level']
        }],
        order: [['assigned_at', 'DESC']],
        raw: true,
        nest: true
      });

      if (roleAssignments.length === 0) {
        console.log(`\n❌ NO ROLE ASSIGNMENTS in user_role_assignments table`);
        console.log(`   This is the likely cause of authentication failure!`);
      } else {
        console.log(`\n✅ ROLE ASSIGNMENTS FOUND (${roleAssignments.length} total):`);
        
        roleAssignments.forEach((assignment, index) => {
          const isActive = assignment.status === 'active';
          const isEffective = new Date(assignment.effective_from) <= new Date();
          const isNotExpired = !assignment.effective_until || new Date(assignment.effective_until) >= new Date();
          const isValid = isActive && isEffective && isNotExpired;

          console.log(`\n   Assignment #${index + 1}:`);
          console.log(`   - Assignment ID: ${assignment.assignment_id}`);
          console.log(`   - Role ID: ${assignment.role_id}`);
          console.log(`   - Role Name: ${assignment.role?.name || 'ROLE NOT FOUND'}`);
          console.log(`   - Status: ${assignment.status} ${isActive ? '✅' : '❌'}`);
          console.log(`   - Assigned At: ${assignment.assigned_at}`);
          console.log(`   - Effective From: ${assignment.effective_from} ${isEffective ? '✅' : '❌'}`);
          console.log(`   - Effective Until: ${assignment.effective_until || 'NULL (permanent)'} ${isNotExpired ? '✅' : '❌'}`);
          console.log(`   - VALID: ${isValid ? '✅ YES' : '❌ NO'}`);
        });

        // Check for active assignment
        const activeAssignment = roleAssignments.find(a => 
          a.status === 'active' && 
          new Date(a.effective_from) <= new Date() &&
          (!a.effective_until || new Date(a.effective_until) >= new Date())
        );

        if (activeAssignment) {
          console.log(`\n✅ ACTIVE ROLE ASSIGNMENT:`);
          console.log(`   - Role: ${activeAssignment.role?.name}`);
        } else {
          console.log(`\n❌ NO ACTIVE ROLE ASSIGNMENT`);
          console.log(`   User has assignments but none are currently active!`);
        }
      }

      // 4. Check what getUserWithRole would return
      console.log(`\n--- SIMULATING getUserWithRole() ---`);
      const userWithRole = await db.users.findOne({
        where: { email: testUser.email },
        attributes: ['id', 'email', 'email_verified', 'first_name', 'last_name'],
        include: [{
          model: db.roles,
          as: 'role',
          attributes: ['name', 'role_id'],
          required: false
        }],
        raw: true,
        nest: true
      });

      const roleName = userWithRole.role?.name || 'unassigned';
      console.log(`   getUserWithRole() would return role: "${roleName}"`);
      
      if (roleName === 'unassigned') {
        console.log(`   ⚠️  This means JWT token will have role='unassigned'`);
        console.log(`   ⚠️  Frontend may treat this as unauthenticated!`);
      }

      // 5. Check what ProfileService would return
      console.log(`\n--- SIMULATING ProfileService.getUserProfile() ---`);
      const profileRoleAssignment = await db.user_role_assignments.findOne({
        where: { user_id: user.id, status: 'active' },
        attributes: ['role_id'],
        include: [{
          model: db.roles,
          as: 'role',
          attributes: ['name', 'role_id']
        }],
        order: [['assigned_at', 'DESC']],
        raw: true,
        nest: true
      });

      const profileRole = profileRoleAssignment?.role?.name || 'unassigned';
      console.log(`   ProfileService would return role: "${profileRole}"`);

      // 6. Summary
      console.log(`\n--- DIAGNOSIS SUMMARY ---`);
      if (roleName === 'unassigned' && profileRole === 'unassigned') {
        console.log(`   ❌ PROBLEM IDENTIFIED:`);
        console.log(`   - User has no valid role assignment`);
        console.log(`   - Login will succeed but user will be treated as unauthenticated`);
        console.log(`   - Dashboard access will be denied`);
        console.log(`\n   FIX: Assign 'student' role to this user`);
      } else if (roleName !== profileRole) {
        console.log(`   ⚠️  ROLE MISMATCH:`);
        console.log(`   - Login role: ${roleName}`);
        console.log(`   - Profile role: ${profileRole}`);
        console.log(`   - This may cause inconsistent behavior`);
      } else {
        console.log(`   ✅ User has valid role: ${roleName}`);
      }

    } catch (error) {
      console.error(`\n❌ ERROR checking user ${testUser.email}:`, error.message);
    }
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log('DIAGNOSTIC COMPLETE');
  console.log('='.repeat(80));
}

// Run diagnostic
diagnoseSpecificUsers()
  .then(() => {
    console.log('\n✅ Diagnostic completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Diagnostic failed:', error);
    process.exit(1);
  });
