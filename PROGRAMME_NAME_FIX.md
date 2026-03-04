# Programme Name Display Fix

## Issue
The programme page (`/programmes/[id]`) was displaying "WLIMP - Workforce Leadership and Impact Mentorship Programme" for all programmes instead of showing the actual programme name from the database.

## Root Cause
The programme name was hardcoded in `cohortle-web/src/app/programmes/[id]/page.tsx` on lines 127-131:

```typescript
setProgramme({
  id: params.id,
  name: 'WLIMP – Workforce Leadership & Impact Mentorship Programme', // ❌ Hardcoded
  description: 'Access your weekly lessons and learning materials',
});
```

## Solution
Updated the code to use the actual programme name from the API response (`currentProgramme.name`):

```typescript
// Set programme info from enrolled programme data
setProgramme({
  id: params.id,
  name: currentProgramme.name, // ✅ Dynamic from API
  description: currentProgramme.description || 'Access your weekly lessons and learning materials',
});
```

## How It Works

1. **API Fetches Enrolled Programmes**: The `getEnrolledProgrammes()` function calls `/v1/api/programmes/enrolled` which returns all programmes the user is enrolled in with their actual names from the database.

2. **Backend Returns Correct Data**: The backend (`EnrollmentService.getUserEnrolledProgrammes()`) queries the `programmes` table and returns:
   ```javascript
   {
     id: programme.id,
     name: programme.name,        // ✅ From database
     description: programme.description,
     currentWeek,
     totalWeeks,
     cohortId: cohort.id,
     cohortName: cohort.name,
     enrolledAt: enrollment.enrolled_at,
   }
   ```

3. **Frontend Uses Dynamic Name**: The page now uses `currentProgramme.name` which contains the actual programme name from the database.

## Files Changed
- `cohortle-web/src/app/programmes/[id]/page.tsx` - Fixed hardcoded programme name

## Testing
To verify the fix works correctly:

1. **Check Database**: Ensure programmes have correct names in the database:
   ```sql
   SELECT id, name, description FROM programmes;
   ```

2. **Test Frontend**: 
   - Navigate to any programme page (e.g., `/programmes/1`)
   - The page should display the actual programme name from the database
   - Different programmes should show different names

3. **Verify API Response**:
   ```bash
   # Get enrolled programmes (requires authentication)
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        https://api.cohortle.com/v1/api/programmes/enrolled
   ```

## Impact
- ✅ All programme pages now display their correct names
- ✅ No more hardcoded "WLIMP" text
- ✅ Supports multiple programmes with different names
- ✅ Programme descriptions are also dynamic

## Related Components
- `ProgrammeHeader` component already uses `programme.name` prop correctly
- No other components needed changes

## Deployment
This fix is ready to deploy. After deployment:
1. Clear browser cache or do a hard refresh (Ctrl+Shift+R)
2. Navigate to any programme page
3. Verify the correct programme name is displayed
