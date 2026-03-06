# Server Action Cache Fix - IMMEDIATE ACTION REQUIRED

## Current Issue
Production logs show repeated Server Action errors:
```
Error: Failed to find Server Action "x". This request might be from an older or newer deployment.
Original error: Cannot read properties of undefined (reading 'workers')
```

**Timestamps**: 
- 2026-03-06T12:03:23 (multiple occurrences)
- 2026-03-06T12:42:07 (multiple occurrences)

## Root Cause
This is a **deployment cache mismatch** between:
1. Client-side JavaScript (cached by browsers/Cloudflare)
2. Server-side code (updated on deployment)

When users have cached old JavaScript but the server has new code, Server Actions fail because the action IDs don't match.

## IMMEDIATE FIX (Do This Now)

### Step 1: Clear Cloudflare Cache
Run the cache purge script:
```powershell
.\purge-cloudflare-cache.ps1
```

Or manually in Cloudflare dashboard:
1. Go to Cloudflare dashboard
2. Select cohortle.com domain
3. Go to "Caching" → "Configuration"
4. Click "Purge Everything"
5. Confirm purge

### Step 2: Force Rebuild in Coolify
1. Open Coolify dashboard
2. Go to cohortle-web application
3. Click "Redeploy"
4. Enable "Force rebuild" checkbox
5. Click "Deploy"

### Step 3: Verify Build ID Generation
The build should generate a unique ID with timestamp. Check logs for:
```
Generating build ID: build-1709740800000
```

## PERMANENT FIX (Already Implemented)

The `next.config.mjs` already has:
```javascript
generateBuildId: async () => {
  return `build-${Date.now()}`;
}
```

This forces new chunk names on each build, preventing cache issues.

## Why This Happens

### Normal Flow:
1. User loads page → Gets JavaScript with Server Action IDs
2. User clicks button → Sends action ID to server
3. Server finds action by ID → Executes successfully

### Broken Flow (Current):
1. User loaded page yesterday → Got old JavaScript with old action IDs
2. Server deployed today → Has new action IDs
3. User clicks button → Sends OLD action ID
4. Server can't find old action ID → ERROR

## Verification Steps

### After Cache Clear + Redeploy:
1. Open production site in **incognito/private window**
2. Open DevTools Console (F12)
3. Navigate through the site
4. Look for Server Action errors
5. Should see NO errors in fresh session

### Check Build ID:
```bash
# In production, check the build ID
curl https://cohortle.com/_next/static/[BUILD_ID]/_buildManifest.js
```

The BUILD_ID should be `build-[timestamp]` format.

## Additional Measures

### 1. Add Cache Headers for Server Actions
Already implemented in `next.config.mjs`:
```javascript
{
  source: '/dashboard/:path*',
  headers: [
    { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }
  ]
}
```

### 2. Update Coolify Build Command (Optional)
To ensure clean builds every time:
```bash
rm -rf .next && npm run build
```

### 3. Set Cloudflare Cache Rules
In Cloudflare:
- Cache Level: Standard
- Browser Cache TTL: 4 hours (not "Respect Existing Headers")
- Always Online: Off (for dynamic content)

## Monitoring

### Watch for These Patterns:
- ✅ **Good**: No Server Action errors after cache clear
- ⚠️ **Warning**: Errors only from old sessions (users who haven't refreshed)
- ❌ **Bad**: Errors from new sessions (cache not cleared properly)

### Check Logs:
```bash
# In Coolify, filter logs for:
"Failed to find Server Action"
```

Should decrease significantly after fix.

## User Impact

### Before Fix:
- Users with cached old JavaScript get errors
- Forms may not submit
- Interactive features break
- Error: "Failed to find Server Action"

### After Fix:
- Fresh page loads work correctly
- Server Actions execute successfully
- No cache mismatch errors
- Smooth user experience

## Timeline

### Immediate (Next 5 minutes):
1. ✅ Clear Cloudflare cache
2. ✅ Force rebuild in Coolify
3. ✅ Verify deployment completes

### Short-term (Next 1 hour):
- Monitor logs for Server Action errors
- Test in incognito window
- Verify no new errors

### Long-term (Next 24 hours):
- Old cached sessions expire naturally
- All users get fresh JavaScript
- Error rate drops to zero

## Rollback Plan

If issues persist:
1. Check if cache was actually cleared (verify in Cloudflare)
2. Check if new build deployed (verify build ID changed)
3. Try manual browser cache clear: Ctrl+Shift+R
4. Check if Cloudflare is caching too aggressively

## Related Issues

This fix also addresses:
- ✅ WebSocket localhost:8081 error (development code in production)
- ✅ Stale JavaScript causing unexpected behavior
- ✅ Cache invalidation on deployments

## Success Criteria

- [ ] Cloudflare cache purged
- [ ] New build deployed with fresh build ID
- [ ] No Server Action errors in logs (new sessions)
- [ ] Forms and interactive features work
- [ ] Incognito window shows no errors

## Communication

### To Users (If Needed):
"We've deployed an update. Please refresh your browser (Ctrl+F5 or Cmd+Shift+R) to get the latest version."

### Internal Status:
"Server Action cache mismatch fixed. Cloudflare cache cleared. New build deployed. Monitoring for 24 hours."

---

**Priority**: HIGH
**Impact**: User-facing functionality broken
**Effort**: 5 minutes (cache clear + redeploy)
**Risk**: Low (standard cache management)
