# Profile Page Error - Quick Fix

## The Problem

The profile page is failing because required database tables don't exist yet. The ProfileService needs these tables:
- `user_preferences` - For notification settings
- `learning_goals` - For learning goal tracking  
- `user_achievements` - For achievement badges
- `achievements` - Achievement definitions

## Quick Fix - Run Migrations Locally

### Option 1: Use the PowerShell Script (Recommended)

```powershell
.\run-local-migrations.ps1
```

This will run migrations on your local MySQL database (127.0.0.1).

### Option 2: Manual Command

```powershell
cd cohortle-api
$env:NODE_ENV='local'
npx sequelize-cli db:migrate
```

### Option 3: If You Want to Use Development Environment

First, make sure your development database is accessible, then:

```powershell
cd cohortle-api
$env:NODE_ENV='development'
npx sequelize-cli db:migrate
```

## After Running Migrations

1. Restart your API server:
   ```powershell
   cd cohortle-api
   npm start
   ```

2. Test the profile page:
   - Navigate to `/profile/settings` in your browser
   - The page should now load without errors

## Verify It Worked

Run the diagnostic script:
```powershell
node diagnose-profile-error.js
```

You should see:
- ✅ All tables exist
- ✅ getUserProfile successful
- ✅ getPreferences successful
- ✅ getLearningGoal successful
- ✅ getUserAchievements successful

## What These Migrations Create

The migrations will create these tables:

1. **lesson_completions** - Tracks which lessons users have completed
2. **lesson_comments** - Stores comments on lessons
3. **cohort_posts** - Community posts within cohorts
4. **post_comments** - Comments on community posts
5. **user_preferences** - User notification preferences
6. **learning_goals** - User-defined learning goals
7. **achievements** - Achievement definitions
8. **user_achievements** - Achievements earned by users

## Troubleshooting

### "Cannot connect to MySQL server"

Make sure MySQL is running:
```powershell
# Check if MySQL service is running
Get-Service -Name MySQL*
```

If not running, start it:
```powershell
Start-Service -Name MySQL80  # or your MySQL service name
```

### "Access denied for user 'root'"

Update your local database credentials in `cohortle-api/config/config.js`:
```javascript
local: {
  username: "root",
  password: "your-actual-password",  // Update this
  database: "cohortle",
  host: "127.0.0.1",
  dialect: "mysql",
}
```

### "Database 'cohortle' doesn't exist"

Create the database first:
```sql
mysql -u root -p
CREATE DATABASE cohortle;
exit;
```

Then run migrations again.

## Production Note

Your `.env` file currently has `NODE_ENV=production` which tries to connect to a remote database. For local development:

1. Either change it to `NODE_ENV=local` in the `.env` file
2. Or use the scripts above which temporarily override the environment

## Next Steps

Once migrations are complete, the profile page should work perfectly. The ProfileService has built-in fallback handling, so even if some tables are missing, it will return default values instead of crashing.
