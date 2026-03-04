# Server Action Mismatch Error - Detailed Fix Guide

## The Error

```
Error: Failed to find Server Action "x". This request might be from an older or newer deployment. 
Original error: Cannot read properties of undefined (reading 'workers')
```

## What This Means

This is a **Next.js Server Action cache mismatch** error. It happens when:

1. **Multiple deployments** are running simultaneously (old and new containers)
2. **Server Action IDs** don't match between client and server
3. **Cloudflare/CDN cache** is serving old JavaScript bundles
4. **Browser cache** has old client-side code

## Root Cause

When you deploy a new version of the Next.js app:
1. New server actions get new IDs
2. Old client code tries to call old server action IDs
3. Server can't find those IDs (they're in the new deployment)
4. Error occurs

## Immediate Fix Steps

### 1. **Redeploy in Coolify with Force Rebuild**
- Go to Coolify Dashboard
- Find `cohortle-web` service
- Click **Redeploy**
- Enable **Force Rebuild** option
- Wait for deployment to complete

### 2. **Verify Only One Container is Running**
- In Coolify, check the service details
- Ensure only **ONE** container instance is running
- If multiple, stop the old ones

### 3. **Purge Cloudflare Cache** (Manual)
Since the script can't access the API token:
1. Log into Cloudflare Dashboard
2. Go to **Caching** → **Configuration**
3. Click **Purge Everything**
4. Confirm purge

### 4. **User Instructions**
Tell users to:
1. **Hard refresh**: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. **Clear browser cache** completely
3. **Close all tabs** and reopen the app

## Technical Details

### Why This Happened
- We pushed dashboard fixes to both repositories
- The frontend deployment may have created new server action IDs
- Old client code is trying to call old server actions
- Server can't resolve them

### Server Actions in Our App
Our app uses server actions for:
- Authentication (cookies)
- API proxy requests
- Form submissions

## Prevention for Future

### 1. **Always Use Force Rebuild**
When deploying Next.js apps with server actions:
- Always enable **Force Rebuild** in Coolify
- This ensures clean builds

### 2. **Single Container Strategy**
- Configure Coolify to use **rolling updates**
- Or ensure only one container runs at a time

### 3. **Cache Control Headers**
Add to `next.config.js`:
```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },
};
```

### 4. **Versioned Deployments**
Consider adding version headers:
```javascript
// In your app
const version = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';
```

## Verification Steps

After redeploying:

### 1. **Check Commit Hash**
```powershell
.\verify-production-deployment.ps1
```
Should show: `d4056be` (current commit)

### 2. **Test in Incognito Mode**
- Open incognito/private window
- Visit the app
- No errors should appear

### 3. **Check Browser Console**
- Open DevTools (F12)
- Go to Console tab
- Look for `[Dashboard]` logs (our new logging)
- No server action errors

### 4. **Test Dashboard Sections**
- Log in as a learner
- Go to dashboard
- Check live sessions and recent activity sections
- They should show empty states (normal if no data)

## If Error Persists

### 1. **Check Coolify Logs**
- Look for build errors
- Check runtime errors
- Verify environment variables

### 2. **Check Database Connection**
- Ensure backend is running
- Check API connectivity
- Verify CORS settings

### 3. **Manual Cache Purge**
```bash
# If you have access to the server
docker system prune -a
docker volume prune
```

### 4. **Rollback Option**
If needed, rollback to previous working version:
```bash
git checkout <previous-commit>
git push origin main
# Then redeploy
```

## Files Modified in This Fix

### cohortle-api (commit fb8d0eb)
- `routes/dashboard.js` - Fixed live sessions endpoint

### cohortle-web (commit d4056be)
- `src/app/dashboard/page.tsx` - Improved error handling and logging

## Expected Outcome

After following these steps:
1. Server action error disappears
2. Dashboard loads without errors
3. Live sessions and recent activity sections work
4. Console shows `[Dashboard]` logs
5. Users can hard refresh to fix cached versions

## Quick Reference

**Error**: `Failed to find Server Action "x"`
**Cause**: Next.js server action cache mismatch
**Fix**: 
1. Redeploy with Force Rebuild
2. Purge Cloudflare cache
3. User hard refresh

**Current Commit**: `d4056be`
**Status**: ✅ Code is pushed, needs deployment

---

**Next Action**: Redeploy `cohortle-web` in Coolify with **Force Rebuild** enabled.