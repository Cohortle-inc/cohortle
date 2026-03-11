# Run Database Diagnostics on Production Server

## Quick Start

This guide provides step-by-step instructions for running the database diagnostics on the production server for Task 1.2 of the MVP Authentication Bug Hunt.

## Prerequisites

- SSH access to production server
- OR access to Coolify console
- Node.js installed on production server
- Database credentials configured in `.env`

## Method 1: Via SSH (Recommended)

### Step 1: Connect to Production Server

```bash
# Replace with your actual server details
ssh user@your-production-server.com
```

### Step 2: Navigate to API Directory

```bash
# Find the cohortle-api directory
cd /path/to/cohortle-api

# Verify you're in the right place
ls -la diagnose-database-roles.js
```

### Step 3: Run Diagnostic Script

```bash
# Run the diagnostic
node diagnose-database-roles.js

# OR save output to file
node diagnose-database-roles.js > diagnostic-output-$(date +%Y%m%d-%H%M%S).txt 2>&1
```

### Step 4: Review Output

The script will display:
- ✅ Green checkmarks for healthy components
- ⚠️ Warnings for issues that need attention
- ❌ Errors for critical problems

### Step 5: Copy Output

```bash
# If you saved to file, view it
cat diagnostic-output-*.txt

# Copy to local machine for documentation
scp user@server:/path/to/diagnostic-output-*.txt ./
```

## Method 2: Via Coolify Console

### Step 1: Access Coolify

1. Log into your Coolify dashboard
2. Navigate to your cohortle-api service
3. Click "Console" or "Terminal" button

### Step 2: Run Diagnostic

```bash
# You should already be in /app directory
pwd  # Should show /app

# Run the diagnostic
node diagnose-database-roles.js
```

### Step 3: Copy Output

- Select and copy the terminal output
- Paste into a local text file for documentation

## Method 3: Via Database Client (Alternative)

If you have direct database access via phpMyAdmin or MySQL Workbench:

### Step 1: Access Database

1. Open phpMyAdmin or MySQL Workbench
2. Connect to the production database
3. Select the `cohortle` database

### Step 2: Run SQL Queries

Copy and paste queries from `cohortle-api/diagnose-database-roles.sql`:

```sql
-- Check users without role assignments
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

-- Check role distribution
SELECT 
  r.name as role,
  COUNT(ura.id) as user_count
FROM roles r
LEFT JOIN user_role_assignments ura ON r.role_id = ura.role_id AND ura.status = 'active'
GROUP BY r.name;

-- Add more queries from the SQL file...
```

## What to Look For

### Critical Issues (Must Fix Immediately)

1. **Users Without Role Assignments**
   ```
   ⚠ WARNING: Found X users without role assignments
   ```
   - **Action:** Run fix script (see below)

2. **Orphaned Foreign Keys**
   ```
   ⚠ WARNING: Found X role assignments with invalid role_id
   ```
   - **Action:** Manual database cleanup required

3. **Duplicate Active Roles**
   ```
   ⚠ WARNING: Found X users with multiple active role assignments
   ```
   - **Action:** Deactivate duplicate assignments

### Warnings (Should Investigate)

1. **Delayed Role Assignments**
   ```
   ⚠ Found X users with delayed role assignment (>5 seconds)
   ```
   - **Note:** May indicate transaction issues

2. **Inactive Assignments**
   ```
   Found X inactive role assignments
   ```
   - **Note:** Normal if users had role changes

### Healthy Indicators

```
✓ Database connection successful
✓ All users have role assignments
✓ No duplicate active role assignments
✓ All role assignments have valid foreign keys
✓ Database role system is healthy
```

## If Issues Are Found

### Fix Users Without Roles

```bash
# On production server
cd /path/to/cohortle-api

# Run the fix script
node scripts/fix-users-without-roles.js

# Verify fix worked
node diagnose-database-roles.js
```

### Fix Duplicate Role Assignments

