# Deploy Backend - Step by Step Guide

## Current Status
✅ All code changes are ready in your local repository
✅ Migration file created
✅ Model and routes updated

## Deployment Steps

### Step 1: Commit and Push Changes to GitHub

Open a terminal in the backend directory and run:

```bash
# Navigate to backend
cd c:\Users\Sal\Desktop\CODEBASE\cohortle-api

# Check what files changed
git status

# Add all changes
git add .

# Commit with a clear message
git commit -m "Add lesson type feature - database migration and API updates"

# Push to GitHub
git push origin main
```

### Step 2: Deploy via Coolify

1. Open your Coolify dashboard at your VPS
2. Find your `cohortle-api` application
3. Click "Deploy" or "Redeploy" button
4. Wait for deployment to complete (usually 1-2 minutes)

Coolify will automatically:
- Pull the latest code from GitHub
- Install dependencies
- Restart the application

### Step 3: Run the Migration

After Coolify deploys, you need to run the migration. You have two options:

#### Option A: Via Coolify Terminal (Recommended)
1. In Coolify dashboard, find your cohortle-api application
2. Click on "Terminal" or "Console"
3. Run this command:
   ```bash
   npx sequelize-cli db:migrate
   ```

#### Option B: Via SSH to your VPS
1. SSH into your RackNerd VPS
2. Navigate to your application directory
3. Run:
   ```bash
   npx sequelize-cli db:migrate
   ```

**Expected Output:**
```
== 20260218000000-add-type-to-module-lessons: migrating =======
== 20260218000000-add-type-to-module-lessons: migrated (0.123s)
```

### Step 4: Verify Migration

Check if the migration worked:

```bash
# In Coolify terminal or SSH
npx sequelize-cli db:migrate:status
```

Should show:
```
up 20260218000000-add-type-to-module-lessons.js
```

### Step 5: Test the API

Run the test script from your local machine:

```bash
# Navigate to backend
cd c:\Users\Sal\Desktop\CODEBASE\cohortle-api

# Edit test_lesson_types.bat first:
# - Update TOKEN with a valid auth token
# - Update MODULE_ID with a valid module ID

# Run tests
test_lesson_types.bat
```

Or test manually with curl:

```bash
# Get lessons (should include type field)
curl -X GET https://api.cohortle.com/v1/api/modules/1/lessons ^
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Step 6: Verify in Database (Optional)

If you have database access:

```sql
-- Check the column was added
DESCRIBE module_lessons;

-- Should show 'type' column with VARCHAR(50), default 'video'

-- Check existing lessons
SELECT id, name, type FROM module_lessons LIMIT 10;

-- All should have type = 'video'
```

## Troubleshooting

### Issue: Git push fails
**Solution**: Make sure you're on the correct branch and have push access
```bash
git branch  # Should show 'main' or 'master'
git remote -v  # Should show your GitHub repo
```

### Issue: Coolify deployment fails
**Solution**: Check Coolify logs for errors. Common issues:
- Build errors (check package.json)
- Environment variables missing
- Port conflicts

### Issue: Migration fails with "Column already exists"
**Solution**: The migration may have already run. Check with:
```bash
npx sequelize-cli db:migrate:status
```

### Issue: Migration fails with "Cannot connect to database"
**Solution**: Check database credentials in your .env file or Coolify environment variables

### Issue: API returns 500 error after deployment
**Solution**: 
1. Check application logs in Coolify
2. Verify migration ran successfully
3. Restart the application

## Quick Checklist

- [ ] Commit changes to git
- [ ] Push to GitHub
- [ ] Deploy via Coolify
- [ ] Run migration via Coolify terminal
- [ ] Verify migration status
- [ ] Test API endpoint
- [ ] Check application logs

## What Happens Next?

After successful deployment:
1. ✅ Backend is ready with lesson type support
2. ⏳ Build frontend mobile app with EAS
3. ⏳ Test on your phone

## Need Help?

If you encounter issues:
1. Check Coolify application logs
2. Check database connection
3. Verify migration status
4. Test API endpoints manually

---

**Ready?** Start with Step 1: Commit and push your changes to GitHub!
