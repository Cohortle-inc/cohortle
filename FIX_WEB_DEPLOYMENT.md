# Fix Web Deployment - Server Action Error

## Problem
```
Error: Failed to find Server Action "x". This request might be from an older or newer deployment.
Original error: Cannot read properties of undefined (reading 'workers')
```

## Root Cause
Build cache mismatch between deployments. Next.js is looking for Server Actions that don't exist because of stale build artifacts.

## Solution Applied

### 1. Updated `next.config.mjs`
Added proper build ID generation to ensure each build is unique:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Ensure proper build ID generation
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
};

export default nextConfig;
```

## Deployment Steps

### Option 1: Via Coolify UI (Recommended)
1. Go to Coolify dashboard
2. Find the `cohortle-web` application
3. Click "Redeploy" or "Force Rebuild"
4. Wait for build to complete
5. Test at https://cohortle.com

### Option 2: Via Git Push
1. Commit the changes:
```bash
cd cohortle-web
git add next.config.mjs
git commit -m "fix: resolve Server Action error with unique build IDs"
git push origin main
```

2. Coolify will auto-deploy on push (if configured)

### Option 3: Manual Build (If needed)
```bash
cd cohortle-web

# Clear all caches
rm -rf .next
rm -rf node_modules/.cache

# Reinstall dependencies (optional but recommended)
npm ci

# Build
npm run build

# The build should complete without errors
# Then deploy via Coolify
```

## Verification Steps

After deployment:

### 1. Check Homepage
```bash
curl https://cohortle.com
```
Should return HTML without errors.

### 2. Check Login Page
Visit: https://cohortle.com/login
- Should load without errors
- Form should be visible
- No console errors

### 3. Test Authentication
1. Try to sign up a new account
2. Check browser console for errors
3. Check Network tab for API calls
4. Verify redirect to dashboard on success

### 4. Check API Connectivity
```bash
curl https://api.cohortle.com/api/health
```
Should return 200 OK (if health endpoint exists).

## Expected Behavior After Fix

✅ No "Server Action" errors  
✅ Pages load correctly  
✅ Forms submit properly  
✅ API calls work  
✅ Authentication flow completes  

## If Issue Persists

### Check Coolify Logs
1. Go to Coolify dashboard
2. View deployment logs
3. Look for build errors or warnings

### Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Look for JavaScript errors
4. Check Network tab for failed requests

### Check Environment Variables
Ensure these are set in Coolify:
- `NEXT_PUBLIC_API_URL=https://api.cohortle.com`

### Nuclear Option: Clean Rebuild
If nothing works:
1. Delete the application in Coolify
2. Recreate it from scratch
3. Set environment variables
4. Deploy

## Additional Notes

### Why This Happened
- Next.js caches build artifacts for performance
- When deploying with `standalone` output, build IDs must be unique
- Stale cache caused mismatch between server and client
- Adding timestamp-based build ID ensures uniqueness

### Prevention
- The fix in `next.config.mjs` prevents this from happening again
- Each build now has a unique ID
- No manual cache clearing needed in future

## Timeline
- **Fix applied:** Now
- **Rebuild required:** Yes
- **Estimated downtime:** 2-5 minutes (during rebuild)
- **Testing time:** 5-10 minutes

## Success Criteria
- [ ] Homepage loads without errors
- [ ] Login page displays correctly
- [ ] Signup form works
- [ ] Login form works
- [ ] Dashboard accessible after login
- [ ] No console errors
- [ ] API calls succeed
