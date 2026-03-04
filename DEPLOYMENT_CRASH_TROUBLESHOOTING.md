# Deployment Crash Troubleshooting

## Issue: Server Keeps Restarting (Not Running Green)

The application is in a restart loop, which means there's likely a critical error preventing it from starting.

## Step 1: Check Coolify Logs (CRITICAL)

1. Open Coolify dashboard
2. Navigate to `cohortle-api` application
3. Click on "Logs" tab
4. Look for error messages - especially:
   - **Syntax errors** (missing commas, brackets, etc.)
   - **Module not found** errors
   - **Database connection** errors
   - **Port binding** errors

## Common Errors to Look For:

### Error 1: Syntax Error
```
SyntaxError: Unexpected token
```
**Cause**: Code syntax issue in one of our new files
**Solution**: Check the file mentioned in the error

### Error 2: Module Not Found
```
Error: Cannot find module './services/AccessControlService'
```
**Cause**: File path issue or missing file
**Solution**: Verify file exists and path is correct

### Error 3: Database Connection
```
Error: connect ECONNREFUSED
SequelizeConnectionError
```
**Cause**: Can't connect to database
**Solution**: Check database is running and credentials are correct

### Error 4: Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Cause**: Port conflict
**Solution**: Restart the application or change port

## Step 2: Quick Rollback (If Needed)

If the error is critical and you need the app running immediately:

```bash
# SSH into your server or use Coolify terminal
cd /path/to/cohortle-api

# Rollback to previous commit
git revert HEAD --no-edit

# Or reset to previous commit
git reset --hard HEAD~1

# Force push (be careful!)
git push origin main --force
```

Then redeploy in Coolify.

## Step 3: Check Specific Files

Based on what we changed, check these files for errors:

### 1. Check AccessControlService.js
```bash
# In Coolify terminal or SSH
cd /path/to/cohortle-api
node -c services/AccessControlService.js
```

### 2. Check ProgressService.js
```bash
node -c services/ProgressService.js
```

### 3. Check routes/post.js
```bash
node -c routes/post.js
```

### 4. Check routes/lesson.js
```bash
node -c routes/lesson.js
```

## Step 4: Test Locally (If Possible)

If you can run the backend locally:

```bash
cd c:\Users\Sal\Desktop\CODEBASE\cohortle-api

# Install dependencies
npm install

# Try to start the server
npm start
```

This will show you the exact error.

## Step 5: Common Fixes

### Fix 1: Missing Comma in Object/Array
Look for missing commas in:
- `routes/post.js`
- `routes/lesson.js`
- `services/AccessControlService.js`

### Fix 2: Incorrect Require Path
Check all `require()` statements in new files:
```javascript
// Should be:
const AccessControlService = require('../services/AccessControlService');

// Not:
const AccessControlService = require('./services/AccessControlService');
```

### Fix 3: Missing Dependencies
Check if we need to install new packages:
```bash
npm install
```

## Step 6: Specific File Checks

### Check services/AccessControlService.js

Common issues:
- Missing `module.exports`
- Incorrect database model imports
- Syntax errors in SQL queries

### Check routes/post.js

Common issues:
- Missing middleware imports
- Incorrect route definitions
- Async/await syntax errors

### Check services/ProgressService.js

Common issues:
- Missing model imports
- Database query syntax errors

## Step 7: Database Migration Issue

The migrations haven't run yet, so the new columns don't exist. The app might be trying to query columns that don't exist yet.

**Temporary Fix**: Comment out code that uses new columns until migrations run.

## What to Send Me

To help diagnose, please share:

1. **Last 50 lines of Coolify logs**:
   - In Coolify, click "Logs"
   - Copy the last 50 lines
   - Look for lines with "Error" or "Exception"

2. **Build logs** (if deployment failed during build):
   - Check "Build Logs" tab in Coolify

3. **Specific error message**:
   - The exact error text (especially the first error shown)

## Emergency Rollback Commands

If you need to rollback immediately:

### Option 1: Via Git (Recommended)
```bash
# In cohortle-api directory locally
cd c:\Users\Sal\Desktop\CODEBASE\cohortle-api

# Revert the last commit
git revert HEAD --no-edit

# Push
git push origin main
```

Then redeploy in Coolify.

### Option 2: Via Coolify
1. In Coolify, find deployment history
2. Click on previous successful deployment
3. Click "Redeploy this version"

## Most Likely Issues

Based on our changes, the most likely issues are:

1. **Syntax error in AccessControlService.js** - Check for missing commas, brackets
2. **Incorrect require() paths** - Check all `require()` statements
3. **Database query trying to use columns that don't exist yet** - Migrations haven't run
4. **Missing await keyword** - Check all async functions

## Next Steps

1. Check Coolify logs and share the error message
2. I'll help you fix the specific issue
3. We'll either:
   - Fix the code and redeploy, OR
   - Rollback, fix locally, then redeploy

---

**IMPORTANT**: Don't run migrations yet - we need the app running first!
