#!/usr/bin/env node

/**
 * Diagnostic script to identify why new users get "user not authenticated"
 * Checks: role_id field, user_role_assignments, and role lookup
 */

const db = require('./cohortle-api/models');

async function diagnoseNewUserAuth() {
  try {
    console.log('🔍 Diagnosing new user authentication issue...\n');

    // Get all users created in the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentUsers = await db.users.findAll({
      where: {
        createdAt: {
          [db.Sequelize.Op.gte]: oneDayAgo
        }
      },
      attributes: ['id', 'email', 'role_id', 'createdAt', 'status'],
      include: [{
        model: db.roles,
        as: 'role',
        attributes: ['name', 'role_id'],
        required: false
      }],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    console.log(`📊 Found ${recentUsers.length} users created in the last 24 hours:\n`);

    for (const user of recentUsers) {
      console.log(`User ID: ${user.id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Status: ${user.status}`);
      console.log(`Created: ${user.createdAt}`);
      console.log(`role_id field: ${user.role_id || 'NULL'}`);
      console.log(`role via JOIN: ${user.role ? user.role.name : 'NULL'}`);

      // Check user_role_assignments
      const assignments = await db.user_role_assignments.findAll({
        where: { user_id: user.id },
        include: [{
          model: db.roles,
          as: 'role',
          attributes: ['name']
        }],
        attributes: ['assignment_id', 'role_id', 'status', 'effective_from', 'effective_until']
      });

      if (assignments.length > 0) {
        console.log(`✅ Role assignments found: ${assignments.length}`);
        assignments.forEach(a => {
          console.log(`   - Role: ${a.role ? a.role.name : 'UNKNOWN'}, Status: ${a.status}`);
        });
      } else {
        console.log(`❌ NO role assignments found!`);
      }

      console.log('---\n');
    }

    // Check if there's a mismatch between role_id and user_role_assignments
    console.log('\n🔎 Checking for mismatches...\n');

    const usersWithMismatch = await db.sequelize.query(`
      SELECT 
        u.id,
        u.email,
        u.role_id,
        r.name as role_name,
        COUNT(ura.assignment_id) as assignment_count,
        GROUP_CONCAT(DISTINCT r2.name) as assigned_roles
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
      LEFT JOIN roles r2 ON ura.role_id = r2.role_id
      WHERE u.createdAt >= ?
      GROUP BY u.id
      HAVING u.role_id IS NULL OR r.name IS NULL OR assignment_count = 0
      LIMIT 10
    `, {
      replacements: [oneDayAgo],
      type: db.Sequelize.QueryTypes.SELECT
    });

    if (usersWithMismatch.length > 0) {
      console.log(`⚠️  Found ${usersWithMismatch.length} users with potential issues:\n`);
      usersWithMismatch.forEach(u => {
        console.log(`User: ${u.email}`);
        console.log(`  role_id: ${u.role_id || 'NULL'}`);
        console.log(`  role_name: ${u.role_name || 'NULL'}`);
        console.log(`  assignments: ${u.assignment_count}`);
        console.log(`  assigned_roles: ${u.assigned_roles || 'NONE'}`);
        console.log('');
      });
    } else {
      console.log('✅ No obvious mismatches found in recent users');
    }

  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
  } finally {
    process.exit(0);
  }
}

diagnoseNewUserAuth();