```sql
-- Find duplicates
SELECT user_id, COUNT(*) as count
FROM user_role_assignments
WHERE status = 'active'
GROUP BY user_id
HAVING COUNT(*) > 1;

-- For each user with duplicates, keep the most recent and deactivate others
UPDATE user_role_assignments
SET status = 'inactive'
WHERE id IN (
  SELECT id FROM (
    SELECT id
    FROM user_role_assignments
    WHERE user_id = [USER_ID] AND status = 'active'
    ORDER BY assigned_at DESC
    LIMIT 999 OFFSET 1
  ) AS subquery
);
```

### Fix Orphaned Records

```sql
-- Remove role assignments with invalid role_id
DELETE FROM user_role_assignments
WHERE role_id NOT IN (SELECT role_id FROM roles);

-- Remove role assignments with invalid user_id
DELETE FROM user_role_assignments
WHERE user_id NOT IN (SELECT id FROM users);
```

## Document Your Findings

Create a findings report with:

### 1. Summary Statistics

```markdown
## Database Diagnostic Results - [Date]

### Overview
- Total users: [number]
- Users with roles: [number]
- Users without roles: [number]
- Database health: [Healthy/Issues Found/Critical]

### Role Distribution
- student: [number] users
- convener: [number] users
- administrator: [number] users
```

### 2. Issues Found

```markdown
### Issues Identified

1. **[Issue Type]**
   - Severity: [Critical/Warning/Info]
   - Count: [number]
   - Description: [details]
   - Action Taken: [what you did]

2. **[Issue Type]**
   - ...
```

### 3. Actions Taken

```markdown
### Fixes Applied

1. **[Fix Description]**
   - Script: [script name]
   - Result: [success/failure]
   - Verification: [how you verified]

2. **[Fix Description]**
   - ...
```

### 4. Final Status

```markdown
### Final Database State

After fixes:
- Users without roles: 0
- Duplicate assignments: 0
- Orphaned records: 0
- Database health: ✅ Healthy

Ready to proceed to Phase 2: Backend API Audit
```

## Troubleshooting

### Error: Cannot connect to database

```
Error: ECONNREFUSED
```

**Solution:**
- Verify you're on the production server
- Check `.env` file has correct credentials
- Ensure database service is running

### Error: Module not found

```
Error: Cannot find module './models'
```

**Solution:**
```bash
# Install dependencies
npm install

# Try again
node diagnose-database-roles.js
```

### Error: Permission denied

```
Error: EACCES: permission denied
```

**Solution:**
```bash
# Run with appropriate permissions
sudo node diagnose-database-roles.js

# Or fix file permissions
chmod +x diagnose-database-roles.js
```

## Next Steps

After running diagnostics:

1. ✅ **Document findings** in `DATABASE_DIAGNOSTICS_FINDINGS_TASK_1.2.md`
2. ✅ **Fix any issues** found (Task 1.3)
3. ✅ **Re-run diagnostics** to verify fixes (Task 1.4)
4. ✅ **Proceed to Phase 2** (Backend API Audit)

## Quick Reference Commands

```bash
# Run diagnostic
node diagnose-database-roles.js

# Run diagnostic and save output
node diagnose-database-roles.js > diagnostic-output.txt 2>&1

# Run fix script
node scripts/fix-users-without-roles.js

# Verify fix
node diagnose-database-roles.js | grep "Users without roles"

# Check specific user
node -e "const db = require('./models'); db.sequelize.query('SELECT u.email, r.name FROM users u LEFT JOIN user_role_assignments ura ON u.id = ura.user_id LEFT JOIN roles r ON ura.role_id = r.role_id WHERE u.email = \"user@example.com\"', {type: db.sequelize.QueryTypes.SELECT}).then(console.log).finally(() => process.exit())"
```

## Support

If you encounter issues:

1. Check the error message carefully
2. Verify you're on the production server
3. Ensure database is accessible
4. Check `.env` configuration
5. Review the diagnostic script code

---

**Task:** 1.2 Run database diagnostics and document findings  
**Status:** Ready to execute on production server  
**Estimated Time:** 5-10 minutes  
**Next Task:** 1.3 Fix missing role assignments (if needed)
