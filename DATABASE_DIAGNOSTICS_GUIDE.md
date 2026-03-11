# Database Role System Diagnostics Guide

## Overview

This guide explains how to use the comprehensive database diagnostic tools for the authentication and role system. These tools help identify issues with user role assignments, referential integrity, and database consistency.

## Available Diagnostic Tools

### 1. Node.js Diagnostic Script (Recommended)
**File:** `cohortle-api/diagnose-database-roles.js`

**Features:**
- Connects to database using Sequelize models
- Runs 14 comprehensive diagnostic tests
- Provides detailed output with color coding
- Generates actionable recommendations

**Usage:**
```bash
# From project root
node cohortle-api/diagnose-database-roles.js

# Or use the wrapper scripts:
# PowerShell (Windows)
./diagnose-database-roles.ps1

# Bash (Linux/Mac)
./diagnose-database-roles.sh
```

### 2. SQL Diagnostic Script
**File:** `cohortle-api/diagnose-database-roles.sql`

**Features:**
- Pure SQL queries for direct database access
- Can be run in any MySQL/MariaDB client
- Useful when Node.js environment is unavailable
- Same tests as Node.js version

**Usage:**
```bash
# Run directly in MySQL client
mysql -u username -p database_name < cohortle-api/diagnose-database-roles.sql

# Or in MySQL shell
mysql> source cohortle-api/diagnose-database-roles.sql;

# Or copy-paste queries into phpMyAdmin or other GUI tools
```

## Diagnostic Tests Performed

### Test 1: Database Connection
Verifies connection to the database is successful.

### Test 2: Roles Table
Lists all available roles in the system (student, convener, administrator).

### Test 3: Total Users
Counts total number of users in the database.

### Test 4: Users with Role Assignments
Shows users who have active role assignments (last 10).

### Test 5: Users WITHOUT Role Assignments ⚠️
**Critical:** Identifies users without any role assignment.
- These users will experience "user not authenticated" errors
- Must be fixed immediately

### Test 6: Role Distribution
Shows how many users are assigned to each role.

### Test 7: Duplicate Active Role Assignments ⚠️
Identifies users with multiple active role assignments.
- Users should have only one active role
- Duplicates can cause unpredictable behavior

### Test 8: Recent Registrations
Shows the last 10 user registrations and their role assignments.
- Helps verify new users are getting roles assigned

### Test 9: Email Verification Status
Shows distribution of verified vs unverified emails.
- For MVP, email verification is disabled

### Test 10: Old role_id Column Check
Checks if deprecated role_id column in users table is still being used.
- This column should NOT be used
- All role lookups should use user_role_assignments table

### Test 11: Referential Integrity - role_id Foreign Keys ⚠️
Identifies role assignments with invalid role_id references.
- Orphaned records indicate database corruption

### Test 12: Referential Integrity - user_id Foreign Keys ⚠️
Identifies role assignments with invalid user_id references.
- Orphaned records indicate database corruption

### Test 13: Inactive Role Assignments
Shows role assignments marked as inactive.
- Informational only, not necessarily a problem

### Test 14: Role Assignment Timestamps
Identifies users where role assignment was delayed (>5 seconds after user creation).
- May indicate role assignment not happening in same transaction
- Could lead to race conditions

## Interpreting Results

### ✓ Healthy System
```
✓ Database role system is healthy
```
All tests passed, no action required.

### ⚠️ Users Without Roles
```
⚠ WARNING: Found X users without role assignments
⚠ ACTION REQUIRED: Assign roles to users without assignments
```

**Fix:**
```bash
node cohortle-api/scripts/fix-users-without-roles.js
```

### ⚠️ Duplicate Role Assignments
```
⚠ WARNING: Found X users with multiple active role assignments
⚠ ACTION REQUIRED: Fix duplicate role assignments
```

**Fix:** Manual intervention required. Identify which role should be active and deactivate others.

### ⚠️ Referential Integrity Issues
```
⚠ WARNING: Found X role assignments with invalid role_id
⚠ ACTION REQUIRED: Fix referential integrity issues
```

**Fix:** Database cleanup required. Delete orphaned records or restore missing references.

## Common Issues and Solutions

### Issue 1: Users Without Role Assignments

**Symptom:**
- "user not authenticated" errors
- Users can't access dashboard
- Profile shows "unassigned" role

**Diagnosis:**
```sql
SELECT u.id, u.email
FROM users u
LEFT JOIN user_role_assignments ura ON u.id = ura.user_id AND ura.status = 'active'
WHERE ura.id IS NULL;
```

