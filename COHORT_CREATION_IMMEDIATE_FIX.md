# Cohort Creation - Immediate Fix Required

## Current Issue

Cohort creation is failing with:
- **400 error** when checking enrolment code availability
- **500 error** when creating cohort

## Root Cause

The `enrollment_code` column migration hasn't run on the production database yet.

## Immediate Solutions

### Option 1: Wait for Auto-Migration (Recommended)

The backend has auto-migration enabled. The migration should run automatically on the next deployment. 

**Status**: Backend was just deployed with the fix. Migration should run within 5-10 minutes.

### Option 2: Manual Migration (If Urgent)

If you need immediate access, run the migration manually:

1. **Via Coolify Terminal** (if available):
   ```bash
   npm run migrate
   ```

2. **Via SSH** (if you have server access):
   ```bash
   ssh user@your-server
   cd /path/to/cohortle-api
   npm run migrate
   ```

3. **Via Database Direct** (last resort):
   ```sql
   ALTER TABLE cohorts ADD COLUMN enrollment_code VARCHAR(50) NULL UNIQUE AFTER name;
   CREATE UNIQUE INDEX idx_cohorts_enrollment_code ON cohorts(enrollment_code);
   ```

### Option 3: Force Redeploy

Force a new deployment in Coolify to trigger auto-migration:

1. Go to Coolify dashboard
2. Find `cohortle-api` application  
3. Click **"Redeploy"**
4. Wait for deployment to complete
5. Check logs for migration output

## Expected Migration Output

When the migration runs, you should see in the deployment logs:

```
Running Sequelize migrations...
Sequelize CLI [Node: 20.20.0, CLI: 6.6.2, ORM: 6.37.7]

== 20260301000003-add-enrollment-code-to-cohorts: migrating =======
== 20260301000003-add-enrollment-code-to-cohorts: migrated (0.123s)

Starting application...
```

## Verification Steps

After migration runs:

1. **Test enrollment code check**:
   ```
   GET https://api.cohortle.com/v1/api/enrollment-codes/check?code=TEST-2026-ABC123
   ```
   Should return `200 OK` with `{"available": true}`

2. **Test cohort creation**:
   Create a cohort through the frontend - should work without errors

3. **Check database**:
   ```sql
   DESCRIBE cohorts;
   -- Should show enrollment_code column
   ```

## Timeline

- **Backend deployed**: Just now with enrollment_code fix
- **Migration should run**: Within 5-10 minutes automatically
- **Issue should resolve**: Once migration completes

## Monitoring

Watch the Coolify deployment logs for:
- ✅ Migration success messages
- ❌ Any migration errors
- 🔄 Application restart confirmation

## Next Steps

1. **Wait 10 minutes** for auto-migration
2. **Test cohort creation** again
3. **If still failing**, try Option 2 or 3 above
4. **Report back** with results

## Files Changed

- ✅ `cohortle-api/routes/cohort.js` - Added enrollment_code handling
- ✅ `cohortle-api/migrations/20260301000003-add-enrollment-code-to-cohorts.js` - Migration exists
- ✅ Auto-migration enabled in deployment

The fix is deployed, just waiting for the migration to run!