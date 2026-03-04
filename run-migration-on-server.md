# Run Migration on Production Server

## ✅ Script Already Created

The migration script `run-production-migration.js` is ready to use.

## Option 1: Run via Coolify Console (RECOMMENDED)

This is the simplest and safest method:

1. **Open Coolify Dashboard**
   - Go to your Coolify instance
   - Navigate to the `cohortle-api` service

2. **Open Terminal/Console**
   - Click on "Terminal" or "Console" button
   - This opens a shell inside the running container

3. **Run the migration:**
   ```bash
   cd /app/cohortle-api
   npm run migrate
   ```

4. **Expected Output:**
   ```
   🔍 Checking for existing foreign key constraint...
   ✅ No orphaned cohorts found
   📝 Adding foreign key constraint...
   ✅ Foreign key constraint added successfully
   ✅ Migration completed successfully
   ```

## Option 2: Run Locally (Requires Database Access)

If you want to run from your local machine, you need to update the database connection:

1. **Create a production environment file:**
   ```bash
   # Create cohortle-api/.env.production
   DB_HOSTNAME=107.175.94.134
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=ergKTYj00ZjjTRb1iWC3BW79oPN6uFe9A34FrF409EwZAjaWwJUI6k5OcCV6w1um
   DB_DATABASE=cohortle
   NODE_ENV=production
   ```

2. **Update the script to use production env:**
   Modify `run-production-migration.js` line 10:
   ```javascript
   require('./cohortle-api/node_modules/dotenv').config({ path: './cohortle-api/.env.production' });
   ```

3. **Run the script:**
   ```bash
   node run-production-migration.js
   ```

## Option 3: Direct Database Migration (Advanced)

If you have direct database access:

1. **Connect to production database:**
   ```bash
   mysql -h 107.175.94.134 -P 3306 -u root -p cohortle
   ```

2. **Run the migration SQL manually** (see migration file for SQL)

## Current Status

- ✅ Migration file created: `cohortle-api/migrations/20260302000010-add-cohort-programme-foreign-key.js`
- ✅ Script created: `run-production-migration.js`
- ✅ Code deployed to GitHub (commits `7fbbce7` and `d51fa63`)
- ⏳ Waiting for Coolify to deploy
- ⏳ Migration needs to be run

## What the Migration Does

1. Checks if foreign key constraint already exists (idempotent)
2. Checks for orphaned cohorts (cohorts with invalid programme_id)
3. Adds foreign key constraint: `cohorts.programme_id` → `programmes.id`
4. Prevents:
   - Creating cohorts with non-existent programme_id
   - Deleting programmes that have cohorts
   - Data integrity issues

## Troubleshooting

### If migration fails with "orphaned cohorts" error:

1. **Find orphaned cohorts:**
   ```sql
   SELECT c.id, c.name, c.programme_id, c.enrollment_code
   FROM cohorts c
   LEFT JOIN programmes p ON c.programme_id = p.id
   WHERE p.id IS NULL;
   ```

2. **Fix them:**
   - Option A: Update to valid programme_id
   - Option B: Delete orphaned cohorts

3. **Run migration again**

### If migration fails with "constraint already exists":

This is fine - the migration is idempotent and will skip if already applied.

## Next Steps After Migration

1. ✅ Verify migration succeeded (check output)
2. Test cohort creation in production
3. Verify programme context banner appears
4. Verify confirmation dialog works
5. Monitor for 24-48 hours

## Recommendation

**Use Option 1 (Coolify Console)** - it's the safest and simplest method because:
- Runs directly on the server (no network issues)
- Uses the correct database connection automatically
- No need to expose database to external connections
- Matches the deployment environment exactly
