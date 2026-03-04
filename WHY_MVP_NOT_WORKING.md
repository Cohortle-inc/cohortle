# Why Your Web App MVP Is Not Functioning - Diagnostic Guide

**Date:** February 25, 2026  
**Status:** 🔴 NEEDS IMMEDIATE ATTENTION

---

## Quick Answer

Your MVP code is complete and ready, but it's likely not working due to **deployment configuration issues**. Here are the most common problems:

---

## 🔴 Critical Issues to Check RIGHT NOW

### Issue 1: Backend Not Deployed or Misconfigured
**Symptom:** Users see "Failed to load programmes" or blank pages

**Check:**
1. Is `cohortle-api` actually deployed and running?
2. Go to: https://api.cohortle.com/health
   - ✅ Should return: `{"status":"ok"}` or similar
   - ❌ If error: Backend is down or not deployed

**Most Common Problems:**
- `NODE_ENV` is set to `development` instead of `production`
- `DB_DATABASE` is set to wrong value (like "cohortle.com" instead of actual database name)
- Database migrations haven't run
- Backend crashed during startup

**Fix:**
```bash
# Check Coolify logs for cohortle-api
# Look for errors like:
# - "Cannot connect to database"
# - "Table doesn't exist"
# - "Migration failed"
```

---

### Issue 2: Frontend Environment Variable Wrong
**Symptom:** API calls fail, network errors in browser console

**Check:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for errors like:
   - "Failed to fetch"
   - "Network error"
   - "CORS error"
   - Requests going to wrong URL

**Most Common Problem:**
- `NEXT_PUBLIC_API_URL` is not set correctly
- OR it's only available at runtime, not build time

**Fix:**
In Coolify for `cohortle-web`:
1. Set `NEXT_PUBLIC_API_URL=https://api.cohortle.com`
2. Make sure it's available at **BOTH** build time AND runtime
3. Redeploy with cache cleared

---

### Issue 3: Database Tables Don't Exist
**Symptom:** Backend returns 500 errors, logs show "Table doesn't exist"

**Check:**
1. Look at `cohortle-api` logs in Coolify
2. Search for: "ER_NO_SUCH_TABLE" or "Table 'X' doesn't exist"

**Most Common Problem:**
- Migrations haven't run on production database
- Connected to wrong database

**Fix:**
```bash
# SSH into your backend server or use Coolify console
cd cohortle-api
npm run migrate

# Should see:
# == 20250422154538-initial-setup: migrated
# == 20250425194222-add-email-to-users: migrated
# ... (all migrations)
```

---

### Issue 4: Authentication Not Working
**Symptom:** Users can't login, get redirected to login repeatedly

**Check:**
1. Try to login at: https://cohortle.com/login
2. Open browser DevTools → Network tab
3. Look at the login request response

**Most Common Problems:**
- JWT_SECRET not set or different between deployments
- Cookies not being set (CORS issue)
- Token not being sent with requests

**Fix:**
- Verify `JWT_SECRET` is set in backend
- Check CORS configuration allows your frontend domain
- Verify cookies are being set (check Application tab in DevTools)

---

### Issue 5: Old Code Deployed
**Symptom:** Features you know exist aren't showing up

**Check:**
1. In Coolify, check the git commit hash for both services
2. Should be recent commits (within last few days)
3. Compare with your local git log

**Most Common Problem:**
- Auto-deploy not triggered
- Build cache serving old version
- Wrong branch deployed

**Fix:**
1. Clear build cache in Coolify
2. Manually trigger redeploy
3. Verify correct branch is configured

---

## 🔍 Step-by-Step Diagnostic Process

### Step 1: Check Backend Health (2 minutes)

```bash
# Test 1: Is backend accessible?
curl https://api.cohortle.com/health

# Expected: {"status":"ok"} or similar
# If fails: Backend is down

# Test 2: Can you reach any endpoint?
curl https://api.cohortle.com/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'

# Expected: Some JSON response (even if error)
# If fails: Backend routing broken
```

### Step 2: Check Frontend Build (2 minutes)

```bash
# In Coolify, check cohortle-web build logs
# Look for:
✓ Creating an optimized production build
✓ Compiled successfully

# If you see errors, the build failed
# Common errors:
# - "Module not found"
# - "Type error"
# - "Environment variable not found"
```

### Step 3: Check Browser Console (1 minute)

1. Open https://cohortle.com
2. Press F12 (DevTools)
3. Go to Console tab
4. Look for red errors

**Common errors and what they mean:**
- `Failed to fetch` → Backend not reachable
- `401 Unauthorized` → Authentication issue
- `404 Not Found` → Endpoint doesn't exist (old backend?)
- `CORS error` → Backend not allowing frontend domain
- `undefined is not a function` → JavaScript error (old code?)

### Step 4: Check Network Requests (2 minutes)

1. In DevTools, go to Network tab
2. Refresh the page
3. Look at the requests

**What to check:**
- Are requests going to `https://api.cohortle.com`?
  - If not: `NEXT_PUBLIC_API_URL` is wrong
- What status codes are you getting?
  - 200: Good
  - 401: Auth issue
  - 404: Endpoint missing
  - 500: Backend error
  - Failed: Can't reach backend

