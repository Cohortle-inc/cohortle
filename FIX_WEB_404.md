# Fix Web 404 - Quick Action Plan

## The Problem
cohortle.com shows 404, but logs show Next.js (which doesn't exist in this codebase).

## Most Likely Cause
**Coolify is deploying the wrong repository or the build isn't configured correctly.**

## Quick Fix (5 minutes)

### Step 1: Check Coolify Repository
1. Log into Coolify
2. Go to the web deployment (cohortle.com)
3. **Verify the repository URL** - Should be your cohortz repo
4. **Verify the branch** - Should be main/master
5. If wrong, update and redeploy

### Step 2: Update Build Configuration
In Coolify, set these:

**Base Directory**: `cohortz`

**Build Command**:
```
npm install && npx expo export:web
```

**Start Command**:
```
npx serve dist -l 3000 -s
```

**Port**: `3000`

### Step 3: Add Environment Variables
```
EXPO_PUBLIC_API_URL=https://api.cohortle.com
EXPO_PUBLIC_API_BASE_URL=https://api.cohortle.com
```

### Step 4: Redeploy
Click "Redeploy" in Coolify and watch the logs.

## What to Look For in Logs

### Build Logs Should Show:
```
✓ Exporting web files to dist/
✓ Export complete
```

### Runtime Logs Should Show:
```
Serving dist on port 3000
```

### Should NOT Show:
```
Next.js 14.2.31  ← This means wrong repo!
```

## If Next.js Still Appears

This means Coolify is deploying a different repository. Check:
1. Do you have multiple projects in Coolify?
2. Is cohortle.com pointing to the correct project?
3. Is there an old deployment cached?

**Action**: Delete the web deployment in Coolify and create a new one.

## Test Locally First (Optional)

If you want to verify the build works:
```bash
cd cohortz
npm install
npx expo export:web
npx serve dist -l 3000 -s
```

Visit http://localhost:3000 - should see your app.

## Files Created for You

1. **WEB_404_TROUBLESHOOTING.md** - Detailed troubleshooting guide
2. **COOLIFY_WEB_CONFIG.md** - Complete Coolify configuration
3. **cohortz/BUILD_WEB.bat** - Script to build web version locally

## Summary

The 404 is happening because either:
1. Wrong repository is deployed (explains Next.js logs)
2. Build command isn't running `expo export:web`
3. Start command isn't serving the `dist` folder
4. Base directory isn't set to `cohortz`

Fix these in Coolify and redeploy. Should work in 5 minutes.
