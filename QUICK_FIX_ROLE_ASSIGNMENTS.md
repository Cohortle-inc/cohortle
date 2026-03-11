# Quick Fix: Missing Role Assignments

## Problem
Users without role assignments in the `user_role_assignments` table cannot authenticate properly, resulting in "user not authenticated" errors.

## Solution
Assign the `student` role to all users without role assignments.

## Quick Start (Choose One Method)

### Method 1: Automated Script (Easiest)

**On Production Server:**

```bash
# Navigate to API directory
cd /app  # or wherever cohortle-api is deployed

# Run the fix
bash run-role-assignment-fix.sh
```

**Or with PowerShell:**

```bash
pwsh run-role-assignment-fix.ps1
```

### Method 2: Direct Node.js

**On Production Server:**

```bash
cd /app
node scripts/fix-users-without-roles.js
```

### Method 3: Direct SQL

**Via phpMyAdmin or MySQL client:**

```sql
-- 1. Get student role ID
SELECT role_id FROM roles WHERE name = 'student' LIMIT 1;

-- 2. Assign student role to users without roles
-- Replace [STUDENT_ROLE_ID] with the UUID from step 1
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

-- 3. Verify fix
SELECT COUNT(*) FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
WHERE ura.id IS NULL;
-- Should return 0
```

## Verification

After running the fix:

```sql
-- Check all users have roles
SELECT COUNT(*) as users_without_roles
FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
WHERE ura.id IS NULL;
```

**Expected:** `0`

## Test

1. Pick a user that was fixed
2. Log in with their credentials
3. Verify dashboard access works
4. Verify no "user not authenticated" errors

## Important Notes

- ✅ Run this ON the production server (not locally)
- ✅ The database is only accessible from within the Docker network
- ✅ This fix only ADDS roles, never removes existing ones
- ✅ Safe to run multiple times (idempotent)
- ✅ All users get 'student' role by default (safest option)

## Files

- **Execution Guide:** `TASK_1.3_FIX_MISSING_ROLE_ASSIGNMENTS.md`
- **Bash Script:** `run-role-assignment-fix.sh`
- **PowerShell Script:** `run-role-assignment-fix.ps1`
- **Node.js Script:** `cohortle-api/scripts/fix-users-without-roles.js`
- **SQL Queries:** `cohortle-api/diagnose-database-roles.sql`

## Troubleshooting

**Can't connect to database:**
- Ensure you're running ON the production server
- Check `.env` file has correct database credentials

**Student role not found:**
```bash
node scripts/initialize-role-system.js
```

**Still getting errors:**
- Check the detailed guide: `TASK_1.3_FIX_MISSING_ROLE_ASSIGNMENTS.md`
- Review diagnostic output from Task 1.2

## Next Steps

After fix is complete:

1. ✅ Verify all users have roles (query above)
2. ✅ Test user login and dashboard access
3. ➡️ Proceed to Task 1.4: Verify database integrity
4. ➡️ Move to Phase 2: Backend API Audit

---

**Task:** 1.3 Fix missing role assignments  
**Time:** 5-10 minutes  
**Risk:** Low (only adds data)
