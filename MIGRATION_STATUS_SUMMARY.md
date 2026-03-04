# Migration Status Summary

## Current Situation

The production logs show a migration error, but it's **not the root cause** of the problems.

---

## Migration Error - FIXED ✅

**Error:**
```
ERROR: Duplicate column name 'visibility_scope'
Migration: 20260220000000-add-post-visibility-scope
```

**Status:** ✅ **FIXED** - Migration is now idempotent

**What Was Done:**
- Added existence checks for `visibility_scope` and `cohort_id` columns
- Wrapped index creation in try-catch blocks
- Migration now skips gracefully if columns/indexes already exist
- Committed and pushed to production (commit: de0ffe7)

**Impact:** This fix allows Sequelize to continue past this migration and run the WLIMP migrations that follow.

---

## Real Problem: Database Authentication

**Error:**
```
ERROR: Access denied for user 'mysql'@'10.0.1.11' (using password: YES)
```

**Impact:** 🔴 **CRITICAL** - Prevents WLIMP migrations from running

**What's Blocked:**
- `20260301000000-create-wlimp-weeks.js`
- `20260301000001-create-wlimp-lessons.js`
- `20260301000002-create-wlimp-enrollments.js`
- `20260301000003-add-enrollment-code-to-cohorts.js` ← **This is what we need!**

**Status:** These migrations are idempotent (they check for existence), but they can't run because database connection fails.

---

## WLIMP Migration Status

### Migration: 20260301000003-add-enrollment-code-to-cohorts.js

**This migration IS idempotent:**
```javascript
// Check if enrollment_code column already exists
const [columns] = await queryInterface.sequelize.query(
    `SHOW COLUMNS FROM cohorts LIKE 'enrollment_code'`
);

if (columns.length === 0) {
    await queryInterface.addColumn('cohorts', 'enrollment_code', {
        // ... column definition
    });
}
```

**Status:** ✅ Safe to run multiple times
**Problem:** ❌ Can't run due to database authentication failure

---

## Fix Priority

### 1. Restart API Service (REQUIRED)

The idempotent migration fix has been deployed. Now restart the API service:

1. Go to Coolify dashboard
2. Find `cohortle-api` service
3. Click "Restart" button
4. Wait for deployment to complete
5. Check logs to verify:
   - Database connection succeeds
   - visibility_scope migration completes without error
   - All 4 WLIMP migrations run successfully

### 2. Migrations Will Auto-Run

Once database authentication is fixed:
- API restart will trigger migrations automatically
- WLIMP migrations will run (they're idempotent)
- `enrollment_code` column will be added to `cohorts` table
- Cohort creation will work

### 3. Optional: Verify Migration Status

After restart, check the logs for these success messages:

```
✅ Migration 20260220000000-add-post-visibility-scope completed
✅ Migration 20260301000000-create-wlimp-weeks completed
✅ Migration 20260301000001-create-wlimp-lessons completed
✅ Migration 20260301000002-create-wlimp-enrollments completed
✅ Migration 20260301000003-add-enrollment-code-to-cohorts completed
```

---

## Summary

**Migration Fix:**
- ✅ `visibility_scope` migration - Now idempotent, deployed to production

**Critical Blocker:**
- ❌ Database authentication - Prevents WLIMP migrations from running

**Next Steps:**
1. Restart API service in Coolify to trigger migrations with the idempotent fix
2. Verify in logs that the visibility_scope migration completes without error
3. Verify WLIMP migrations run successfully
4. Test cohort creation at `https://cohortle.com/convener/programmes/10/cohorts/new`

**Expected Result:**
- Database connects successfully (credentials already fixed by user)
- visibility_scope migration skips gracefully (columns exist)
- WLIMP migrations run automatically
- `enrollment_code` column added
- Cohort creation works
- Programme publish works (already fixed in code)
