# Role System Deployment Guide

**Date:** March 5, 2026  
**Status:** Ready for Production Deployment

---

## Overview

This guide walks you through deploying the RBAC (Role-Based Access Control) system to production. The deployment consists of three main steps:

1. Run the seeder to populate roles and permissions
2. Assign roles to existing users
3. Create at least one administrator

---

## Prerequisites

✅ Migrations have been run successfully (confirmed in previous session)  
✅ Production database is accessible  
✅ You have SSH/terminal access to production server  
✅ Node.js is installed on production server  
✅ Environment variables are configured

---

## Step 1: Run the Seeder

The seeder populates the database with default roles and permissions.

### What It Does:
- Creates 3 roles: `student`, `convener`, `administrator`
- Creates 15 permissions for different actions
- Maps permissions to roles (with inheritance)

### How to Run:

**Option A: Using the helper script (Linux/Mac)**
```bash
cd cohortle-api
./seed-roles-production.sh
```

**Option B: Using the helper script (Windows)**
```powershell
cd cohortle-api
.\seed-roles-production.ps1
```

**Option C: Direct command**
```bash
cd cohortle-api
npx sequelize-cli db:seed --seed 20260304000000-seed-roles-and-permissions.js
```

### Expected Output:
```
Seeding roles and permissions...
Roles and permissions seeded successfully!
```

### Verification:
```bash
# Check if roles were created
node scripts/verify-role-system.js
```

---

## Step 2: Assign Roles to Existing Users

After the seeder runs, you need to assign the default `student` role to all existing users.

### What It Does:
- Finds all users without roles
- Assigns `student` role to them
- Creates role assignments in `user_role_assignments` table
- Logs changes in `role_assignment_history` table

### How to Run:

**Option A: Using the helper script (Linux/Mac)**
```bash
cd cohortle-api
./assign-roles-production.sh
```

**Option B: Using the helper script (Windows)**
```powershell
cd cohortle-api
.\assign-roles-production.ps1
```

**Option C: Direct command**
```bash
cd cohortle-api
node scripts/assign-roles-to-existing-users.js
```

### Expected Output:
```
🔄 Connecting to database...
✅ Database connection established

📋 Step 1: Checking if roles exist...
✅ Found 3 roles:
   - student (level 1)
   - convener (level 2)
   - administrator (level 3)

📋 Step 2: Finding users without roles...
📊 Found 5 users without roles:
   1. user1@example.com (John Doe)
   2. user2@example.com (Jane Smith)
   ...

📋 Step 3: Assigning student role to users...
✅ Updated 5 users with student role

📋 Step 4: Creating role assignments...
✅ Created 5 role assignments

📋 Step 5: Logging role assignment history...
✅ Created 5 history entries

📋 Step 6: Verifying role assignments...
📊 Final Statistics:
   Total users: 5
   Users with roles: 5
   Users without roles: 0

📊 Role Distribution:
   student: 5 users
   convener: 0 users
   administrator: 0 users

✅ Role assignment complete!
```

### What If It Fails?

If the script fails, check:
1. Database connection (verify .env variables)
2. Seeder was run first (roles must exist)
3. Database permissions (user needs UPDATE and INSERT)

---

## Step 3: Create Administrator

You need at least one administrator to manage the system.

### What It Does:
- Promotes an existing user to `administrator` role
- Updates user's role_id
- Creates new role assignment
- Logs the change in history

### How to Run:

**Option A: Using the helper script (Linux/Mac)**
```bash
cd cohortle-api
./create-admin-production.sh admin@example.com
# Or with custom reason:
./create-admin-production.sh admin@example.com "Initial platform administrator"
```

**Option B: Using the helper script (Windows)**
```powershell
cd cohortle-api
.\create-admin-production.ps1 -Email "admin@example.com"
# Or with custom reason:
.\create-admin-production.ps1 -Email "admin@example.com" -Reason "Initial platform administrator"
```

**Option C: Direct command**
```bash
cd cohortle-api
node scripts/create-admin-user.js admin@example.com
# Or with custom reason:
node scripts/create-admin-user.js admin@example.com "Initial platform administrator"
```

