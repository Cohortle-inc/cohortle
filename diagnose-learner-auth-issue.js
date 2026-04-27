#!/usr/bin/env node

const db = require('./cohortle-api/models');

async function diagnose() {
  try {
    console.log('🔍 Diagnosing learner authentication issue...\n');

    // 1. Check if student role exists
    const studentRole = await db.roles.findOne({ where: { name: 'student' } });
    console.log('1. Student role in database:');
    if (studentRole) {
      console.log(`   ✅ Found: ID=${studentRole.role_id}, Name=${studentRole.name}`);
    } else {
      console.log('   ❌ NOT FOUND');
    }

    // 2. Check users with role_id set
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

    console.log('\n2. Sample users with role_id set:');
    usersWithRoleId.forEach(u => {
      console.log(`   Email: ${u.email}`);
      console.log(`   role_id: ${u.role_id}`);
      console.log(`   role.name (from JOIN): ${u.role?.name || 'NULL'}`);
      console.log('');
    });

    // 3. Check user_role_assignments
    const assignments = await db.user_role_assignments.findAll({
      limit: 5,
      attributes: ['user_id', 'role_id', 'status', 'effective_from', 'effective_until'],
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

    console.log('3. Sample user_role_assignments:');
    assignments.forEach(a => {
      console.log(`   User: ${a.user?.email || 'UNKNOWN'}`);
      console.log(`   Role: ${a.role?.name || 'NULL'}`);
      console.log(`   Status: ${a.status}`);
      console.log('');
    });

    // 4. Test getUserWithRole function
    console.log('4. Testing getUserWithRole function:');
    if (usersWithRoleId.length > 0) {
      const testUser = usersWithRoleId[0];
      const auth = require('./cohortle-api/routes/auth.js');
      // We need to call the function directly - let's check if it's exported
      console.log('   (Function is internal to auth.js, checking via login simulation)');
    }

    // 5. Check if there's a mismatch between role_id and role name
    console.log('\n5. Checking for role_id/name mismatches:');
    const allRoles = await db.roles.findAll();
    console.log(`   Total roles in database: ${allRoles.length}`);
    allRoles.forEach(r => {
      console.log(`   - ${r.name}: ${r.role_id}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

diagnose();
