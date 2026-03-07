# Quick Fix: Network Error

## TL;DR - Do This First

### 1. Set Environment Variables in Coolify ⚠️ CRITICAL

**Backend (cohortle-api):**
```bash
FRONTEND_URL=https://cohortle.com
RESEND_API_KEY=<get-from-resend.com>
```

**Frontend (cohortle-web):**
```bash
NEXT_PUBLIC_API_URL=https://api.cohortle.com
```

Then restart both services.

### 2. If Still Getting Errors

**Clear Browser Data:**
1. Press `Ctrl+Shift+Delete` (or `Cmd+Shift+Delete` on Mac)
2. Select "Cookies" and "Cached images"
3. Click "Clear data"
4. Try again

**Try Incognito Mode:**
1. Press `Ctrl+Shift+N` (Chrome) or `Ctrl+Shift+P` (Firefox)
2. Go to https://cohortle.com
3. Try the action that was failing

### 3. Get Error Details

If still failing:
1. Press `F12` to open DevTools
2. Go to "Console" tab
3. Try the failing action
4. Screenshot any red errors
5. Share the error message

## System Status

✅ All systems are operational:
- Backend API is healthy
- Frontend is accessible
- Authentication is working
- Database is connected

Run `./test-production-status.ps1` to verify.

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| "Network error" on login | Clear cookies, try incognito |
| "Network error" on signup | Check environment variables in Coolify |
| "401 Unauthorized" | Log out and log back in |
| "500 Internal Server Error" | Check Coolify logs |
| Page won't load | Clear cache, hard refresh (Ctrl+F5) |

## Need More Help?

See detailed guides:
- `NETWORK_ERROR_RESOLUTION.md` - Complete troubleshooting guide
- `NETWORK_ERROR_DIAGNOSIS.md` - Diagnostic procedures
- `NETWORK_ERROR_INVESTIGATION_SUMMARY.md` - Investigation results

## Test Your System

```powershell
# Run this to test all endpoints
./test-production-status.ps1
```

All tests should pass with ✅ green checkmarks.