### Expected Output:
```
🔄 Connecting to database...
✅ Database connection established

📋 Step 1: Finding user with email: admin@example.com
✅ Found user: Admin User (admin@example.com)

📋 Step 2: Getting administrator role...
✅ Found administrator role

📋 Step 3: Promoting user from 'student' to 'administrator'...
✅ Updated user role to administrator

📋 Step 4: Updating role assignments...
✅ Created new administrator role assignment

📋 Step 5: Logging role change in history...
✅ Logged role change in history

📋 Step 6: Verifying administrator assignment...
✅ Verification successful!

📊 Administrator Details:
   Email: admin@example.com
   Name: Admin User
   Role: administrator
   Hierarchy Level: 3
   Assignment Status: active

✅ Administrator created successfully!

⚠️  IMPORTANT: The user will need to log out and log back in
   for the role change to take effect (JWT token refresh).
```

### Important Notes:

1. **User must exist** - You can only promote existing users
2. **User must log out** - Role changes require a new JWT token
3. **Create multiple admins** - For redundancy, create 2-3 administrators
4. **Document admin emails** - Keep a secure record of administrator accounts

---

## Step 4: Verify Deployment

After completing all steps, verify the role system is working correctly.

### Run Verification Script:

```bash
cd cohortle-api
node scripts/verify-role-system.js
```

### Expected Output:

```
🔍 Role System Verification

============================================================

🔄 Connecting to database...
✅ Database connection established

📋 Check 1: Roles
------------------------------------------------------------
✅ PASS: Found 3 roles
   - student (level 1)
   - convener (level 2)
   - administrator (level 3)

📋 Check 2: Permissions
------------------------------------------------------------
✅ PASS: Found 15 permissions
   - analytics: 2 permissions
   - cohort: 1 permissions
   - community: 1 permissions
   - content: 1 permissions
   - dashboard: 1 permissions
   - enrollment: 1 permissions
   - lesson: 2 permissions
   - programme: 2 permissions
   - role: 1 permissions
   - system: 1 permissions
   - user: 1 permissions

📋 Check 3: Role-Permission Mappings
------------------------------------------------------------
✅ student: 5 permissions
✅ convener: 10 permissions
✅ administrator: 15 permissions
✅ PASS: All roles have permissions

📋 Check 4: Users with Roles
------------------------------------------------------------
   Total users: 5
   Users with roles: 5
   Users without roles: 0
✅ PASS: All users have roles

📋 Check 5: Role Distribution
------------------------------------------------------------
   student: 3 users
   convener: 1 users
   administrator: 1 users
✅ PASS: At least one administrator exists

📋 Check 6: Role Assignments
------------------------------------------------------------
   Users with assignments: 5
   Total assignments: 5
   Active assignments: 5
   Inactive assignments: 0
✅ PASS: All users have active role assignments

📋 Check 7: Role Assignment History
------------------------------------------------------------
   Total history entries: 5
   Users with history: 5
✅ PASS: Role assignment history is being tracked

📋 Check 8: Data Integrity
------------------------------------------------------------
✅ PASS: No orphaned role assignments
✅ PASS: No mismatched roles

============================================================

✅ ALL CHECKS PASSED!
   Role system is properly configured.
```

---

## Post-Deployment Testing

### Test 1: User Login
1. Log in as a regular user (student role)
2. Verify you can access student features
3. Verify you CANNOT access convener/admin features

### Test 2: Administrator Login
1. Log in as the administrator
2. Verify you can access admin endpoints
3. Test role assignment API:
   ```bash
   curl -X GET https://api.cohortle.com/v1/api/roles \
     -H "Authorization: Bearer {admin-token}"
   ```

### Test 3: Role Assignment
1. As admin, promote a user to convener:
   ```bash
   curl -X PUT https://api.cohortle.com/v1/api/users/{userId}/role \
     -H "Authorization: Bearer {admin-token}" \
     -H "Content-Type: application/json" \
     -d '{"role": "convener", "reason": "Test promotion"}'
   ```
