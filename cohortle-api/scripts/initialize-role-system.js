/**
 * Initialize Role System on Deployment
 * 
 * This script automatically sets up the role system when the application starts.
 * It is idempotent and safe to run multiple times.
 * 
 * Steps:
 * 1. Run seeder to populate roles and permissions
 * 2. Assign student role to all users without roles
 * 3. Create administrator account (testaconvener@cohortle.com)
 * 
 * This runs automatically on deployment/startup.
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const { execSync } = require('child_process');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'testaconvener@cohortle.com';
const SILENT_MODE = process.env.ROLE_INIT_SILENT === 'true';

// Database configuration
const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOSTNAME,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
  }
);

function log(message, type = 'info') {
  if (SILENT_MODE && type === 'info') return;
  
  const prefix = {
    info: '  ',
    success: '✅',
    warning: '⚠️ ',
    error: '❌',
  }[type] || '  ';
  
  console.log(`${prefix} ${message}`);
}

async function runSeeder() {
  try {
    log('Step 1: Running seeder for roles and permissions...');
    
    // Check if roles already exist
    const [roles] = await sequelize.query(`SELECT COUNT(*) as count FROM roles`);
    
    if (roles[0].count > 0) {
      log('Roles already exist, skipping seeder', 'info');
      return true;
    }
    
    // Run seeder
    execSync('npx sequelize-cli db:seed --seed 20260304000000-seed-roles-and-permissions.js', {
      cwd: __dirname + '/..',
      stdio: SILENT_MODE ? 'pipe' : 'inherit'
    });
    
    log('Seeder completed successfully', 'success');
    return true;
  } catch (error) {
    log(`Seeder failed: ${error.message}`, 'error');
    return false;
  }
}

async function assignRolesToUsers() {
  try {
    log('Step 2: Assigning roles to users without roles...');
    
    // Get student role
    const [studentRoles] = await sequelize.query(`
      SELECT role_id FROM roles WHERE name = 'student'
    `);
    
    if (studentRoles.length === 0) {
      log('Student role not found, skipping user assignment', 'warning');
      return false;
    }
    
    const studentRoleId = studentRoles[0].role_id;
    
    // Find users without roles
    const [usersWithoutRoles] = await sequelize.query(`
      SELECT COUNT(*) as count FROM users WHERE role_id IS NULL
    `);
    
    const userCount = usersWithoutRoles[0].count;
    
    if (userCount === 0) {
      log('All users already have roles', 'info');
      return true;
    }
    
    log(`Found ${userCount} users without roles, assigning student role...`);
    
    // Assign student role to users
    await sequelize.query(`
      UPDATE users
      SET role_id = :studentRoleId
      WHERE role_id IS NULL
    `, {
      replacements: { studentRoleId }
    });
    
    // Create role assignments
    await sequelize.query(`
      INSERT INTO user_role_assignments (user_id, role_id, assigned_by, assigned_at, status)
      SELECT 
        u.id,
        :studentRoleId,
        NULL,
        NOW(),
        'active'
      FROM users u
      WHERE u.role_id = :studentRoleId
        AND NOT EXISTS (
          SELECT 1 
          FROM user_role_assignments ura 
          WHERE ura.user_id = u.id 
            AND ura.status = 'active'
        )
    `, {
      replacements: { studentRoleId }
    });
    
    // Log in history
    await sequelize.query(`
      INSERT INTO role_assignment_history (user_id, previous_role_id, new_role_id, changed_by, changed_at, reason)
      SELECT 
        u.id,
        NULL,
        :studentRoleId,
        NULL,
        NOW(),
        'Automatic: Assigned default student role on deployment'
      FROM users u
      WHERE u.role_id = :studentRoleId
        AND NOT EXISTS (
          SELECT 1 
          FROM role_assignment_history rah 
          WHERE rah.user_id = u.id
        )
    `, {
      replacements: { studentRoleId }
    });
    
    log(`Assigned student role to ${userCount} users`, 'success');
    return true;
  } catch (error) {
    log(`Failed to assign roles: ${error.message}`, 'error');
    return false;
  }
}

async function createAdministrator() {
  try {
    log(`Step 3: Setting up administrator (${ADMIN_EMAIL})...`);
    
    // Check if user exists
    const [users] = await sequelize.query(`
      SELECT id, email, role_id FROM users WHERE email = :email
    `, {
      replacements: { email: ADMIN_EMAIL }
    });
    
    if (users.length === 0) {
      log(`User ${ADMIN_EMAIL} not found, will be assigned admin when they register`, 'warning');
      return true;
    }
    
    const user = users[0];
    
    // Get administrator role
    const [adminRoles] = await sequelize.query(`
      SELECT role_id FROM roles WHERE name = 'administrator'
    `);
    
    if (adminRoles.length === 0) {
      log('Administrator role not found', 'error');
      return false;
    }
    
    const adminRoleId = adminRoles[0].role_id;
    
    // Check if already admin
    if (user.role_id === adminRoleId) {
      log(`${ADMIN_EMAIL} is already an administrator`, 'info');
      return true;
    }
    
    log(`Promoting ${ADMIN_EMAIL} to administrator...`);
    
    // Update user role
    await sequelize.query(`
      UPDATE users
      SET role_id = :adminRoleId
      WHERE id = :userId
    `, {
      replacements: {
        adminRoleId,
        userId: user.id
      }
    });
    
    // Deactivate old role assignment
    await sequelize.query(`
      UPDATE user_role_assignments
      SET status = 'inactive'
      WHERE user_id = :userId
        AND status = 'active'
    `, {
      replacements: { userId: user.id }
    });
    
    // Create new role assignment
    await sequelize.query(`
      INSERT INTO user_role_assignments (user_id, role_id, assigned_by, assigned_at, status)
      VALUES (:userId, :adminRoleId, NULL, NOW(), 'active')
    `, {
      replacements: {
        userId: user.id,
        adminRoleId
      }
    });
    
    // Log in history
    await sequelize.query(`
      INSERT INTO role_assignment_history (user_id, previous_role_id, new_role_id, changed_by, changed_at, reason)
      VALUES (:userId, :previousRoleId, :newRoleId, NULL, NOW(), :reason)
    `, {
      replacements: {
        userId: user.id,
        previousRoleId: user.role_id,
        newRoleId: adminRoleId,
        reason: 'Automatic: Platform administrator assigned on deployment'
      }
    });
    
    log(`${ADMIN_EMAIL} promoted to administrator`, 'success');
    return true;
  } catch (error) {
    log(`Failed to create administrator: ${error.message}`, 'error');
    return false;
  }
}

async function verifySetup() {
  try {
    log('Step 4: Verifying role system setup...');
    
    // Check roles
    const [roles] = await sequelize.query(`SELECT COUNT(*) as count FROM roles`);
    if (roles[0].count === 0) {
      log('No roles found', 'error');
      return false;
    }
    
    // Check permissions
    const [permissions] = await sequelize.query(`SELECT COUNT(*) as count FROM permissions`);
    if (permissions[0].count === 0) {
      log('No permissions found', 'error');
      return false;
    }
    
    // Check users without roles
    const [usersWithoutRoles] = await sequelize.query(`
      SELECT COUNT(*) as count FROM users WHERE role_id IS NULL
    `);
    if (usersWithoutRoles[0].count > 0) {
      log(`${usersWithoutRoles[0].count} users still without roles`, 'warning');
    }
    
    // Check for administrator
    const [admins] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      WHERE r.name = 'administrator'
    `);
    
    if (admins[0].count === 0) {
      log('No administrators found', 'warning');
    } else {
      log(`Found ${admins[0].count} administrator(s)`, 'info');
    }
    
    log('Role system verification complete', 'success');
    return true;
  } catch (error) {
    log(`Verification failed: ${error.message}`, 'error');
    return false;
  }
}

async function initializeRoleSystem() {
  const startTime = Date.now();
  
  if (!SILENT_MODE) {
    console.log('\n🔧 Initializing Role System...\n');
  }
  
  try {
    // Connect to database
    await sequelize.authenticate();
    
    // Run initialization steps
    const seederSuccess = await runSeeder();
    if (!seederSuccess) {
      log('Seeder failed, skipping remaining steps', 'warning');
      await sequelize.close();
      return false;
    }
    
    const assignSuccess = await assignRolesToUsers();
    if (!assignSuccess) {
      log('Role assignment had issues, but continuing...', 'warning');
    }
    
    const adminSuccess = await createAdministrator();
    if (!adminSuccess) {
      log('Administrator setup had issues, but continuing...', 'warning');
    }
    
    await verifySetup();
    
    await sequelize.close();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    if (!SILENT_MODE) {
      console.log(`\n✅ Role system initialized successfully in ${duration}s\n`);
    }
    
    return true;
  } catch (error) {
    log(`Initialization failed: ${error.message}`, 'error');
    await sequelize.close();
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  initializeRoleSystem()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { initializeRoleSystem };
