# Quick Fix: Login/Signup Not Working

## TL;DR - Try This First

### Option 1: Clear Browser Cache (Most Common Fix)
1. Press `F12` to open DevTools
2. Go to `Application` tab
3. Click `Clear site data` button
4. Close browser completely
5. Reopen and try again

### Option 2: Use Incognito/Private Mode
1. Open new incognito/private window
2. Go to https://cohortle.com/login
3. Try logging in

### Option 3: Hard Refresh
- Windows: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

## If Still Not Working

### Get Error Details
1. Press `F12` to open DevTools
2. Go to `Console` tab
3. Clear console (trash icon)
4. Try to login/signup
5. **Copy ALL red error messages**
6. Share them with me

### Check Coolify
1. Go to Coolify dashboard
2. Check `cohortle-web` deployment status
3. Should say "Running" (not "Building" or "Deploying")
4. If deploying, wait 2-5 minutes

## Test Backend Directly

Run this in PowerShell with your actual credentials:

```powershell
$body = @{
    email = "your-email@example.com"
    password = "your-password"
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://api.cohortle.com/v1/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

**Expected Results:**
- ✅ Status 200 = Login works (issue is frontend/browser)
- ❌ Status 401 = Wrong credentials
- ❌ Status 500 = Backend error

## Convener Signup

If signing up as convener, you need the invitation code:
```
COHORTLE_CONVENER_2024
```

## What I Need to Help

If none of the above works, provide:

1. **Browser console errors** (F12 → Console → copy red errors)
2. **Network tab details** (F12 → Network → click failed request → copy Response)
3. **Coolify deployment status** (Running/Building/Failed)
4. **What you're trying** (Login or Signup? Student or Convener?)
5. **Error message shown** (on the page itself)

## All Fixes Are Deployed

These fixes are already in production:
- ✅ Token validation (middleware checks for undefined)
- ✅ Password field (login includes password)
- ✅ Invitation code (convener signup)
- ✅ Role-based redirect (convener → /convener/dashboard)
- ✅ Signup returns role from backend

The system should be working. Most likely issue is browser cache or deployment timing.
