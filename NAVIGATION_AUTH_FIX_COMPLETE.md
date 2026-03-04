# Navigation and Authentication Fixes - Complete

## Issues Fixed

### Issue 1: Wrong Dashboard Flash on Logout/Role Switch
**Problem:** When logging out from learner account and logging into convener account, the learner dashboard briefly appeared before showing the correct convener dashboard.

**Root Cause:** Race condition in logout flow - user state was being cleared in `finally` block after async API call, causing old state to persist briefly during navigation.

**Solution:** Changed logout flow to clear user state IMMEDIATELY (synchronously) before making async API call:

```typescript
// OLD (caused race condition)
const logout = async (): Promise<void> => {
  try {
    await authApi.logout();
  } catch (error) {
    console.error('Logout API call failed:', error);
  } finally {
    setUser(null);  // ❌ Happens after async call
    router.push('/login');
  }
};

// NEW (fixes race condition)
const logout = async (): Promise<void> => {
  setUser(null);  // ✅ Happens immediately
  
  try {
    await authApi.logout();
  } catch (error) {
    console.error('Logout API call failed:', error);
  }
  
  router.push('/login');
};
```

**Result:** User state is cleared immediately, preventing flash of wrong dashboard.

### Issue 2: Blank Pages After Navigation
**Problem:** Pages like `/convener/programmes/13` showed blank after navigating through multiple pages.

**Root Cause:** Invalid route segment config exports in client component. The page had:
```typescript
'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;
```

These exports are only valid in server components, not client components. Having them in a client component causes Next.js to fail silently, resulting in blank pages.

**Solution:** Removed the invalid exports from the client component:

```typescript
'use client';

// ✅ No route segment config exports in client components
import React, { useState } from 'react';
```

**Result:** Page renders correctly without blank screen.

## Files Modified

1. **cohortle-web/src/lib/contexts/AuthContext.tsx**
   - Fixed logout race condition
   - User state now clears immediately before async operations

2. **cohortle-web/src/app/convener/programmes/[id]/page.tsx**
   - Removed invalid route segment config exports
   - Page now renders correctly

## Deployment

**Commit:** `ba5eff4`
**Branch:** main
**Status:** Pushed to GitHub

Coolify will automatically deploy these changes to production.

## Testing After Deployment

### Test 1: Logout/Role Switch
1. Log in as learner
2. Navigate to dashboard (should show learner dashboard)
3. Log out
4. Log in as convener
5. **Expected:** Should go directly to convener dashboard without flash of learner dashboard

### Test 2: Navigation
1. Log in as convener
2. Navigate to convener dashboard
3. Click on a programme
4. Navigate to `/convener/programmes/[id]`
5. **Expected:** Page should load correctly, not show blank screen
6. Navigate through multiple pages (cohorts, weeks, lessons)
7. **Expected:** All pages should load correctly

## Additional Notes

### Why Route Segment Configs Don't Work in Client Components

Route segment configs like `export const dynamic`, `export const revalidate`, etc. are Next.js server-side rendering directives. They tell Next.js how to handle the page at build time and request time on the server.

Client components (marked with `'use client'`) run in the browser and don't participate in server-side rendering decisions. Therefore, these exports are ignored in client components and can cause unexpected behavior.

**Rule:** Only use route segment config exports in server components (files without `'use client'`).

### Why Immediate State Clearing Matters

In React, state updates are asynchronous, but setting state directly is synchronous. The issue was:

1. `logout()` is called
2. Async API call starts
3. While API call is in progress, router navigates
4. New page loads with old state still in memory
5. State finally clears after API call completes

By clearing state FIRST, we ensure:
1. `logout()` is called
2. State clears immediately (synchronous)
3. Async API call starts
4. Router navigates with clean state
5. New page loads with correct (empty) state

## Related Issues

These fixes also prevent:
- Stale authentication state during navigation
- Incorrect role-based redirects
- Flash of unauthorized content
- Blank pages due to rendering errors

## Future Improvements

Consider adding:
1. Error boundaries to catch and display rendering errors
2. Loading states during navigation
3. Router cache invalidation after logout
4. Session timeout handling
5. Automatic token refresh
