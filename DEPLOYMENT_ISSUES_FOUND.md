# Deployment Issues Found & Fixes Required

## Summary
Both services are deployed with the correct code (commit 068c709), but there are critical configuration issues preventing the app from working correctly.

---

## 🔴 CRITICAL ISSUES FOUND

### Issue 1: cohortle-api - Wrong NODE_ENV
**Current Value:** `development`  
**Required Value:** `production`

**Impact:** 
- API is running in development mode in production
- May cause performance issues
- Verbose logging
- Different behavior than expected

**Fix:** In Coolify, change `NODE_ENV` from `development` to `production`

---

### Issue 2: cohortle-api - Wrong DB_DATABASE Value
**Current Value:** `cohortle.com`  
**Required Value:** Should be the actual database name (likely `cohortle` or similar)

**Impact:**
- API is trying to connect to a database named "cohortle.com" which doesn't exist
- This is why you're getting 400 errors when loading programmes
- All database queries are failing

**Fix:** In Coolify, change `DB_DATABASE` to the correct production database name

---

### Issue 3: cohortle-web - NEXT_PUBLIC_API_URL Not Available at Build Time
**Current Setting:** Only available at runtime  
**Required Setting:** Must be available at BOTH build time AND runtime

**Impact:**
- Next.js cannot embed the API URL into the built JavaScript files
- The app might not know where to send API requests
- This is likely why the Continue Learning button and other features aren't working

**Fix:** In Coolify, change `NEXT_PUBLIC_API_URL` to be available at BOTH build time AND runtime

---

## ✅ CORRECT CONFIGURATION

### cohortle-api Environment Variables:
```bash
DB_HOSTNAME=u08gs4kgcogg8kc4k44s0ggk
DB_PORT=3306
DB_USER=<your-db-user>
DB_PASSWORD=<your-db-password>
DB_DATABASE=<actual-database-name>  # ❌ NOT "cohortle.com"
NODE_ENV=production                  # ❌ NOT "development"
JWT_SECRET=<your-jwt-secret>
BUNNY_STREAM_API_KEY=<your-key>
BUNNY_STREAM_LIBRARY_ID=<your-id>

# All should be: Available at Build Time AND Runtime
```

### cohortle-web Environment Variables:
```bash
NEXT_PUBLIC_API_URL=https://api.cohortle.com

# Must be: Available at Build Time AND Runtime
```

---

## 📋 STEP-BY-STEP FIX INSTRUCTIONS

### Step 1: Fix cohortle-api Configuration

1. Go to Coolify → cohortle-api service → Environment Variables
2. Find `NODE_ENV` and change value from `development` to `production`
3. Find `DB_DATABASE` and change value from `cohortle.com` to your actual database name
   - Check your database server to confirm the correct database name
   - It's probably something like: `cohortle`, `cohortle_production`, or `cohortle_prod`
4. Ensure all variables are set to "Available at Build Time AND Runtime"
5. Save changes

### Step 2: Fix cohortle-web Configuration

1. Go to Coolify → cohortle-web service → Environment Variables
2. Find `NEXT_PUBLIC_API_URL`
3. Change availability from "Runtime only" to "Build Time AND Runtime"
4. Save changes

### Step 3: Redeploy Both Services

1. **Clear build cache** for both services (if option available)
2. **Redeploy cohortle-api** first
3. Wait for deployment to complete
4. **Redeploy cohortle-web** second
5. Wait for deployment to complete

### Step 4: Verify the Fix

1. **Hard refresh browser** (Ctrl+Shift+R or Cmd+Shift+R)
2. **Test the application:**
   - Login should work
   - Dashboard should load programmes
   - Programme pages should show Continue Learning button
   - No 400 errors in browser console

---

## 🔍 HOW TO FIND YOUR CORRECT DATABASE NAME

If you're not sure what the correct `DB_DATABASE` value should be:

### Option 1: Check Database Server
1. Connect to your database server using the hostname: `u08gs4kgcogg8kc4k44s0ggk`
2. Run: `SHOW DATABASES;`
3. Look for a database named `cohortle`, `cohortle_production`, or similar
4. Use that name for `DB_DATABASE`

### Option 2: Check Coolify Database Service
1. Go to Coolify → Databases
2. Find your MySQL/MariaDB database
3. Check the database name configured there
4. Use that name for `DB_DATABASE`

### Option 3: Check Previous Deployments
1. Look at your database backup files or migration scripts
2. The database name should be referenced there

---

## ⚠️ IMPORTANT NOTES

### About NEXT_PUBLIC_* Variables
- Any environment variable starting with `NEXT_PUBLIC_` MUST be available at build time
- Next.js embeds these values into the JavaScript bundle during build
- If only available at runtime, the app won't have access to them
- This is why your Continue Learning button isn't working

### About NODE_ENV
- `NODE_ENV=production` is critical for production deployments
- It affects:
  - Performance optimizations
  - Error handling
  - Logging verbosity
  - Security features
  - Caching behavior

### About DB_DATABASE
- The value `cohortle.com` is definitely wrong
- Database names cannot contain dots (.)
- This is causing all your database queries to fail
- This is why you're seeing 400 errors

---

## 🎯 EXPECTED OUTCOME AFTER FIX

Once you make these changes and redeploy:

✅ API will connect to the correct database  
✅ No more 400 errors when loading programmes  
✅ Continue Learning button will appear on programme pages  
✅ Role detection will work correctly  
✅ All links will work properly  
✅ Create programme functionality will work  
✅ App will run in production mode with proper optimizations  

---

## 📞 NEXT STEPS

1. **Make the configuration changes** listed above
2. **Redeploy both services** with cache clearing
3. **Test the application** after deployment
4. **Report back** if you still see any issues

If you need help finding the correct database name, let me know and I can help you check your database server.
