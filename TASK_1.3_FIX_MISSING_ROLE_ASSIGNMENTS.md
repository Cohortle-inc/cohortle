# Task 1.3: Fix Missing Role Assignments - Execution Guide

## Overview
This document provides step-by-step instructions for executing Task 1.3 of the MVP Authentication Bug Hunt spec. This task fixes users who don't have role assignments in the `user_role_assignments` table by assigning them the student role.

## Prerequisites

Before running this fix:

1. ✅ Task 1.1 completed (diagnostic script created)
2. ✅ Task 1.2 completed (diagnostics run and findings documented)
3. ✅ Database backup taken (recommended)
4. ✅ Access to production server (SSH or Coolify console)

## What This Fix Does

The fix script will:

1. **Identify** users without role assignments in `user_role_assignments` table
2. **Assign** the `student` role to all users without assignments
3. **Verify** all users now have active role assignments
4. **Report** the number of users fixed and final role distribution

## Execution Methods

### Method 1: Using Node.js Script (Recommended)

This method uses the Node.js script that integrates with Sequelize models.

#### Step 1: SSH into Production Server

```bash
ssh user@your-production-server
```

Or use Coolify console:
1. Open Coolify dashboard
2. Navigate to cohortle-api service
3. Click "Console" or "Terminal"

#### Step 2: Navigate to API Directory

```bash
cd /app  # or wherever cohortle-api is deployed
```

#### Step 3: Run the Fix Script

```bash
node scripts/fix-users-without-roles.js
```

#### Expected Output

```
============================================================
FIX USERS WITHOUT ROLE ASSIGNMENTS
============================================================

✓ Database connected

Step 1: Finding users without role assignments...
Found 3 users without role assignments:
  - learner@example.com (ID: 45)
  - student@example.com (ID: 46)
  - test@example.com (ID: 47)

Step 2: Getting student role ID...
✓ Student role found: [UUID]

Step 3: Assigning student role to users...
  ✓ Assigned student role to learner@example.com
  ✓ Assigned student role to student@example.com
  ✓ Assigned student role to test@example.com

============================================================
SUMMARY
============================================================
Total users processed: 3
Successfully assigned roles: 3
Errors: 0

✓ All users now have role assignments!

Step 4: Verifying fix...
✓ Verification passed: All users have roles
```

### Method 2: Using PowerShell Script

This method uses direct MySQL queries via PowerShell.

#### Step 1: Transfer Script to Production

```bash
# From your local machine
scp fix-production-role-assignments.ps1 user@production-server:/tmp/
```

#### Step 2: SSH into Production

```bash
ssh user@production-server
```

#### Step 3: Run PowerShell Script

```bash
# Dry run first (no changes)
pwsh /tmp/fix-production-role-assignments.ps1 -DryRun

# If dry run looks good, run for real
pwsh /tmp/fix-production-role-assignments.ps1
```

#### Step 4: Confirm Changes

When prompted:
```
Do you want to assign the 'student' role to these users? (Y/N)
```

Type `Y` and press Enter to proceed.

### Method 3: Direct SQL Execution

If you have direct database access via phpMyAdmin or MySQL client:

#### Step 1: Check for Users Without Roles

```sql
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.created_at
FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
WHERE ura.id IS NULL
ORDER BY u.created_at DESC;
```

#### Step 2: Get Student Role ID

```sql
SELECT role_id FROM roles WHERE name = 'student' LIMIT 1;
```

