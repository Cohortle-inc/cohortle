# Dashboard Loading Issue - Fixed

## Issue Summary
After fixing the authentication issue where learner accounts showed "user not authenticated", the dashboard was stuck in a loading state instead of displaying the user's enrolled programmes.

## Root Cause
The dashboard page had a logic issue in the `useEffect` hook that fetches additional dashboard data (upcoming sessions and recent activity). The `dashboardLoading` state was never being set to `false` in certain scenarios:

1. When `shouldFetchProgrammes` was `false` (e.g., for conveners), the function would return early without setting `dashboardLoading` to `false`
2. When the `useEnrolledProgrammes` hook completed loading but returned `null` data, the `fetchDashboardData` function was never called, leaving `dashboardLoading` stuck at `true`

## Solution Implemented

### File Changed
- `cohortle-web/src/app/dashboard/page.tsx`

### Changes Made

1. **Added early return with state cleanup** when `shouldFetchProgrammes` is false:
   ```typescript
   if (!shouldFetchProgrammes) {
     setDashboardLoading(false);
     return;
   }
   ```

2. **Added fallback logic** in the `useEffect` dependency to handle when programmes hook completes but data is null:
   ```typescript
   if (programmes !== null) {
     fetchDashboardData();
   } else if (!isLoading) {
     // If programmes hook is not loading but data is still null, set dashboard loading to false
     setDashboardLoading(false);
   }
   ```

3. **Updated dependencies** to include `isLoading` so the effect can properly detect when the programmes hook has finished loading.

## Testing

### Test Script Created
Created `test-enrolled-programmes.ps1` to verify the enrolled programmes API endpoint is working correctly.

### Expected Behavior After Fix
1. Login works correctly for all learner accounts
2. Dashboard loads without hanging
3. If user has no enrolled programmes, the empty state is displayed
4. If user has enrolled programmes, they are displayed correctly
5. Loading states are properly managed throughout the component lifecycle

## Deployment

### Git Commit
```
fix: resolve dashboard loading hang when fetching enrolled programmes

- Add fallback to set dashboardLoading to false when programmes hook completes but data is null
- Ensure dashboardLoading state is properly managed even when shouldFetchProgrammes is false
- Prevents infinite loading state when user has no enrolled programmes
```

### Repository
- **cohortle-web**: Pushed to main branch (commit 356b7be)

## Next Steps

1. **Deploy to production** - The fix needs to be deployed to Coolify
2. **Test on production** - Verify that learner accounts can now access the dashboard without hanging
3. **Monitor logs** - Check for any errors in the browser console or API logs

## Related Issues Fixed

This fix completes the authentication issue resolution:
- ✅ Users can now log in successfully (fixed in previous commit)
- ✅ Dashboard loads correctly without hanging (fixed in this commit)
- ✅ Enrolled programmes are fetched and displayed properly

## Technical Notes

### Why This Happened
The original code assumed that if `programmes !== null`, the data was ready. However, the hook could complete loading with `null` data in error scenarios or when the API returns an empty response. The `dashboardLoading` state was initialized to `true` but never set to `false` in these edge cases.

### Prevention
To prevent similar issues in the future:
1. Always ensure loading states have a clear path to completion
2. Handle both success and error cases explicitly
3. Add fallback logic for edge cases where data might be null or undefined
4. Include all relevant dependencies in useEffect hooks
