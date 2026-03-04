# Convener Placeholder Content Completion

## Summary
Completed placeholder content in convener pages by connecting them to real API data and adding proper hooks.

## Changes Made

### 1. New Hooks Created

#### `cohortle-web/src/lib/hooks/useCohortDetail.ts`
- Fetches cohort details including enrollment data
- Uses React Query for caching and state management
- Extracts cohort from programme endpoint

#### `cohortle-web/src/lib/hooks/useWeekDetail.ts`
- Fetches week details with lessons
- Uses React Query for caching
- Finds specific week from programme weeks endpoint

### 2. Pages Updated

#### `cohortle-web/src/app/convener/programmes/[id]/cohorts/[cohortId]/page.tsx`
**Before**: Used hardcoded placeholder data
**After**: 
- Uses `useCohortDetail` hook for real data
- Displays actual cohort information (name, code, start date, status)
- Shows real enrollment counts
- Improved empty state messaging
- Added status badge (Active/Inactive)

**Features**:
- Real-time cohort data from API
- Enrollment statistics (enrolled count, available spots, capacity)
- Enrollment code display for sharing
- Better UX messaging for empty states

#### `cohortle-web/src/app/convener/programmes/[id]/weeks/[weekId]/page.tsx`
**Before**: Used hardcoded placeholder data with TODO comments
**After**:
- Uses `useWeekDetail` hook for real data
- Displays actual week information (number, title, start date)
- Shows real lessons from API
- Improved edit/delete button handlers with user feedback

**Features**:
- Real-time week data from API
- Lesson list with reordering capability
- Better UX for edit/delete actions (alerts user about future updates)
- Proper error handling

### 3. Removed TODOs

Removed all TODO comments from:
- Cohort detail page
- Week detail page

Replaced with:
- Working API integrations
- Proper error handling
- User-friendly messaging

## API Integration

Both pages now properly integrate with existing backend endpoints:

### Cohort Data
- Endpoint: `/v1/api/programmes/:id` (extracts cohort from programme data)
- Data: name, enrollment_code, start_date, status, enrolled_count

### Week Data
- Endpoint: `/v1/api/programmes/:id/weeks`
- Data: week_number, title, start_date, lessons array

## User Experience Improvements

### Cohort Detail Page
1. Real enrollment statistics
2. Status badge showing active/inactive
3. Better empty state for no learners
4. Informative message about future learner management features

### Week Detail Page
1. Real lesson data with proper ordering
2. User feedback for edit/delete actions
3. Clear messaging about future features
4. Maintains lesson reordering functionality

## Future Enhancements (Not in Current Scope)

These features are mentioned to users but not yet implemented:
1. **Learner Management**: View individual learner details and progress
2. **Lesson Editing**: In-place or modal-based lesson editing
3. **Lesson Deletion**: Confirmation and API integration for deleting lessons
4. **Week Editing**: Edit week details (title, start date)
5. **Cohort Editing**: Edit cohort details (name, dates)

## Testing

To test the changes:

1. **Cohort Detail Page**:
   ```
   Navigate to: /convener/programmes/[id]/cohorts/[cohortId]
   - Should show real cohort data
   - Should display enrollment statistics
   - Should show status badge
   ```

2. **Week Detail Page**:
   ```
   Navigate to: /convener/programmes/[id]/weeks/[weekId]
   - Should show real week data
   - Should list actual lessons
   - Should allow lesson reordering
   ```

## Files Modified

- ✅ `cohortle-web/src/lib/hooks/useCohortDetail.ts` (NEW)
- ✅ `cohortle-web/src/lib/hooks/useWeekDetail.ts` (NEW)
- ✅ `cohortle-web/src/app/convener/programmes/[id]/cohorts/[cohortId]/page.tsx`
- ✅ `cohortle-web/src/app/convener/programmes/[id]/weeks/[weekId]/page.tsx`

## Status
✅ Complete - All placeholder content has been replaced with real API integrations