Copy the `role_id` value (it's a UUID).

#### Step 3: Assign Student Role

Replace `[STUDENT_ROLE_ID]` with the actual UUID from Step 2:

```sql
INSERT INTO user_role_assignments (user_id, role_id, assigned_by, assigned_at, status)
SELECT 
  u.id,
  '[STUDENT_ROLE_ID]',
  1,
  NOW(),
  'active'
FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
WHERE ura.id IS NULL;
```

#### Step 4: Verify Fix

```sql
SELECT COUNT(*) as users_without_roles
FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
WHERE ura.id IS NULL;
```

Should return `0`.

## Verification Steps

After running the fix, verify it worked:

### 1. Check User Count

```sql
SELECT COUNT(*) as users_without_roles
FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
WHERE ura.id IS NULL;
```

**Expected:** `0`

### 2. Check Role Distribution

```sql
SELECT 
  r.name as role,
  COUNT(ura.id) as user_count
FROM roles r
LEFT JOIN user_role_assignments ura ON r.role_id = ura.role_id AND ura.status = 'active'
GROUP BY r.name
ORDER BY user_count DESC;
```

**Expected:** All users distributed across roles (mostly student)

### 3. Test User Login

1. Pick a user that was fixed (from the output)
2. Try logging in with their credentials
3. Verify they can access the dashboard
4. Verify no "user not authenticated" errors

### 4. Check Recent Assignments

```sql
SELECT 
  u.email,
  r.name as role,
  ura.assigned_at,
  ura.status
FROM user_role_assignments ura
JOIN users u ON ura.user_id = u.id
JOIN roles r ON ura.role_id = r.role_id
WHERE ura.assigned_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
ORDER BY ura.assigned_at DESC;
```

Should show the newly assigned roles.

## Troubleshooting

### Issue: Script Can't Connect to Database

**Symptom:** `ECONNREFUSED` or `HostNotFoundError`

**Solution:** 
- Ensure you're running the script ON the production server, not locally
- The database hostname in `.env` is only accessible from within the Docker network
- Use SSH or Coolify console to access the production server

### Issue: Student Role Not Found

**Symptom:** `Student role not found in database!`

**Solution:**
```bash
# Run role system initialization
node scripts/initialize-role-system.js
```

### Issue: Permission Denied

**Symptom:** `Access denied for user`

**Solution:**
- Check database credentials in `.env`
- Ensure `DB_USER` has INSERT permissions on `user_role_assignments` table

### Issue: Duplicate Key Error

**Symptom:** `Duplicate entry for key 'PRIMARY'`

**Solution:**
- This shouldn't happen, but if it does, it means some users already have roles
- Re-run the diagnostic to see current state
- The script should skip users who already have roles

### Issue: Some Users Still Without Roles

**Symptom:** Verification shows non-zero count

**Solution:**
1. Check the error messages in the script output
2. Manually inspect those specific users:
   ```sql
   SELECT * FROM users WHERE id IN ([list of IDs]);
   ```
3. Manually assign roles if needed
4. Investigate why automatic assignment failed

## Success Criteria

Task 1.3 is complete when:

- ✅ All users have at least one active role assignment
- ✅ Verification query returns 0 users without roles
- ✅ Users can log in and access their dashboards
- ✅ No "user not authenticated" errors for valid users
- ✅ Role distribution looks correct (mostly students, few conveners)

## Requirements Validated

This task validates:

- **Requirement 11.2:** All users have active role assignments
- **Requirement 11.5:** Database migrations ensure all users have role assignments

## Next Steps

After completing Task 1.3:

1. ✅ Mark Task 1.3 as complete
2. ➡️ Proceed to Task 1.4: Verify database integrity
3. ➡️ Move to Phase 2: Backend API Audit and Fixes

## Files Referenced

- **Node.js Script:** `cohortle-api/scripts/fix-users-without-roles.js`
- **PowerShell Script:** `fix-production-role-assignments.ps1`
- **SQL Queries:** `cohortle-api/diagnose-database-roles.sql`

## Documentation

After running the fix, document:

1. **Number of users fixed:** [count]
2. **Users fixed:** [list of emails]
3. **Execution time:** [timestamp]
4. **Final role distribution:** [student: X, convener: Y, admin: Z]
5. **Any errors encountered:** [description]
6. **Verification results:** [pass/fail]

## Safety Notes

- ✅ This fix only ADDS role assignments, never removes or modifies existing ones
- ✅ All users are assigned the 'student' role (safest default)
- ✅ Conveners and admins keep their existing roles (script only affects users WITHOUT roles)
- ✅ The operation is idempotent (safe to run multiple times)
- ✅ No user data is deleted or modified

## Rollback Plan

If something goes wrong:

1. **Restore from backup** (if you took one before running)
2. **Or manually remove the assignments:**
   ```sql
   DELETE FROM user_role_assignments 
   WHERE assigned_by = 1 
   AND assigned_at >= '[timestamp when fix was run]';
   ```

## Contact

If you encounter issues not covered in this guide:

1. Check the diagnostic output from Task 1.2
2. Review the error messages carefully
3. Check database logs for more details
4. Consult with the development team

---

**Task:** 1.3 Fix missing role assignments  
**Requirements:** 11.2, 11.5  
**Status:** Ready for execution on production server  
**Estimated Time:** 5-10 minutes  
**Risk Level:** Low (only adds data, doesn't modify or delete)
