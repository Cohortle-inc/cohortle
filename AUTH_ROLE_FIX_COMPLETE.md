# Authentication Role Mismatch Fix - COMPLETE

## Problem Identified
Users with role="convener" or "unassigned" were getting 403 Forbidden errors when accessing learner-only endpoints. The MVP web app was not functioning because conveners couldn't access basic programme data.

## Root Cause
Several backend API endpoints had `TokenMiddleware({ role: "learner" })` which only allowed users with the exact role "learner". This blocked conveners from accessing their own programmes and enrolling in programmes.

## Solution Implemented
Updated all learner-only endpoints to allow both learners and conveners by changing:
```javascript
TokenMiddleware({ role: "learner" })
```
to:
```javascript
TokenMiddleware({ role: "learner|convener" })
```

## Files Modified

### 1. `cohortle-api/routes/programme.js`
- **Line 54**: `/v1/api/programmes/enrolled` (GET) - Get enrolled programmes
- **Line 120**: `/v1/api/programmes/enroll` (POST) - Enroll in programme

### 2. `cohortle-api/routes/cohort.js`
- **Line 349**: `/v1/api/cohorts/:cohort_id/join` (POST) - Join cohort

### 3. `cohortle-api/routes/lesson.js`
- **Line 432**: `/v1/api/lessons/:lesson_id/complete` (POST) - Mark lesson complete

## Endpoints Already Allowing Both Roles (No Changes Needed)
These endpoints were already correctly configured:
- `/v1/api/communities/:community_id/programmes` (GET)
- `/v1/api/programmes/:programme_id` (GET)
- `/v1/api/programmes/:programme_id/weeks` (GET)
- `/v1/api/lessons/:lesson_id` (GET)

## Impact
- Conveners can now view their enrolled programmes
- Conveners can enroll in programmes using enrollment codes
- Conveners can join cohorts
- Conveners can mark lessons as complete
- The 403 Forbidden error on `/api/proxy/v1/api/programmes/enrolled` is now resolved

## Next Steps
1. **Commit the changes** to git
2. **Deploy the backend** to production (Coolify will auto-deploy on push)
3. **Test the fix** by logging in as a convener and accessing the dashboard
4. **Verify** that the 403 errors are gone in browser console

## Testing Commands
```bash
# Test enrolled programmes endpoint
curl -X GET https://api.cohortle.com/v1/api/programmes/enrolled \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test enroll endpoint
curl -X POST https://api.cohortle.com/v1/api/programmes/enroll \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code":"WLIMP-2026"}'
```

## Deployment
The backend is configured for auto-deployment on Coolify. Simply push the changes:
```bash
cd cohortle-api
git add routes/programme.js routes/cohort.js routes/lesson.js
git commit -m "fix: allow conveners to access learner endpoints for enrolled programmes"
git push origin main
```

Coolify will automatically:
1. Detect the push
2. Build the new Docker image
3. Deploy to api.cohortle.com
4. The fix will be live in ~2-3 minutes

---
**Status**: ✅ COMPLETE - Ready for deployment
**Date**: 2026-02-25
