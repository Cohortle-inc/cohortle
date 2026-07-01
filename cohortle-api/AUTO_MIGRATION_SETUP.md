# Auto-Migration Setup Complete ✅

## What Changed

Your backend now automatically runs database migrations on every deployment!

## How It Works

### 1. Docker Entrypoint Script
The `docker-entrypoint.sh` file now runs migrations before starting the app:

```bash
npx sequelize-cli db:migrate
```

This happens automatically when:
- Coolify deploys your app
- Docker container starts
- Application restarts

### 2. Safety Features

**Graceful Failure**: If migrations fail, the app still starts (with a warning). This prevents deployment failures from old/duplicate migrations.

**Idempotent**: Sequelize tracks which migrations have run. Running the same migration twice is safe - it will skip already-completed migrations.

### 3. New NPM Scripts

You can now run these commands manually if needed:

```bash
# Run pending migrations
npm run migrate

# Check migration status
npm run migrate:status

# Rollback last migration
npm run migrate:undo
```

## Deployment Process

### Step 1: Commit and Push Changes

```bash
cd cohortle-api
git add .
git commit -m "feat: enable auto-migrations on deployment"
git push origin main
```

### Step 2: Deploy in Coolify

1. Open Coolify dashboard
2. Find `cohortle-api` application
3. Click **"Deploy"** or **"Redeploy"**
4. Wait for deployment to complete

### Step 3: Verify Migrations Ran

Check the deployment logs in Coolify. You should see:

```
Running Sequelize migrations...
Sequelize CLI [Node: 20.20.0, CLI: 6.6.2, ORM: 6.37.7]

Loaded configuration file "config/config.js".
Using environment "production".
== 20260218000000-add-type-to-module-lessons: migrating =======
== 20260218000000-add-type-to-module-lessons: migrated (0.123s)

== 20260220000000-add-post-visibility-scope: migrating =======
== 20260220000000-add-post-visibility-scope: migrated (0.234s)

Starting application...
Server running on port 3000
```

## What Gets Migrated

### Migration 1: Lesson Types
- Adds `type` column to `module_lessons` table
- Default value: `'video'`
- Supports: text, video, pdf, live_session, link, assignment, quiz, form, reflection, practical_task

### Migration 2: Post Access Control
- Adds `visibility_scope` column to `posts` table (ENUM: 'community', 'cohort')
- Adds `cohort_id` column to `posts` table (nullable)
- Default visibility: `'community'`

## Troubleshooting

### Issue: "Column already exists"

**Cause**: Migration already ran (maybe manually or in a previous deployment)

**Solution**: This is fine! Sequelize will skip it. Check logs for:
```
No migrations were executed, database schema was already up to date.
```

### Issue: "Cannot connect to database"

**Cause**: Database credentials missing or incorrect

**Solution**: 
1. Check Coolify environment variables
2. Verify `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` are set
3. Test database connection from Coolify terminal

### Issue: Migration fails but app starts

**Cause**: The entrypoint script allows app to start even if migration fails

**Solution**:
1. Check deployment logs for specific error
2. Fix the issue
3. Redeploy or run migration manually

### Issue: Need to rollback a migration

**Solution**: SSH into server or use Coolify terminal:
```bash
npm run migrate:undo
```

## Benefits of Auto-Migration

✅ **No manual steps** - Migrations run automatically on deployment  
✅ **Consistent** - Same process every time  
✅ **Safe** - Idempotent (can run multiple times safely)  
✅ **Tracked** - Sequelize logs which migrations have run  
✅ **Rollback-friendly** - Easy to undo if needed  

## Future Deployments

From now on, whenever you:
1. Create a new migration file
2. Commit and push to GitHub
3. Deploy in Coolify

The migration will run automatically! No manual intervention needed.

## Verification Commands

After deployment, you can verify migrations ran:

**Via Coolify Terminal** (if it works):
```bash
npm run migrate:status
```

**Via SSH**:
```bash
ssh user@your-server
cd /path/to/cohortle-api
npm run migrate:status
```

**Expected Output**:
```
up 20260218000000-add-type-to-module-lessons.js
up 20260220000000-add-post-visibility-scope.js
```

## Database Verification

You can also verify directly in the database:

```sql
-- Check lesson type column
DESCRIBE module_lessons;
-- Should show 'type' column

-- Check post visibility columns
DESCRIBE posts;
-- Should show 'visibility_scope' and 'cohort_id' columns

-- Check migration tracking table
SELECT * FROM SequelizeMeta;
-- Should show both migration files
```

## Next Steps

1. Commit and push these changes
2. Deploy in Coolify
3. Check deployment logs to confirm migrations ran
4. Test API endpoints to verify everything works

---

**Ready to deploy?** Follow the steps above and migrations will run automatically!