### Step 5: Check Coolify Logs (5 minutes)

**For cohortle-api:**
```
Look for:
✅ "Server running on port 3000"
✅ "Database connected"
✅ "Migrations completed"

❌ "Cannot connect to database"
❌ "Table doesn't exist"
❌ "Port already in use"
❌ Any stack traces
```

**For cohortle-web:**
```
Look for:
✅ "Ready in XXXms"
✅ "Compiled successfully"

❌ "Module not found"
❌ "Build failed"
❌ "Port already in use"
```

---

## 🎯 Most Likely Root Causes (Ranked)

### 1. Database Configuration Wrong (60% probability)
- `DB_DATABASE` set to wrong value
- Database doesn't exist
- Migrations not run

**Quick Test:**
```bash
# Check backend logs for database errors
# Look for: "ER_NO_SUCH_TABLE" or "Cannot connect"
```

### 2. Environment Variables Not Set Correctly (25% probability)
- `NEXT_PUBLIC_API_URL` not available at build time
- `NODE_ENV` set to development
- Missing required variables

**Quick Test:**
```bash
# In browser console:
console.log(process.env.NEXT_PUBLIC_API_URL)
# Should show: https://api.cohortle.com
```

### 3. Backend Not Deployed or Crashed (10% probability)
- Service not running
- Crashed during startup
- Port conflict

**Quick Test:**
```bash
curl https://api.cohortle.com/health
# Should return 200 OK
```

### 4. Old Code Deployed (5% probability)
- Build cache issue
- Wrong branch
- Auto-deploy not triggered

**Quick Test:**
```bash
# Check git commit in Coolify
# Should be recent (last few days)
```

---

## 🚀 Quick Fix Checklist

Try these in order:

### Fix 1: Verify and Fix Environment Variables (5 minutes)

**In Coolify for cohortle-api:**
```bash
NODE_ENV=production  # NOT development
DB_DATABASE=cohortle  # NOT cohortle.com
DB_HOSTNAME=<your-actual-db-host>
JWT_SECRET=<strong-secret>
```

**In Coolify for cohortle-web:**
```bash
NEXT_PUBLIC_API_URL=https://api.cohortle.com
# Make sure it's available at BUILD TIME and RUNTIME
```

### Fix 2: Run Migrations (2 minutes)

```bash
# In Coolify console or SSH:
cd cohortle-api
npm run migrate
```

### Fix 3: Clear Cache and Redeploy (10 minutes)

1. In Coolify, go to cohortle-api
2. Clear build cache (if option available)
3. Click "Redeploy"
4. Wait for completion
5. Repeat for cohortle-web

### Fix 4: Hard Refresh Browser (1 minute)

```
Windows/Linux: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

---

## 📊 What Should Be Working

If everything is configured correctly, users should be able to:

### ✅ Learner Journey
1. Visit https://cohortle.com
2. Click "Login" or "Sign Up"
3. Create account or login
4. See dashboard with enrolled programmes
5. Click on a programme
6. See modules and lessons
7. Click on a lesson
8. View lesson content
9. Mark lesson complete
10. See progress update

### ✅ Convener Journey
1. Login as convener
2. See "Create Programme" button
3. Create a programme
4. Add cohorts
5. Add weeks
6. Add lessons
7. Manage enrollments

---

## 🆘 If Nothing Works

### Emergency Diagnostic Script

Create this file and run it:

```bash
# save as test-production.sh
#!/bin/bash

echo "=== Testing Cohortle Production ==="
echo ""

echo "1. Testing Backend Health..."
curl -s https://api.cohortle.com/health
echo ""

echo "2. Testing Frontend..."
curl -I https://cohortle.com
echo ""

echo "3. Testing API Endpoint..."
curl -s https://api.cohortle.com/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test","password":"test"}'
echo ""

echo "=== Test Complete ==="
```

Run it:
```bash
bash test-production.sh
```

---

## 📞 What to Report

If you're still stuck, provide:

1. **Backend health check result:**
   ```bash
   curl https://api.cohortle.com/health
   ```

2. **Environment variables** (from Coolify):
   - cohortle-api: NODE_ENV, DB_DATABASE values
   - cohortle-web: NEXT_PUBLIC_API_URL value

3. **Browser console errors:**
   - Screenshot of Console tab
   - Screenshot of Network tab

4. **Coolify logs:**
   - Last 50 lines from cohortle-api
   - Last 50 lines from cohortle-web

5. **Git commit hashes:**
   - What's deployed in Coolify for both services

---

## 🎯 Expected Timeline to Fix

- **If it's env variables:** 5-10 minutes
- **If it's migrations:** 2-5 minutes
- **If it's deployment:** 10-15 minutes
- **If it's code issue:** 30-60 minutes

---

## ✅ Success Indicators

You'll know it's working when:

1. ✅ https://api.cohortle.com/health returns 200 OK
2. ✅ https://cohortle.com loads without errors
3. ✅ Login works and redirects to dashboard
4. ✅ Dashboard shows programmes (or empty state)
5. ✅ No errors in browser console
6. ✅ No errors in Coolify logs

---

**Next Step:** Run through the diagnostic process above and report what you find.
