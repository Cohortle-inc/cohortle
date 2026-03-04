# Profile Page Error - Summary & Solutions

## Current Situation

The profile page is showing an error because it requires database tables that don't exist yet. However, your local MySQL server is not running (or not installed).

## Root Cause

The ProfileService needs these tables:
- `user_preferences` - For notification settings
- `learning_goals` - For learning goal tracking
- `user_achievements` - For achievement badges
- `achievements` - Achievement definitions
- `lesson_completions` - For tracking completed lessons

## Solutions (Choose One)

### Solution 1: Install and Start MySQL Locally (Recommended for Development)

1. **Install MySQL:**
   - Download from: https://dev.mysql.com/downloads/installer/
   - Or use Chocolatey: `choco install mysql`

2. **Start MySQL Service:**
   ```powershell
   Start-Service -Name MySQL80
   ```

3. **Create Database:**
   ```sql
   mysql -u root -p
   CREATE DATABASE cohortle;
   exit;
   ```

4. **Run Migrations:**
   ```powershell
   .\run-local-migrations.ps1
   ```

### Solution 2: Use Remote Database (If Available)

If you have access to a remote database, update `cohortle-api/.env`:

```env
NODE_ENV=development
DB_HOSTNAME=your-remote-host
DB_PORT=3306
DB_USER=your-username
DB_PASSWORD=your-password
DB_DATABASE=cohortle
```

Then run:
```powershell
cd cohortle-api
npm run migrate
```

### Solution 3: Temporary Fix - Use Fallback Values

The ProfileService already has fallback handling for missing tables. The error might be something else. Let's diagnose:

```powershell
# Check what the actual error is
# Open browser DevTools (F12) and navigate to /profile/settings
# Look at the Console and Network tabs for the actual error
```

## Quick Diagnostic

To see the exact error, check:

1. **Browser Console** (F12 → Console tab)
   - Look for JavaScript errors
   - Look for failed API requests

2. **Network Tab** (F12 → Network tab)
   - Navigate to `/profile/settings`
   - Check which API call is failing
   - Click on the failed request to see the error response

3. **API Server Logs**
   - If your API server is running, check its console output
   - Look for error messages when you access the profile page

## Alternative: Skip Profile Features Temporarily

If you need to continue development without the profile features, you can modify the ProfileService to return mock data:

1. Edit `cohortle-api/services/ProfileService.js`
2. Add a check at the top of each method to return mock data if tables don't exist

But this is not recommended for production.

## What Error Are You Actually Seeing?

Please provide:
1. The exact error message from the browser console
2. The HTTP status code (from Network tab)
3. Any error messages from the API server logs

This will help me provide a more specific fix.

## Common Error Messages & Fixes

### "Failed to fetch profile"
- API server not running → Start it: `cd cohortle-api && npm start`
- CORS error → Check proxy configuration
- 500 error → Check API server logs

### "User not found"
- Not logged in → Log in first
- Invalid token → Clear cookies and log in again

### "Cannot connect to database"
- MySQL not running → Start MySQL service
- Wrong credentials → Check config/config.js

### Page shows loading spinner forever
- API request hanging → Check Network tab
- JavaScript error → Check Console tab

## Next Steps

1. Tell me what error you see in the browser
2. Or install MySQL and run migrations
3. Or use a remote database if available
