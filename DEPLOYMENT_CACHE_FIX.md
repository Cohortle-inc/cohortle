# Deployment Cache Fix - Server Action Error

## Issue
Error: `Failed to find Server Action "x". This request might be from an older or newer deployment.`

This occurs when Next.js has stale Server Action references between deployments, even though we don't use Server Actions.

## Root Cause
- Next.js caches Server Action manifests between builds
- Browser/CDN caching of old JavaScript chunks
- Mismatch between client and server builds

## Fixes Applied

### 1. Next.js Configuration Update
- Added `allowedOrigins: []` to serverActions config to restrict Server Actions
- Already have `generateBuildId` with timestamps for cache busting

### 2. Deployment Steps Required

#### On Coolify:
1. **Force Clean Build**:
   - Go to Coolify dashboard
   - Navigate to cohortle-web service
   - Click "Redeploy" with "Force rebuild" option
   - This will clear Docker build cache

2. **Clear Application Cache**:
   ```bash
   # SSH into the container after deployment
   rm -rf /app/.next/cache/*
   ```

3. **Restart the Service**:
   - After clearing cache, restart the container

#### Clear Cloudflare Cache:
```powershell
# Run from workspace root
.\purge-cloudflare-cache.ps1
```

Or manually:
1. Go to Cloudflare dashboard
2. Navigate to Caching > Configuration
3. Click "Purge Everything"

#### Clear Browser Cache:
Users experiencing this error should:
1. Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. Or clear browser cache completely
3. Or open in incognito/private window

## Prevention

### For Future Deployments:
1. Always purge Cloudflare cache after deployment
2. Use the automated cache purge script
3. Monitor for this error in production logs

### Build ID Strategy:
The `generateBuildId` function creates unique build IDs with timestamps, which should prevent this issue. However, aggressive CDN caching can still cause problems.

## Verification

After applying fixes:
1. Check deployment logs for successful build
2. Test in incognito window
3. Verify no Server Action errors in browser console
4. Check that all pages load correctly

## Related Files
- `cohortle-web/next.config.mjs` - Next.js configuration
- `cohortle-web/Dockerfile` - Build configuration
- `purge-cloudflare-cache.ps1` - Cache purge script
