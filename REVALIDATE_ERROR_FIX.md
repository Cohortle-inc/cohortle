# Revalidate Error Fix

## Problem
Build was failing with:
```
Error: Invalid revalidate value "[object Object]" on "/dashboard", must be a non-negative number or "false"
```

## Root Cause
I incorrectly added `export const dynamicParams = true` to **static routes** (routes without parameters). This directive is **only valid for dynamic routes** with parameters like `/programmes/[id]`.

When Next.js encountered `dynamicParams` on a static route, it caused the `revalidate` value to be misinterpreted as an object instead of a number.

## Solution
Removed `export const dynamicParams = true` from static routes:
- `/profile`
- `/profile/settings`
- `/dashboard`
- `/programmes`
- `/convener/dashboard`

These routes now only have:
```typescript
export const dynamic = 'force-dynamic';
export const revalidate = 0;
```

## Dynamic Routes (Keep dynamicParams)
The following routes with parameters still have all three directives:
- `/programmes/[id]/page.tsx`
- `/programmes/[id]/learn/page.tsx`
- `/programmes/[id]/community/page.tsx`
- `/programmes/[id]/public/page.tsx`

These correctly use:
```typescript
export const dynamic = 'force-dynamic';
export const dynamicParams = true;  // Valid for dynamic routes
export const revalidate = 0;
```

## Commit Details
- **Commit**: `df02214` - "fix: remove dynamicParams from static routes - only valid for dynamic routes"
- **Previous**: `7c22f29` - "fix: add comprehensive dynamic rendering config to prevent static export errors"
- **Branch**: `main`
- **Status**: ✅ Pushed to GitHub

## Next Steps
1. ✅ Changes committed and pushed
2. ⏳ Trigger Coolify rebuild
3. ⏳ Monitor build logs - should complete successfully now
4. ⏳ Verify deployment
5. ⏳ Purge Cloudflare cache

## Technical Notes
### Route Segment Config Rules
- `export const dynamic` - Valid for ALL routes
- `export const revalidate` - Valid for ALL routes
- `export const dynamicParams` - **ONLY valid for dynamic routes with parameters** (e.g., `[id]`, `[slug]`)

### Why This Matters
Next.js uses these exports to configure how routes are rendered:
- Static routes (no parameters): Only need `dynamic` and `revalidate`
- Dynamic routes (with parameters): Can use all three including `dynamicParams`

Using `dynamicParams` on a static route causes Next.js to misinterpret the configuration, leading to the "[object Object]" error.

## Expected Build Output
With this fix, the build should:
1. ✅ Compile successfully
2. ✅ Generate static pages without errors
3. ✅ Skip prerendering for auth-protected pages
4. ✅ Complete without "Invalid revalidate value" errors
5. ✅ Complete without "Export encountered errors" messages

## Related Documentation
- [STATIC_EXPORT_FIX_COMPLETE.md](./STATIC_EXPORT_FIX_COMPLETE.md)
- [BUILD_ERROR_FIX_COMPLETE.md](./BUILD_ERROR_FIX_COMPLETE.md)
- [DEPLOYMENT_FIX_SUMMARY.md](./DEPLOYMENT_FIX_SUMMARY.md)
- [Next.js Route Segment Config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config)
