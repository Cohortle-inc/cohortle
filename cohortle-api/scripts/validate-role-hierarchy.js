#!/usr/bin/env node

/**
 * Script to validate and fix role hierarchy permission inheritance
 * 
 * Usage:
 *   node scripts/validate-role-hierarchy.js --check          # Check hierarchy consistency
 *   node scripts/validate-role-hierarchy.js --fix            # Fix missing permissions
 *   node scripts/validate-role-hierarchy.js --role convener  # Check specific role
 */

const RoleValidationService = require('../services/RoleValidationService');
const db = require('../models');

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const roleArg = args.indexOf('--role');
  const specificRole = roleArg !== -1 ? args[roleArg + 1] : null;

  console.log('='.repeat(60));
  console.log('Role Hierarchy Validation Tool');
  console.log('='.repeat(60));
  console.log('');

  try {
    if (command === '--check') {
      await checkHierarchy(specificRole);
    } else if (command === '--fix') {
      await fixHierarchy(specificRole);
    } else {
      printUsage();
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await db.sequelize.close();
  }
}

async function checkHierarchy(roleName) {
  console.log('Checking role hierarchy consistency...');
  console.log('');

  const result = await RoleValidationService.validateRoleHierarchyConsistency(roleName);

  if (result.valid) {
    console.log('✅ Role hierarchy is consistent!');
    console.log('');
    console.log(result.message);
  } else {
    console.log('❌ Role hierarchy has inconsistencies!');
    console.log('');
    console.log(result.message);
    console.log('');
    console.log('Details:');
    console.log('-'.repeat(60));

    for (const issue of result.inconsistencies) {
      console.log('');
      console.log(`Role: ${issue.role_name} (Level ${issue.hierarchy_level})`);
      console.log(`Missing ${issue.missing_permissions.length} inherited permission(s):`);
      
      for (const perm of issue.missing_permissions) {
        console.log(`  - ${perm.permission_name}`);
        console.log(`    Should inherit from: ${perm.should_inherit_from}`);
        console.log(`    Description: ${perm.permission_description}`);
      }
    }

    console.log('');
    console.log('-'.repeat(60));
    console.log('');
    console.log('To fix these issues, run:');
    console.log('  node scripts/validate-role-hierarchy.js --fix');
  }

  console.log('');
}

async function fixHierarchy(roleName) {
  console.log('Fixing role hierarchy permission inheritance...');
  console.log('');

  // Get admin user (first administrator)
  const adminRole = await db.roles.findOne({ where: { name: 'administrator' } });
  if (!adminRole) {
    throw new Error('Administrator role not found');
  }

  const adminAssignment = await db.user_role_assignments.findOne({
    where: { role_id: adminRole.role_id, status: 'active' },
    include: [{ model: db.users, as: 'user' }]
  });

  if (!adminAssignment) {
    throw new Error('No active administrator found');
  }

  const adminUserId = adminAssignment.user_id;
  console.log(`Using admin user: ${adminAssignment.user.email} (ID: ${adminUserId})`);
  console.log('');

  // Get roles to fix
  let rolesToFix;
  if (roleName) {
    rolesToFix = [roleName];
  } else {
    const roles = await db.roles.findAll({
      where: { hierarchy_level: { [db.Sequelize.Op.gt]: 1 } },
      order: [['hierarchy_level', 'ASC']]
    });
    rolesToFix = roles.map(r => r.name);
  }

  console.log(`Fixing ${rolesToFix.length} role(s)...`);
  console.log('');

  let totalAdded = 0;

  for (const role of rolesToFix) {
    console.log(`Processing role: ${role}`);
    
    const result = await RoleValidationService.ensurePermissionInheritance(role, adminUserId);
    
    if (result.success) {
      console.log(`  ✅ ${result.message}`);
      totalAdded += result.permissions_added;
    } else {
      console.log(`  ❌ Failed: ${result.error.message}`);
    }
  }

  console.log('');
  console.log('-'.repeat(60));
  console.log(`Total permissions added: ${totalAdded}`);
  console.log('');

  // Validate again
  console.log('Validating hierarchy after fixes...');
  const validation = await RoleValidationService.validateRoleHierarchyConsistency();
  
  if (validation.valid) {
    console.log('✅ Role hierarchy is now consistent!');
  } else {
    console.log('⚠️  Some issues remain:');
    console.log(validation.message);
  }

  console.log('');
}

function printUsage() {
  console.log('Usage:');
  console.log('  node scripts/validate-role-hierarchy.js --check          # Check hierarchy');
  console.log('  node scripts/validate-role-hierarchy.js --fix            # Fix missing permissions');
  console.log('  node scripts/validate-role-hierarchy.js --check --role convener  # Check specific role');
  console.log('  node scripts/validate-role-hierarchy.js --fix --role convener    # Fix specific role');
  console.log('');
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
