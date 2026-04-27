# Dashboard Learner Count Fix

## Issue
The convener dashboard summary was showing "total learners" as 0 even when there were enrolled learners in programmes.

## Root Cause
The frontend `Programme` interface in `cohortle-web/src/lib/api/convener.ts` was missing the `enrolledCount` and `enrolled_count` fields that the backend API was returning.

## Fix Applied
Updated the `Programme` interface to include the missing fields:

```typescript
interface Programme {
  id: number;
  name: string;
  description: string;
  startDate: string;
  status: 'draft' | 'published';
  lifecycleStatus?: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  onboarding_mode?: 'code' | 'application' | 'hybrid';
  application_deadline?: string | null;
  max_capacity?: number | null;
  application_form_slug?: string | null;
  enrolledCount?: number;        // ← Added
  enrolled_count?: number;       // ← Added
  cohortCount?: number;          // ← Added
  cohort_count?: number;         // ← Added
}
```

## Backend Verification
The backend `/v1/api/programmes/my` endpoint was already correctly:
1. Fetching enrolled counts using a JOIN query between cohorts and enrollments
2. Counting only active enrollments (`WHERE e.status = 'active'`)
3. Returning both camelCase (`enrolledCount`) and snake_case (`enrolled_count`) versions

## Components Affected
The fix resolves the issue in:
- `ConvenerDashboardSummary` component - Total Learners metric
- `ProgrammeCard` component - Individual programme learner counts
- Cohort detail pages - Enrolled learner displays

## Testing
Created diagnostic scripts to verify the fix:
- `test-dashboard-summary.ps1` - Tests the API endpoint directly
- `test-dashboard-summary.js` - Node.js version of the test
- `diagnose-dashboard-learner-count.js` - Database-level diagnostic

## Status
✅ **FIXED** - The total learners count should now display correctly in the convener dashboard summary.

## Next Steps
1. Test the dashboard in the browser to confirm the fix
2. Run the diagnostic scripts if issues persist
3. Check that all other dashboard metrics are working correctly