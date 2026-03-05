# Next.js Server Action Error Fix

**Error:** `Failed to find Server Action "x". This request might be from an older or newer deployment.`

**Date:** March 5, 2026  
**Status:** Requires Fix

---

## Problem

The error occurs when:
1. Client has cached an old version of the app
2. Server has been redeployed with new code
3. Client tries to call a server action that no longer exists or has changed

This is a **deployment cache mismatch** issue, not a code bug.

---

## Root Cause

The error message shows:
```
Original error: Cannot read properties of undefined (reading 'workers')
```

This suggests the server action manifest is corrupted or missing. This happens when:
- Build cache is stale
- Deployment didn't complete properly
- Client cache hasn't been cleared

---

## Immediate Fix

### Option 1: Force Rebuild and Redeploy

```bash
# In cohortle-web directory
rm -rf .next
rm -rf node_modules/.cache
npm run build
# Then redeploy
```

### Option 2: Clear Cloudflare Cache

Since you're using Cloudflare, clear the cache:

```bash
# Use your existing script
.\purge-cloudflare-cache.ps1
```

### Option 3: Add Cache Busting

Add a deployment marker to force cache invalidation.

---

## Permanent Solution

### 1. Add Proper Cache Headers

Update `cohortle-web/next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... existing config
  
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
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### 2. Add Build ID to Force Cache Invalidation

Update `cohortle-web/next.config.js`:

```javascript
const nextConfig = {
  // ... existing config
  
  generateBuildId: async () => {
    // Use timestamp or git commit hash
    return `build-${Date.now()}`;
  },
};
```

### 3. Ensure Clean Builds on Deployment

Update your deployment process to always do clean builds:

```bash
# In your deployment script or Coolify build command
rm -rf .next
npm run build
```

---

## Quick Fix for Production

### Step 1: Clear Everything

```bash
# On your production server (via Coolify or SSH)
cd /app  # or wherever your app is deployed
rm -rf .next
rm -rf node_modules/.cache
```

### Step 2: Rebuild

```bash
npm run build
```

### Step 3: Restart

```bash
# Restart the application
# (Coolify will do this automatically)
```

### Step 4: Clear Cloudflare Cache

```bash
# Run your cache purge script
.\purge-cloudflare-cache.ps1
```

---

## Prevention

### 1. Add to Deployment Script

Create `cohortle-web/deploy-production.sh`:

```bash
#!/bin/bash

echo "🧹 Cleaning build artifacts..."
rm -rf .next
rm -rf node_modules/.cache

echo "📦 Building application..."
npm run build

echo "🚀 Deployment ready!"
```

### 2. Update Coolify Build Command

In Coolify, set the build command to:

```bash
rm -rf .next && npm run build
```

### 3. Add Post-Deploy Hook

In Coolify, add a post-deploy command:

```bash
curl -X POST https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"purge_everything":true}'
```

---

## Why This Happens

Next.js Server Actions work by:
1. Client sends a request with an action ID
2. Server looks up the action in a manifest
3. Server executes the action

When you redeploy:
- Server has a new manifest
- Client still has old action IDs cached
- Mismatch causes the error

The error goes away when:
- Client refreshes and gets new code
- Cache expires
- You force a cache clear

---

## Verification

After applying the fix:

1. **Check logs** - Error should stop appearing
2. **Test in incognito** - Should work immediately
3. **Clear browser cache** - Should work for all users
4. **Monitor** - Watch for recurring errors

---

## Related Files

- `cohortle-web/next.config.js` - Add cache headers
- `purge-cloudflare-cache.ps1` - Clear CDN cache
- Coolify build settings - Ensure clean builds

---

## Summary

**Immediate Action:**
1. Clear `.next` directory
2. Rebuild application
3. Clear Cloudflare cache
4. Restart application

**Long-term Solution:**
1. Add proper cache headers
2. Use build IDs
3. Always do clean builds on deployment
4. Auto-purge cache after deployment

This is a deployment/caching issue, not a code bug. The role system deployment is unaffected.

---

*Last Updated: March 5, 2026*  
*Issue: Next.js Server Action Mismatch*  
*Priority: Medium (affects user experience)*