2. Verify the user can now access convener features

### Test 4: New User Registration
1. Register a new user
2. Verify they automatically get `student` role
3. Verify they can log in and access student features

---

## Troubleshooting

### Problem: Seeder fails with "roles already seeded"
**Solution:** This is normal if you run it twice. The seeder is idempotent.

### Problem: "No roles found" when assigning roles
**Solution:** Run the seeder first. Roles must exist before assignment.

### Problem: User still has old role after promotion
**Solution:** User needs to log out and log back in to get new JWT token.

### Problem: "User not found" when creating admin
**Solution:** Check the email address. User must exist in database first.

### Problem: Database connection error
**Solution:** Check .env file has correct production database credentials.

### Problem: Permission denied errors
**Solution:** Ensure database user has INSERT, UPDATE, SELECT permissions.

---

## Rollback Procedure

If something goes wrong, you can rollback:

### Rollback Role Assignments:
```sql
-- Remove role assignments
DELETE FROM user_role_assignments;

-- Remove role assignment history
DELETE FROM role_assignment_history;

-- Clear user roles
UPDATE users SET role_id = NULL;
```

### Rollback Seeder:
```bash
npx sequelize-cli db:seed:undo --seed 20260304000000-seed-roles-and-permissions.js
```

### Full Rollback (including migrations):
```bash
# Restore from backup
mysql -h {host} -u {user} -p {database} < backup_file.sql
```

---

## Quick Reference Commands

### Check what's been done:
```bash
# Verify role system
node scripts/verify-role-system.js

# Check database directly
mysql -h {host} -u {user} -p {database}
SELECT COUNT(*) FROM roles;
SELECT COUNT(*) FROM permissions;
SELECT COUNT(*) FROM users WHERE role_id IS NOT NULL;
```

### Create additional administrators:
```bash
node scripts/create-admin-user.js admin2@example.com
node scripts/create-admin-user.js admin3@example.com
```

### Promote user to convener (via database):
```sql
UPDATE users 
SET role_id = (SELECT role_id FROM roles WHERE name = 'convener')
WHERE email = 'convener@example.com';
```

---

## Security Checklist

After deployment, ensure:

- [ ] At least 2 administrators created (for redundancy)
- [ ] Administrator emails documented securely
- [ ] JWT_SECRET is strong (256 bits minimum)
- [ ] All users have roles assigned
- [ ] Role assignment history is being tracked
- [ ] API endpoints require authentication
- [ ] Admin endpoints require administrator role
- [ ] CORS is configured correctly
- [ ] Rate limiting is enabled

---

## Next Steps

After successful deployment:

1. **Monitor logs** - Watch for authentication/authorization errors
2. **Test workflows** - Verify all user journeys work correctly
3. **Create conveners** - Promote users who need to create programmes
4. **Document procedures** - Share admin procedures with team
5. **Set up monitoring** - Configure alerts for role-related errors

---

## Support

If you encounter issues:

1. Check the verification script output
2. Review application logs
3. Check database for data integrity
4. Refer to troubleshooting section above
5. Contact technical support if needed

---

## Files Created

### Scripts:
- `cohortle-api/scripts/assign-roles-to-existing-users.js` - Assigns roles to users
- `cohortle-api/scripts/create-admin-user.js` - Creates administrator
- `cohortle-api/scripts/verify-role-system.js` - Verifies setup

### Helper Scripts (Linux/Mac):
- `cohortle-api/seed-roles-production.sh` - Run seeder
- `cohortle-api/assign-roles-production.sh` - Assign roles
- `cohortle-api/create-admin-production.sh` - Create admin

### Helper Scripts (Windows):
- `cohortle-api/seed-roles-production.ps1` - Run seeder
- `cohortle-api/assign-roles-production.ps1` - Assign roles
- `cohortle-api/create-admin-production.ps1` - Create admin

---

*Last Updated: March 5, 2026*  
*Document Version: 1.0*  
*Role System Version: Production Ready*
