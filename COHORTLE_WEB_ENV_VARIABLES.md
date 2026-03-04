# cohortle-web Environment Variables Configuration

## Summary
For cohortle-web, you only need ONE environment variable, and it MUST be available at both build time and runtime.

---

## Required Environment Variables

### NEXT_PUBLIC_API_URL
- **Value:** `https://api.cohortle.com`
- **Availability:** ✅ **BOTH Build Time AND Runtime**
- **Why:** This is used in server-side API routes during build and runtime

---

## Why NEXT_PUBLIC_API_URL Must Be Available at Build Time

The variable is used in these server-side API routes:
1. `/api/proxy/[...path]/route.ts` - Proxy for all API calls
2. `/api/auth/login/route.ts` - Login endpoint
3. `/api/auth/signup/route.ts` - Signup endpoint

These routes are built during the build process, so the environment variable must be available at build time.

---

## Other Environment Variables (Optional)

### NODE_ENV
- **Value:** Automatically set by Next.js
- **Availability:** Runtime only is fine
- **Why:** Used for conditional logic (development vs production)
- **Note:** You don't need to set this manually - Next.js handles it

### BASE_PATH
- **Value:** Not currently used (defaults to empty string)
- **Availability:** Not needed
- **Why:** Only used for logo path, which works fine without it

---

## Configuration in Coolify

### Current Setup (WRONG):
```
NEXT_PUBLIC_API_URL = https://api.cohortle.com
  ❌ Available at: Runtime only
```

### Correct Setup:
```
NEXT_PUBLIC_API_URL = https://api.cohortle.com
  ✅ Available at: Build Time AND Runtime
```

---

## How to Fix in Coolify

1. Go to Coolify → cohortle-web service
2. Navigate to Environment Variables
3. Find `NEXT_PUBLIC_API_URL`
4. Change availability setting from "Runtime only" to "Build Time AND Runtime"
5. Save changes
6. Redeploy the service

---

## Why This Matters

When `NEXT_PUBLIC_API_URL` is only available at runtime:
- The server-side API routes don't know the API URL during build
- They fall back to `http://localhost:3001` (which doesn't work in production)
- All API calls through the proxy fail
- This causes the 400 errors and missing data you're seeing

When it's available at build time:
- The API routes are built with the correct URL
- All API calls work correctly
- The Continue Learning button and other features work

---

## Final Configuration Summary

For **cohortle-web**, you only need:

```bash
NEXT_PUBLIC_API_URL=https://api.cohortle.com
# Must be: Build Time AND Runtime
```

That's it! No other environment variables are needed for cohortle-web.

---

## After Making Changes

1. Save the environment variable changes
2. Redeploy cohortle-web
3. Wait for build to complete
4. Hard refresh browser (Ctrl+Shift+R)
5. Test the application
