# Production Environment Variables Checklist

## Current Issue
Your production deployment isn't showing the latest changes (Continue Learning button). This could be due to:
1. Incorrect environment variables
2. Build cache issues
3. Deployment not using latest code

## How to Check Your Production Environment Variables

### Step 1: Access Your Deployment Platform
Log into your deployment platform (Coolify/Vercel/etc.) and navigate to:
- **cohortle-api** service settings
- **cohortle-web** service settings

### Step 2: Verify cohortle-api Environment Variables

Navigate to the **cohortle-api** service and check these environment variables:

#### Required Variables:
```bash
# Database Configuration
DB_HOSTNAME=<your-production-database-host>
# ❌ Should NOT be: 127.0.0.1 or localhost
# ✅ Should be: Your actual database server hostname/IP

DB_PORT=3306
# ✅ Usually 3306 for MySQL

DB_USER=<your-production-db-user>
# ❌ Should NOT be: root (for security)
# ✅ Should be: A dedicated database user

DB_PASSWORD=<your-production-db-password>
# ❌ Should NOT be: root123 or any test password
# ✅ Should be: A strong production password

DB_DATABASE=<your-production-database-name>
# ❌ Should NOT be: cohortle_test
# ✅ Should be: cohortle or cohortle_production

# Server Configuration
PORT=3001
# ✅ Can be 3001 or whatever port your API uses

NODE_ENV=production
# ❌ Should NOT be: development
# ✅ MUST be: production

# JWT Secret
JWT_SECRET=<your-actual-jwt-secret>
# ❌ Should NOT be: your-secret-key-change-in-production
# ✅ Should be: A long random string (at least 32 characters)

# Bunny Stream Configuration (if using video)
BUNNY_STREAM_API_KEY=<your-actual-api-key>
BUNNY_STREAM_LIBRARY_ID=<your-actual-library-id>
```

### Step 3: Verify cohortle-web Environment Variables

Navigate to the **cohortle-web** service and check these environment variables:

#### Required Variables:
```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://api.cohortle.com
# ✅ You confirmed this is set correctly

# Optional (NOT REQUIRED - not used in codebase)
# NEXT_PUBLIC_APP_URL=https://cohortle.com
# Note: This variable is NOT used anywhere in your code, so it doesn't matter
```

## Step 4: Check Deployment Status

For each service (cohortle-api and cohortle-web):

### Build Information:
- [ ] Check the **last deployment timestamp** - should be recent (after your force deploy)
- [ ] Check the **git commit hash** - should be `068c709` or later
- [ ] Check the **build logs** - look for "Build completed successfully"
- [ ] Check for any **error messages** in build logs

### Deployment Status:
- [ ] Service status should be **Running** or **Active**
- [ ] No error indicators or warnings
- [ ] Check **runtime logs** for any errors

## Step 5: Common Issues and Fixes

### Issue 1: Wrong Database Configuration
**Symptoms:** API returns 400 errors, can't load programmes
**Fix:** Update DB_HOSTNAME, DB_DATABASE, DB_USER, DB_PASSWORD to production values

### Issue 2: NODE_ENV is "development"
**Symptoms:** Unexpected behavior, verbose logging
**Fix:** Set NODE_ENV=production

### Issue 3: Build Cache Not Cleared
**Symptoms:** Changes not visible despite successful deployment
**Fix:** 
1. Find "Clear Build Cache" option in deployment platform
2. Trigger fresh deployment
3. Wait for build to complete

### Issue 4: Deployment Using Old Code
**Symptoms:** Continue Learning button not visible
**Fix:**
1. Verify git commit hash in deployment matches local (068c709)
2. If different, trigger new deployment
3. Check if auto-deploy is enabled for your branch

## Step 6: Test After Verification

After verifying/fixing environment variables:

1. **Trigger a fresh deployment** for both services
2. **Wait for builds to complete** (check logs)
3. **Hard refresh browser** (Ctrl+Shift+R)
4. **Run the browser test script** (test-production-browser.js)

## Quick Verification Commands

If your deployment platform has SSH/shell access, you can run:

```bash
# For cohortle-api
echo $NODE_ENV          # Should output: production
echo $DB_HOSTNAME       # Should NOT be: 127.0.0.1
echo $DB_DATABASE       # Should NOT be: cohortle_test

# For cohortle-web
echo $NEXT_PUBLIC_API_URL  # Should output: https://api.cohortle.com
```

## What to Report Back

Please check your deployment platform and report:

1. **cohortle-api environment variables:**
   - What is DB_HOSTNAME set to?
   - What is DB_DATABASE set to?
   - What is NODE_ENV set to?

2. **cohortle-web environment variables:**
   - Confirm NEXT_PUBLIC_API_URL is https://api.cohortle.com

3. **Deployment status:**
   - What git commit is currently deployed?
   - When was the last successful deployment?
   - Any errors in build or runtime logs?

4. **Build logs:**
   - Does the build complete successfully?
   - Any warnings or errors?

## Expected Production Configuration

### Correct Setup:
```
cohortle-api:
  ✅ DB_HOSTNAME: <actual-db-host> (NOT localhost)
  ✅ DB_DATABASE: cohortle (NOT cohortle_test)
  ✅ NODE_ENV: production
  ✅ JWT_SECRET: <strong-random-secret>
  ✅ Git commit: 068c709 or later

cohortle-web:
  ✅ NEXT_PUBLIC_API_URL: https://api.cohortle.com
  ✅ Git commit: 068c709 or later
```

### Incorrect Setup (What You Might Have):
```
cohortle-api:
  ❌ DB_HOSTNAME: 127.0.0.1 (localhost - wrong!)
  ❌ DB_DATABASE: cohortle_test (test db - wrong!)
  ❌ NODE_ENV: development (wrong!)
  ❌ JWT_SECRET: your-secret-key-change-in-production (placeholder!)
  ❌ Git commit: old commit (not 068c709)

cohortle-web:
  ✅ NEXT_PUBLIC_API_URL: https://api.cohortle.com (correct)
  ❌ Git commit: old commit (not 068c709)
```

## Next Steps

1. **Check your deployment platform** using this checklist
2. **Report back** what you find for each environment variable
3. **Fix any incorrect values** in your deployment platform
4. **Trigger fresh deployments** after fixing
5. **Test** using the browser script

---

**Note:** The `.env` file in your repository is for local development only. Production environment variables must be set in your deployment platform's settings, not in the `.env` file.