**Solution:**
```bash
node cohortle-api/scripts/fix-users-without-roles.js
```

### Issue 2: Duplicate Active Role Assignments

**Symptom:**
- Unpredictable role behavior
- User sees wrong dashboard
- Authorization errors

**Diagnosis:**
```sql
SELECT user_id, COUNT(*) as count
FROM user_role_assignments
WHERE status = 'active'
GROUP BY user_id
HAVING COUNT(*) > 1;
```

**Solution:**
```sql
-- Deactivate older assignments, keep most recent
UPDATE user_role_assignments ura1
SET status = 'inactive'
WHERE user_id = [USER_ID]
  AND status = 'active'
  AND id != (
    SELECT id FROM (
      SELECT id FROM user_role_assignments
      WHERE user_id = [USER_ID] AND status = 'active'
      ORDER BY assigned_at DESC
      LIMIT 1
    ) AS ura2
  );
```

### Issue 3: Orphaned Foreign Keys

**Symptom:**
- Database errors
- Inconsistent data
- Failed queries

**Diagnosis:**
```sql
-- Check for invalid role_id
SELECT ura.*
FROM user_role_assignments ura
LEFT JOIN roles r ON ura.role_id = r.role_id
WHERE r.role_id IS NULL;

-- Check for invalid user_id
SELECT ura.*
FROM user_role_assignments ura
LEFT JOIN users u ON ura.user_id = u.id
WHERE u.id IS NULL;
```

**Solution:**
```sql
-- Delete orphaned records
DELETE FROM user_role_assignments
WHERE id IN (
  SELECT id FROM (
    SELECT ura.id
    FROM user_role_assignments ura
    LEFT JOIN roles r ON ura.role_id = r.role_id
    WHERE r.role_id IS NULL
  ) AS orphaned
);
```

## Running Diagnostics in Different Environments

### Local Development
```bash
# Ensure .env file has correct database credentials
cd cohortle-api
node diagnose-database-roles.js
```

### Production (via SSH)
```bash
# SSH into production server
ssh user@production-server

# Navigate to project directory
cd /path/to/cohortle

# Run diagnostics
node cohortle-api/diagnose-database-roles.js
```

### Production (via Database Client)
```bash
# Connect to production database
mysql -h production-db-host -u username -p database_name

# Run SQL script
source cohortle-api/diagnose-database-roles.sql;
```

### Using phpMyAdmin
1. Log into phpMyAdmin
2. Select the database
3. Go to SQL tab
4. Copy contents of `cohortle-api/diagnose-database-roles.sql`
5. Paste and execute

## Automation

### Run Diagnostics on Schedule
Add to cron (Linux/Mac):
```bash
# Run diagnostics daily at 2 AM
0 2 * * * cd /path/to/cohortle && node cohortle-api/diagnose-database-roles.js >> /var/log/cohortle-diagnostics.log 2>&1
```

### Run Diagnostics Before Deployment
Add to CI/CD pipeline:
```yaml
# Example GitHub Actions
- name: Run Database Diagnostics
  run: |
    node cohortle-api/diagnose-database-roles.js
    if [ $? -ne 0 ]; then
      echo "Database diagnostics failed"
      exit 1
    fi
```

## Troubleshooting

### Error: Cannot connect to database
**Solution:** Check database credentials in `.env` file

### Error: Unknown column 'role_id'
**Solution:** This is expected if old role_id column was removed. Test will show as passed.

### Error: Sequelize models not found
**Solution:** Run `npm install` in cohortle-api directory

### Error: Permission denied
**Solution:** 
```bash
# Make scripts executable
chmod +x diagnose-database-roles.sh
chmod +x cohortle-api/diagnose-database-roles.js
```

## Related Documentation

- [MVP Auth Bug Hunt Requirements](.kiro/specs/mvp-auth-bug-hunt/requirements.md)
- [MVP Auth Bug Hunt Design](.kiro/specs/mvp-auth-bug-hunt/design.md)
- [MVP Auth Bug Hunt Tasks](.kiro/specs/mvp-auth-bug-hunt/tasks.md)
- [Role System Schema](cohortle-api/docs/ROLE_SYSTEM_SCHEMA.md)

## Support

If you encounter issues not covered in this guide:
1. Check the diagnostic output for specific error messages
2. Review the database schema documentation
3. Check application logs for related errors
4. Document the issue in MVP_AUTH_BUG_HUNT_FINDINGS.md
