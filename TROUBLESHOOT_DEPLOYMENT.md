# Troubleshooting Deployment Issues

## Current Status
- ✅ Backend code deployed to Coolify
- ❌ Migration failing with errors
- ❌ API not responding (404 errors)

## Issues Identified

### 1. Migration Errors
The logs show multiple migration attempts with errors. This suggests:
- Database connection issues
- Migration running multiple times
- Possible environment variable problems

### 2. API Not Responding
- `https://api.cohortle.com/` returns 404
- This suggests the application isn't starting properly

## Immediate Actions Needed

### Step 1: Check Application Status in Coolify
1. Go to Coolify dashboard
2. Check if `cohortle-api` application is actually running
3. Look for any error messages in the application logs

### Step 2: Check Environment Variables
The migration logs show it's using "development" environment. Verify:
1. Database connection string is correct
2. Environment variables are properly set
3. Database credentials are valid

### Step 3: Manual Migration (Alternative)
If Coolify migration keeps failing, try manual approach:

1. **SSH into your VPS**
2. **Navigate to app directory**
3. **Run migration manually**:
   ```bash
   cd /path/to/your/app
   NODE_ENV=production npx sequelize-cli db:migrate
   ```

### Step 4: Check Database Connection
Test if the app can connect to the database:
```bash
# In your app directory
node -e "
const config = require('./config/config.js');
console.log('Database config:', config.production || config.development);
"
```

## Quick Fixes to Try

### Fix 1: Restart Application
In Coolify:
1. Stop the application
2. Start it again
3. Check logs for startup errors

### Fix 2: Check Database
1. Verify MySQL is running
2. Check database credentials
3. Test connection manually

### Fix 3: Environment Check
Make sure these environment variables are set:
- `DB_HOST`
- `DB_USER` 
- `DB_PASSWORD`
- `DB_NAME`
- `NODE_ENV=production`

## Alternative: Skip Migration for Now

If migration keeps failing, we can:
1. Build the mobile app without the lesson types feature
2. Fix the backend migration later
3. The app will still work with existing functionality

## Next Steps

1. **Check Coolify application status**
2. **Review application logs for startup errors**
3. **Verify database connection**
4. **Try manual migration if needed**

Let me know what you see in the Coolify dashboard and we'll fix this step by step!