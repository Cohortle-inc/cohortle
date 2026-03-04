# CRITICAL FIX: API Proxy Query Parameters

## Root Cause Identified

The API proxy (`/api/proxy/[...path]/route.ts`) was **NOT forwarding query parameters** from the frontend to the backend. This caused:

1. ❌ **Enrollment Code Check 400 Error**: The `code` parameter wasn't being sent to backend
2. ❌ **Potential other GET request failures**: Any endpoint using query parameters would fail

## The Problem

### Before Fix:
```typescript
// Only used path segments, ignored query parameters
const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/${pathSegments.join('/')}`;
```

**Example:**
- Frontend calls: `/api/proxy/v1/api/enrollment-codes/check?code=PROG-2026-PRB3F7`
- Proxy forwarded: `https://api.cohortle.com/v1/api/enrollment-codes/check` ❌ (missing `?code=...`)
- Backend received: No `code` parameter
- Backend returned: 400 Bad Request ("Enrollment code is required")

### After Fix:
```typescript
// Extract and forward query parameters
const searchParams = request.nextUrl.searchParams.toString();
const backendUrl = searchParams ? `${backendBaseUrl}?${searchParams}` : backendBaseUrl;
```

**Example:**
- Frontend calls: `/api/proxy/v1/api/enrollment-codes/check?code=PROG-2026-PRB3F7`
- Proxy forwards: `https://api.cohortle.com/v1/api/enrollment-codes/check?code=PROG-2026-PRB3F7` ✅
- Backend receives: `code=PROG-2026-PRB3F7`
- Backend returns: `{available: true/false}`

## Additional Improvements

Added logging to help debug future proxy issues:

```typescript
console.log('Proxy request:', {
  method,
  path: pathSegments.join('/'),
  queryParams: searchParams,
  backendUrl,
  hasToken: !!token
});

console.log('Proxy response:', {
  status: response.status,
  dataLength: data.length
});
```

## Impact

This fix resolves:
- ✅ Enrollment code availability checking (400 error)
- ✅ Any other GET requests with query parameters
- ✅ Improves debugging with proxy logging

## Deployment

**Commit:** `2916deb` - CRITICAL FIX: API proxy not forwarding query parameters

**Next Steps:**
1. Deploy frontend changes to production
2. Test enrollment code checking
3. Test cohort creation (500 error may be a separate issue)

## Testing

After deployment, the enrollment code check should work:
1. Go to create cohort page
2. Enter an enrollment code
3. Should see real-time availability check working
4. No more 400 errors in console

## Note on 500 Error

The cohort creation 500 error is likely a separate issue that will be revealed once:
1. This proxy fix is deployed
2. The detailed logging we added earlier is deployed
3. We can see the actual backend error causing the 500

The 500 error might be related to:
- Database constraints
- Missing required fields
- Authentication/authorization issues

We'll be able to diagnose it properly once the logging is deployed.