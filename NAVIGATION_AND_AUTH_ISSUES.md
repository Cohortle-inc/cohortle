# Navigation and Authentication Issues

## Issues Identified

### Issue 1: Blank Pages After Navigation
**Problem:** Pages like `/convener/programmes/13` show blank after navigating through multiple pages.

**Root Cause:** This is likely a Next.js client-side navigation caching issue combined with potential React state management problems. When navigating between pages, Next.js caches page data, but if there's an error or the data isn't properly hydrated, the page appears blank.

**Possible Causes:**
1. Client-side data fetching errors not being caught
2. React components throwing errors during render
3. Next.js router cache not being invalidated properly
4. Missing error boundaries to catch and display errors

### Issue 2: Wrong Dashboard Flash on Logout
**Problem:** When logging out from learner account and logging into convener account, the learner dashboard briefly appears before showing the correct convener dashboard.

**Root Cause:** The AuthContext state is not being cleared immediately on logout, causing a race condition:

1. User clicks logout
2. `logout()` function is called
3. API call to clear cookie happens (async)
4. `setUser(null)` is called in `finally` block
5. Router pushes to `/login`
6. User logs in as different role
7. Old user state briefly persists before new state loads
8. Middleware checks token but doesn't verify role immediately
9. Client-side routing shows old dashboard briefly

**Specific Problems:**
- `setUser(null)` happens in `finally` block, which executes after async operations
- Router.push('/login') happens before state is fully cleared
- No immediate state clearing before async logout call
- AuthContext initialization doesn't clear stale state on mount

## Solutions

### Solution 1: Add Error Boundaries and Better Error Handling

Add error boundaries to catch rendering errors and display them instead of blank pages.

### Solution 2: Fix Logout Race Condition

Update the logout flow to:
1. Clear user state IMMEDIATELY (synchronously)
2. Then make async API call
3. Then redirect

This prevents the flash of wrong dashboard.

### Solution 3: Add Router Cache Invalidation

Use Next.js router.refresh() to invalidate cache after navigation.

### Solution 4: Add Loading States

Add proper loading states to prevent blank pages during data fetching.

## Implementation Plan

1. Fix logout race condition in AuthContext
2. Add error boundary to catch rendering errors
3. Add loading states to pages
4. Test navigation flow thoroughly
