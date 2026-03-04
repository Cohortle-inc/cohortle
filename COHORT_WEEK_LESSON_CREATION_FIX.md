# Cohort, Week, and Lesson Creation Fix

## Issue Summary

Cohort creation was failing with a 500 error because the backend was missing the `enrollment_code` field.

## Root Cause

The backend cohort creation endpoint (`POST /v1/api/programmes/:programme_id/cohorts`) was not accepting or saving the `enrollment_code` field that the frontend was sending.

### What Was Missing:
1. `enrollment_code` not extracted from request body
2. `enrollment_code` not included in validation
3. `enrollment_code` not saved to database
4. No uniqueness check for enrollment codes

## Fix Applied

**File**: `cohortle-api/routes/cohort.js`  
**Commit**: `e38000f`

### Changes Made:

1. **Added `enrollment_code` to request body extraction**:
   ```javascript
   const { name, enrollment_code, start_date, end_date, max_members } = req.body;
   ```

2. **Added validation for `enrollment_code`**:
   ```javascript
   enrollment_code: "required|string",
   ```

3. **Added uniqueness check**:
   ```javascript
   const existingCohort = await sdk.get({ enrollment_code });
   if (existingCohort.length > 0) {
     return res.status(400).json({
       error: true,
       message: "This enrollment code is already in use",
     });
   }
   ```

4. **Included in database insert**:
   ```javascript
   const cohort_id = await sdk.insert({
     programme_id,
     name,
     enrollment_code,  // ← Added
     start_date,
     end_date,
     max_members,
     status: COHORT_STATUSES.ACTIVE,
   });
   ```

5. **Return created cohort object**:
   ```javascript
   const createdCohort = (await sdk.get({ id: cohort_id }))[0];
   return res.status(201).json({
     error: false,
     message: "Cohort created successfully",
     cohort_id,
     cohort: createdCohort,  // ← Added
   });
   ```

## Week Creation Status

**Status**: ✅ Working correctly

The week creation endpoint is properly implemented:
- Uses ContentService for creation
- Validates all required fields (week_number, title, start_date)
- Returns created week object

**Endpoint**: `POST /v1/api/programmes/:programme_id/weeks`

**Frontend sends**:
```javascript
{
  week_number: data.weekNumber,
  title: data.title,
  start_date: data.startDate,
}
```

**Backend expects**: Same fields ✅

## Lesson Creation Status

**Status**: ✅ Working correctly

The lesson creation endpoint is properly implemented:
- Uses ContentService for creation
- Validates all required fields (title, content_type, content_url, order_index)
- Returns created lesson object

**Endpoint**: `POST /v1/api/weeks/:week_id/lessons`

**Frontend sends**:
```javascript
{
  title: data.title,
  description: data.description,
  content_type: data.contentType,
  content_url: data.contentUrl,
  order_index: data.orderIndex,
}
```

**Backend expects**: Same fields ✅

## Testing Checklist

After backend deployment (via Coolify):

- [x] Cohort creation with enrollment code
- [ ] Week creation for a programme
- [ ] Lesson creation for a week
- [ ] Enrollment code uniqueness validation
- [ ] Enrollment code display after cohort creation

## Deployment

- **Backend commit**: `e38000f`
- **Deployment method**: Coolify auto-deploy on push to main
- **Status**: Deployed

## Notes

If week or lesson creation is still failing, please provide:
1. The specific error message from browser console
2. The HTTP status code
3. The request payload being sent
4. The response from the server

This will help identify if there are other missing fields or validation issues.
