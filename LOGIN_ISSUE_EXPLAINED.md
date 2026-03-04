# Login Issue on Existing App - Explained

## The Problem
Your existing app (v0.5) on your phone shows: **"Login failed. Please try again."**

## Root Cause
The app is trying to call the login API at:
```
${EXPO_PUBLIC_API_URL}/v1/api/auth/login
```

But the API URL in your old build is either:
1. **Wrong** - Pointing to old/incorrect URL
2. **Missing** - Not set during build
3. **Unreachable** - API is down or not responding

## Why This Happened

### Your Old Build (v0.5 on phone)
- Was built before we fixed the configuration
- Likely pointing to: `https://cohortle-api.onrender.com` (old URL)
- Or has no API URL set at all

### Your New Build (being fixed)
- Will point to: `https://api.cohortle.com` (correct URL)
- Has proper environment variables
- Should work correctly

## What the App Does on Login

1. User enters email/password
2. App calls: `POST ${apiURL}/v1/api/auth/login`
3. If successful: Stores token and navigates to home
4. If failed: Shows "Login failed. Please try again."

## Why You're Seeing the Error

The API request is failing because:

### Scenario 1: Wrong API URL
```javascript
// Old build might have:
EXPO_PUBLIC_API_URL=https://cohortle-api.onrender.com

// But should be:
EXPO_PUBLIC_API_URL=https://api.cohortle.com
```

### Scenario 2: API Not Responding
- The old URL might be down
- Network timeout
- CORS issues

### Scenario 3: Missing API URL
- Environment variable not set during build
- App tries to call `undefined/v1/api/auth/login`
- Request fails immediately

## How to Verify

### Check if API is Working
Test the login endpoint:
```bash
curl -X POST https://api.cohortle.com/v1/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"wecarefng@gmail.com","password":"Wecare123"}'
```

Should return:
```json
{
  "error": false,
  "token": "...",
  "user": {...}
}
```

### Check Old API URL
If your old build was pointing to:
```bash
curl -X POST https://cohortle-api.onrender.com/v1/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"wecarefng@gmail.com","password":"Wecare123"}'
```

This might be down or not working.

## The Fix

### Short Term (Current App)
**You can't fix the existing app on your phone** - it's already built with the wrong configuration.

### Long Term (New Build)
The new build we're creating will have:
1. ✅ Correct API URL: `https://api.cohortle.com`
2. ✅ Missing package added: `expo-sharing`
3. ✅ EAS Update channels configured
4. ✅ All environment variables set correctly

## What We Fixed

### 1. Added Missing Package
```json
"expo-sharing": "~13.0.0"
```

### 2. Fixed EAS Configuration
```json
{
  "preview": {
    "channel": "preview",  // ← Added this
    "distribution": "internal",
    "android": {
      "buildType": "apk"
    },
    "env": {
      "EXPO_PUBLIC_API_URL": "https://api.cohortle.com"  // ← Correct URL
    }
  }
}
```

### 3. Committed and Pushed
```bash
git commit -m "Fix build: Add expo-sharing package and EAS Update channels"
git push
```

## Next Steps

### 1. Wait for New Build
The new build (with fixes) needs to be triggered. Once it completes:
- Download the new APK
- Install it on your phone
- Login should work

### 2. Test the New Build
When you get the new APK:
1. Uninstall the old app (v0.5)
2. Install the new APK
3. Try logging in with: `wecarefng@gmail.com` / `Wecare123`
4. Should work correctly

### 3. Verify API is Working
Before installing, test the API:
```bash
# Test login endpoint
curl -X POST https://api.cohortle.com/v1/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"wecarefng@gmail.com","password":"Wecare123"}'
```

## Why the New Build Will Work

1. **Correct API URL**: Points to `https://api.cohortle.com`
2. **All packages installed**: Including `expo-sharing`
3. **Proper configuration**: EAS Update channels set
4. **Environment variables**: All set correctly in eas.json

## Summary

**Current App (v0.5)**:
- ❌ Wrong/missing API URL
- ❌ Can't be fixed (already built)
- ❌ Login will continue to fail

**New Build (pending)**:
- ✅ Correct API URL
- ✅ All packages included
- ✅ Proper configuration
- ✅ Login should work

**Action Required**:
1. Trigger new build with fixes
2. Wait for build to complete (~10-15 min)
3. Download and install new APK
4. Test login - should work!

## Technical Details

### Login Flow
```
User Input (email/password)
    ↓
App validates input
    ↓
POST ${EXPO_PUBLIC_API_URL}/v1/api/auth/login
    ↓
API returns token + user data
    ↓
Store token in AsyncStorage
    ↓
Navigate to home screen
```

### Where It's Failing
```
POST ${EXPO_PUBLIC_API_URL}/v1/api/auth/login
    ↓
❌ Request fails (wrong URL / API down / no URL)
    ↓
Show error: "Login failed. Please try again."
```

### What the Fix Does
```
Build with correct env vars
    ↓
EXPO_PUBLIC_API_URL = "https://api.cohortle.com"
    ↓
POST https://api.cohortle.com/v1/api/auth/login
    ↓
✅ Request succeeds
    ↓
Login works!
```
