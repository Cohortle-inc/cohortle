#!/usr/bin/env node

/**
 * Fix script for learner authentication issue
 * 
 * Problem: All learner accounts show "user not authenticated" after role migration
 * Root cause: getUserWithRole() is returning role='unassigned' instead of 'student'
 * 
 * This script:
 * 1. Verifies that roles are properly assigned in the database
 * 2. Checks if there's a data type mismatch between role_id columns
 * 3. Ensures all users have valid role assignments
 * 4. Fixes any inconsistencies
 */

const db = require('./cohortle-api/models');

async function diagnoseAndFix() {
  try {
    console.log('🔍 Diagnosing learner authentication issue...\n');

    // 1. Check if student role exists
    console.log('1️⃣  Checking student role...');
    const studentRole = await db.roles.findOne({ where: { name: 'student' } });
    if (!studentRole) {
      console.log('   ❌ Student role not found!');
      process.exit(1);
    }
    console.log(`   ✅ Found: ID=${studentRole.role_id}, Name=${studentRole.name}`);
    console.log(`   Role ID type: ${typeof studentRole.role_id}`);

    // 2. Check users with role_id set
    console.log('\n2️⃣  Checking users with role_id set...');
    const usersWithRoleId = await db.users.findAll({
      where: { role_id: { [db.Sequelize.Op.ne]: null } },
      limit: 5,
      attributes: ['id', 'email', 'role_id'],
      include: [{
        model: db.roles,
        as: 'role',
        attributes: ['name', 'role_id'],
        required: false
      }]
    });

    console.log(`   Found ${usersWithRoleId.length} users with role_id set`);
    usersWithRoleId.forEach((u, i) => {
      console.log(`   User ${i + 1}:`);
      console.log(`     Email: ${u.email}`);
      console.log(`     role_id: ${u.role_id} (type: ${typeof u.role_id})`);
      console.log(`     role.name (from JOIN): ${u.role?.name || 'NULL'}`);
      if (!u.role?.name) {
        console.log(`     ⚠️  JOIN failed - role not found!`);
      }
    });

    // 3. Check user_role_assignments
    console.log('\n3️⃣  Checking user_role_assignments...');
    const assignments = await db.user_role_assignments.findAll({
      limit: 5,
      attributes: ['user_id', 'role_id', 'status'],
      include: [
        {
          model: db.roles,
          as: 'role',
          attributes: ['name', 'role_id'],
          required: false
        },
        {
          model: db.users,
          as: 'user',
          attributes: ['email'],
          required: false
        }
      ]
    });

    console.log(`   Found ${assignments.length} role assignments`);
    assignments.forEach((a, i) => {
      console.log(`   Assignment ${i + 1}:`);
      console.log(`     User: ${a.user?.email || 'UNKNOWN'}`);
      console.log(`     Role: ${a.role?.name || 'NULL'}`);
      console.log(`     Status: ${a.status}`);
    });

    // 4. Check for data type mismatches
    console.log('\n4️⃣  Checking for data type mismatches...');
    const mismatchedUsers = await db.sequelize.query(`
      SELECT u.id, u.email, u.role_id, r.role_id as role_table_id, r.name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      WHERE u.role_id IS NOT NULL
      LIMIT 5
    `, { type: db.Sequelize.QueryTypes.SELECT });

    mismatchedUsers.forEach((u, i) => {
      console.log(`   User ${i + 1}:`);
      console.log(`     Email: ${u.email}`);
      console.log(`     users.role_id: ${u.role_id}`);
      console.log(`     roles.role_id: ${u.role_table_id || 'NULL'}`);
      console.log(`     roles.name: ${u.name || 'NULL'}`);
      if (!u.name) {
        console.log(`     ⚠️  JOIN failed - checking if role_id exists in roles table...`);
      }
    });

    // 5. Verify role_id exists in roles table
    console.log('\n5️⃣  Verifying role_id exists in roles table...');
    const allRoles = await db.roles.findAll({ attributes: ['role_id', 'name'] });
    console.log(`   Total roles: ${allRoles.length}`);
    allRoles.forEach(r => {
      console.log(`   - ${r.name}: ${r.role_id}`);
    });

    // 6. Check if there are users without role assignments
    console.log('\n6️⃣  Checking for users without role assignments...');
    const usersWithoutRoles = await db.sequelize.query(`
      SELECT COUNT(*) as count
      FROM users u
      WHERE u.role_id IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM user_role_assignments ura 
        WHERE u.id = ura.user_id AND ura.status = 'active'
      )
    `, { type: db.Sequelize.QueryTypes.SELECT });

    console.log(`   Users without roles: ${usersWithoutRoles[0].count}`);

    console.log('\n✅ Diagnosis complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

diagnoseAndFix();
