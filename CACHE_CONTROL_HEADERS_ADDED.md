# Cache-Control Headers Added

## Problem
Dynamic pages (dashboard, profile, convener pages) were being cached by the browser, causing:
- Stale content after navigation
- Wrong dashboard showing after logout/login
- Blank pages due to cached invalid state

## Solution
Added Cache-Control headers to Next.js configuration to prevent caching of dynamic, user-specific pages.

## Implementation

### Headers Added
```javascript
{
  key: 'Cache-Control',
  value: 'no-cache, no-store, must-revalidate',
},
{
  key: 'Pragma',
  value: 'no-cache',
},
{
  key: 'Expires',
  value: '0',
}
```

### Routes Protected
1. `/dashboard/*` - Learner dashboard and related pages
2. `/convener/*` - Convener dashboard and all convener pages
3. `/profile/*` - User profile and settings
4. `/programmes/*` - Programme listing and details
5. `/lessons/*` - Lesson viewer and related pages

### Static Assets Still Cached
Static assets (`/_next/static/*`) remain cached with:
```javascript
{
  key: 'Cache-Control',
  value: 'public, max-age=31536000, immutable',
}
```

This ensures optimal performance for JavaScript bundles, CSS, and images while preventing caching of dynamic content.

## How It Works

### Cache-Control: no-cache, no-store, must-revalidate
- `no-cache`: Browser must revalidate with server before using cached copy
- `no-store`: Browser must not store any version of the response
- `must-revalidate`: Once stale, must not use without revalidation

### Pragma: no-cache
- HTTP/1.0 backward compatibility
- Ensures older browsers also don't cache

### Expires: 0
- Sets expiration date to past
- Additional layer to prevent caching

## Benefits

1. **Fresh Content**: Users always see current data
2. **No Stale State**: Prevents cached authentication state
3. **Correct Role Display**: No flash of wrong dashboard
4. **Better Navigation**: Pages load correctly after multiple navigations
5. **Security**: Prevents sensitive data from being cached

## Testing

After deployment, verify headers are set:

```bash
# Check dashboard headers
curl -I https://cohortle.com/dashboard

# Check convener headers
curl -I https://cohortle.com/convener/dashboard

# Check profile headers
curl -I https://cohortle.com/profile
```

Expected response headers:
```
Cache-Control: no-cache, no-store, must-revalidate
Pragma: no-cache
Expires: 0
```

## Browser Behavior

### Before (with caching)
1. User logs in as learner → Dashboard cached
2. User logs out
3. User logs in as convener
4. Browser shows cached learner dashboard briefly
5. Then loads convener dashboard

### After (no caching)
1. User logs in as learner → Dashboard loaded fresh
2. User logs out → State cleared
3. User logs in as convener
4. Browser loads convener dashboard fresh (no cache)
5. Correct dashboard shows immediately

## Performance Impact

### Minimal Impact
- Only affects HTML pages, not static assets
- Static assets (JS, CSS, images) still cached for 1 year
- Modern browsers handle no-cache efficiently
- Server-side rendering is already fast

### Trade-offs
- Slightly more server requests for HTML
- Guaranteed fresh content
- Better user experience
- Improved security

## Files Modified

- `cohortle-web/next.config.mjs` - Added headers configuration

## Deployment

**Commit:** `83cfce9`
**Branch:** main
**Status:** Pushed to GitHub

Coolify will automatically deploy these changes.

## Related Fixes

This complements the previous fixes:
1. Logout race condition fix (commit `ba5eff4`)
2. Invalid route segment config removal (commit `ba5eff4`)

Together, these changes ensure:
- Clean logout/login flow
- No cached stale state
- Correct page rendering
- Fresh content on every navigation

## Additional Notes

### Why Not Use revalidate: 0?

Route segment config `revalidate: 0` only works in server components and affects server-side caching, not browser caching. Cache-Control headers are needed to control browser behavior.

### Why Not Use router.refresh()?

`router.refresh()` forces a client-side re-render but doesn't prevent browser from serving cached HTML. Cache-Control headers prevent the cache at the source.

### Cloudflare Caching

These headers also instruct Cloudflare to not cache these pages, ensuring fresh content is always served from the origin server.
