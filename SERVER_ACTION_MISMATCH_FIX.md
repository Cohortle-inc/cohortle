# Server Action Mismatch Fix Guide

## Problem
```
Error: Failed to find Server Action "x". This request might be from an older or newer deployment.
Original error: Cannot read properties of undefined (reading 'workers')
```

This occurs when the client-side code is calling a server action that doesn't exist in the currently running server build.

## Root Causes
1. **Stale browser cache** - Client has old JavaScript
2. **Stale CDN/Cloudflare cache** - CDN serving old assets
3. **Multiple containers running** - Old and new versions running simultaneously
4. **Build ID mismatch** - Client and server from different builds
5. **Incomplete deployment** - Build didn't fully complete

## Immediate Fix Steps

### 1. Push Latest Code
```powershell
# Ensure all changes are committed and pushed
cd cohortle-web
git push origin main

cd ../cohortle-api
git push origin main
```

### 2. Purge Cloudflare Cache
```powershell
# Run the cache purge script
.\purge-cloudflare-cache.ps1
```

### 3. Force Clean Rebuild in Coolify
1. Go to Coolify dashboard
2. Navigate to cohortle-web deployment
3. Click "Redeploy" with "Force rebuild" option
4. Wait for build to complete (check logs for success)

### 4. Verify Single Container
In Coolify, ensure only ONE container is running for cohortle-web:
- Stop any old/stale containers
- Only the latest deployment should be active

### 5. Clear Browser Cache
Users should:
- Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- Or clear browser cache completely

## Verification Checklist

### ✅ Check Deployment Status
```powershell
# Run deployment verification
.\verify-production-deployment.ps1
```

Expected output:
- ✅ Same commit hash on both frontend and backend
- ✅ Build completed successfully
- ✅ Server responding with 200 status
- ✅ No error logs in recent deployment

### ✅ Check Build ID
The build ID should be consistent. Check in browser DevTools:
1. Open Network tab
2. Look for `_next/static/[BUILD_ID]/`
3. Verify this matches the server's build ID

### ✅ Check Server Actions
In your codebase, verify all server actions are properly defined:
```bash
# Search for 'use server' directives
grep -r "use server" cohortle-web/src/
```

## Prevention Strategies

### 1. Automated Cache Purging
Your GitHub workflow already handles this:
```yaml
# .github/workflows/purge-cache-on-deploy.yml
# Automatically purges Cloudflare cache on deployment
```

Ensure this workflow is enabled and has valid Cloudflare credentials.

### 2. Deployment Markers
Update deployment markers after each deploy:
```powershell
.\update-deployment-markers.ps1
```

This creates `deployment-info.json` with:
- Commit hash
- Build timestamp
- Deployment ID

### 3. Health Check Endpoint
Your app has a deployment verification endpoint:
```
GET https://app.cohortle.com/api/deployment
```

Returns:
```json
{
  "status": "ok",
  "commitHash": "abc123",
  "buildTime": "2026-03-01T12:00:00Z",
  "version": "1.0.0"
}
```

### 4. Graceful Degradation
Add error boundary for server action failures:

```typescript
// In your root layout or error boundary
if (error.message.includes('Failed to find Server Action')) {
  // Show user-friendly message
  return (
    <div>
      <p>The app has been updated. Please refresh the page.</p>
      <button onClick={() => window.location.reload()}>
        Refresh Now
      </button>
    </div>
  );
}
```

## Debugging Commands

### Check Current Deployment
```powershell
# Check what's currently deployed
.\verify-production-status.ps1
```

### Check Coolify Logs
```bash
# In Coolify dashboard, view logs for:
# - Build logs (ensure no errors)
# - Runtime logs (check for startup errors)
# - Container status (only one should be running)
```

### Check Git Status
```powershell
# Ensure local and remote are in sync
cd cohortle-web
git status
git log origin/main..HEAD  # Should be empty if pushed
```

## Common Mistakes to Avoid

❌ **Don't** deploy without pushing to Git first
❌ **Don't** have multiple containers running simultaneously  
❌ **Don't** forget to purge CDN cache after deployment
❌ **Don't** use server actions in client components without 'use server'
❌ **Don't** rename/remove server actions without updating all call sites

✅ **Do** push code before deploying
✅ **Do** verify single container is running
✅ **Do** purge cache after each deployment
✅ **Do** use proper 'use server' directives
✅ **Do** test in incognito mode after deployment

## Emergency Rollback

If the issue persists:

1. **Rollback in Coolify**
   - Go to Deployments tab
   - Find last working deployment
   - Click "Redeploy" on that version

2. **Verify Rollback**
   ```powershell
   .\verify-production-deployment.ps1
   ```

3. **Investigate Issue**
   - Check what changed between working and broken versions
   - Review server action definitions
   - Check for missing 'use server' directives

## Next.js Server Actions Best Practices

### 1. Always Use 'use server' Directive
```typescript
// ✅ Correct
'use server'

export async function myServerAction(data: FormData) {
  // Server-side code
}
```

### 2. Keep Server Actions in Separate Files
```typescript
// app/actions/user.ts
'use server'

export async function updateUser(data: FormData) {
  // Implementation
}
```

### 3. Don't Export Server Actions from Client Components
```typescript
// ❌ Wrong - client component
'use client'

export async function serverAction() {
  'use server'
  // This won't work properly
}
```

### 4. Use Proper Error Handling
```typescript
'use server'

export async function myAction(data: FormData) {
  try {
    // Action logic
    return { success: true };
  } catch (error) {
    console.error('Server action error:', error);
    return { success: false, error: error.message };
  }
}
```

## Contact & Support

If issue persists after following all steps:
1. Check Coolify deployment logs for specific errors
2. Verify environment variables are set correctly
3. Ensure database migrations have run successfully
4. Check that API backend is responding correctly

## Related Documentation
- [DEPLOYMENT_CACHE_FIX.md](./DEPLOYMENT_CACHE_FIX.md)
- [CLOUDFLARE_CACHE_AUTOMATION.md](./CLOUDFLARE_CACHE_AUTOMATION.md)
- [DEPLOYMENT_VERIFICATION_GUIDE.md](./DEPLOYMENT_VERIFICATION_GUIDE.md)
