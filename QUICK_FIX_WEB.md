# Quick Fix for cohortle.com 404 Error

## The Problem
cohortle.com shows 404 because the wrong repository is deployed.

## The Solution
Deploy the `cohortle-web` repository (Next.js app) instead.

## 3-Minute Fix

### Step 1: Log into Coolify
Go to your Coolify dashboard.

### Step 2: Find Web Deployment
Look for the deployment connected to cohortle.com.

### Step 3: Update Repository
Change the repository to:
```
https://github.com/cohortle-inc/cohortle-web
```

### Step 4: Verify Settings
- Build Method: **Dockerfile**
- Port: **3000**
- Domain: **cohortle.com**

### Step 5: Add Environment Variables
```
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
NEXT_PUBLIC_API_URL=https://api.cohortle.com
```

### Step 6: Redeploy
Click "Redeploy" and wait 2-3 minutes.

### Step 7: Test
Visit https://cohortle.com - should see the landing page!

## What You'll See

The website has these pages:
- **/** - Homepage/landing page
- **/about** - About page
- **/contact** - Contact page
- **/learner** - For learners
- **/partner** - For partners
- **/our-approach** - Approach page
- **/what-we-support** - Support page

## If Still 404

1. Check Coolify build logs for errors
2. Verify the repository URL is correct
3. Ensure Dockerfile is being used (not Nixpacks)
4. Check if port 3000 is exposed
5. Verify domain is pointing to the right deployment

## Repository Locations

Now cloned in your workspace:
```
CODEBASE/
├── cohortle-api/     # Backend (already working)
├── cohortz/          # Mobile app (building)
└── cohortle-web/     # Website (needs deployment fix) ← NEW!
```

## Summary

You have 3 separate projects:
1. **cohortle-api** → api.cohortle.com (✅ working)
2. **cohortle-web** → cohortle.com (❌ needs fix)
3. **cohortz** → Mobile APK (⏳ building)

Fix: Deploy `cohortle-web` to cohortle.com in Coolify.
